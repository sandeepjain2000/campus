import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSessionTenantId, isUuid } from '@/lib/tenantContext';

const HIRING_ROLES = ['employer', 'college_admin', 'super_admin'];

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

function resolveHiringTenantId(session, requestedTenantId) {
  const fromSession = getSessionTenantId(session.user);
  if (session.user.role === 'super_admin') {
    const req = requestedTenantId != null ? String(requestedTenantId).trim() : '';
    if (req && isUuid(req)) return req;
    return fromSession;
  }
  return fromSession;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !HIRING_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const requestedTenantId = url.searchParams.get('tenantId');
    const tenantId = resolveHiringTenantId(session, requestedTenantId);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
    }

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
    if (!session?.user || !HIRING_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const tenantId = resolveHiringTenantId(session, body?.tenantId || null);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
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
