import { query } from '@/lib/db';
import { getApplyBlockReason } from '@/lib/getApplyBlockReason';
import {
  getStudentPlacementApplyLock,
  getStudentResumeApplyState,
} from '@/lib/studentApplyEligibility';

/**
 * Load student fields needed for posting eligibility checks.
 * @param {string} studentId
 * @param {string | null} [tenantId]
 */
export async function loadStudentApplyProfile(studentId, tenantId = null) {
  if (!studentId) {
    return {
      cgpa: null,
      branch: '',
      department: '',
      batchYear: null,
      backlogsActive: 0,
      hasResume: false,
      isPlacementLocked: false,
    };
  }

  const [profileRes, resumeState, placementLock] = await Promise.all([
    query(
      `SELECT cgpa, branch, department, batch_year, backlogs_active, placement_status, tenant_id
       FROM student_profiles WHERE id = $1::uuid LIMIT 1`,
      [studentId],
    ),
    getStudentResumeApplyState(studentId),
    getStudentPlacementApplyLock(studentId, tenantId),
  ]);

  const row = profileRes.rows[0] || {};
  const cgpaRaw = row.cgpa;
  const cgpa =
    cgpaRaw != null && cgpaRaw !== '' && !Number.isNaN(Number(cgpaRaw)) ? Number(cgpaRaw) : null;

  return {
    cgpa,
    branch: row.branch || '',
    department: row.department || '',
    batchYear: row.batch_year != null && row.batch_year !== '' ? Number(row.batch_year) : null,
    backlogsActive: Number(row.backlogs_active ?? 0),
    hasResume: resumeState.hasResume,
    isPlacementLocked: Boolean(placementLock.locked),
  };
}

/**
 * @param {import('@/lib/getApplyBlockReason').OpportunityLike | null | undefined} opportunity
 * @param {import('@/lib/getApplyBlockReason').StudentLike | null | undefined} student
 * @param {import('@/lib/getApplyBlockReason').ApplyBlockOptions} [options]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function assertStudentMayApplyToPosting(opportunity, student, options = {}) {
  const reason = getApplyBlockReason(opportunity, student, options);
  if (reason) return { ok: false, error: reason };
  return { ok: true };
}
