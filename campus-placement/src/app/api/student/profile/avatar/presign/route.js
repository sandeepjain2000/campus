import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createStudentAvatarPresign, isS3Configured } from '@/lib/s3';
import { normalizeStudentAvatarContentType, validateStudentAvatarFile } from '@/lib/studentAvatarUpload';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        {
          error: 'Cloud storage not configured',
          hint: 'Your administrator can enable server-side file storage. Until then, your browser may save small images locally where supported.',
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const fileName = String(body.fileName || 'photo');
    const contentType = normalizeStudentAvatarContentType(body.contentType);
    const fileSize = Number(body.fileSize || 0);

    const check = validateStudentAvatarFile({ type: contentType, size: fileSize });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const userId = session.user.id || session.user.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Session user id missing' }, { status: 401 });
    }
    const out = await createStudentAvatarPresign({
      userId,
      fileName,
      contentType,
    });

    return NextResponse.json(out);
  } catch (e) {
    console.error('POST /api/student/profile/avatar/presign', e);
    return NextResponse.json({ error: 'Presign failed' }, { status: 500 });
  }
}
