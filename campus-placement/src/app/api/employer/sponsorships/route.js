import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

function formatInr(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collegesRes = await query(
      `SELECT id, name, city
       FROM tenants
       WHERE type = 'college'
       ORDER BY name ASC`
    );

    const colleges = [];
    for (const college of collegesRes.rows) {
      const facilityRes = await query(
        `SELECT facility_type, COUNT(*) AS count
         FROM college_facilities
         WHERE tenant_id = $1
         GROUP BY facility_type`,
        [college.id]
      );
      const totalFacilities = facilityRes.rows.reduce((acc, r) => acc + Number(r.count || 0), 0);

      const base = Math.max(200000, totalFacilities * 100000);
      const sponsorshipLevels = [
        {
          category: 'Campus Infrastructure',
          description: 'Support learning spaces, labs, and student infrastructure.',
          tiers: [
            { name: 'Bronze Sponsor', price: `₹${formatInr(base)}`, benefits: ['Brand mention on partner wall', 'Quarterly impact summary'] },
            { name: 'Silver Sponsor', price: `₹${formatInr(base * 2)}`, benefits: ['Bronze benefits', 'Feature in campus events bulletin'] },
            { name: 'Gold Sponsor', price: `₹${formatInr(base * 4)}`, benefits: ['Silver benefits', 'Priority branding slot on major events'] },
          ],
        },
      ];

      colleges.push({
        id: college.id,
        name: college.name,
        location: college.city || 'India',
        sponsorshipLevels,
      });
    }

    return NextResponse.json({
      colleges,
      paymentInfo: {
        accountName: null,
        bankName: null,
        accountNumberMasked: null,
        ifsc: null,
        branch: null,
      },
    });
  } catch (error) {
    console.error('Failed to load sponsorship options:', error);
    return NextResponse.json({ error: 'Failed to load sponsorship options' }, { status: 500 });
  }
}
