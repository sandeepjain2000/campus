import { NextResponse } from 'next/server';
import { buildPlatformErrorResponse } from '@/lib/platformErrorLog';

/**
 * Log + JSON response for API route catch blocks.
 * @param {unknown} error
 * @param {{
 *   context: string;
 *   request?: Request;
 *   sessionUser?: { id?: string; sub?: string; email?: string };
 *   tenantId?: string | null;
 *   employerId?: string | null;
 *   requestBody?: unknown;
 *   defaultMessage?: string;
 *   logLabel?: string;
 * }} opts
 */
export async function respondPlatformError(error, opts) {
  console.error(opts.logLabel || opts.context, error);
  const { status, body } = await buildPlatformErrorResponse(error, opts);
  return NextResponse.json(body, { status });
}
