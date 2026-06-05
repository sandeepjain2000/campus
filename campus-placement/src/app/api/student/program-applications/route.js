import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getApplyBlockReason, postingEligibilityFromJobRow } from '@/lib/getApplyBlockReason';
import { assertStudentMayApplyToPlacement } from '@/lib/studentApplyEligibility';
import { loadStudentApplyProfile } from '@/lib/studentApplyProfile';
import { WITHDRAWAL_IS_FINAL_STUDENT_MESSAGE, isWithdrawnApplicationStatus } from '@/lib/applicationWithdrawal';
import { assertStudentMayApplyToInternship } from '@/lib/internshipPlacementRules';
import { assertActiveEmployerTieUp } from '@/lib/employerTieUp';
import { getOrCreateStudentProfileId, isStudentProfileArchived } from '@/lib/studentServer';
import { resolveStudentPlacementTenantIds } from '@/lib/sessionTenant';
import { uuidInClause } from '@/lib/sqlPlaceholders';

export const dynamic = 'force-dynamic';
export const revalidate = 0;






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
         ep.company_name,
         ep.website
       FROM program_applications pa
       JOIN student_profiles sp ON sp.id = pa.student_id
       JOIN job_postings jp ON jp.id = pa.job_id
       JOIN employer_profiles ep ON ep.id = jp.employer_id
       WHERE sp.user_id = $1::uuid
         AND COALESCE(pa.is_deleted, false) = false
         AND COALESCE(jp.is_deleted, false) = false
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
        website: r.website || null,
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

    if (await isStudentProfileArchived(userId)) {
      return NextResponse.json(
        { error: 'Your student account has been archived. Contact your placement office if this is a mistake.' },
        { status: 403 },
      );
    }

    const studentId = await getOrCreateStudentProfileId(userId);
    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not available' }, { status: 400 });
    }

    const applyGate = await assertStudentMayApplyToPlacement(studentId, tenantIds[0] || sessionTenant);
    if (!applyGate.ok) {
      return NextResponse.json({ error: applyGate.error }, { status: 403 });
    }

    const { sql: tenantInSql, params: tenantInParams } = uuidInClause(tenantIds, 2);
    const job = await query(
      `SELECT jp.id, jp.job_type, jp.status, jp.min_cgpa, jp.max_backlogs, jp.eligible_branches,
              jp.batch_year, jp.application_deadline,
              sp.cgpa AS student_cgpa, sp.branch AS student_branch, sp.department AS student_department,
              sp.batch_year AS student_batch_year, sp.backlogs_active AS student_backlogs_active
       FROM job_postings jp
       CROSS JOIN student_profiles sp
       INNER JOIN job_posting_visibility jpv ON jpv.job_id = jp.id AND jpv.tenant_id IN (${tenantInSql})
         AND jpv.college_status = 'approved'
       INNER JOIN employer_profiles ep ON ep.id = jp.employer_id
       INNER JOIN employer_approvals ea
         ON ea.employer_id = ep.id AND ea.tenant_id = jpv.tenant_id AND ea.status = 'approved'
       WHERE jp.id = $1::uuid AND sp.id = $${tenantInParams.length + 2}::uuid
         AND COALESCE(jp.is_deleted, false) = false`,
      [jobId, ...tenantInParams, studentId],
    );

    if (!job.rowCount) {
      return NextResponse.json({ error: 'Opening not found or not available for your campus' }, { status: 404 });
    }

    const row = job.rows[0];
    const employerIdRes = await query(
      `SELECT jp.employer_id, jpv.tenant_id
       FROM job_postings jp
       INNER JOIN job_posting_visibility jpv ON jpv.job_id = jp.id
       WHERE jp.id = $1::uuid
       LIMIT 1`,
      [jobId],
    );
    const empRow = employerIdRes.rows[0];
    if (empRow?.employer_id && empRow?.tenant_id) {
      const tieUp = await assertActiveEmployerTieUp(empRow.tenant_id, empRow.employer_id);
      if (!tieUp.ok) {
        return NextResponse.json({ error: tieUp.error }, { status: 403 });
      }
    }

    if (row.status !== 'published') {
      return NextResponse.json({ error: 'This opening is not accepting applications' }, { status: 409 });
    }
    if (!PROGRAM_TYPES.has(row.job_type)) {
      return NextResponse.json({ error: 'Invalid program type' }, { status: 400 });
    }

    if (row.job_type === 'internship') {
      const internGate = await assertStudentMayApplyToInternship(studentId, jobId);
      if (!internGate.ok) {
        return NextResponse.json({ error: internGate.error }, { status: 403 });
      }
    }

    const applyProfile = await loadStudentApplyProfile(studentId, tenantIds[0] || sessionTenant);
    const { opportunity, student: profileFields } = postingEligibilityFromJobRow(row);
    const blockReason = getApplyBlockReason(opportunity, {
      ...profileFields,
      hasResume: applyProfile.hasResume,
      isPlacementLocked: applyProfile.isPlacementLocked,
    });
    if (blockReason) {
      return NextResponse.json({ error: blockReason }, { status: 400 });
    }

    const existing = await query(
      `SELECT status FROM program_applications
       WHERE student_id = $1::uuid AND job_id = $2::uuid
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [studentId, jobId],
    );
    if (existing.rows.length && isWithdrawnApplicationStatus(existing.rows[0].status)) {
      return NextResponse.json({ error: WITHDRAWAL_IS_FINAL_STUDENT_MESSAGE }, { status: 409 });
    }

    const ins = await query(
      `INSERT INTO program_applications (student_id, job_id, status, notes)
       VALUES ($1::uuid, $2::uuid, 'applied', $3)
       ON CONFLICT (student_id, job_id)
       DO UPDATE SET
         status = 'applied',
         notes = COALESCE(EXCLUDED.notes, program_applications.notes),
         updated_at = NOW()
       WHERE program_applications.status <> 'withdrawn'
       RETURNING id, status`,
      [studentId, jobId, notes || null],
    );

    if (!ins.rowCount) {
      const withdrawn = await query(
        `SELECT 1 FROM program_applications
         WHERE student_id = $1::uuid AND job_id = $2::uuid AND status = 'withdrawn'
           AND COALESCE(is_deleted, false) = false
         LIMIT 1`,
        [studentId, jobId],
      );
      if (withdrawn.rowCount) {
        return NextResponse.json({ error: WITHDRAWAL_IS_FINAL_STUDENT_MESSAGE }, { status: 409 });
      }
      return NextResponse.json({ error: 'Could not submit application' }, { status: 500 });
    }

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
