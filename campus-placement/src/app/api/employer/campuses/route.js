import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/employer/campuses
// Returns all colleges with this employer's approval status for each
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employer profile
    const empResult = await query(
      `SELECT ep.id, ep.company_name FROM employer_profiles ep
       JOIN users u ON u.id = ep.user_id
       WHERE u.id = $1`,
      [session.user.id]
    );
    if (!empResult.rows.length) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }
    const employer = empResult.rows[0];

    // Get all active colleges with stats and this employer's approval status
    const result = await query(
      `SELECT
          t.id,
          t.name,
          t.slug,
          t.city,
          t.state,
          t.logo_url,
          t.naac_grade,
          t.nirf_rank,
          t.accreditation,
          t.website,
          -- Student stats per college
          COUNT(DISTINCT sp.id) AS total_students,
          COUNT(DISTINCT sp.id) FILTER (WHERE sp.placement_status = 'placed') AS placed_students,
          ROUND(AVG(sp.cgpa), 2) AS avg_cgpa,
          -- Employer approval status
          ea.status AS approval_status,
          ea.created_at AS requested_at,
          ea.approved_at,
          -- Active drives count
          COUNT(DISTINCT pd.id) FILTER (WHERE pd.status IN ('scheduled','approved','in_progress')) AS active_drives
       FROM tenants t
       LEFT JOIN student_profiles sp ON sp.tenant_id = t.id
       LEFT JOIN employer_approvals ea ON ea.tenant_id = t.id AND ea.employer_id = $1
       LEFT JOIN placement_drives pd ON pd.tenant_id = t.id AND pd.employer_id = $1
       WHERE t.is_active = true AND t.type = 'college'
       GROUP BY t.id, t.name, t.slug, t.city, t.state, t.logo_url,
                t.naac_grade, t.nirf_rank, t.accreditation, t.website,
                ea.status, ea.created_at, ea.approved_at
       ORDER BY t.name`,
      [employer.id]
    );

    return NextResponse.json({
      employerId: employer.id,
      companyName: employer.company_name,
      colleges: result.rows,
    });
  } catch (error) {
    console.error('Campuses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch campuses' }, { status: 500 });
  }
}

// POST /api/employer/campuses
// Request access to a college
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId } = await req.json();
    if (!collegeId) {
      return NextResponse.json({ error: 'collegeId is required' }, { status: 400 });
    }

    const empResult = await query(
      `SELECT ep.id FROM employer_profiles ep JOIN users u ON u.id = ep.user_id WHERE u.id = $1`,
      [session.user.id]
    );
    if (!empResult.rows.length) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }
    const employerId = empResult.rows[0].id;

    // Upsert the approval request
    await query(
      `INSERT INTO employer_approvals (tenant_id, employer_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (tenant_id, employer_id) DO NOTHING`,
      [collegeId, employerId]
    );

    return NextResponse.json({ success: true, message: 'Access requested successfully' });
  } catch (error) {
    console.error('Campus request error:', error);
    return NextResponse.json({ error: 'Failed to request access' }, { status: 500 });
  }
}
