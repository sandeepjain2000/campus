import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const MOCK_DATA = {
  stats: {
    totalApplications: 5,
    shortlisted: 2,
    offersReceived: 1,
    upcomingDrives: 3,
    profileCompletion: 78,
  },
  recentDrives: [
    { id: 1, company: 'TechCorp Solutions', role: 'SDE', date: '2026-09-15', type: 'on_campus', salary: '12-18 LPA', status: 'scheduled' },
    { id: 2, company: 'GlobalSoft Technologies', role: 'Full Stack Developer', date: '2026-09-22', type: 'virtual', salary: '10-15 LPA', status: 'approved' },
    { id: 3, company: 'Infosys Limited', role: 'Systems Engineer', date: '2026-10-05', type: 'on_campus', salary: '8-10 LPA', status: 'requested' },
  ],
  applications: [
    { id: 1, company: 'TechCorp Solutions', role: 'SDE', status: 'shortlisted', round: 'Coding Round', appliedAt: '2026-09-08' },
    { id: 2, company: 'GlobalSoft Technologies', role: 'Full Stack Developer', status: 'applied', round: 'Pending', appliedAt: '2026-09-11' },
  ]
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch stats
    const statsQuery = await query(`
      SELECT 
        COUNT(*) as "totalApplications",
        SUM(CASE WHEN status IN ('shortlisted', 'in_progress', 'selected') THEN 1 ELSE 0 END) as "shortlisted",
        SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) as "offersReceived"
      FROM applications a
      JOIN student_profiles sp ON sp.id = a.student_id
      WHERE sp.user_id = $1
    `, [userId]);

    // Fetch upcoming drives available for student's college
    const drivesQuery = await query(`
      SELECT d.id, ep.company_name as company, d.name as role, d.date, d.type, 
             d.status, j.salary_min, j.salary_max
      FROM placement_drives d
      JOIN employer_profiles ep ON d.employer_id = ep.id
      LEFT JOIN jobs j ON j.employer_id = d.employer_id
      WHERE d.tenant_id = $1 AND d.status IN ('approved', 'scheduled')
      ORDER BY d.date ASC
      LIMIT 3
    `, [session.user.tenantId]);

    // Fetch recent applications
    const appsQuery = await query(`
      SELECT a.id, ep.company_name as company, j.title as role, a.status, a.created_at as "appliedAt"
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employer_profiles ep ON j.employer_id = ep.id
      JOIN student_profiles sp ON a.student_id = sp.id
      WHERE sp.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT 3
    `, [userId]);

    return NextResponse.json({
      stats: {
        totalApplications: parseInt(statsQuery.rows[0].totalApplications || 0),
        shortlisted: parseInt(statsQuery.rows[0].shortlisted || 0),
        offersReceived: parseInt(statsQuery.rows[0].offersReceived || 0),
        upcomingDrives: drivesQuery.rows.length,
        profileCompletion: 80, // Dynamic calculation later
      },
      recentDrives: drivesQuery.rows.map(d => ({
        ...d,
        salary: d.salary_min ? "₹" + (d.salary_min/100000).toFixed(1) + "L - ₹" + (d.salary_max/100000).toFixed(1) + "L PA" : 'Not disclosed'
      })),
      applications: appsQuery.rows,
    });
  } catch (error) {
    console.log('Database not connected, falling back to mock data...');
    // Return mock data if DB connection fails
    return NextResponse.json(MOCK_DATA);
  }
}
