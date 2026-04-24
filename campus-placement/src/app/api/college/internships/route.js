import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * Published internship job postings from employers with an approved tie-up to this college.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const result = await query(
      `SELECT
         jp.id,
         jp.title,
         jp.description,
         jp.salary_min,
         jp.salary_max,
         jp.min_cgpa,
         jp.vacancies,
         jp.skills_required,
         jp.status,
         jp.created_at,
         ep.id AS employer_id,
         ep.company_name,
         ep.website
       FROM job_postings jp
       INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
       INNER JOIN employer_approvals ea
         ON ea.employer_id = ep.id
        AND ea.tenant_id = $1::uuid
        AND ea.status = 'approved'
       WHERE jp.job_type = 'internship'
         AND jp.status = 'published'
       ORDER BY jp.created_at DESC`,
      [tenantId],
    );

    return NextResponse.json({ internships: result.rows });
  } catch (e) {
    console.error('GET /api/college/internships', e);
    return NextResponse.json({ error: 'Failed to load internships' }, { status: 500 });
  }
}
