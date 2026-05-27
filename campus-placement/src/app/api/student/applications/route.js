import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { toDateOnlyString, validateDriveDateForApply } from '@/lib/dateOnly';
import { assertStudentResumeForApply } from '@/lib/studentApplyEligibility';
import { getOrCreateStudentProfileId, isStudentProfileArchived } from '@/lib/studentServer';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const apps = await query(
      `
      SELECT
        a.id,
        a.drive_id,
        a.status,
        a.current_round,
        a.applied_at,
        d.drive_date,
        ep.company_name AS company,
        ep.website AS website,
        COALESCE(j.title, d.title) AS role,
        j.job_type
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN placement_drives d ON a.drive_id = d.id
      JOIN employer_profiles ep ON d.employer_id = ep.id
      LEFT JOIN job_postings j ON a.job_id = j.id
      WHERE sp.user_id = $1
      ORDER BY a.applied_at DESC
      `,
      [userId],
    );

    return NextResponse.json({
      items: apps.rows.map((row) => ({
        id: row.id,
        drive_id: row.drive_id,
        company: row.company,
        website: row.website || null,
        role: row.role,
        status: row.status,
        currentRound: row.current_round,
        appliedAt: row.applied_at,
        driveDate: row.drive_date,
        jobType: row.job_type || 'full_time',
      })),
    });
  } catch (error) {
    console.error('GET /api/student/applications', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { drive_id, location_preference } = await req.json();

    if (!drive_id) {
      return NextResponse.json({ error: 'Drive ID required' }, { status: 400 });
    }

    if (await isStudentProfileArchived(userId)) {
      return NextResponse.json(
        { error: 'Your student account has been archived. Contact your placement office if this is a mistake.' },
        { status: 403 },
      );
    }

    const studentId = await getOrCreateStudentProfileId(userId);
    if (!studentId) {
      return NextResponse.json({
        error: 'Student profile not found. Complete profile setup before applying.',
      }, { status: 400 });
    }

    const resumeGate = await assertStudentResumeForApply(studentId);
    if (!resumeGate.ok) {
      return NextResponse.json({ error: resumeGate.error }, { status: 400 });
    }

    const notes = location_preference ? `Preferred Location: ${location_preference}` : null;

    try {
      const meta = await query(
        `SELECT d.id, d.job_id, d.drive_date, j.min_cgpa, sp.cgpa AS student_cgpa
         FROM placement_drives d
         LEFT JOIN job_postings j ON d.job_id = j.id
         CROSS JOIN student_profiles sp
         WHERE d.id = $1 AND sp.id = $2`,
        [drive_id, studentId]
      );

      if (meta.rowCount === 0) {
        return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
      }

      const { job_id, drive_date, min_cgpa, student_cgpa } = meta.rows[0];
      const driveDateYmd = toDateOnlyString(drive_date);
      const driveDateCheck = validateDriveDateForApply(driveDateYmd);
      if (!driveDateCheck.ok) {
        return NextResponse.json({ error: driveDateCheck.error }, { status: 400 });
      }

      if (min_cgpa != null) {
        const reqCgpa = Number(min_cgpa);
        const myCgpa = Number(student_cgpa);

        if (isNaN(myCgpa)) {
          return NextResponse.json({ error: 'Please update your CGPA in your profile to apply.' }, { status: 400 });
        }

        let isEligible = false;
        if (reqCgpa > 10 && myCgpa <= 10) {
          // Employer asked for percentage (e.g. 60), student gave CGPA (e.g. 6.5)
          isEligible = (myCgpa * 9.5) >= reqCgpa;
        } else if (reqCgpa <= 10 && myCgpa > 10) {
          // Employer asked for CGPA, student gave percentage
          isEligible = myCgpa >= (reqCgpa * 9.5);
        } else {
          isEligible = myCgpa >= reqCgpa;
        }

        if (!isEligible) {
          return NextResponse.json({ 
            error: `Cannot apply to drive: Need minimum ${reqCgpa} CGPA, your current is ${myCgpa}. Scale mismatch resolved.`
          }, { status: 400 });
        }
      }

      const ins = await query(
        `
        INSERT INTO applications (student_id, drive_id, job_id, status, notes)
        VALUES ($1, $2, $3, 'applied', $4)
        ON CONFLICT (student_id, drive_id)
        DO UPDATE SET status = 'applied', notes = COALESCE(EXCLUDED.notes, applications.notes), updated_at = NOW()
        RETURNING id
      `,
        [studentId, drive_id, job_id, notes],
      );

      if (ins.rowCount === 0) {
        return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Application submitted successfully' });
    } catch (dbError) {
      console.error('DB Insert failed:', dbError);
      return NextResponse.json({ error: 'Could not save application' }, { status: 500 });
    }
  } catch (error) {
    console.error('Application API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
