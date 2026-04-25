import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId
      || (await query(`SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`)).rows[0]?.id
      || null;
    if (!tenantId) {
      return NextResponse.json({
        tenantUsers: [],
        studentUsers: [],
        studentProfiles: [],
        drives: [],
        employers: [],
      });
    }

    const [tenantUsersRes, studentUsersRes, studentsRes, drivesRes, employersRes] = await Promise.all([
      query(
        `SELECT id, email, first_name, last_name, role
         FROM users
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 300`,
        [tenantId]
      ),
      query(
        `SELECT id, email, first_name, last_name, role
         FROM users
         WHERE tenant_id = $1 AND role = 'student'
         ORDER BY created_at DESC
         LIMIT 200`,
        [tenantId]
      ),
      query(
        `SELECT sp.id, sp.user_id, sp.department, sp.cgpa, sp.placement_status,
                u.email, u.first_name, u.last_name
         FROM student_profiles sp
         LEFT JOIN users u ON u.id = sp.user_id
         WHERE sp.tenant_id = $1
         ORDER BY sp.created_at DESC
         LIMIT 200`,
        [tenantId]
      ),
      query(
        `SELECT id, title, status, drive_date
         FROM placement_drives
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 200`,
        [tenantId]
      ),
      query(
        `SELECT id, company_name
         FROM employer_profiles
         ORDER BY created_at DESC
         LIMIT 200`
      ),
    ]);

    return NextResponse.json({
      tenantUsers: tenantUsersRes.rows,
      studentUsers: studentUsersRes.rows,
      studentProfiles: studentsRes.rows,
      drives: drivesRes.rows,
      employers: employersRes.rows,
    });
  } catch (error) {
    console.error('Failed to load data-entry options:', error);
    return NextResponse.json({ error: 'Failed to load options' }, { status: 500 });
  }
}
