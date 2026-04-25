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
        ep.id,
        ep.company_name,
        ep.industry,
        ep.total_hires,
        ep.is_verified,
        ep.is_blacklisted
      FROM employer_profiles ep
      ORDER BY ep.created_at DESC`
    );

    return NextResponse.json({
      employers: result.rows.map((r) => ({
        id: r.id,
        name: r.company_name,
        industry: r.industry || '—',
        hires: Number(r.total_hires || 0),
        verified: Boolean(r.is_verified),
        blacklisted: Boolean(r.is_blacklisted),
      })),
    });
  } catch (error) {
    console.error('Failed to load admin employers:', error);
    return NextResponse.json({ error: 'Failed to load employers' }, { status: 500 });
  }
}
