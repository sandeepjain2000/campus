import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { withApiHandlers } from '@/lib/platformErrorRoute';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';
import { buildCvDownloadFileName, isStudentCvsTableReady } from '@/lib/studentCv';
import { createDownloadUrlForKey, isS3Configured } from '@/lib/s3';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function extractS3Key(fileUrl) {
  try {
    const u = new URL(String(fileUrl || ''));
    const key = decodeURIComponent((u.pathname || '').replace(/^\/+/, ''));
    return key || null;
  } catch {
    return null;
  }
}

async function __platform_GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isStudentCvsTableReady())) {
      return NextResponse.json({ error: 'CV management is not available' }, { status: 503 });
    }

    const cvId = String(params?.id || '').trim();
    if (!cvId) {
      return NextResponse.json({ error: 'Missing CV id' }, { status: 400 });
    }

    const studentId = await getOrCreateStudentProfileId(session.user.id);
    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const r = await query(
      `SELECT label, file_url, file_extension
       FROM student_cvs
       WHERE id = $1::uuid AND student_id = $2::uuid`,
      [cvId, studentId],
    );
    const row = r.rows[0];
    if (!row?.file_url) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    if (!isS3Configured()) {
      return NextResponse.json({ error: 'File storage not configured' }, { status: 503 });
    }

    const key = extractS3Key(row.file_url);
    if (!key) {
      return NextResponse.json({ error: 'Invalid file location' }, { status: 400 });
    }

    const downloadFileName = buildCvDownloadFileName(row.label, row.file_extension);
    const { downloadUrl } = await createDownloadUrlForKey(key, 60 * 30, { downloadFileName });
    return NextResponse.redirect(downloadUrl);
  } catch (e) {
    console.error('GET /api/student/cvs/[id]/view', e);
    return NextResponse.json({ error: 'Could not open CV' }, { status: 500 });
  }
}

const __platformApiHandlers = withApiHandlers({ GET: __platform_GET }, { context: 'api_student_cvs_id_view' });
export const GET = __platformApiHandlers.GET;
