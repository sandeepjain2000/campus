/** Minimum calendar year allowed for placement dates (excludes 2001 seed-era typos). */
export const MIN_PLACEMENT_YEAR = 2002;

/**
 * Normalize DB/API date values to YYYY-MM-DD (never use String(date).slice — that causes 2001 display bugs).
 * @param {unknown} value
 * @returns {string}
 */
export function toDateOnlyString(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateOnlyString(parsed);
  }
  return '';
}

/**
 * Parse YYYY-MM-DD as local calendar date (avoids UTC off-by-one in toLocaleDateString).
 * @param {string} ymd
 * @returns {Date | null}
 */
export function parseYmdToLocalDate(ymd) {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export function startOfTodayLocal() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/**
 * @param {string} ymd
 * @param {{ minYear?: number, allowPast?: boolean }} [opts]
 */
export function validatePlacementDate(ymd, opts = {}) {
  const { minYear = MIN_PLACEMENT_YEAR, allowPast = false } = opts;
  const normalized = toDateOnlyString(ymd);
  if (!normalized) {
    return { ok: false, error: 'Enter a valid date (YYYY-MM-DD).' };
  }
  const d = parseYmdToLocalDate(normalized);
  if (!d) {
    return { ok: false, error: 'Enter a valid date.' };
  }
  if (d.getFullYear() < minYear) {
    return { ok: false, error: `Date cannot be before ${minYear}.` };
  }
  if (!allowPast) {
    const today = startOfTodayLocal();
    if (d < today) {
      return { ok: false, error: 'Date cannot be in the past.' };
    }
  }
  return { ok: true, value: normalized };
}

/**
 * Response deadline must be today or later; joining must be after deadline.
 * @param {string | null | undefined} responseDeadlineYmd
 * @param {string | null | undefined} joiningYmd
 */
export function validateOfferDates(responseDeadlineYmd, joiningYmd) {
  if (responseDeadlineYmd) {
    const rd = validatePlacementDate(responseDeadlineYmd, { allowPast: false });
    if (!rd.ok) return { ok: false, error: `Response deadline: ${rd.error}` };
  }
  if (joiningYmd) {
    const jd = validatePlacementDate(joiningYmd, { allowPast: false });
    if (!jd.ok) return { ok: false, error: `Joining date: ${jd.error}` };
  }
  if (responseDeadlineYmd && joiningYmd) {
    const a = parseYmdToLocalDate(toDateOnlyString(responseDeadlineYmd));
    const b = parseYmdToLocalDate(toDateOnlyString(joiningYmd));
    if (a && b && a >= b) {
      return { ok: false, error: 'Response deadline must be before the joining date.' };
    }
  }
  return { ok: true };
}

/**
 * @param {string | null | undefined} driveDateYmd
 */
export function validateDriveDateForApply(driveDateYmd) {
  const v = validatePlacementDate(driveDateYmd, { allowPast: false });
  if (!v.ok) {
    return { ok: false, error: 'This drive date has passed. You can no longer apply.' };
  }
  return v;
}
