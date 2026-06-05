import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { isAssessmentRoundKind } from '@/lib/assessmentRoundMap';
import { listPendingImportSessions } from '@/lib/assessmentImportStaging';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEmployerProfileId(session) {
  const userId = session?.user?.id;
  if (!userId) return null;
  const res = await query(`SELECT id FROM employer_profiles WHERE user_id = $1::uuid LIMIT 1`, [userId]);
  return res.rows[0]?.id || null;
}

/** GET — list pending CSV import review sessions. Query: kind=internship|jobs|drive|projects (optional) */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const employerId = await getEmployerProfileId(session);
    if (!employerId) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const kind = new URL(request.url).searchParams.get('kind')?.trim() || '';
    if (kind && !isAssessmentRoundKind(kind)) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    const sessions = await listPendingImportSessions(employerId, {
      opportunityKind: kind || null,
    });

    const counts = { internship: 0, jobs: 0, drive: 0, projects: 0 };
    if (!kind) {
      const all = await listPendingImportSessions(employerId);
      for (const s of all) {
        const k = s.opportunity_kind;
        if (counts[k] !== undefined) counts[k] += 1;
      }
    }

    return NextResponse.json({
      sessions,
      counts: kind ? undefined : counts,
    });
  } catch (e) {
    console.error('GET /api/employer/assessments/import', e);
    const msg = String(e?.message || '');
    if (msg.includes('employer_assessment_import')) {
      return NextResponse.json(
        { error: 'Import review tables missing. Run npm run db:migrate:071', sessions: [], counts: {} },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Failed to list import sessions' }, { status: 500 });
  }
}
