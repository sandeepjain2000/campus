import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    student: String(r?.student || ''),
    roll: String(r?.roll || ''),
    campus: String(r?.campus || ''),
    rounds: {
      aptitude: {
        status: String(r?.rounds?.aptitude?.status || '—'),
        detail: String(r?.rounds?.aptitude?.detail || '—'),
      },
      gd: {
        status: String(r?.rounds?.gd?.status || '—'),
        detail: String(r?.rounds?.gd?.detail || '—'),
      },
      interviews: {
        status: String(r?.rounds?.interviews?.status || '—'),
        detail: String(r?.rounds?.interviews?.detail || '—'),
      },
    },
  }));
}

async function resolveTenantId(session, requestedTenantId = null) {
  if (requestedTenantId) return requestedTenantId;
  const fromSession = session?.user?.tenant_id ?? session?.user?.tenantId ?? null;
  if (fromSession) return fromSession;
  const fallback = await query(
    `SELECT id
     FROM tenants
     WHERE type = 'college'
     ORDER BY created_at ASC
     LIMIT 1`
  );
  return fallback.rows[0]?.id || null;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const requestedTenantId = url.searchParams.get('tenantId');
    const tenantId = await resolveTenantId(session, requestedTenantId);
    if (!tenantId) return NextResponse.json({ rows: [] });

    const res = await query(`SELECT settings FROM tenants WHERE id = $1::uuid`, [tenantId]);
    const settings = res.rows[0]?.settings || {};
    const rows = normalizeRows(settings.hiringAssessmentRows);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Failed to load hiring assessment rows:', error);
    return NextResponse.json({ error: 'Failed to load hiring assessment rows' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['employer', 'college_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const tenantId = await resolveTenantId(session, body?.tenantId || null);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const rows = normalizeRows(body?.rows);
    const existing = await query(`SELECT settings FROM tenants WHERE id = $1::uuid`, [tenantId]);
    const settings = existing.rows[0]?.settings || {};
    const merged = { ...settings, hiringAssessmentRows: rows };
    await query(
      `UPDATE tenants
       SET settings = $1::jsonb, updated_at = NOW()
       WHERE id = $2::uuid`,
      [JSON.stringify(merged), tenantId]
    );

    return NextResponse.json({ success: true, rows });
  } catch (error) {
    console.error('Failed to save hiring assessment rows:', error);
    return NextResponse.json({ error: 'Failed to save hiring assessment rows' }, { status: 500 });
  }
}
