import { writeEmployerAssessmentAudit } from '@/lib/employerAssessmentAudit';
import { assertAssessmentContextEditable } from '@/lib/assessmentContext';
import { upsertAssessmentRowInContext } from '@/lib/assessmentRowUpsert';
import { WITHDRAWAL_ASSESSMENT_REJECT_MESSAGE, isStudentWithdrawnFromTarget } from '@/lib/applicationWithdrawal';
import { normalizeHiringResult } from '@/lib/hiringResult';
import {
  assertEmployerMayConfirmStudent,
  EMPLOYER_FCFS_CSV_REJECT_MESSAGE,
  fcfsTrackFromAssessmentKind,
  fcfsTrackFromAssessmentTarget,
  isFcfsHiringSelect,
} from '@/lib/campusFcfsSelection';
import { resolveRollFromCsvIdentifiers } from '@/lib/studentSystemId';
import { STUDENT_PROFILE_ACTIVE_CLAUSE } from '@/lib/studentProfileActive';
import {
  findApplicationForStudent,
  resolveTarget,
  sanitizeUuidInput,
  targetGroupKey,
} from '@/lib/assessmentUploadProcessCore';

async function insertUploadBatch(client, {
  employerId,
  userId,
  tenantId,
  targetDriveId,
  targetJobId,
  opportunityKind,
  fileName,
  s3Key,
  preparedRows,
}) {
  await assertAssessmentContextEditable(client, {
    employerId,
    tenantId,
    opportunityKind,
    driveId: targetDriveId,
    jobId: targetJobId,
  });

  const up = await client.query(
    `INSERT INTO employer_assessment_uploads
       (employer_id, tenant_id, drive_id, job_id, uploaded_by, original_file_name, s3_key, total_rows)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8)
     RETURNING id`,
    [
      employerId,
      tenantId,
      targetDriveId,
      targetJobId,
      userId || null,
      fileName,
      s3Key,
      preparedRows.length,
    ],
  );
  const uploadId = up.rows[0].id;

  let accepted = 0;
  const errors = [];

  for (const row of preparedRows) {
    const studentRes = await client.query(
      `SELECT id, roll_number
       FROM student_profiles
       WHERE tenant_id = $1::uuid AND ${STUDENT_PROFILE_ACTIVE_CLAUSE}
         AND (LOWER(COALESCE(roll_number, '')) = LOWER($2) OR LOWER(COALESCE(enrollment_number, '')) = LOWER($2))
       LIMIT 1`,
      [tenantId, row.roll],
    );
    if (!studentRes.rows.length) {
      errors.push(`Student ${row.roll}: not found in master student list`);
      continue;
    }
    const studentId = studentRes.rows[0].id;
    const withdrawn = await isStudentWithdrawnFromTarget(client, studentId, {
      driveId: targetDriveId,
      jobId: targetJobId,
    });
    if (withdrawn) {
      errors.push(`Student ${row.roll}: ${WITHDRAWAL_ASSESSMENT_REJECT_MESSAGE}`);
      continue;
    }
    if (isFcfsHiringSelect(row.hiring_result)) {
      const track =
        fcfsTrackFromAssessmentTarget({
          opportunityKind,
          targetDriveId,
          targetJobId,
        }) || fcfsTrackFromAssessmentKind(opportunityKind);
      if (track) {
        const fcfs = await assertEmployerMayConfirmStudent(
          {
            tenantId,
            studentProfileId: studentId,
            track,
            employerId,
          },
          client,
        );
        if (!fcfs.ok) {
          errors.push(`Student ${row.roll}: ${EMPLOYER_FCFS_CSV_REJECT_MESSAGE}`);
          continue;
        }
      }
    }
    const storedRoll = studentRes.rows[0].roll_number || row.roll;
    const applicationId = await findApplicationForStudent(client, studentId, targetDriveId, targetJobId);

    await upsertAssessmentRowInContext(client, {
      employerId,
      tenantId,
      targetDriveId,
      targetJobId,
      uploadId,
      studentProfileId: studentId,
      applicationId,
      rollNumber: storedRoll,
      hiringResult: row.hiring_result,
      remarks: row.remarks,
      candidateName: row.candidateName || null,
      isUnregisteredStudent: !applicationId,
    });
    accepted += 1;
  }

  await client.query(
    `UPDATE employer_assessment_uploads
     SET accepted_rows = $1, rejected_rows = $2
     WHERE id = $3::uuid`,
    [accepted, preparedRows.length - accepted, uploadId],
  );

  await writeEmployerAssessmentAudit(client, {
    tenantId,
    userId: userId || null,
    uploadId,
    kind: 'csv_upload',
    summary: `CSV upload: ${fileName} — ${accepted} accepted, ${preparedRows.length - accepted} rejected`,
    details: {
      original_file_name: fileName,
      total_rows: preparedRows.length,
      accepted_rows: accepted,
      rejected_rows: preparedRows.length - accepted,
    },
  });

  return { uploadId, accepted, errors, rejected: preparedRows.length - accepted };
}

