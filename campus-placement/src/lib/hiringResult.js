/** Allowed hiring_result values in UI (empty/null = no decision yet). */
export const HIRING_RESULT_OPTIONS = [
  { value: '', label: '— No decision —' },
  { value: 'Shortlist', label: 'Shortlist' },
  { value: 'Reject', label: 'Reject' },
  { value: 'Select', label: 'Select' },
  { value: 'Decline', label: 'Decline' },
  { value: 'Withdraw', label: 'Withdraw' },
];

const ALLOWED_CANONICAL = new Map(
  HIRING_RESULT_OPTIONS.filter((o) => o.value).map((o) => [o.value.toLowerCase(), o.value]),
);

/** Normalize CSV/UI input to canonical casing or empty string. */
export function normalizeHiringResult(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const hit = ALLOWED_CANONICAL.get(s.toLowerCase());
  return hit || '';
}

/** @returns {string | null} error message, or null if valid (empty allowed) */
export function validateHiringResult(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (normalizeHiringResult(s)) return null;
  return `Invalid hiring_result "${s}". Use: ${HIRING_RESULT_OPTIONS.filter((o) => o.value).map((o) => o.value).join(', ')}.`;
}

export function hiringResultSelectOptions() {
  return HIRING_RESULT_OPTIONS;
}
