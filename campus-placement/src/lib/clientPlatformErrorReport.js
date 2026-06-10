/**
 * Report API/UI failures to platform_error_logs when the server did not already log them.
 * Fire-and-forget — never throws to callers.
 */
export async function reportClientApiFailure({
  context,
  route,
  statusCode = null,
  message,
  details = null,
  responseBody = null,
}) {
  if (typeof window === 'undefined') return;

  const alreadyLogged = Boolean(
    responseBody?.referenceId || responseBody?.reference,
  );
  if (alreadyLogged) return;

  const payload = {
    context,
    route,
    statusCode,
    message: message || responseBody?.userMessage || responseBody?.error || 'Request failed',
    alreadyLogged,
    details: details || (responseBody ? { response: responseBody } : null),
  };

  try {
    await fetch('/api/platform/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch {
    /* ignore */
  }
}