/** Commit pre-validated staging rows (direct upload or accepted import review). */
export async function commitValidatedAssessmentRows(client, params) {
  const {
    employerId,
    userId,
    opportunityKind,
    fileName,
    s3Key,
    stagingRows,
  } = params;

  const groups = new Map();
  for (const raw of stagingRows) {
    const driveId = sanitizeUuidInput(raw.placement_drive_id);
    const jobId = sanitizeUuidInput(raw.job_id);
    const tenantId = sanitizeUuidInput(raw.tenant_id);
    const key = targetGroupKey({ driveId, jobId, tenantId: driveId ? '' : tenantId });
    if (!groups.has(key)) {
      groups.set(key, { driveId: driveId || null, jobId: jobId || null, tenantId: tenantId || null, rawRows: [] });
    }
    groups.get(key).rawRows.push(raw);
  }

  let acceptedRows = 0;
  let rejectedRows = 0;
  const uploadIds = [];
  const errors = [];
  let firstUpload = true;

  for (const [, group] of groups) {
    const target = await resolveTarget(client, employerId, group);
    if (target.error) {
      errors.push(`${group.driveId || group.jobId}: ${target.error}`);
      rejectedRows += group.rawRows.length;
      continue;
    }

    const tenantMeta = await client.query(`SELECT short_code FROM tenants WHERE id = $1::uuid LIMIT 1`, [target.tenantId]);
    const shortCode = tenantMeta.rows[0]?.short_code || '';

    const preparedRows = [];
    const dedupe = new Set();
    for (const raw of group.rawRows) {
      const resolved = resolveRollFromCsvIdentifiers({
        systemIdCell: raw.system_id,
        rollCell: raw.college_roll_no,
        shortCode,
      });
      if (resolved.error) {
        errors.push(`Row ${raw.rowNum}: ${resolved.error}`);
        continue;
      }
      const dedupeKey = resolved.systemId || resolved.rollNumber;
      if (dedupe.has(dedupeKey)) {
        errors.push(`Row ${raw.rowNum}: duplicate student identifier (${dedupeKey})`);
        continue;
      }
      dedupe.add(dedupeKey);
      preparedRows.push({
        roll: resolved.rollNumber,
        candidateName: raw.candidate_name,
        remarks: raw.remarks || null,
        hiring_result: normalizeHiringResult(raw.hiring_result),
      });
    }

    if (!preparedRows.length) {
      rejectedRows += group.rawRows.length;
      continue;
    }

    const result = await insertUploadBatch(client, {
      employerId,
      userId,
      tenantId: target.tenantId,
      targetDriveId: target.targetDriveId,
      targetJobId: target.targetJobId,
      opportunityKind,
      fileName,
      s3Key: firstUpload ? s3Key : null,
      preparedRows,
    });
    firstUpload = false;
    uploadIds.push(result.uploadId);
    acceptedRows += result.accepted;
    rejectedRows += result.rejected + (group.rawRows.length - preparedRows.length);
    errors.push(...result.errors);
  }

  return {
    ok: uploadIds.length > 0,
    uploadId: uploadIds[0] || null,
    uploadIds,
    totalRows: stagingRows.length,
    acceptedRows,
    rejectedRows,
    errors,
  };
}
