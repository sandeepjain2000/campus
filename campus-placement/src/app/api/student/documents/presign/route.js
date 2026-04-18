import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createStudentDocumentPresign, isS3Configured } from '@/lib/s3';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        {
          error: 'S3 not configured',
          hint: 'Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME on the server.',
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const fileName = String(body.fileName || 'document');
    const contentType = String(body.contentType || 'application/octet-stream');
    const fileSize = Number(body.fileSize || 0);

    if (fileSize > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const out = await createStudentDocumentPresign({
      userId: session.user.id,
      fileName,
      contentType,
    });

    return NextResponse.json(out);
  } catch (e) {
    console.error('POST /api/student/documents/presign', e);
    return NextResponse.json({ error: e.message || 'Presign failed' }, { status: 500 });
  }
}
