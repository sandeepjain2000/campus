import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/** Public list for registration department dropdown (global catalog). */
export async function GET() {
  try {
    const res = await query(
      `SELECT id, name FROM reference_departments ORDER BY sort_order ASC, name ASC`
    );
    return NextResponse.json({ departments: res.rows });
  } catch (e) {
    console.error('GET /api/public/departments', e);
    return NextResponse.json({ error: 'Failed to load departments', departments: [] }, { status: 500 });
  }
}
