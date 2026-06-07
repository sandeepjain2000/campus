import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStudentApplyGate } from '@/lib/studentApplyEligibility';
import { loadStudentApplyProfile } from '@/lib/studentApplyProfile';
import { getStudentBrowseGate } from '@/lib/studentBrowseGate';
import { getOrCreateStudentProfileId } from '@/lib/studentServer';
import { campusProgramsForbiddenForAlumniResponse, isAlumniStudent } from '@/lib/studentAlumni';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isAlumniStudent(session.user)) {
      return campusProgramsForbiddenForAlumniResponse();
    }

    const studentProfileId = await getOrCreateStudentProfileId(session.user.id);
    if (!studentProfileId) {
      return NextResponse.json({
        drives: [],
        canApply: false,
        hasResume: false,
        placementLocked: false,
        applyBlockedReason: null,
      });
    }

    const applyGate = await getStudentApplyGate(studentProfileId, session.user.tenantId);
    const browseGate = await getStudentBrowseGate(studentProfileId, session.user.tenantId);

    const applyProfile = await loadStudentApplyProfile(studentProfileId, session.user.tenantId);

    const res = await query(
      `
      SELECT
        d.id,
        ep.company_name AS company,
        ep.website AS website,
        d.title AS role,
        d.drive_date AS date,
        d.drive_type AS type,
        d.venue,
        d.status,
        d.max_students AS vacancies,
        d.registered_count AS registered,
        a.status AS application_status,
        (a.status IS NOT NULL AND a.status IN ('applied', 'shortlisted', 'in_progress', 'selected', 'on_hold')) AS applied
      FROM placement_drives d
      JOIN employer_profiles ep ON d.employer_id = ep.id
      LEFT JOIN applications a
        ON a.drive_id = d.id
       AND a.student_id = $1
       AND COALESCE(a.is_deleted, false) = false
      WHERE d.tenant_id = $2
        AND d.status IN ('approved', 'scheduled')
        AND COALESCE(d.is_deleted, false) = false
      ORDER BY d.drive_date ASC, d.created_at DESC
      `,
      [studentProfileId, session.user.tenantId],
    );

    const driveRows = browseGate.canBrowseListings
      ? res.rows.map((row) => ({
        id: row.id,
        company: row.company,
        website: row.website || null,
        role: row.role,
        date: row.date,
        type: row.type,
        venue: row.venue || 'TBD',
        offCampusCity: null,
        salary: 'See drive details',
        status: row.status,
        branch: ['All eligible branches'],
        cgpa: null,
        minCgpa: null,
        maxBacklogs: null,
        batchYear: null,
        eligibleBranches: null,
        applicationDeadline: null,
        vacancies: row.vacancies ?? 0,
        registered: row.registered ?? 0,
        deadline: null,
        applied: Boolean(row.applied),
        applicationStatus: row.application_status || null,
      }))
      : [];

    return NextResponse.json({
      canApply: applyGate.canApply,
      hasResume: browseGate.hasResume,
      profileComplete: browseGate.profileComplete,
      canBrowseListings: browseGate.canBrowseListings,
      browseGateTitle: browseGate.browseGateTitle,
      browseGateMessage: browseGate.browseGateMessage,
      profileMissingLabels: browseGate.profileMissingLabels,
      placementLocked: applyGate.placementLocked,
      applyBlockedReason: applyGate.applyBlockedReason,
      currentStudent: {
        cgpa: applyProfile.cgpa,
        branch: applyProfile.branch,
        department: applyProfile.department,
        batchYear: applyProfile.batchYear,
        backlogsActive: applyProfile.backlogsActive,
        hasResume: applyProfile.hasResume,
        isPlacementLocked: applyProfile.isPlacementLocked,
      },
      drives: driveRows,
    });
  } catch (error) {
    console.error('GET /api/student/drives', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
