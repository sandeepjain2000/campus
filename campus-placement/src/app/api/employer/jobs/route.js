import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { validateEmployerJobPayload } from '@/lib/apiInputValidation';
import { AND_JP_NOT_DELETED } from '@/lib/softDeleteSql';
import {
  PROGRAM_JOB_TYPES,
  resolvePublishTenantIds,
  syncJobPostingVisibility,
} from '@/lib/jobPostingVisibility';
import {
  normalizeEmployerMinCgpa,
  resolveEmployerMinCgpaForSubmit,
} from '@/lib/employerJobDisplay';
import { JOB_APPLICANT_COUNT_SUBQUERY } from '@/lib/employerApplicationCounts';
import {
  applyJobPostingStatusTransition,
  assertEmployerMaySetJobStatus,
  buildPublishedEmployerPatchSql,
  invalidateStudentOpportunityListCache,
  publishedCoreFieldsChanged,
} from '@/lib/jobPostingPublishState';

export const dynamic = 'force-dynamic';
export const revalidate = 0;





/** Avoid stale lists after posting (Next may cache GET route handlers). */

async function getEmployerId(userId) {
  const r = await query(`SELECT id, company_name FROM employer_profiles WHERE user_id = $1::uuid`, [userId]);
  return r.rows[0] || null;
}

