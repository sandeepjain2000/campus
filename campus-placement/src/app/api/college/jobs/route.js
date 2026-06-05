import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { resolveCollegeAdminTenantId } from '@/lib/sessionTenant';
import { resolveTenantAcademicYear } from '@/lib/resolveAcademicYearFromRequest';
import { AND_JP_NOT_DELETED } from '@/lib/softDeleteSql';

export const dynamic = 'force-dynamic';
export const revalidate = 0;






/**
 * Published job postings from employers with an approved tie-up to this college.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    const sessionTenant = session.user.tenantId || session.user.tenant_id;
    const tenantId = (await resolveCollegeAdminTenantId(userId, sessionTenant)) || sessionTenant;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const ay = await resolveTenantAcademicYear(tenantId, searchParams);
    const yearId = ay.year?.id || null;

    let result;
    try {
      const yearClause = yearId ? ' AND (jp.academic_year_id = $2::uuid OR jp.academic_year_id IS NULL)' : '';
      const params = yearId ? [tenantId, yearId] : [tenantId];
      result = await query(
        `SELECT
           jp.id,
           jp.title,
           jp.description,
           jp.salary_min,
           jp.salary_max,
           jp.min_cgpa,
           jp.max_backlogs,
           jp.batch_year,
           jp.vacancies,
           jp.skills_required,
           jp.eligible_branches,
           jp.job_type,
           jp.status,
           jp.created_at,
           jp.academic_year_id,
           ep.id AS employer_id,
           ep.company_name,
           ep.website
         FROM job_postings jp
         INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
         INNER JOIN job_posting_visibility jpv
           ON jpv.job_id = jp.id AND jpv.tenant_id = $1::uuid
         INNER JOIN employer_approvals ea
           ON ea.employer_id = ep.id
          AND ea.tenant_id = $1::uuid
          AND ea.status = 'approved'
         WHERE jp.job_type IN ('full_time', 'part_time', 'contract', 'ppo')
           AND jp.status = 'published'${yearClause} ${AND_JP_NOT_DELETED}
         ORDER BY jp.created_at DESC`,
        params,
      );
    } catch (err) {
      if (err?.code === '42703' && String(err?.message || '').includes('academic_year_id')) {
        result = await query(
          `SELECT
             jp.id,
             jp.title,
             jp.description,
             jp.salary_min,
             jp.salary_max,
             jp.min_cgpa,
             jp.max_backlogs,
             jp.batch_year,
             jp.vacancies,
             jp.skills_required,
             jp.eligible_branches,
             jp.job_type,
             jp.status,
             jp.created_at,
             ep.id AS employer_id,
             ep.company_name,
             ep.website
           FROM job_postings jp
           INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
           INNER JOIN job_posting_visibility jpv
             ON jpv.job_id = jp.id AND jpv.tenant_id = $1::uuid
           INNER JOIN employer_approvals ea
             ON ea.employer_id = ep.id
            AND ea.tenant_id = $1::uuid
            AND ea.status = 'approved'
           WHERE jp.job_type IN ('full_time', 'part_time', 'contract', 'ppo')
             AND jp.status = 'published' ${AND_JP_NOT_DELETED}
           ORDER BY jp.created_at DESC`,
          [tenantId],
        );
      } else {
        throw err;
      }
    }

    return NextResponse.json({ jobs: result.rows });
  } catch (e) {
    console.error('GET /api/college/jobs', e);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }
}
