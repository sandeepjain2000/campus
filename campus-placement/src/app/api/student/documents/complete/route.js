import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { transaction } from '@/lib/db';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';

const DOC_TYPES = new Set(['resume', 'id_proof', 'academic', 'certificate', 'other']);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const document_type = String(body.document_type || '').trim();
    const document_name = String(body.document_name || '').trim();
    const file_url = String(body.file_url || '').trim();
    const file_size = body.file_size != null ? parseInt(body.file_size, 10) : null;

    if (!document_name || !file_url) {
      return NextResponse.json({ error: 'document_name and file_url required' }, { status: 400 });
    }
    if (!DOC_TYPES.has(document_type)) {
      return NextResponse.json({ error: 'Invalid document_type' }, { status: 400 });
    }

    const userId = session.user.id || session.user.sub;
    const studentId = await getOrCreateStudentProfileId(userId);
    if (!studentId) {
      return NextResponse.json({ error: 'Could not create student profile (missing tenant?)' }, { status: 400 });
    }

    const document = await transaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO student_documents (student_id, document_type, document_name, file_url, file_size, is_verified)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id, document_type, document_name, file_url, file_size, is_verified, uploaded_at`,
        [studentId, document_type, document_name, file_url, file_size],
      );

      if (document_type === 'resume') {
        await client.query(
          `UPDATE student_profiles
           SET
             resume_url = $1,
             aux_profile = COALESCE(aux_profile, '{}'::jsonb) || jsonb_build_object('cvFileName', $2),
             updated_at = NOW()
           WHERE id = $3::uuid`,
          [file_url, document_name, studentId],
        );
      }

      return ins.rows[0];
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    console.error('POST /api/student/documents/complete', e);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
