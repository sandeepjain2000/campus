import { query } from '@/lib/db';

export async function getEmployerProfileId(userId) {
  const result = await query(`SELECT id FROM employer_profiles WHERE user_id = $1::uuid`, [userId]);
  return result.rows[0]?.id || null;
}

export async function canEmployerAccessStudent(employerId, studentId) {
  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM applications a
       INNER JOIN placement_drives d ON d.id = a.drive_id
       WHERE d.employer_id = $1::uuid
         AND a.student_id = $2::uuid
     ) OR EXISTS (
       SELECT 1
       FROM program_applications pa
       INNER JOIN job_postings jp ON jp.id = pa.job_id
       WHERE jp.employer_id = $1::uuid
         AND pa.student_id = $2::uuid
     ) AS allowed`,
    [employerId, studentId],
  );
  return Boolean(result.rows[0]?.allowed);
}

export async function getLatestResumeForStudent(studentId) {
  const result = await query(
    `SELECT id, document_name, file_url, uploaded_at
     FROM student_documents
     WHERE student_id = $1::uuid
       AND document_type = 'resume'
     ORDER BY uploaded_at DESC
     LIMIT 1`,
    [studentId],
  );
  return result.rows[0] || null;
}

export function isPlaceholderResumeUrl(url) {
  const value = String(url || '').trim().toLowerCase();
  return !value || value.includes('campus-placement.local') || value.includes('/student-documents/');
}

export function isUsableResumeUrl(url) {
  const value = String(url || '').trim();
  return /^https:\/\//i.test(value) && !isPlaceholderResumeUrl(value);
}

export function extractS3Key(fileUrl) {
  try {
    const parsed = new URL(String(fileUrl || ''));
    return decodeURIComponent((parsed.pathname || '').replace(/^\/+/, '')) || null;
  } catch {
    return null;
  }
}
