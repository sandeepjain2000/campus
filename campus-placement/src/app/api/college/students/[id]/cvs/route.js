import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { withApiHandlers } from '@/lib/platformErrorRoute';
import { SP_ACTIVE_CLAUSE } from '@/lib/studentProfileActive';
import { resolveCollegeStaffTenantFromSession } from '@/lib/sessionTenant';
import { assertCollegeStaff } from '@/lib/collegeAccess';
import {
  assertCollegeCvVerifier,
  canVerifyStudentCvs,
  getCollegeCvVerificationSettings,
} from '@/lib/collegeCvVerification';
import { isStudentCvsTableReady, listStudentCvsForCollege } from '@/lib/studentCv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function __platform_GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const gate = assertCollegeStaff(session);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const tenantId = await resolveCollegeStaffTenantFromSession(session);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const { id: studentId } = await params;
    if (!studentId) {
      return NextResponse.json({ error: 'Student id is required' }, { status: 400 });
    }

    const ready = await isStudentCvsTableReady();
    if (!ready) {
      return NextResponse.json(
        { error: 'CV management is not available until migration 099_student_cvs.sql is applied.', items: [] },
        { status: 503 },
      );
    }

    const check = await query(
      `SELECT id FROM student_profiles
       WHERE id = $1::uuid AND tenant_id = $2::uuid AND ${SP_ACTIVE_CLAUSE}
       LIMIT 1`,
      [studentId, tenantId],
    );
    if (!check.rows.length) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === '1';
    const settings = await getCollegeCvVerificationSettings(tenantId);
    const items = await listStudentCvsForCollege(studentId, { includeArchived });

    return NextResponse.json({
      items,
      requireCvVerification: settings.requireCvVerification,
      delegateCvVerificationToCommittee: settings.delegateCvVerificationToCommittee,
      canVerify: canVerifyStudentCvs(session, settings),
    });
  } catch (e) {
    console.error('GET /api/college/students/[id]/cvs', e);
    return NextResponse.json({ error: 'Failed to load student CVs' }, { status: 500 });
  }
}

const __platformApiHandlers = withApiHandlers({ GET: __platform_GET }, { context: 'api_college_student_cvs' });
export const GET = __platformApiHandlers.GET;
