/**
 * Parse JSON from a fetch response; tolerate non-JSON error bodies (HTML, plain text).
 * @param {string} url
 * @param {RequestInit} [init]
 */
export async function fetchJson(url, init = {}) {
  const res = await fetch(url, init);
  if (!res.ok) {
    let errorMessage = res.statusText || 'Request failed';
    try {
      const errorData = await res.json();
      if (errorData?.error) errorMessage = String(errorData.error);
    } catch {
      // Response body is not JSON.
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

/** SWR-compatible fetcher for same-origin authenticated API routes. */
export function swrFetcher(url) {
  return fetchJson(url, { credentials: 'same-origin' });
}
