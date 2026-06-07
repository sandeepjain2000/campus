import { query } from '@/lib/db';
import { getCollegeOfferRules } from '@/lib/offerPlacementRules';
import { isAuthoritativeResumeUrl, resolveStudentResumeUrl } from '@/lib/studentResumeUrl';
import {
  STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE,
  STUDENT_RESUME_REQUIRED_APPLY_MESSAGE,
} from '@/lib/studentApplyMessages';

export { STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE, STUDENT_RESUME_REQUIRED_APPLY_MESSAGE };

const PLACEMENT_STATUS_LOCK = new Set(['placed', 'opted_out', 'higher_studies']);

const PLACEMENT_STATUS_MESSAGES = {
  placed: STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE,
  opted_out: 'Your profile is marked as opted out of campus placement, so new applications are disabled.',
  higher_studies: 'Your profile is marked for higher studies, so new placement applications are disabled.',
};

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

/**
 * Whether the student is locked from new placement applications (accepted offer / placed status).
 * @returns {Promise<{ locked: boolean, reason?: string }>}
 */
export async function getStudentPlacementApplyLock(studentId, tenantId = null) {
  if (!studentId) return { locked: false };

  const profileRes = await query(
    `SELECT placement_status, tenant_id, COALESCE(is_alumni, false) AS is_alumni
     FROM student_profiles WHERE id = $1::uuid LIMIT 1`,
    [studentId],
  );
  const row = profileRes.rows[0];
  if (!row) return { locked: false };
  if (row.is_alumni) return { locked: false };

  const status = String(row.placement_status || '').trim().toLowerCase();
  if (PLACEMENT_STATUS_LOCK.has(status)) {
    return { locked: true, reason: PLACEMENT_STATUS_MESSAGES[status] || STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE };
  }

  const effectiveTenantId = tenantId || row.tenant_id;
  const { maxOffers } = await getCollegeOfferRules(effectiveTenantId);
  const acceptedRes = await query(
    `SELECT COUNT(*)::int AS n FROM offers
     WHERE student_id = $1::uuid AND LOWER(TRIM(status)) = 'accepted'
       AND COALESCE(is_deleted, false) = false`,
    [studentId],
  );
  const acceptedCount = acceptedRes.rows[0]?.n ?? 0;
  if (Number.isFinite(maxOffers) && maxOffers > 0 && acceptedCount >= maxOffers) {
    return { locked: true, reason: STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE };
  }

  return { locked: false };
}

/**
 * Combined resume + placement gate for browse/apply UIs and POST handlers.
 */
export async function getStudentApplyGate(studentId, tenantId = null) {
  const [resumeState, placementLock] = await Promise.all([
    getStudentResumeApplyState(studentId),
    getStudentPlacementApplyLock(studentId, tenantId),
  ]);

  const placementLocked = Boolean(placementLock.locked);
  const canApply = resumeState.hasResume && !placementLocked;
  let applyBlockedReason = null;
  if (placementLocked) applyBlockedReason = placementLock.reason || STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE;
  else if (!resumeState.hasResume) applyBlockedReason = STUDENT_RESUME_REQUIRED_APPLY_MESSAGE;

  return {
    hasResume: resumeState.hasResume,
    placementLocked,
    canApply,
    applyBlockedReason,
  };
}

/** @returns {{ ok: true } | { ok: false, error: string }} */
export async function assertStudentMayApplyToPlacement(studentId, tenantId = null) {
  const resumeGate = await assertStudentResumeForApply(studentId);
  if (!resumeGate.ok) return resumeGate;

  const lock = await getStudentPlacementApplyLock(studentId, tenantId);
  if (lock.locked) {
    return { ok: false, error: lock.reason || STUDENT_PLACEMENT_LOCKED_APPLY_MESSAGE };
  }
  return { ok: true };
}

/** Mark student placed after accepting an offer (idempotent). */
export async function markStudentPlacedAfterOfferAccept(studentId) {
  if (!studentId) return;
  await query(
    `UPDATE student_profiles
     SET placement_status = 'placed', updated_at = NOW()
     WHERE id = $1::uuid AND COALESCE(LOWER(TRIM(placement_status)), 'unplaced') = 'unplaced'`,
    [studentId],
  );
}
