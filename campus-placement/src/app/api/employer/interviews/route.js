import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { toDateOnlyString, validatePlacementDate } from '@/lib/dateOnly';

async function getTenant(tenantId) {
  const res = await query(`SELECT id, name, settings FROM tenants WHERE id = $1::uuid LIMIT 1`, [tenantId]);
  return res.rows[0] || null;
}

async function savePlans(tenantId, settings) {
  await query(
    `UPDATE tenants
     SET settings = $1::jsonb, updated_at = NOW()
     WHERE id = $2::uuid`,
    [JSON.stringify(settings), tenantId],
  );
}

async function syncEmployerInterviewToCollegeCalendar({
  tenantId,
  employerUserId,
  campusName,
  round,
  dateYmd,
  time,
  mode,
  panelNames,
  assigned,
  planId,
}) {
  const title = `${campusName || 'Employer'} • ${round}`;
  const desc = [
    `Employer interview slot`,
    time ? `Time: ${time}` : '',
    mode ? `Mode: ${mode}` : '',
    panelNames ? `Panel: ${panelNames}` : '',
    assigned ? `Assigned: ${assigned}` : '',
    `Plan: ${planId}`,
    `Employer user: ${employerUserId}`,
  ]
    .filter(Boolean)
    .join('\n');

  await query(
    `INSERT INTO college_calendar (tenant_id, title, event_type, start_date, end_date, is_blocking, description)
     VALUES ($1::uuid, $2, 'interview_slot', $3::date, $3::date, false, $4)`,
    [tenantId, title, dateYmd, desc],
  );
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');
    if (!campusId) return NextResponse.json({ error: 'campusId is required' }, { status: 400 });

    const tenant = await getTenant(campusId);
    if (!tenant) return NextResponse.json({ rows: [] });

    const list = Array.isArray(tenant.settings?.employerInterviewPlans) ? tenant.settings.employerInterviewPlans : [];
    const rows = list
      .filter((r) => r.employerUserId === session.user.id)
      .map((r) => ({ ...r, date: toDateOnlyString(r.date) || r.date }));
    return NextResponse.json({ rows, campusName: tenant.name });
  } catch (error) {
    console.error('GET /api/employer/interviews', error);
    return NextResponse.json({ error: 'Failed to load interview plans' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id || session.user.sub;
    const employerRes = await query(
      `SELECT id, company_name FROM employer_profiles WHERE user_id = $1::uuid LIMIT 1`,
      [userId],
    );
    const employerId = employerRes.rows[0]?.id;
    const companyName = employerRes.rows[0]?.company_name || 'Employer';
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const campusId = String(body?.campusId || '').trim();
    if (!campusId) return NextResponse.json({ error: 'campusId is required' }, { status: 400 });

    const approvalRes = await query(
      `SELECT 1 FROM employer_approvals
       WHERE employer_id = $1::uuid AND tenant_id = $2::uuid AND status = 'approved'
       LIMIT 1`,
      [employerId, campusId],
    );
    if (!approvalRes.rows.length) {
      return NextResponse.json(
        { error: 'This college partnership is not approved yet. Request campus access first.' },
        { status: 403 },
      );
    }

    const round = String(body?.round || '').trim();
    const date = String(body?.date || '').trim();
    const time = String(body?.time || '').trim();
    const mode = String(body?.mode || 'Virtual').trim();
    const assigned = Number(body?.assigned || 0);
    const panelNames = String(body?.panelNames || '').trim();
    const campus = String(body?.campus || '').trim();
    if (!round || !date || !time) {
      return NextResponse.json({ error: 'round, date and time are required' }, { status: 400 });
    }

    const dateCheck = validatePlacementDate(date, { allowPast: false });
    if (!dateCheck.ok) {
      return NextResponse.json({ error: dateCheck.error }, { status: 400 });
    }

    const tenant = await getTenant(campusId);
    if (!tenant) return NextResponse.json({ error: 'Campus not found' }, { status: 404 });

    const planId = `ei-${Date.now()}`;
    const settings = tenant.settings || {};
    const rows = Array.isArray(settings.employerInterviewPlans) ? settings.employerInterviewPlans : [];
    rows.unshift({
      id: planId,
      employerUserId: session.user.id,
      campus: campus || tenant.name,
      companyName,
      round,
      date: dateCheck.value,
      time,
      mode,
      assigned: Number.isFinite(assigned) ? assigned : 0,
      panelNames,
    });
    settings.employerInterviewPlans = rows;
    await savePlans(campusId, settings);

    try {
      await syncEmployerInterviewToCollegeCalendar({
        tenantId: campusId,
        employerUserId: session.user.id,
        campusName: campus || tenant.name,
        round,
        dateYmd: dateCheck.value,
        time,
        mode,
        panelNames,
        assigned: Number.isFinite(assigned) ? assigned : 0,
        planId,
      });
    } catch (calErr) {
      console.warn('employer interview college_calendar sync:', calErr?.message || calErr);
    }

    return NextResponse.json({
      rows: rows.filter((r) => r.employerUserId === session.user.id).map((r) => ({
        ...r,
        date: toDateOnlyString(r.date) || r.date,
      })),
    });
  } catch (error) {
    console.error('POST /api/employer/interviews', error);
    return NextResponse.json({ error: 'Failed to save interview plan' }, { status: 500 });
  }
}
