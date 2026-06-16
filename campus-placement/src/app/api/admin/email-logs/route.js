import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { withApiHandlers } from '@/lib/platformErrorRoute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function __platform_GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get('search') || '').trim();
    const statusFilter = String(searchParams.get('status') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 200), 1000);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

    const params = [];
    const clauses = [];

    if (search) {
      params.push(`%${search}%`);
      clauses.push(`(
        context ILIKE $${params.length} OR 
        original_to ILIKE $${params.length} OR 
        resolved_to ILIKE $${params.length} OR 
        subject_truncated ILIKE $${params.length} OR 
        error_message ILIKE $${params.length}
      )`);
    }

    if (statusFilter) {
      params.push(statusFilter);
      clauses.push(`status = $${params.length}`);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT count(*)::int FROM mail_delivery_logs ${whereClause}`,
      params
    );
    const totalCount = countRes.rows[0]?.count || 0;

    params.push(limit, offset);
    const sql = `
      SELECT id, created_at, context, status, skip_reason, original_to, resolved_to, subject_truncated, error_message, error_code, message_id, smtp_response, user_id
      FROM mail_delivery_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const logsRes = await query(sql, params);

    return NextResponse.json({
      logs: logsRes.rows,
      totalCount,
    });
  } catch (error) {
    console.error('Failed to load email logs:', error);
    return NextResponse.json({ error: 'Failed to load email logs' }, { status: 500 });
  }
}

const __platformApiHandlers = withApiHandlers({
  GET: __platform_GET,
}, { context: 'api_admin_email_logs' });
export const GET = __platformApiHandlers.GET;
