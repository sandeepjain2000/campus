import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const MOCK_DATA = {
  stats: {
    colleges: 3,
    employers: 3,
    students: 5,
    totalUsers: 11,
  },
  registeredColleges: [
    { id: 1, name: 'IIT Mumbai' },
    { id: 2, name: 'NIT Trichy' },
    { id: 3, name: 'BITS Pilani' },
  ]
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statsQuery = await query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE type = 'college') as "colleges",
        (SELECT COUNT(*) FROM employer_profiles) as "employers",
        (SELECT COUNT(*) FROM student_profiles) as "students",
        (SELECT COUNT(*) FROM users) as "totalUsers"
    `);

    const collegesQuery = await query(`
      SELECT id, name
      FROM tenants
      WHERE type = 'college'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      stats: {
        colleges: parseInt(statsQuery.rows[0].colleges || 0),
        employers: parseInt(statsQuery.rows[0].employers || 0),
        students: parseInt(statsQuery.rows[0].students || 0),
        totalUsers: parseInt(statsQuery.rows[0].totalUsers || 0),
      },
      registeredColleges: collegesQuery.rows,
    });
  } catch (error) {
    console.log('Database not connected, falling back to mock data...');
    return NextResponse.json(MOCK_DATA);
  }
}
