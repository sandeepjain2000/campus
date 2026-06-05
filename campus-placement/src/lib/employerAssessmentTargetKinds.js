/**
 * Job type filters for Assessment uploads / update-online target dropdowns.
 * @typedef {'internship' | 'jobs' | 'drive' | 'projects'} AssessmentTargetKind
 */

const INTERNSHIP_TYPES = ['internship'];
const PROJECT_TYPES = ['short_project', 'hackathon'];
const NON_JOBS_TAB_TYPES = [...INTERNSHIP_TYPES, ...PROJECT_TYPES];

/**
 * SQL fragment + extra bind params for job_postings filtered by assessment tab.
 * @param {AssessmentTargetKind} kind
 * @returns {{ clause: string, params: unknown[] }}
 */
export function jobTypesClauseForAssessmentKind(kind) {
  if (kind === 'internship') {
    return { clause: `AND jp.job_type = $3`, params: ['internship'] };
  }
  if (kind === 'projects') {
    return { clause: `AND jp.job_type = ANY($3::text[])`, params: [PROJECT_TYPES] };
  }
  if (kind === 'jobs') {
    return {
      clause: `AND jp.job_type <> ALL($3::text[])`,
      params: [NON_JOBS_TAB_TYPES],
    };
  }
  return { clause: '', params: [] };
}
