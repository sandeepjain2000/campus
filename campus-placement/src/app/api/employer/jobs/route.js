import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { fetchCollegeAdminUserIds, notifyStudentsOfTenant, notifyUsersOneAtATime } from '@/lib/notificationService';

/** Avoid stale lists after posting (Next may cache GET route handlers). */
export const dynamic = 'force-dynamic';

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
    if (!session || session.user.role !== 'employer') {
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
      `SELECT id, title, description, job_type, status, salary_min, salary_max, min_cgpa, vacancies,
              skills_required, eligible_branches, created_at
       FROM job_postings
       WHERE employer_id = $1::uuid${typeClause}
       ORDER BY created_at DESC`,
      params,
    );

    const rows = jobs.rows.map((j) => ({
      id: j.id,
      title: j.title,
      keywords: (j.skills_required || []).join(', '),
      type: j.job_type,
      salaryMin: j.salary_min != null ? Number(j.salary_min) : null,
      salaryMax: j.salary_max != null ? Number(j.salary_max) : null,
      status: j.status,
      vacancies: j.vacancies,
      applications: 0,
      branches: j.eligible_branches?.length ? j.eligible_branches : [],
      cgpa: j.min_cgpa != null ? Number(j.min_cgpa) : null,
      createdAt: j.created_at ? new Date(j.created_at).toISOString().slice(0, 10) : '',
      placementDriveId: '',
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
    if (!session || session.user.role !== 'employer') {
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
          jobType === 'internship' ? 'Internship' : 'Engineering',
          salaryMin != null && salaryMin !== '' ? Number(salaryMin) : null,
          salaryMax != null && salaryMax !== '' ? Number(salaryMax) : null,
          minCgpa != null && minCgpa !== '' ? Number(minCgpa) : 0,
          skillsRequired,
          Math.max(1, parseInt(String(vacancies), 10) || 1),
          status,
        ],
      );

      const job = ins.rows[0];
      const uniqueTenants = [...new Set((tenantIds || []).filter(Boolean))];

      if (status === 'published' && uniqueTenants.length) {
        for (const tenantId of uniqueTenants) {
          const ok = await client.query(
            `SELECT 1 FROM employer_approvals
             WHERE tenant_id = $1::uuid AND employer_id = $2::uuid AND status = 'approved'`,
            [tenantId, emp.id],
          );
          if (!ok.rowCount) continue;

          const college = await client.query(`SELECT name FROM tenants WHERE id = $1::uuid`, [tenantId]);
          const collegeName = college.rows[0]?.name || 'Campus';

          const adminIds = await fetchCollegeAdminUserIds(tenantId, client);
          await notifyUsersOneAtATime(
            adminIds,
            {
              title:
                jobType === 'internship'
                  ? `${emp.company_name} posted an internship`
                  : `${emp.company_name} published a job`,
              message: `${emp.company_name} published "${job.title}" (${jobType.replace('_', ' ')}) relevant to ${collegeName}. Open Job Postings to review pipeline activity.`,
              type: jobType === 'internship' ? 'info' : 'application',
              link: jobType === 'internship' ? '/dashboard/college/internships' : '/dashboard/college/drives',
            },
            client,
          );

          if (jobType === 'internship') {
            await notifyStudentsOfTenant(
              tenantId,
              {
                title: `New internship: ${job.title}`,
                message: `${emp.company_name} posted an internship opportunity. Browse drives and applications to learn more.`,
                type: 'drive',
                link: '/dashboard/student/drives',
              },
              client,
            );
          }
        }
      }

      return { ok: true, job };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('POST /api/employer/jobs', e);
    return NextResponse.json({ error: e.message || 'Failed to create job' }, { status: 500 });
  }
}
