import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';
import { suggestSkillsFromResumeText } from '@/lib/suggestSkillsFromResume';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = await getOrCreateStudentProfileId(session.user.id);
    if (!studentId) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    let text = String(body?.text || '').trim();

    if (!text) {
      const prof = await query(
        `SELECT skills, aux_profile, resume_url FROM student_profiles WHERE id = $1::uuid`,
        [studentId],
      );
      const row = prof.rows[0];
      const skills = Array.isArray(row?.skills) ? row.skills : [];
      const aux = row?.aux_profile || {};
      const parts = [
        aux.summary,
        aux.objective,
        aux.experience,
        aux.projects,
        aux.education,
      ]
        .filter(Boolean)
        .join('\n');
      text = parts;
      if (!text.trim()) {
        return NextResponse.json({
          suggestions: [],
          message: 'Upload a CV or add profile summary text first, then try again.',
        });
      }
      const suggestions = suggestSkillsFromResumeText(text, skills);
      return NextResponse.json({ suggestions });
    }

    const current = await query(`SELECT skills FROM student_profiles WHERE id = $1::uuid`, [studentId]);
    const skills = Array.isArray(current.rows[0]?.skills) ? current.rows[0].skills : [];
    const suggestions = suggestSkillsFromResumeText(text, skills);
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('POST /api/student/profile/suggest-skills', e);
    return NextResponse.json({ error: 'Failed to suggest skills' }, { status: 500 });
  }
}
