import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';
import { resolveStudentPlacementTenantIds } from '@/lib/sessionTenant';
import { uuidInClause } from '@/lib/sqlPlaceholders';

export const dynamic = 'force-dynamic';

const PROGRAM_TYPES = new Set(['full_time', 'internship', 'short_project', 'hackathon']);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT
         pa.id,
         pa.status,
         pa.applied_at,
         pa.notes,
         jp.id AS job_id,
         jp.title,
         jp.job_type,
         ep.company_name
       FROM program_applications pa
       JOIN student_profiles sp ON sp.id = pa.student_id
       JOIN job_postings jp ON jp.id = pa.job_id
       JOIN employer_profiles ep ON ep.id = jp.employer_id
       WHERE sp.user_id = $1::uuid
       ORDER BY pa.applied_at DESC`,
      [userId],
    );

    return NextResponse.json({
      items: result.rows.map((r) => ({
        id: r.id,
        status: r.status,
        appliedAt: r.applied_at,
        notes: r.notes,
        jobId: r.job_id,
        title: r.title,
        jobType: r.job_type,
        companyName: r.company_name,
      })),
    });
  } catch (e) {
    console.error('GET /api/student/program-applications', e);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    const sessionTenant = session.user.tenantId || session.user.tenant_id;
    const tenantIds = await resolveStudentPlacementTenantIds(userId, sessionTenant);
    if (!userId || !tenantIds.length) {
      return NextResponse.json({ error: 'Missing student context' }, { status: 400 });
    }

    const { jobId, notes } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const studentId = await getOrCreateStudentProfileId(userId);
    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not available' }, { status: 400 });
    }

    const { sql: tenantInSql, params: tenantInParams } = uuidInClause(tenantIds, 2);
    const job = await query(
      `SELECT jp.id, jp.job_type, jp.status, jp.min_cgpa, sp.cgpa AS student_cgpa
       FROM job_postings jp
       CROSS JOIN student_profiles sp
       INNER JOIN job_posting_visibility jpv ON jpv.job_id = jp.id AND jpv.tenant_id IN (${tenantInSql})
       INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
       INNER JOIN employer_approvals ea
         ON ea.employer_id = ep.id AND ea.tenant_id = jpv.tenant_id AND ea.status = 'approved'
       WHERE jp.id = $1::uuid AND sp.id = $${tenantInParams.length + 2}::uuid`,
      [jobId, ...tenantInParams, studentId],
    );

    if (!job.rowCount) {
      return NextResponse.json({ error: 'Opening not found or not available for your campus' }, { status: 404 });
    }

    const row = job.rows[0];
    if (row.status !== 'published') {
      return NextResponse.json({ error: 'This opening is not accepting applications' }, { status: 409 });
    }
    if (!PROGRAM_TYPES.has(row.job_type)) {
      return NextResponse.json({ error: 'Invalid program type' }, { status: 400 });
    }

    if (row.min_cgpa != null) {
      const reqCgpa = Number(row.min_cgpa);
      const myCgpa = Number(row.student_cgpa);

      if (isNaN(myCgpa)) {
        return NextResponse.json({ error: 'Please update your CGPA in your profile to apply.' }, { status: 400 });
      }

      let isEligible = false;
      if (reqCgpa > 10 && myCgpa <= 10) {
        isEligible = (myCgpa * 9.5) >= reqCgpa;
      } else if (reqCgpa <= 10 && myCgpa > 10) {
        isEligible = myCgpa >= (reqCgpa * 9.5);
      } else {
        isEligible = myCgpa >= reqCgpa;
      }

      if (!isEligible) {
        return NextResponse.json({ 
          error: `Cannot apply: Need minimum ${reqCgpa} CGPA, your current is ${myCgpa}. Scale mismatch resolved.`
        }, { status: 400 });
      }
    }

    const ins = await query(
      `INSERT INTO program_applications (student_id, job_id, status, notes)
       VALUES ($1::uuid, $2::uuid, 'applied', $3)
       ON CONFLICT (student_id, job_id)
       DO UPDATE SET status = 'applied', notes = COALESCE(EXCLUDED.notes, program_applications.notes), updated_at = NOW()
       RETURNING id, status`,
      [studentId, jobId, notes || null],
    );

    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1::uuid, $2, $3, 'success', '/dashboard/student/applications')`,
        [userId, 'Application Submitted', `You have successfully applied for the ${row.job_type}.`]
      );
    } catch (err) {
      console.error('Failed to create notification', err);
    }

    return NextResponse.json({
      success: true,
      id: ins.rows[0].id,
      status: ins.rows[0].status,
    });
  } catch (e) {
    console.error('POST /api/student/program-applications', e);
    return NextResponse.json({ error: 'Could not submit application' }, { status: 500 });
  }
}
