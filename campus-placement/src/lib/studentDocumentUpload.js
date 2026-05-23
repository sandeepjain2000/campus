export const STUDENT_DOCUMENT_ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const STUDENT_DOCUMENT_EXT_TO_TYPE = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const STUDENT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * @param {string} contentType
 * @param {string} fileName
 */
export function normalizeStudentDocumentContentType(contentType, fileName) {
  const raw = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (raw && raw !== 'application/octet-stream' && STUDENT_DOCUMENT_ALLOWED_TYPES.has(raw)) {
    return raw;
  }
  const ext = String(fileName || '').split('.').pop()?.toLowerCase();
  if (ext && STUDENT_DOCUMENT_EXT_TO_TYPE[ext]) {
    return STUDENT_DOCUMENT_EXT_TO_TYPE[ext];
  }
  return raw || 'application/octet-stream';
}

/**
 * @param {{ name?: string, type?: string, size?: number }} file
 */
export function validateStudentDocumentFile(file) {
  const fileName = String(file?.name || 'document').trim() || 'document';
  const size = Number(file?.size || 0);
  const contentType = normalizeStudentDocumentContentType(file?.type, fileName);

  if (!size) {
    return { ok: false, error: 'The file is empty. Choose a PDF or Word document.' };
  }
  if (size > STUDENT_DOCUMENT_MAX_BYTES) {
    return {
      ok: false,
      error: `File is too large (max ${Math.round(STUDENT_DOCUMENT_MAX_BYTES / (1024 * 1024))}MB).`,
    };
  }
  if (!STUDENT_DOCUMENT_ALLOWED_TYPES.has(contentType)) {
    return {
      ok: false,
      error: 'Unsupported file type. Upload a PDF or Word document (.pdf, .doc, .docx).',
    };
  }

  return { ok: true, fileName, contentType, size };
}

export const STUDENT_DOCUMENT_ACCEPT_ATTR =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
