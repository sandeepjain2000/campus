/** Matches `src/app/api/student/profile/avatar/presign/route.js` */
export const STUDENT_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/**
 * Browser/OS quirks: normalize before presign + Set lookup.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeStudentAvatarContentType(raw) {
  const base = String(raw || 'application/octet-stream').split(';')[0].trim().toLowerCase();
  if (base === 'image/jpg' || base === 'image/pjpeg') return 'image/jpeg';
  return base;
}

/**
 * @param {File} file
 * @returns {{ ok: true, contentType: string } | { ok: false, error: string }}
 */
export function validateStudentAvatarFile(file) {
  if (!file || typeof file !== 'object') {
    return { ok: false, error: 'No file selected.' };
  }
  const contentType = normalizeStudentAvatarContentType(file.type);
  if (!ALLOWED.has(contentType)) {
    return {
      ok: false,
      error: 'Please use a JPEG, PNG, WebP, or GIF image.',
    };
  }
  if (file.size > STUDENT_AVATAR_MAX_BYTES) {
    return { ok: false, error: 'Image too large (max 2MB).' };
  }
  if (file.size <= 0) {
    return { ok: false, error: 'File is empty.' };
  }
  return { ok: true, contentType };
}

export function studentAvatarAcceptAttr() {
  return Array.from(ALLOWED).join(',');
}
