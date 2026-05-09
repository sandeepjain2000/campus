import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

function toIsoDateOnly(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    const empRes = await query(`SELECT id FROM employer_profiles WHERE user_id = $1::uuid`, [userId]);
    const employerId = empRes.rows[0]?.id;
    if (!employerId) return NextResponse.json({ events: [] });

    const eventsRes = await query(
      `SELECT d.id, d.title, d.drive_date, d.drive_type, d.status, t.name AS college
       FROM placement_drives d
       LEFT JOIN tenants t ON t.id = d.tenant_id
       WHERE d.employer_id = $1::uuid
       ORDER BY d.drive_date DESC, d.created_at DESC
       LIMIT 500`,
      [employerId],
    );

    const events = eventsRes.rows.map((r) => ({
      id: r.id,
      title: r.title || 'Placement Drive',
      date: toIsoDateOnly(r.drive_date),
      time: '',
      type: r.status || 'scheduled',
      mode: r.drive_type || 'on_campus',
      college: r.college || '',
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('GET /api/employer/calendar', error);
    return NextResponse.json({ error: 'Failed to load calendar events' }, { status: 500 });
  }
}
