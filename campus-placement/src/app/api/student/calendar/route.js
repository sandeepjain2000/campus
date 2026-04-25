import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = await getOrCreateStudentProfileId(session.user.id);
    if (!studentId) return NextResponse.json({ events: [] });

    const res = await query(
      `SELECT d.id, COALESCE(ep.company_name, 'Company') AS company,
              COALESCE(j.title, d.title) AS role, d.drive_date, d.drive_type, d.status
       FROM placement_drives d
       LEFT JOIN employer_profiles ep ON ep.id = d.employer_id
       LEFT JOIN job_postings j ON j.id = d.job_id
       LEFT JOIN applications a ON a.drive_id = d.id AND a.student_id = $1::uuid AND a.status <> 'withdrawn'
       JOIN student_profiles sp ON sp.id = $1::uuid
       WHERE d.tenant_id = sp.tenant_id
         AND d.status IN ('approved', 'scheduled', 'requested')
       ORDER BY d.drive_date ASC, d.created_at DESC
       LIMIT 500`,
      [studentId],
    );

    const events = res.rows.map((r) => ({
      id: r.id,
      date: r.drive_date ? String(r.drive_date).slice(0, 10) : '',
      title: `${r.company} — ${r.role || 'Drive'}`,
      type: r.drive_type || 'on_campus',
      status: r.status || 'scheduled',
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('GET /api/student/calendar', error);
    return NextResponse.json({ error: 'Failed to load student calendar' }, { status: 500 });
  }
}
