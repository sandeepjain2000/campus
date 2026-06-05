/**
 * Publish/draft visibility for job_postings (internships, jobs, programs).
 * Student listings filter on status = 'published' (not is_visible alone).
 */

/** SQL fragment: job posting row is open for new student discovery. */
export const JOB_POSTING_STUDENT_LISTED_SQL = "jp.status = 'published'";

const listCache = new Map();

function cacheKey(tenantIds, kind) {
  const tenants = [...(tenantIds || [])].map(String).sort().join(',');
  return `${kind || 'all'}:${tenants}`;
}

export function getStudentOpportunityListCache(tenantIds, kind) {
  return listCache.get(cacheKey(tenantIds, kind)) ?? null;
}

export function setStudentOpportunityListCache(tenantIds, kind, payload) {
  listCache.set(cacheKey(tenantIds, kind), {
    payload,
    cachedAt: Date.now(),
  });
}

/** Clear cached student opportunity lists after employer publish/draft changes. */
export function invalidateStudentOpportunityListCache() {
  listCache.clear();
}

/**
 * Apply status transition side effects (is_visible is also enforced by DB trigger).
 * @param {import('pg').PoolClient} client
 */
export async function applyJobPostingStatusTransition(client, jobId, nextStatus) {
  if (nextStatus === 'published') {
    await client.query(
      `UPDATE job_postings
       SET is_visible = true,
           published_at = COALESCE(published_at, NOW()),
           updated_at = NOW()
       WHERE id = $1::uuid`,
      [jobId],
    );
  } else if (nextStatus === 'draft' || nextStatus === 'closed' || nextStatus === 'cancelled') {
    await client.query(
      `UPDATE job_postings
       SET is_visible = false,
           updated_at = NOW()
       WHERE id = $1::uuid`,
      [jobId],
    );
  }
}

export function assertEmployerMaySetJobStatus(currentStatus, nextStatus) {
  if (currentStatus === 'published' && nextStatus === 'draft') {
    const err = new Error(
      'Published postings cannot be moved back to draft. Add details under Additional information, or ask the college to update core requirements.',
    );
    err.statusCode = 400;
    throw err;
  }
}

/**
 * When published, employers may only update narrative fields (additional_info / description).
 */
export function buildPublishedEmployerPatchSql(existing, body) {
  const nextAdditional =
    body.additionalInfo !== undefined
      ? String(body.additionalInfo ?? '')
      : existing.additional_info ?? '';
  const nextDescription =
    body.description !== undefined ? String(body.description ?? '') : existing.description ?? '';

  return {
    sql: `UPDATE job_postings
          SET additional_info = $1,
              description = $2,
              updated_at = NOW()
          WHERE id = $3::uuid AND employer_id = $4::uuid
          RETURNING id, title, job_type, status, additional_info`,
    params: [nextAdditional, nextDescription, existing.id, existing.employer_id],
    lockedCore: true,
  };
}

export function publishedCoreFieldsChanged(existing, body, skillsRequired) {
  const title = body.title?.trim() ?? existing.title;
  const jobType = body.jobType ?? existing.job_type;
  const salaryMin =
    body.salaryMin != null && body.salaryMin !== ''
      ? Number(body.salaryMin)
      : existing.salary_min != null
        ? Number(existing.salary_min)
        : null;
  const salaryMax =
    body.salaryMax != null && body.salaryMax !== ''
      ? Number(body.salaryMax)
      : existing.salary_max != null
        ? Number(existing.salary_max)
        : null;
  const minCgpa =
    body.minCgpa !== undefined && body.minCgpa !== null && body.minCgpa !== ''
      ? body.minCgpa
      : existing.min_cgpa;
  const vacancies =
    body.vacancies !== undefined
      ? Math.max(1, parseInt(String(body.vacancies), 10) || 1)
      : existing.vacancies;
  const skills = skillsRequired ?? existing.skills_required;

  return (
    title !== (existing.title || '').trim() ||
    jobType !== existing.job_type ||
    salaryMin !== (existing.salary_min != null ? Number(existing.salary_min) : null) ||
    salaryMax !== (existing.salary_max != null ? Number(existing.salary_max) : null) ||
    String(minCgpa) !== String(existing.min_cgpa ?? '') ||
    vacancies !== existing.vacancies ||
    JSON.stringify(skills || []) !== JSON.stringify(existing.skills_required || [])
  );
}