function parseKeywords(keywords) {
  return String(keywords || '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const JOB_TYPES = new Set(['full_time', 'internship', 'contract', 'ppo', 'hackathon', 'short_project', 'mentorship', 'guest_faculty']);

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    const emp = await getEmployerId(userId);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const jobTypeFilter = searchParams.get('jobType');
    const typeClause =
      jobTypeFilter && JOB_TYPES.has(jobTypeFilter) ? ` AND job_type = $2` : '';
    const params = jobTypeFilter && JOB_TYPES.has(jobTypeFilter) ? [emp.id, jobTypeFilter] : [emp.id];

    const jobs = await query(
      `SELECT jp.id, jp.title, jp.description, jp.job_type, jp.status, jp.salary_min, jp.salary_max,
              jp.min_cgpa, jp.vacancies, jp.skills_required, jp.eligible_branches, jp.created_at,
              ${JOB_APPLICANT_COUNT_SUBQUERY} AS application_count,
              COALESCE(
                (SELECT array_agg(jpv.tenant_id::text)
                 FROM job_posting_visibility jpv
                 WHERE jpv.job_id = jp.id),
                ARRAY[]::text[]
              ) AS tenant_ids
       FROM job_postings jp
       WHERE jp.employer_id = $1::uuid${typeClause.replace(/job_type/g, 'jp.job_type')} ${AND_JP_NOT_DELETED}
       ORDER BY jp.created_at DESC`,
      params,
    );

    const rows = jobs.rows.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description || '',
      keywords: (j.skills_required || []).join(', '),
      type: j.job_type,
      salaryMin: j.salary_min != null ? Number(j.salary_min) : null,
      salaryMax: j.salary_max != null ? Number(j.salary_max) : null,
      status: j.status,
      vacancies: j.vacancies,
      applications: Number(j.application_count) || 0,
      branches: j.eligible_branches?.length ? j.eligible_branches : [],
      cgpa: normalizeEmployerMinCgpa(j.min_cgpa),
      minCgpa: normalizeEmployerMinCgpa(j.min_cgpa),
      createdAt: j.created_at ? new Date(j.created_at).toISOString().slice(0, 10) : '',
      tenantIds: Array.isArray(j.tenant_ids) ? j.tenant_ids.filter(Boolean) : [],
    }));

    return NextResponse.json({ jobs: rows, companyName: emp.company_name });
  } catch (e) {
    console.error('GET /api/employer/jobs', e);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    const emp = await getEmployerId(userId);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const {
      title,
      description = '',
      jobType = 'full_time',
      status = 'draft',
      salaryMin = null,
      salaryMax = null,
      minCgpa = null,
      vacancies = 1,
      keywords = '',
      tenantIds = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const jobInputErr = validateEmployerJobPayload({
      salaryMin,
      salaryMax,
      minCgpa,
      vacancies,
      jobType,
    });
    if (jobInputErr) {
      return NextResponse.json({ error: jobInputErr }, { status: 400 });
    }

    const minCgpaResolved = resolveEmployerMinCgpaForSubmit(minCgpa);
    if (minCgpaResolved.error) {
      return NextResponse.json({ error: minCgpaResolved.error }, { status: 400 });
    }

    if (!JOB_TYPES.has(jobType)) {
      return NextResponse.json({ error: 'Invalid jobType' }, { status: 400 });
    }

    const allowedStatus = new Set(['draft', 'published', 'closed', 'cancelled']);
    if (!allowedStatus.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const skills = parseKeywords(keywords);
    const skillsRequired = skills.length ? skills : ['General'];

    const result = await transaction(async (client) => {
      const tenantsToPublish = await resolvePublishTenantIds(client, emp.id, tenantIds, { status });

      if (status === 'published' && PROGRAM_JOB_TYPES.has(jobType) && tenantsToPublish.length === 0) {
        const err = new Error(
          'Cannot publish: none of the selected campuses have an approved employer tie-up. Ask the college to approve access, then try again.',
        );
        err.statusCode = 400;
        throw err;
      }

      const ins = await client.query(
        `INSERT INTO job_postings (
           employer_id, title, description, job_type, category, locations,
           salary_min, salary_max, eligible_branches, min_cgpa, max_backlogs, batch_year,
           skills_required, vacancies, status
         ) VALUES (
           $1::uuid, $2, $3, $4, $5, ARRAY['India']::text[],
           $6, $7, ARRAY['Computer Science & Engineering', 'Information Technology']::text[],
           $8, 0, 2025, $9::text[], $10, $11
         )
         RETURNING id, title, job_type, status, salary_min, salary_max, min_cgpa, vacancies, skills_required, created_at`,
        [
          emp.id,
          title.trim(),
          description || '',
          jobType,
          jobType === 'internship'
            ? 'Internship'
            : jobType === 'short_project' || jobType === 'hackathon'
              ? 'Student program'
              : 'Engineering',
          salaryMin != null && salaryMin !== '' ? Number(salaryMin) : null,
          salaryMax != null && salaryMax !== '' ? Number(salaryMax) : null,
          minCgpaResolved.value,
          skillsRequired,
          Math.max(1, parseInt(String(vacancies), 10) || 1),
          status,
        ],
      );

      const job = ins.rows[0];

      if (status === 'published' && tenantsToPublish.length) {
        await syncJobPostingVisibility(client, {
          jobId: job.id,
          employerId: emp.id,
          tenantIds: tenantsToPublish,
          jobType,
          jobTitle: job.title,
          companyName: emp.company_name,
          notifyAdmins: true,
        });
      }

      if (status !== job.status) {
        await applyJobPostingStatusTransition(client, job.id, status);
      }

      return { ok: true, job, tenantIds: tenantsToPublish };
    });

    invalidateStudentOpportunityListCache();
    return NextResponse.json(result);
  } catch (e) {
    console.error('POST /api/employer/jobs', e);
    const status = e.statusCode === 400 ? 400 : 500;
    const safeMsg = status >= 500 ? 'Failed to create job' : (e.message || 'Failed to create job');
    return NextResponse.json({ error: safeMsg }, { status });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }

    const emp = await getEmployerId(userId);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));

    if (body?.action === 'close') {
      const closeId = String(body.id || '').trim();
      if (!closeId) {
        return NextResponse.json({ error: 'Job id is required' }, { status: 400 });
      }
      const closed = await query(
        `UPDATE job_postings
         SET status = 'closed', is_visible = false, updated_at = NOW()
         WHERE id = $1::uuid AND employer_id = $2::uuid AND status = 'published'
         RETURNING id, title, job_type, status`,
        [closeId, emp.id],
      );
      if (!closed.rows.length) {
        return NextResponse.json(
          {
            error:
              'Job not found, or it is not published. Only published postings can be closed from this action.',
          },
          { status: 404 },
        );
      }
      invalidateStudentOpportunityListCache();
      return NextResponse.json({ ok: true, job: closed.rows[0] });
    }

    const {
      id,
      title,
      description = '',
      jobType,
      status,
      salaryMin = null,
      salaryMax = null,
      minCgpa = null,
      vacancies = 1,
      keywords = '',
      tenantIds,
      additionalInfo,
    } = body;

    const jobId = String(id || '').trim();
    if (!jobId || !title?.trim()) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
    }
    const patchInputErr = validateEmployerJobPayload({
      salaryMin,
      salaryMax,
      minCgpa,
      vacancies,
      jobType,
    });
    if (patchInputErr) {
      return NextResponse.json({ error: patchInputErr }, { status: 400 });
    }

    const minCgpaResolved = resolveEmployerMinCgpaForSubmit(minCgpa);
    if (minCgpaResolved.error) {
      return NextResponse.json({ error: minCgpaResolved.error }, { status: 400 });
    }

    if (!JOB_TYPES.has(jobType)) {
      return NextResponse.json({ error: 'Invalid jobType' }, { status: 400 });
    }
    const allowedStatus = new Set(['draft', 'published', 'closed', 'cancelled']);
    if (!allowedStatus.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const skills = parseKeywords(keywords);
    const skillsRequired = skills.length ? skills : ['General'];

    const result = await transaction(async (client) => {
      const existingRes = await client.query(
        `SELECT id, employer_id, title, description, job_type, status, salary_min, salary_max,
                min_cgpa, vacancies, skills_required, additional_info
         FROM job_postings
         WHERE id = $1::uuid AND employer_id = $2::uuid ${AND_JP_NOT_DELETED}`,
        [jobId, emp.id],
      );
      if (!existingRes.rows.length) {
        const err = new Error('Job not found');
        err.statusCode = 404;
        throw err;
      }
      const existing = existingRes.rows[0];

      assertEmployerMaySetJobStatus(existing.status, status);

      let updated;
      if (existing.status === 'published' && status === 'published') {
        if (publishedCoreFieldsChanged(existing, body, skillsRequired)) {
          const err = new Error(
            'Core requirements cannot be changed after publish. Use Additional information, or ask the college to update the listing.',
          );
          err.statusCode = 400;
          throw err;
        }
        const patch = buildPublishedEmployerPatchSql(existing, { additionalInfo, description });
        updated = await client.query(patch.sql, patch.params);
      } else {
        updated = await client.query(
          `UPDATE job_postings
           SET title = $1,
               description = $2,
               job_type = $3,
               status = $4,
               salary_min = $5,
               salary_max = $6,
               min_cgpa = $7,
               vacancies = $8,
               skills_required = $9::text[],
               updated_at = NOW()
           WHERE id = $10::uuid AND employer_id = $11::uuid
           RETURNING id, title, job_type, status`,
          [
            title.trim(),
            description || '',
            jobType,
            status,
            salaryMin != null && salaryMin !== '' ? Number(salaryMin) : null,
            salaryMax != null && salaryMax !== '' ? Number(salaryMax) : null,
            minCgpaResolved.value,
            Math.max(1, parseInt(String(vacancies), 10) || 1),
            skillsRequired,
            jobId,
            emp.id,
          ],
        );
      }

      if (!updated.rows.length) {
        const err = new Error('Job not found');
        err.statusCode = 404;
        throw err;
      }

      if (existing.status !== status) {
        await applyJobPostingStatusTransition(client, jobId, status);
      }

      let syncedTenantIds = [];
      if (status === 'published') {
        const visRes = await client.query(
          `SELECT tenant_id::text AS id FROM job_posting_visibility WHERE job_id = $1::uuid`,
          [jobId],
        );
        const savedTenantIds = visRes.rows.map((r) => r.id);
        const tenantInput = tenantIds !== undefined ? tenantIds : savedTenantIds;
        syncedTenantIds = await resolvePublishTenantIds(client, emp.id, tenantInput, { status });
        if (PROGRAM_JOB_TYPES.has(jobType) && syncedTenantIds.length === 0) {
          const err = new Error(
            'Select at least one approved campus with an active employer tie-up before publishing.',
          );
          err.statusCode = 400;
          throw err;
        }
        if (syncedTenantIds.length) {
          await syncJobPostingVisibility(client, {
            jobId,
            employerId: emp.id,
            tenantIds: syncedTenantIds,
            jobType,
            jobTitle: title.trim(),
            companyName: emp.company_name,
            notifyAdmins: tenantIds !== undefined,
          });
        }
      }

      return { ok: true, job: updated.rows[0], tenantIds: syncedTenantIds };
    });

    invalidateStudentOpportunityListCache();
    return NextResponse.json(result);
  } catch (e) {
    console.error('PATCH /api/employer/jobs', e);
    const status = e.statusCode === 400 ? 400 : e.statusCode === 404 ? 404 : 500;
    const safeMsg = status >= 500 ? 'Failed to update job' : (e.message || 'Failed to update job');
    return NextResponse.json({ error: safeMsg }, { status });
  }
}
