import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { validatePlacementDate } from '@/lib/dateOnly';
import { AND_DRIVE_NOT_DELETED, AND_JP_NOT_DELETED } from '@/lib/softDeleteSql';

export const dynamic = 'force-dynamic';
export const revalidate = 0;




export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = session.user.tenantId || session.user.tenant_id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const [calendarRes, drivesRes] = await Promise.all([
      query(
        `SELECT id, title, event_type, start_date, end_date, is_blocking, description
         FROM college_calendar
         WHERE tenant_id = $1::uuid
         ORDER BY start_date DESC, created_at DESC
         LIMIT 500`,
        [tenantId],
      ),
      query(
        `SELECT d.id, d.title, d.drive_date, d.status, ep.company_name
         FROM placement_drives d
         LEFT JOIN employer_profiles ep ON ep.id = d.employer_id
         WHERE d.tenant_id = $1::uuid
           AND d.status IN ('approved', 'scheduled', 'in_progress')
           ${AND_DRIVE_NOT_DELETED}
         ORDER BY d.drive_date DESC NULLS LAST, d.created_at DESC
         LIMIT 200`,
        [tenantId],
      ),
    ]);

    const driveEvents = drivesRes.rows.map((d) => ({
      id: `drive-${d.id}`,
      title: d.company_name ? `${d.company_name} — ${d.title}` : d.title,
      event_type: 'placement_drive',
      start_date: d.drive_date,
      end_date: d.drive_date,
      is_blocking: false,
      description: `Placement drive · ${d.status || 'scheduled'}`,
      source: 'placement_drive',
    }));

    return NextResponse.json({ events: [...calendarRes.rows, ...driveEvents] });
  } catch (error) {
    console.error('GET /api/college/events', error);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = session.user.tenantId || session.user.tenant_id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const body = await request.json();
    const title = String(body?.title || '').trim();
    const eventType = String(body?.eventType || 'other').trim();
    const startDate = String(body?.startDate || '').trim();
    const endDate = String(body?.endDate || startDate).trim();
    const description = String(body?.description || '').trim();
    const isBlocking = Boolean(body?.isBlocking);

    const allowedTypes = new Set(['exam', 'holiday', 'festival', 'placement_drive', 'interview_slot', 'workshop', 'other']);
    if (!title || !startDate || !allowedTypes.has(eventType)) {
      return NextResponse.json({ error: 'title, eventType and startDate are required' }, { status: 400 });
    }

    const startCheck = validatePlacementDate(startDate, { allowPast: false });
    if (!startCheck.ok) {
      return NextResponse.json({ error: startCheck.error }, { status: 400 });
    }
    const endCheck = validatePlacementDate(endDate || startDate, { allowPast: false });
    if (!endCheck.ok) {
      return NextResponse.json({ error: endCheck.error }, { status: 400 });
    }

    await query(
      `INSERT INTO college_calendar (tenant_id, title, event_type, start_date, end_date, is_blocking, description)
       VALUES ($1::uuid, $2, $3, $4::date, $5::date, $6, $7)`,
      [tenantId, title, eventType, startCheck.value, endCheck.value, isBlocking, description || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/college/events', error);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}
