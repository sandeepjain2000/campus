import { fetchAssessmentRowsForView, pickRepresentativeAssessmentRows } from '@/lib/assessmentHiringView';
import { isAssessmentRoundKind } from '@/lib/assessmentRoundMap';
import {
  ASSESSMENT_UPLOAD_CSV_HEADERS,
  buildAssessmentUploadStarterCsv,
  defaultHiringResultCells,
} from '@/lib/assessmentUploadStarterCsv';
import { excludeWithdrawnStudents, getWithdrawnStudentProfileIdsForTarget } from '@/lib/applicationWithdrawal';
import { query } from '@/lib/db';
import { listTenantStudentsForAssessment, resolveCurrentAcademicYearLabel } from '@/lib/assessmentCampusStudents';
import {
  filterStudentsByAssessmentPostingEligibility,
  loadAssessmentPostingOpportunity,
} from '@/lib/assessmentExportEligibility';
import { formatStudentSystemId } from '@/lib/studentSystemId';

function assessmentLookupKey({ studentProfileId, driveId, jobId, tenantId }) {
  return `${studentProfileId}|${driveId || ''}|${jobId || ''}|${tenantId || ''}`;
}

function buildAssessmentIndex(employerId) {
  return fetchAssessmentRowsForView({ employerId }).then((rows) => {
    const rep = pickRepresentativeAssessmentRows(rows);
    const map = new Map();
    for (const r of rep) {
      map.set(
        assessmentLookupKey({
          studentProfileId: r.student_profile_id,
          driveId: r.upload_drive_id,
          jobId: r.upload_job_id,
          tenantId: r.tenant_id,
        }),
        r,
      );
    }
    return map;
  });
}

/**
 * Build import-ready CSV with all campus students for tenant + current academic year.
 * @param {string} employerId
 * @param {'internship' | 'jobs' | 'drive' | 'projects'} kind
 * @param {{ tenantId: string, driveId?: string | null, jobId?: string | null, academicYearLabel?: string | null }} context
 */
export async function buildAssessmentExportCsv(employerId, kind, context) {
  if (!isAssessmentRoundKind(kind)) {
    throw new Error('Invalid kind');
  }
  const tenantId = String(context?.tenantId || '').trim();
  if (!tenantId) throw new Error('tenantId is required for export');

  const defaultDriveId = String(context?.driveId || '').trim();
  const defaultJobId = String(context?.jobId || '').trim();
  if (kind === 'drive' && !defaultDriveId) {
    throw new Error('Select a placement drive before exporting the CSV template');
  }
  if (kind !== 'drive' && !defaultJobId) {
    throw new Error('Select a job posting before exporting the CSV template');
  }

  const academicYearLabel =
    context?.academicYearLabel !== undefined
      ? context.academicYearLabel
      : await resolveCurrentAcademicYearLabel(tenantId);

  const studentsAll = await listTenantStudentsForAssessment(tenantId, { academicYearLabel });
  const withdrawnIds = await getWithdrawnStudentProfileIdsForTarget(
    { query },
    { driveId: defaultDriveId || null, jobId: defaultJobId || null },
  );
  const afterWithdrawal = excludeWithdrawnStudents(studentsAll, withdrawnIds);

  const opportunity = await loadAssessmentPostingOpportunity(employerId, kind, {
    tenantId,
    driveId: defaultDriveId || null,
    jobId: defaultJobId || null,
  });
  const { students, excludedCount: eligibilityExcludedCount } =
    await filterStudentsByAssessmentPostingEligibility(
      afterWithdrawal,
      opportunity,
      tenantId,
      kind,
      { jobId: defaultJobId || null },
    );

  const assessmentIndex = await buildAssessmentIndex(employerId);

  const csvRows = students.map((row) => {
    const placementDriveId = kind === 'drive' ? defaultDriveId : '';
    const jobId = kind !== 'drive' ? defaultJobId : '';
    const assessment = assessmentIndex.get(
      assessmentLookupKey({
        studentProfileId: row.student_profile_id,
        driveId: placementDriveId || null,
        jobId: jobId || null,
        tenantId: row.tenant_id,
      }),
    );
    const cells = defaultHiringResultCells(assessment);
    return {
      system_id: formatStudentSystemId(row.short_code, row.roll_number),
      college_roll_no: row.roll_number,
      placement_drive_id: placementDriveId,
      job_id: jobId,
      tenant_id: row.tenant_id || '',
      candidate_name: String(assessment?.candidate_name || row.student_name || '').trim(),
      ...cells,
    };
  });

  return {
    csv: `\uFEFF${buildAssessmentUploadStarterCsv(csvRows)}`,
    rowCount: csvRows.length,
    headers: ASSESSMENT_UPLOAD_CSV_HEADERS,
    academicYearLabel,
    eligibilityExcludedCount,
  };
}
