import { query, transaction } from '@/lib/db';
import { fetchAssessmentRowsForView, pickRepresentativeAssessmentRows } from '@/lib/assessmentHiringView';
import { isAssessmentRoundKind } from '@/lib/assessmentRoundMap';
import { assertAssessmentContextEditable, getOrCreateAssessmentContext } from '@/lib/assessmentContext';
import {
  excludeWithdrawnStudents,
  getWithdrawnStudentProfileIdsForTarget,
  isStudentWithdrawnFromTarget,
  WITHDRAWAL_ASSESSMENT_REJECT_MESSAGE,
} from '@/lib/applicationWithdrawal';
import { listTenantStudentsForAssessment, resolveCurrentAcademicYearLabel } from '@/lib/assessmentCampusStudents';
import {
  filterStudentsByAssessmentPostingEligibility,
  loadAssessmentPostingOpportunity,
} from '@/lib/assessmentExportEligibility';
import { upsertAssessmentRowInContext } from '@/lib/assessmentRowUpsert';
import { writeEmployerAssessmentAudit } from '@/lib/employerAssessmentAudit';
import { normalizeHiringResult, validateHiringResult } from '@/lib/hiringResult';
import {
  assertEmployerMayConfirmStudent,
  EMPLOYER_FCFS_BLOCKED_MESSAGE,
  fcfsTrackFromAssessmentKind,
  isFcfsHiringSelect,
  listCampusFcfsUnavailableForEmployer,
} from '@/lib/campusFcfsSelection';
import { formatStudentSystemId } from '@/lib/studentSystemId';
import { AND_EAU_NOT_DELETED } from '@/lib/softDeleteSql';

const ONLINE_UPLOAD_LABEL = 'Online update';

async function buildAssessmentIndex(employerId, { tenantId, driveId, jobId }) {
  const rows = await fetchAssessmentRowsForView({ employerId, tenantId });
  const rep = pickRepresentativeAssessmentRows(rows);
  const map = new Map();
  for (const r of rep) {
    const matchesDrive = driveId && r.upload_drive_id === driveId;
    const matchesJob = jobId && r.upload_job_id === jobId;
    if (!matchesDrive && !matchesJob) continue;
    map.set(r.student_profile_id, r);
  }
  return map;
}

async function findUploadForTarget(client, employerId, { tenantId, driveId, jobId }) {
  if (driveId) {
    const r = await client.query(
      `SELECT id FROM employer_assessment_uploads eau
       WHERE eau.employer_id = $1::uuid AND eau.drive_id = $2::uuid AND eau.job_id IS NULL
         ${AND_EAU_NOT_DELETED}
       ORDER BY eau.created_at DESC LIMIT 1`,
      [employerId, driveId],
    );
    return r.rows[0]?.id || null;
  }
  const r = await client.query(
    `SELECT id FROM employer_assessment_uploads eau
     WHERE eau.employer_id = $1::uuid AND eau.job_id = $2::uuid AND eau.tenant_id = $3::uuid AND eau.drive_id IS NULL
       ${AND_EAU_NOT_DELETED}
     ORDER BY eau.created_at DESC LIMIT 1`,
    [employerId, jobId, tenantId],
  );
  return r.rows[0]?.id || null;
}

async function ensureUpload(client, employerId, userId, { tenantId, driveId, jobId }) {
  let uploadId = await findUploadForTarget(client, employerId, { tenantId, driveId, jobId });
  if (uploadId) return uploadId;

  const ins = await client.query(
    `INSERT INTO employer_assessment_uploads
       (employer_id, tenant_id, drive_id, job_id, uploaded_by, original_file_name, s3_key, total_rows, accepted_rows, rejected_rows)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, NULL, 0, 0, 0)
     RETURNING id`,
    [employerId, tenantId, driveId || null, jobId || null, userId || null, ONLINE_UPLOAD_LABEL],
  );
  return ins.rows[0].id;
}

/**
 * @param {string} employerId
 * @param {'internship' | 'jobs' | 'drive' | 'projects'} kind
 * @param {{ tenantId: string, driveId?: string | null, jobId?: string | null }} context
 */
