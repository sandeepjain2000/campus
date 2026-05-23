import { transaction } from '@/lib/db';

const DOC_TYPES = new Set(['resume', 'id_proof', 'academic', 'certificate', 'other']);

/**
 * Link uploaded résumé to student_profiles (employers read resume_url).
 * cvFileName in aux_profile is best-effort; failure there must not block upload.
 */
async function syncPrimaryResumeOnProfile(client, studentId, fileUrl, documentName) {
  try {
    await client.query(
      `UPDATE student_profiles
       SET resume_url = $1::text, updated_at = NOW()
       WHERE id = $2::uuid`,
      [fileUrl, studentId],
    );
  } catch (e) {
    if (e?.code === '42703') {
      await client.query(
        `UPDATE student_profiles SET resume_url = $1::text WHERE id = $2::uuid`,
        [fileUrl, studentId],
      );
    } else {
      throw e;
    }
  }

  try {
    await client.query(
      `UPDATE student_profiles
       SET aux_profile = jsonb_set(
         COALESCE(aux_profile, '{}'::jsonb),
         '{cvFileName}',
         to_jsonb($1::text),
         true
       )
       WHERE id = $2::uuid`,
      [documentName, studentId],
    );
  } catch (e) {
    if (e?.code === '42703') {
      return;
    }
    try {
      const sel = await client.query(
        `SELECT aux_profile FROM student_profiles WHERE id = $1::uuid`,
        [studentId],
      );
      let base = sel.rows[0]?.aux_profile;
      if (base == null) {
        base = {};
      } else if (typeof base === 'string') {
        try {
          base = JSON.parse(base);
        } catch {
          base = {};
        }
      }
      const merged = { ...(typeof base === 'object' && base !== null ? base : {}), cvFileName: documentName };
      await client.query(
        `UPDATE student_profiles SET aux_profile = $1::jsonb WHERE id = $2::uuid`,
        [JSON.stringify(merged), studentId],
      );
    } catch (inner) {
      if (inner?.code === '42703') {
        return;
      }
      console.warn('[completeStudentDocument] aux_profile.cvFileName not updated', inner?.message || inner);
    }
  }
}

/**
 * @param {string} studentId
 * @param {{
 *   document_type: string,
 *   document_name: string,
 *   file_url: string,
 *   file_size?: number | null,
 *   setAsPrimaryResume?: boolean,
 * }} input
 */
export async function completeStudentDocumentRecord(studentId, input) {
  const document_type = String(input.document_type || '').trim();
  const document_name = String(input.document_name || '').trim();
  const file_url = String(input.file_url || '').trim();
  const parsedSize = input.file_size != null ? parseInt(String(input.file_size), 10) : null;
  const file_size = Number.isFinite(parsedSize) ? parsedSize : null;

  if (!document_name || !file_url) {
    throw new Error('document_name and file_url required');
  }
  if (!DOC_TYPES.has(document_type)) {
    throw new Error('Invalid document_type');
  }

  return transaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO student_documents (student_id, document_type, document_name, file_url, file_size, is_verified)
       VALUES ($1::uuid, $2::varchar, $3::varchar, $4::text, $5::integer, true)
       RETURNING id, document_type, document_name, file_url, file_size, is_verified, uploaded_at`,
      [studentId, document_type, document_name, file_url, file_size],
    );

    if (document_type === 'resume' && input.setAsPrimaryResume) {
      await syncPrimaryResumeOnProfile(client, studentId, file_url, document_name);
    }

    return ins.rows[0];
  });
}
