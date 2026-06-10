import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/adminAuth';
import { PLATFORM_ERROR_CONTEXT } from '@/lib/platformErrorLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseDate(value, fallback) {
  const s = String(value || '').trim();
  if (!s) return fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fallback;
}

export async function GET(request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const url = new URL(request.url);
    const from = parseDate(url.searchParams.get('from'), '1970-01-01');
    const to = parseDate(url.searchParams.get('to'), '2999-12-31');
    const context = String(url.searchParams.get('context') || '').trim();
    const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '200', 10)));

    const params = [from, to];
    const where = [
      'pel.created_at >= $1::date',
      'pel.created_at < ($2::date + interval \'1 day\')',
    ];
    if (context) {
      params.push(context);
      where.push(`pel.context = $${params.length}`);
    }
    params.push(limit);

    try {
      const res = await query(
        `SELECT
           pel.id,
           pel.created_at,
           pel.severity,
           pel.context,
           pel.status_code,
           pel.user_message,
           pel.error_message,
           pel.error_code,
           pel.details,
           pel.ip_address,
           u.email AS user_email,
           NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), '') AS user_name,
           t.name AS tenant_name,
           ep.company_name
         FROM platform_error_logs pel
         LEFT JOIN users u ON u.id = pel.user_id
         LEFT JOIN tenants t ON t.id = pel.tenant_id
         LEFT JOIN employer_profiles ep ON ep.id = pel.employer_id
         WHERE ${where.join(' AND ')}
         ORDER BY pel.created_at DESC
         LIMIT $${params.length}`,
        params,
      );

      return NextResponse.json({
        logs: res.rows,
        contexts: Object.values(PLATFORM_ERROR_CONTEXT),
      });
    } catch (err) {
      if (err?.code === '42P01') {
        return NextResponse.json({
          logs: [],
          contexts: Object.values(PLATFORM_ERROR_CONTEXT),
          migrationRequired: true,
          error: 'Error logs table is not installed. Run migration 083_platform_error_logs.sql.',
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('GET /api/admin/error-logs', error);
    return NextResponse.json({ error: 'Failed to load error logs' }, { status: 500 });
  }
}
