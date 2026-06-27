import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { withApiHandlers } from '@/lib/platformErrorRoute';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';
import { isStudentCvsTableReady, isStudentCvVerificationReady, mapStudentCvRow, getStudentCampusCvVerificationGate } from '@/lib/studentCv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function __platform_GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ready = await isStudentCvsTableReady();
    if (!ready) {
      return NextResponse.json(
        { error: 'CV management is not available until migration 099_student_cvs.sql is applied.', items: [] },
        { status: 503 },
      );
    }

    const studentId = await getOrCreateStudentProfileId(session.user.id);
    if (!studentId) {
      return NextResponse.json({ items: [] });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === '1';
    const verificationReady = await isStudentCvVerificationReady();

    const verificationColumns = verificationReady ? ', sc.cv_verified_at, sc.cv_verified_by' : '';
    const r = await query(
      `SELECT sc.id, sc.label, sc.file_size, sc.is_default, sc.archived_at, sc.created_at, sc.updated_at${verificationColumns},
              (
                (SELECT COUNT(*)::int FROM program_applications pa WHERE pa.student_cv_id = sc.id)
                + (SELECT COUNT(*)::int FROM applications a WHERE a.student_cv_id = sc.id)
              ) AS used_on_applications
       FROM student_cvs sc
       WHERE sc.student_id = $1::uuid
         ${includeArchived ? '' : 'AND sc.archived_at IS NULL'}
       ORDER BY sc.archived_at NULLS FIRST, sc.is_default DESC, sc.created_at DESC`,
      [studentId],
    );

    const cvVerification = await getStudentCampusCvVerificationGate(studentId, session.user.tenantId);

    return NextResponse.json({
      items: r.rows.map((row) => mapStudentCvRow(row)),
      cvVerification: {
        required: cvVerification.required,
        hasVerifiedCv: cvVerification.hasVerifiedCv,
      },
    });
  } catch (e) {
    console.error('GET /api/student/cvs', e);
    return NextResponse.json({ error: 'Failed to load CVs' }, { status: 500 });
  }
}

const __platformApiHandlers = withApiHandlers({ GET: __platform_GET }, { context: 'api_student_cvs' });
export const GET = __platformApiHandlers.GET;
