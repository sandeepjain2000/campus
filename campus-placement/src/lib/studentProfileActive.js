/**
 * SQL helpers for soft-archived student profiles.
 * Archived students are hidden from college lists, drives/jobs, and student portal actions.
 */

/** Use on student_profiles alias `sp`. */
export const SP_ACTIVE_CLAUSE = 'sp.archived_at IS NULL';

/** Use on bare student_profiles table. */
export const STUDENT_PROFILE_ACTIVE_CLAUSE = 'archived_at IS NULL';

/** Subquery of active profile ids for a tenant (pass tenant uuid param, e.g. $1). */
export function activeStudentIdsForTenant(tenantParam) {
  return `(SELECT id FROM student_profiles WHERE tenant_id = ${tenantParam}::uuid AND archived_at IS NULL)`;
}
