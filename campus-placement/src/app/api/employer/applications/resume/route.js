import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { createDownloadUrlForKey, isS3Configured } from '@/lib/s3';
import {
  canEmployerAccessStudent,
  extractS3Key,
  getEmployerProfileId,
} from '@/lib/employerApplicationAccess';
import { isAuthoritativeResumeUrl, resolveStudentResumeUrl } from '@/lib/studentResumeUrl';

export const dynamic = 'force-dynamic';

function isS3Url(url) {
  try {
    const host = new URL(String(url || '')).hostname.toLowerCase();
    return host.includes('.s3.') || host.includes('amazonaws.com');
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    const studentId = String(new URL(request.url).searchParams.get('studentId') || '').trim();
    if (!userId || !studentId) {
      return NextResponse.json({ error: 'Missing student id' }, { status: 400 });
    }

    const employerId = await getEmployerProfileId(userId);
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    const allowed = await canEmployerAccessStudent(employerId, studentId);
    if (!allowed) {
      return NextResponse.json({ error: 'Resume not available for this employer' }, { status: 403 });
    }

    const [profile, docs] = await Promise.all([
      query(`SELECT resume_url FROM student_profiles WHERE id = $1::uuid`, [studentId]),
      query(
        `SELECT document_type AS type, file_url AS url, uploaded_at AS "uploadedAt"
         FROM student_documents
         WHERE student_id = $1::uuid
         ORDER BY uploaded_at DESC`,
        [studentId],
      ),
    ]);
    const fileUrl = resolveStudentResumeUrl({
      resumeUrl: profile.rows[0]?.resume_url,
      documents: docs.rows,
    });

    if (!isAuthoritativeResumeUrl(fileUrl)) {
      return NextResponse.json({ error: 'No uploaded resume found for this student' }, { status: 404 });
    }

    if (isS3Url(fileUrl) && isS3Configured()) {
      const key = extractS3Key(fileUrl);
      if (key) {
        const { downloadUrl } = await createDownloadUrlForKey(key, 60 * 30);
        return NextResponse.redirect(downloadUrl);
      }
    }

    return NextResponse.redirect(fileUrl);
  } catch (e) {
    console.error('GET /api/employer/applications/resume', e);
    return NextResponse.json({ error: 'Could not open resume' }, { status: 500 });
  }
}
