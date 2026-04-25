import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

async function getEmployerId(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  const employerResult = await query(
    `SELECT id FROM employer_profiles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return employerResult.rows[0]?.id || null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employerId = await getEmployerId(session);

    if (!employerId) {
      return NextResponse.json({ offers: [] });
    }

    const offersResult = await query(
      `SELECT
         o.id,
         COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email, 'Unknown Student') AS student_name,
         t.name AS college_name,
         o.job_title,
         o.salary,
         o.location,
         o.deadline AS deadline_at,
         o.status,
         o.created_at
       FROM offers o
       LEFT JOIN student_profiles sp ON sp.id = o.student_id
       LEFT JOIN users u ON u.id = sp.user_id
       LEFT JOIN tenants t ON t.id = sp.tenant_id
       WHERE o.employer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 500`,
      [employerId]
    );

    return NextResponse.json({ offers: offersResult.rows });
  } catch (error) {
    console.error('Failed to load employer offers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load employer offers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const employerId = await getEmployerId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json();
    const studentId = String(body?.studentId || '').trim();
    const driveId = String(body?.driveId || '').trim() || null;
    const jobTitle = String(body?.jobTitle || '').trim();
    const salary = Number(body?.salary || 0);
    const location = String(body?.location || '').trim() || null;
    const joiningDate = String(body?.joiningDate || '').trim() || null;
    const deadlineAt = String(body?.deadlineAt || '').trim() || null;

    if (!studentId || !jobTitle) {
      return NextResponse.json({ error: 'studentId and jobTitle are required' }, { status: 400 });
    }

    const created = await query(
      `INSERT INTO offers (
         student_id, drive_id, employer_id, job_title, salary, location, status, joining_date, deadline, salary_currency
       ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, 'INR')
       RETURNING id`,
      [studentId, driveId, employerId, jobTitle, Number.isFinite(salary) ? salary : 0, location, joiningDate, deadlineAt]
    );

    return NextResponse.json({ offer: created.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create employer offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to create offer' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const employerId = await getEmployerId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json();
    const id = String(body?.id || '').trim();
    const status = String(body?.status || '').trim();
    if (!id || !['revoked'].includes(status)) {
      return NextResponse.json({ error: 'id and valid status are required' }, { status: 400 });
    }

    const updated = await query(
      `UPDATE offers
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND employer_id = $3
       RETURNING id, status`,
      [status, id, employerId]
    );
    if (!updated.rows[0]) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ offer: updated.rows[0] });
  } catch (error) {
    console.error('Failed to update employer offer:', error);
    return NextResponse.json({ error: error.message || 'Failed to update offer' }, { status: 500 });
  }
}
