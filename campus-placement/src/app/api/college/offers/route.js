import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId || session.user.tenant_id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const offersRes = await query(
      `SELECT
         o.id,
         COALESCE(TRIM(CONCAT(u.first_name, ' ', u.last_name)), u.email, 'Unknown') AS student_name,
         ep.company_name,
         o.job_title,
         o.salary,
         o.location,
         o.status,
         o.deadline,
         o.created_at
       FROM offers o
       JOIN student_profiles sp ON sp.id = o.student_id
       LEFT JOIN users u ON u.id = sp.user_id
       LEFT JOIN employer_profiles ep ON ep.id = o.employer_id
       WHERE sp.tenant_id = $1::uuid
       ORDER BY o.created_at DESC
       LIMIT 500`,
      [tenantId]
    );

    const offers = offersRes.rows;
    const accepted = offers.filter((o) => o.status === 'accepted').length;
    const pending = offers.filter((o) => o.status === 'pending').length;
    const avgSalary = accepted
      ? Math.round(
          offers
            .filter((o) => o.status === 'accepted' && Number(o.salary) > 0)
            .reduce((sum, o) => sum + Number(o.salary), 0) / Math.max(1, accepted)
        )
      : 0;

    return NextResponse.json({
      offers,
      summary: {
        total: offers.length,
        accepted,
        pending,
        avgSalary,
      },
    });
  } catch (error) {
    console.error('GET /api/college/offers', error);
    return NextResponse.json({ error: 'Failed to load offers' }, { status: 500 });
  }
}
