import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { toDateOnlyString, validatePlacementDate } from '@/lib/dateOnly';
import { buildCollegeInterviewDescription, mapCollegeInterviewRow } from '@/lib/collegeInterviewSlot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getTenantId(session) {
  return session?.user?.tenantId || session?.user?.tenant_id || null;
}

async function loadSlot(tenantId, id) {
  const result = await query(
    `SELECT id, title, start_date, description
     FROM college_calendar
     WHERE id = $1::uuid AND tenant_id = $2::uuid AND event_type = 'interview_slot'
     LIMIT 1`,
    [id, tenantId],
  );
  return result.rows[0] || null;
}

function parseInterviewBody(body) {
  const company = String(body?.company || '').trim();
  const round = String(body?.round || '').trim();
  const date = String(body?.date || '').trim();
  const startTime = String(body?.startTime || '').trim();
  const endTime = String(body?.endTime || '').trim();
  const interviewer = String(body?.interviewer || '').trim();
  const panelNames = String(body?.panelNames || '').trim();
  const createdBy = String(body?.createdBy || 'TPO').trim();
  const students = Array.isArray(body?.students)
    ? body.students.map((s) => String(s).trim()).filter(Boolean)
    : [];
  return { company, round, date, startTime, endTime, interviewer, panelNames, createdBy, students };
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = getTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const { id } = await params;
    const existing = await loadSlot(tenantId, id);
    if (!existing) return NextResponse.json({ error: 'Interview slot not found' }, { status: 404 });

    const body = await request.json();
    const fields = parseInterviewBody(body);
    if (
      !fields.company ||
      !fields.round ||
      !fields.date ||
      !fields.startTime ||
      !fields.endTime ||
      !fields.interviewer
    ) {
      return NextResponse.json(
        { error: 'company, round, date, startTime, endTime, and interviewer are required' },
        { status: 400 },
      );
    }

    const existingDate = toDateOnlyString(existing.start_date);
    const dateCheck = validatePlacementDate(fields.date, {
      allowPast: fields.date === existingDate,
    });
    if (!dateCheck.ok) {
      return NextResponse.json({ error: dateCheck.error }, { status: 400 });
    }

    const title = `${fields.company} • ${fields.round}`;
    const desc = buildCollegeInterviewDescription(fields);

    const updated = await query(
      `UPDATE college_calendar
       SET title = $1,
           start_date = $2::date,
           end_date = $2::date,
           description = $3
       WHERE id = $4::uuid AND tenant_id = $5::uuid AND event_type = 'interview_slot'
       RETURNING id, title, start_date, description`,
      [title, dateCheck.value, desc, id, tenantId],
    );

    const row = updated.rows[0];
    return NextResponse.json({ slot: mapCollegeInterviewRow(row) });
  } catch (error) {
    console.error('PATCH /api/college/interviews/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to update interview slot' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = getTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const { id } = await params;
    const del = await query(
      `DELETE FROM college_calendar
       WHERE id = $1::uuid AND tenant_id = $2::uuid AND event_type = 'interview_slot'
       RETURNING id`,
      [id, tenantId],
    );
    if (!del.rows?.length) {
      return NextResponse.json({ error: 'Interview slot not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/college/interviews/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to delete interview slot' }, { status: 500 });
  }
}
