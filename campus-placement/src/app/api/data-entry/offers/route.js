import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const ALLOWED_STATUS = new Set(['pending', 'accepted', 'rejected', 'expired', 'revoked']);

async function assertAccess() {
  const session = await getServerSession(authOptions);
  return session || null;
}

async function resolveTenantId(session) {
  if (session?.user?.tenantId) return session.user.tenantId;
  const fallback = await query(`SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`);
  return fallback.rows[0]?.id || null;
}

export async function GET() {
  try {
    const session = await assertAccess();
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ offers: [] });
    const result = await query(
      `SELECT o.id, o.student_id, o.drive_id, o.employer_id, o.job_title, o.location, o.salary, o.status, o.joining_date,
              u.first_name, u.last_name, u.email, d.title AS drive_title, e.company_name
       FROM offers o
       LEFT JOIN student_profiles sp ON sp.id = o.student_id
       LEFT JOIN users u ON u.id = sp.user_id
       LEFT JOIN placement_drives d ON d.id = o.drive_id
       LEFT JOIN employer_profiles e ON e.id = o.employer_id
       WHERE sp.tenant_id = $1
       ORDER BY o.created_at DESC
       LIMIT 300`,
      [tenantId]
    );
    return NextResponse.json({ offers: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to load offers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await assertAccess();

    const body = await request.json();
    const studentId = String(body?.studentId || '').trim();
    const driveId = String(body?.driveId || '').trim() || null;
    const employerId = String(body?.employerId || '').trim() || null;
    const jobTitle = String(body?.jobTitle || '').trim();
    const location = String(body?.location || '').trim();
    const salary = Number(body?.salary || 0);
    const status = String(body?.status || 'accepted').trim();
    const joiningDate = body?.joiningDate || null;

    if (!studentId || !jobTitle) {
      return NextResponse.json({ error: 'studentId and jobTitle are required' }, { status: 400 });
    }
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid offer status' }, { status: 400 });
    }

    const created = await query(
      `INSERT INTO offers (
        student_id, drive_id, employer_id, job_title, location, salary, status, joining_date, salary_currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR')
      RETURNING id, student_id, drive_id, employer_id, job_title, salary, status`,
      [
        studentId,
        driveId,
        employerId,
        jobTitle,
        location || null,
        Number.isFinite(salary) ? salary : 0,
        status,
        joiningDate || null,
      ]
    );

    return NextResponse.json({ offer: created.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create offer from data-entry:', error);
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await assertAccess();
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'No tenant available for update' }, { status: 400 });
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const driveId = String(body?.driveId || '').trim() || null;
    const employerId = String(body?.employerId || '').trim() || null;
    const jobTitle = String(body?.jobTitle || '').trim();
    const location = String(body?.location || '').trim();
    const salary = Number(body?.salary || 0);
    const status = String(body?.status || 'accepted').trim();
    const joiningDate = body?.joiningDate || null;
    if (!id || !jobTitle || !ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: 'id, jobTitle and valid status are required' }, { status: 400 });
    }
    const updated = await query(
      `UPDATE offers
       SET drive_id = $1, employer_id = $2, job_title = $3, location = $4, salary = $5, status = $6, joining_date = $7, updated_at = NOW()
       WHERE id = $8
         AND student_id IN (SELECT id FROM student_profiles WHERE tenant_id = $9)
       RETURNING id, student_id, drive_id, employer_id, job_title, salary, status`,
      [driveId, employerId, jobTitle, location || null, Number.isFinite(salary) ? salary : 0, status, joiningDate || null, id, tenantId]
    );
    if (!updated.rows[0]) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ offer: updated.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update offer' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await assertAccess();
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'No tenant available for delete' }, { status: 400 });
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await query(
      `DELETE FROM offers
       WHERE id = $1
         AND student_id IN (SELECT id FROM student_profiles WHERE tenant_id = $2)`,
      [id, tenantId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete offer' }, { status: 500 });
  }
}
