import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { profileFromDb } from '@/lib/studentProfileDbMap';
import {
  canEmployerAccessStudent,
  getEmployerProfileId,
  getLatestResumeForStudent,
  isUsableResumeUrl,
} from '@/lib/employerApplicationAccess';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.sub;
    const studentId = String(new URL(request.url).searchParams.get('studentId') || '').trim();
    if (!userId || !studentId) {
      return NextResponse.json({ error: 'Missing student id' }, { status: 400 });
    }

    const employerId = await getEmployerProfileId(userId);
    if (!employerId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    const allowed = await canEmployerAccessStudent(employerId, studentId);
    if (!allowed) {
      return NextResponse.json({ error: 'Profile not available for this employer' }, { status: 403 });
    }

    const profileRow = await query(
      `SELECT
         sp.*,
         u.first_name,
         u.last_name,
         u.email AS account_email,
         u.communication_email,
         u.phone AS user_phone,
         u.avatar_url,
         t.name AS college_name
       FROM student_profiles sp
       INNER JOIN users u ON u.id = sp.user_id
       LEFT JOIN tenants t ON t.id = sp.tenant_id
       WHERE sp.id = $1::uuid`,
      [studentId],
    );

    const sp = profileRow.rows[0];
    if (!sp) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const [skills, projects, educationRecords, latestResume] = await Promise.all([
      query(`SELECT skill_name FROM student_skills WHERE student_id = $1::uuid ORDER BY created_at ASC`, [studentId]),
      query(
        `SELECT title, description, tech_stack, project_url, github_url, start_date, end_date
         FROM student_projects
         WHERE student_id = $1::uuid
         ORDER BY COALESCE(end_date, start_date) DESC NULLS LAST, created_at DESC`,
        [studentId],
      ),
      query(
        `SELECT institution, degree, field_of_study, start_year, end_year, grade, description
         FROM student_education
         WHERE student_id = $1::uuid
         ORDER BY start_year DESC NULLS LAST, created_at DESC`,
        [studentId],
      ),
      getLatestResumeForStudent(studentId),
    ]);

    const profile = profileFromDb({
      sp,
      skills: skills.rows,
      projects: projects.rows,
      accountEmail: sp.account_email,
      communicationEmail: sp.communication_email,
      userPhone: sp.user_phone,
      avatarUrl: sp.avatar_url,
    });

    const hasResume = Boolean(latestResume || isUsableResumeUrl(sp.resume_url));
    const resumeUrl = hasResume ? `/api/employer/applications/resume?studentId=${encodeURIComponent(studentId)}` : '';

    return NextResponse.json({
      student: {
        id: sp.id,
        name: `${sp.first_name || ''} ${sp.last_name || ''}`.trim() || sp.account_email || 'Student',
        email: sp.account_email || '',
        collegeName: sp.college_name || '',
        rollNumber: sp.roll_number || '',
        enrollmentNumber: sp.enrollment_number || '',
        profile: {
          ...profile,
          resumeUrl,
          cvFileName: latestResume?.document_name || profile.cvFileName,
        },
        educationRecords: educationRecords.rows.map((row) => ({
          institution: row.institution,
          degree: row.degree,
          fieldOfStudy: row.field_of_study,
          startYear: row.start_year,
          endYear: row.end_year,
          grade: row.grade,
          description: row.description,
        })),
        resume: {
          hasResume,
          fileName: latestResume?.document_name || profile.cvFileName || '',
          viewUrl: resumeUrl,
        },
      },
    });
  } catch (e) {
    console.error('GET /api/employer/applications/student-profile', e);
    return NextResponse.json({ error: 'Failed to load student profile' }, { status: 500 });
  }
}
