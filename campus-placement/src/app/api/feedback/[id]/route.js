import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const ALLOWED_STATUS = new Set(['Submitted', 'Under Review', 'Planned', 'Closed']);

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    const status = String(body.status || '').trim();
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const res = await query(
      `UPDATE platform_feedback SET status = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, id],
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item: res.rows[0] });
  } catch (e) {
    console.error('PATCH /api/feedback/[id]', e);
    return NextResponse.json({ error: 'Database unavailable', detail: e.message }, { status: 503 });
  }
}