export async function fetchAssessmentUpdateOnlineRows(employerId, kind, context) {
  if (!isAssessmentRoundKind(kind)) throw new Error('Invalid kind');
  const tenantId = String(context?.tenantId || '').trim();
  const driveId = context?.driveId || null;
  const jobId = context?.jobId || null;
  if (!tenantId) throw new Error('tenantId is required');
  if (!driveId && !jobId) throw new Error('driveId or jobId is required');

  const academicYearLabel = await resolveCurrentAcademicYearLabel(tenantId);
  const studentsAll = await listTenantStudentsForAssessment(tenantId, { academicYearLabel });
  const withdrawnIds = await getWithdrawnStudentProfileIdsForTarget(
    { query },
    { driveId, jobId },
  );
  const afterWithdrawal = excludeWithdrawnStudents(studentsAll, withdrawnIds);

  const opportunity = await loadAssessmentPostingOpportunity(employerId, kind, {
    tenantId,
    driveId,
    jobId,
  });
  const { students } = await filterStudentsByAssessmentPostingEligibility(
    afterWithdrawal,
    opportunity,
    tenantId,
    kind,
    { jobId },
  );

  const assessmentIndex = await buildAssessmentIndex(employerId, { tenantId, driveId, jobId });

  const ctx = await getOrCreateAssessmentContext(null, {
    employerId,
    tenantId,
    opportunityKind: kind,
    driveId,
    jobId,
  });

  const track = fcfsTrackFromAssessmentKind(kind);
  const unavailableByOther =
    track
      ? await listCampusFcfsUnavailableForEmployer(tenantId, track, employerId)
      : [];
  const blockedMap = new Map(
    unavailableByOther.map((u) => [u.studentProfileId, u.claimingEmployerName]),
  );

  const rows = [];
  for (const row of students) {
    const assessment = assessmentIndex.get(row.student_profile_id);
    const candidateFromAssessment = assessment?.candidate_name ? String(assessment.candidate_name).trim() : '';
    const fcfsBlockedBy = blockedMap.get(row.student_profile_id) || null;
    const fcfsBlocked = Boolean(fcfsBlockedBy);
    rows.push({
      student_profile_id: row.student_profile_id,
      assessment_row_id: assessment?.id || null,
      upload_id: assessment?.upload_id || null,
      system_id: formatStudentSystemId(row.short_code, row.roll_number),
      college_roll_no: row.roll_number,
      placement_drive_id: driveId || '',
      job_id: jobId || '',
      tenant_id: row.tenant_id || '',
      candidate_name: candidateFromAssessment || String(row.student_name || '').trim(),
      hiring_result: assessment?.hiring_result ?? '',
      remarks: assessment?.remarks ?? '',
      campus_name: '',
      fcfs_blocked: fcfsBlocked,
      fcfs_blocked_by: fcfsBlockedBy,
    });
  }

  return {
    kind,
    rows,
    academicYearLabel,
    submission_status: ctx.submission_status || 'draft',
    submitted_at: ctx.submitted_at || null,
    isSubmitted: ctx.submission_status === 'submitted',
  };
}

function trimText(v, maxLen) {
  const s = v == null ? '' : String(v);
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

export async function saveAssessmentUpdateOnlineRows(employerId, userId, kind, context, rowsIn) {
  if (!isAssessmentRoundKind(kind)) throw new Error('Invalid kind');
  if (!Array.isArray(rowsIn) || rowsIn.length === 0) throw new Error('rows array required');
  if (rowsIn.length > 500) throw new Error('At most 500 rows per save');

  const tenantId = String(context?.tenantId || '').trim();
  const driveId = context?.driveId || null;
  const jobId = context?.jobId || null;
  if (!tenantId) throw new Error('tenantId is required');
  if (!driveId && !jobId) throw new Error('driveId or jobId is required');

  const profileIds = rowsIn.map((r) => String(r?.student_profile_id || '').trim()).filter(Boolean);
  if (!profileIds.length) throw new Error('No valid student profile ids');

  const studentsRes = await query(
    `SELECT sp.id AS student_profile_id, sp.roll_number AS college_roll_no, sp.tenant_id, t.short_code
     FROM student_profiles sp
     JOIN tenants t ON t.id = sp.tenant_id
     WHERE sp.id = ANY($1::uuid[]) AND sp.tenant_id = $2::uuid`,
    [profileIds, tenantId],
  );
  const studentById = new Map(studentsRes.rows.map((r) => [r.student_profile_id, r]));

  let saved = 0;
  const errors = [];

  await transaction(async (client) => {
    await assertAssessmentContextEditable(client, {
      employerId,
      tenantId,
      opportunityKind: kind,
      driveId,
      jobId,
    });

    const uploadId = await ensureUpload(client, employerId, userId, { tenantId, driveId, jobId });

    for (const input of rowsIn) {
      const profileId = String(input?.student_profile_id || '').trim();
      const student = studentById.get(profileId);
      if (!student) {
        errors.push(`Student ${profileId}: not found for this campus`);
        continue;
      }

      const withdrawn = await isStudentWithdrawnFromTarget(client, profileId, { driveId, jobId });
      if (withdrawn) {
        errors.push(`Roll ${student.college_roll_no}: ${WITHDRAWAL_ASSESSMENT_REJECT_MESSAGE}`);
        continue;
      }

      const hiringRaw = input.hiring_result ?? input.hiring_result_result ?? '';
      const hiringErr = validateHiringResult(hiringRaw);
      if (hiringErr) {
        errors.push(`Roll ${student.college_roll_no}: ${hiringErr}`);
        continue;
      }

      const track = fcfsTrackFromAssessmentKind(kind);
      if (track && isFcfsHiringSelect(hiringRaw)) {
        const fcfs = await assertEmployerMayConfirmStudent(
          {
            tenantId,
            studentProfileId: profileId,
            track,
            employerId,
          },
          client,
        );
        if (!fcfs.ok) {
          errors.push(`Roll ${student.college_roll_no}: ${EMPLOYER_FCFS_BLOCKED_MESSAGE}`);
          continue;
        }
      }

      const next = {
        hiring_result: normalizeHiringResult(hiringRaw),
        remarks: trimText(input.remarks, 4000) || null,
        candidate_name: trimText(input.candidate_name, 255) || null,
      };

      await upsertAssessmentRowInContext(client, {
        employerId,
        tenantId,
        targetDriveId: driveId,
        targetJobId: jobId,
        uploadId,
        studentProfileId: profileId,
        applicationId: null,
        rollNumber: student.college_roll_no,
        hiringResult: next.hiring_result,
        remarks: next.remarks,
        candidateName: next.candidate_name,
        isUnregisteredStudent: true,
      });

      await writeEmployerAssessmentAudit(client, {
        tenantId,
        userId: userId || null,
        uploadId,
        kind: 'rows_save',
        summary: `Online update: saved hiring result for roll ${student.college_roll_no}`,
        details: { student_profile_id: profileId, source: 'assessment_update_online' },
      });

      saved += 1;
    }
  });

  return { saved, errors };
}
