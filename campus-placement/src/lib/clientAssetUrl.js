export function isAwsS3Url(value) {
  const s = String(value || '').trim();
  return /^https:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/.+/i.test(s);
}

export function toSignedViewUrl(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (!isAwsS3Url(s)) return s;
  return `/api/s3/view?url=${encodeURIComponent(s)}`;
}
