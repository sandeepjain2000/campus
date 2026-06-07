import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { WITHDRAWAL_IS_FINAL_STUDENT_MESSAGE, isWithdrawnApplicationStatus } from '@/lib/applicationWithdrawal';
import { toDateOnlyString, validateDriveDateForApply } from '@/lib/dateOnly';
import { getApplyBlockReason } from '@/lib/getApplyBlockReason';
import { assertStudentMayApplyToPlacement } from '@/lib/studentApplyEligibility';
import { loadStudentApplyProfile } from '@/lib/studentApplyProfile';
import { getOrCreateStudentProfileId, isStudentProfileArchived } from '@/lib/studentServer';
import { assertActiveEmployerTieUp } from '@/lib/employerTieUp';
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
        d.title AS role,
        'placement_drive'::text AS job_type
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      JOIN placement_drives d ON a.drive_id = d.id
      JOIN employer_profiles ep ON d.employer_id = ep.id
      WHERE sp.user_id = $1
        AND COALESCE(a.is_deleted, false) = false
        AND COALESCE(d.is_deleted, false) = false
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
        jobType: row.job_type || 'placement_drive',
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
    if (isAlumniStudent(session.user)) {
      return campusProgramsForbiddenForAlumniResponse();
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

    const profileTenant = await query(`SELECT tenant_id FROM student_profiles WHERE id = $1::uuid LIMIT 1`, [studentId]);
    const applyGate = await assertStudentMayApplyToPlacement(studentId, profileTenant.rows[0]?.tenant_id);
    if (!applyGate.ok) {
      return NextResponse.json({ error: applyGate.error }, { status: 403 });
    }

    const notes = location_preference ? `Preferred Location: ${location_preference}` : null;

    try {
      const meta = await query(
        `SELECT d.id, d.drive_date, d.employer_id, d.status AS drive_status, sp.tenant_id
         FROM placement_drives d
         CROSS JOIN student_profiles sp
         WHERE d.id = $1 AND sp.id = $2
           AND COALESCE(d.is_deleted, false) = false`,
        [drive_id, studentId]
      );

      if (meta.rowCount === 0) {
        return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
      }

      const { drive_date, employer_id, tenant_id: studentTenantId } = meta.rows[0];
      if (employer_id && studentTenantId) {
        const tieUp = await assertActiveEmployerTieUp(studentTenantId, employer_id);
        if (!tieUp.ok) {
          return NextResponse.json({ error: tieUp.error }, { status: 403 });
        }
      }
      const driveDateYmd = toDateOnlyString(drive_date);
      const driveDateCheck = validateDriveDateForApply(driveDateYmd);
      if (!driveDateCheck.ok) {
        return NextResponse.json({ error: driveDateCheck.error }, { status: 400 });
      }

      const driveRow = meta.rows[0];
      const applyProfile = await loadStudentApplyProfile(studentId, studentTenantId);
      const blockReason = getApplyBlockReason(
        { status: driveRow.drive_status },
        {
          hasResume: applyProfile.hasResume,
          isPlacementLocked: applyProfile.isPlacementLocked,
        },
        { openStatuses: ['approved', 'scheduled'] },
      );
      if (blockReason) {
        return NextResponse.json({ error: blockReason }, { status: 400 });
      }

      const existing = await query(
        `SELECT status FROM applications
         WHERE student_id = $1::uuid AND drive_id = $2::uuid
           AND COALESCE(is_deleted, false) = false
         LIMIT 1`,
        [studentId, drive_id],
      );
      if (existing.rows.length && isWithdrawnApplicationStatus(existing.rows[0].status)) {
        return NextResponse.json({ error: WITHDRAWAL_IS_FINAL_STUDENT_MESSAGE }, { status: 409 });
      }

      const ins = await query(
        `
        INSERT INTO applications (student_id, drive_id, job_id, status, notes)
        VALUES ($1, $2, $3, 'applied', $4)
        ON CONFLICT (student_id, drive_id)
        DO UPDATE SET
          status = 'applied',
          notes = COALESCE(EXCLUDED.notes, applications.notes),
          updated_at = NOW()
        WHERE applications.status <> 'withdrawn'
        RETURNING id
      `,
        [studentId, drive_id, null, notes],
      );

      if (ins.rowCount === 0) {
        const withdrawn = await query(
          `SELECT 1 FROM applications
           WHERE student_id = $1::uuid AND drive_id = $2::uuid AND status = 'withdrawn'
             AND COALESCE(is_deleted, false) = false
           LIMIT 1`,
          [studentId, drive_id],
        );
        if (withdrawn.rowCount) {
          return NextResponse.json({ error: WITHDRAWAL_IS_FINAL_STUDENT_MESSAGE }, { status: 409 });
        }
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
