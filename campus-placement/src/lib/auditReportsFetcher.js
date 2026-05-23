import { stripInternalApiFields } from '@/lib/publicApiError';

function emptyPayloadForUrl(url) {
  const path = String(url || '');
  if (path.includes('/api/audit/logs')) {
    return { logs: [], unavailable: true };
  }
  if (path.includes('/api/audit/reports')) {
    return { exports: [], unavailable: true };
  }
  if (path.includes('/api/admin/colleges')) {
    return { colleges: [] };
  }
  return {};
}

/**
 * SWR fetcher for audit pages — never throws (avoids runtime error text on screen).
 */
export async function auditReportsFetcher(url) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    let data = {};
    try {
      data = stripInternalApiFields(await res.json());
    } catch {
      data = {};
    }
    if (!res.ok) {
      return emptyPayloadForUrl(url);
    }
    return data;
  } catch {
    return emptyPayloadForUrl(url);
  }
}
