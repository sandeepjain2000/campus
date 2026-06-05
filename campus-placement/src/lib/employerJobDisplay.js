/**
 * Employer job / internship posting helpers (min CGPA display & persistence).
 */

import { FIELD_IDS, validateFieldOrError } from '@/lib/inputConstraints';

/** @param {unknown} raw */
export function normalizeEmployerMinCgpa(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Validate then normalize min CGPA for create/update payloads.
 * Rejects 0 and values above 10; empty is allowed (stored as null).
 * @returns {{ error: string | null, value: number | null }}
 */
export function resolveEmployerMinCgpaForSubmit(minCgpa) {
  const err = validateFieldOrError(FIELD_IDS.EMPLOYER_MIN_CGPA, minCgpa);
  if (err) return { error: err, value: null };
  return { error: null, value: parseEmployerMinCgpaForDb(minCgpa) };
}

/** @param {unknown} raw */
export function formatEmployerMinCgpa(raw) {
  const n = normalizeEmployerMinCgpa(raw);
  if (n == null) return '—';
  return String(n);
}

/** @param {unknown} minCgpa */
export function parseEmployerMinCgpaForDb(minCgpa) {
  return normalizeEmployerMinCgpa(minCgpa);
}

/** @param {{ cgpa?: unknown, minCgpa?: unknown }} job */
export function resolveEmployerJobMinCgpa(job) {
  return normalizeEmployerMinCgpa(job?.minCgpa ?? job?.cgpa);
}
