import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT
        t.id,
        t.name,
        t.slug,
        t.city,
        t.is_active,
        COUNT(sp.id) AS students,
        SUM(CASE WHEN sp.placement_status = 'placed' THEN 1 ELSE 0 END) AS placed
      FROM tenants t
      LEFT JOIN student_profiles sp ON sp.tenant_id = t.id
      WHERE t.type = 'college'
      GROUP BY t.id, t.name, t.slug, t.city, t.is_active
      ORDER BY t.created_at DESC`
    );

    return NextResponse.json({
      colleges: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        city: r.city || '—',
        naac: '—',
        students: Number(r.students || 0),
        placed: Number(r.placed || 0),
        active: Boolean(r.is_active),
      })),
    });
  } catch (error) {
    console.error('Failed to load admin colleges:', error);
    return NextResponse.json({ error: 'Failed to load colleges' }, { status: 500 });
  }
}
