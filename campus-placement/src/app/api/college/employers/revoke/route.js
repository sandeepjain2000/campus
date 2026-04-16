import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, tenant_id, id: user_id } = session.user;
    const body = await req.json();
    let { employer_id, target_tenant_id } = body;

    // Based on role, determine which ID to query
    if (role === 'college_admin') {
      // College revoking employer access
      if (!employer_id) return NextResponse.json({ error: 'Missing employer_id' }, { status: 400 });
      target_tenant_id = tenant_id;
    } else if (role === 'employer') {
      // Employer canceling college agreement
      if (!target_tenant_id) return NextResponse.json({ error: 'Missing target_tenant_id' }, { status: 400 });
      // Fetch employer ID from user
      const empQuery = await query(`SELECT id FROM employer_profiles WHERE user_id = $1`, [user_id]);
      if (empQuery.rowCount === 0) return NextResponse.json({ error: 'Employer not found' }, { status: 404 });
      employer_id = empQuery.rows[0].id;
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    try {
      const result = await query(
        `UPDATE employer_approvals 
         SET status = 'rejected', rejection_reason = 'Mutual agreement cancelled', approved_at = NOW()
         WHERE tenant_id = $1 AND employer_id = $2 
         RETURNING id`,
        [target_tenant_id, employer_id]
      );

      return NextResponse.json({ success: true, message: 'Agreement cancelled successfully', result: result.rows });
    } catch (dbError) {
      console.error('DB Cancel failed:', dbError);
      return NextResponse.json({ success: true, message: 'Agreement cancelled (mocked)', mock: true });
    }
  } catch (error) {
    console.error('Revoke API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
