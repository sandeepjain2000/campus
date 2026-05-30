import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { resolveCollegeAdminTenantId } from '@/lib/sessionTenant';
import { AND_JP_NOT_DELETED } from '@/lib/softDeleteSql';
import { notifyStudentsListingApproved } from '@/lib/jobPostingCollegeApproval';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Internship & program listings visible to this college (all campus approval states).
 * Students only see rows where job_posting_visibility.college_status = 'approved'.
 */
export async function GET() {
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
         jp.job_type,
         jp.status,
         jp.created_at,
         ep.id AS employer_id,
         ep.company_name,
         ep.website,
         jpv.college_status,
         jpv.approved_at AS college_approved_at,
         jpv.rejection_reason
       FROM job_postings jp
       INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
       INNER JOIN job_posting_visibility jpv
         ON jpv.job_id = jp.id AND jpv.tenant_id = $1::uuid
       INNER JOIN employer_approvals ea
         ON ea.employer_id = ep.id
        AND ea.tenant_id = $1::uuid
        AND ea.status = 'approved'
       WHERE jp.job_type IN ('internship', 'short_project', 'hackathon')
         AND jp.status = 'published' ${AND_JP_NOT_DELETED}
       ORDER BY
         CASE jpv.college_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
         jp.created_at DESC`,
      [tenantId],
    );

    return NextResponse.json({ internships: result.rows });
  } catch (e) {
    console.error('GET /api/college/internships', e);
    return NextResponse.json({ error: 'Failed to load internships' }, { status: 500 });
  }
}

/** PATCH { jobId, action: 'approve' | 'reject', rejectionReason? } */
export async function PATCH(request) {
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

    const body = await request.json().catch(() => ({}));
    const jobId = String(body?.jobId || '').trim();
    const action = body?.action;
    const rejectionReason = body?.rejectionReason ? String(body.rejectionReason).trim() : null;

    if (!jobId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'jobId and a valid action (approve|reject) are required' }, { status: 400 });
    }

    const fromStatuses = action === 'approve' ? ['pending', 'rejected'] : ['pending'];
    const nextStatus = action === 'approve' ? 'approved' : 'rejected';

    const updated = await query(
      `UPDATE job_posting_visibility jpv
       SET college_status = $1::varchar,
           approved_by = CASE WHEN $1::varchar = 'approved' THEN $2::uuid ELSE NULL END,
           approved_at = CASE WHEN $1::varchar = 'approved' THEN NOW() ELSE NULL END,
           rejection_reason = CASE WHEN $1::varchar = 'rejected' THEN $3 ELSE NULL END
       FROM job_postings jp
       INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
       WHERE jpv.job_id = jp.id
         AND jpv.job_id = $4::uuid
         AND jpv.tenant_id = $5::uuid
         AND jpv.college_status = ANY($6::varchar[])
         AND jp.status = 'published'
         AND jp.job_type IN ('internship', 'short_project', 'hackathon')
         ${AND_JP_NOT_DELETED}
       RETURNING jp.id, jp.title, jp.job_type, ep.company_name, jpv.college_status`,
      [nextStatus, userId, rejectionReason, jobId, tenantId, fromStatuses],
    );

    if (!updated.rows.length) {
      const meta = await query(
        `SELECT jpv.college_status
         FROM job_posting_visibility jpv
         JOIN job_postings jp ON jp.id = jpv.job_id
         WHERE jpv.job_id = $1::uuid AND jpv.tenant_id = $2::uuid ${AND_JP_NOT_DELETED}`,
        [jobId, tenantId],
      );
      if (!meta.rows[0]) {
        return NextResponse.json({ error: 'Listing not found for your campus' }, { status: 404 });
      }
      return NextResponse.json(
        {
          error:
            action === 'approve'
              ? 'This listing is not awaiting approval (already approved or still pending employer publish).'
              : 'Only pending listings can be rejected.',
          currentStatus: meta.rows[0].college_status,
        },
        { status: 409 },
      );
    }

    const row = updated.rows[0];
    if (row.college_status === 'approved') {
      await notifyStudentsListingApproved(null, {
        tenantId,
        title: row.title,
        jobType: row.job_type,
        companyName: row.company_name,
      });
    }

    return NextResponse.json({
      ok: true,
      jobId: row.id,
      collegeStatus: row.college_status,
    });
  } catch (e) {
    console.error('PATCH /api/college/internships', e);
    return NextResponse.json({ error: 'Failed to update listing approval' }, { status: 500 });
  }
}
