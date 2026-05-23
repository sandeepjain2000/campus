import { query } from '@/lib/db';
import { isAuthoritativeResumeUrl, resolveStudentResumeUrl } from '@/lib/studentResumeUrl';

export const STUDENT_RESUME_REQUIRED_APPLY_MESSAGE =
  'Upload your primary CV on your profile before you can apply. Go to Profile → Résumé / CV, or upload one in Documents.';

/**
 * Whether the student has a real resume (profile primary or authoritative resume document).
 */
export async function getStudentResumeApplyState(studentId) {
  if (!studentId) {
    return { hasResume: false, resumeUrl: '' };
  }

  const [profileRes, docsRes] = await Promise.all([
    query(`SELECT resume_url FROM student_profiles WHERE id = $1::uuid`, [studentId]),
    query(
      `SELECT document_type AS type, file_url AS url, uploaded_at AS "uploadedAt"
       FROM student_documents
       WHERE student_id = $1::uuid`,
      [studentId],
    ),
  ]);

  const resumeUrl = resolveStudentResumeUrl({
    resumeUrl: profileRes.rows[0]?.resume_url,
    documents: docsRes.rows,
  });

  return {
    hasResume: isAuthoritativeResumeUrl(resumeUrl),
    resumeUrl,
  };
}

/** @returns {{ ok: true } | { ok: false, error: string }} */
export async function assertStudentResumeForApply(studentId) {
  const { hasResume } = await getStudentResumeApplyState(studentId);
  if (!hasResume) {
    return { ok: false, error: STUDENT_RESUME_REQUIRED_APPLY_MESSAGE };
  }
  return { ok: true };
}
