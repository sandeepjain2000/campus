/** Safe client-facing message when assessment upload hits a DB/schema failure. */
export const ASSESS_UPLOAD_DB_ERROR = 'Database error. Contact support. [Ref: ASSESS-DB-01]';

export const INTERNSHIP_ASSESSMENT_UPLOAD_REJECTED =
  'Assessment uploads are not supported for internship postings. Please select a placement drive posting.';

/** @param {unknown} err */
export function isAssessUploadSqlExposure(err) {
  const code = err?.code;
  const msg = String(err?.message || '');
  return code === '42P01' || /missing FROM-clause/i.test(msg);
}
