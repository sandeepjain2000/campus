import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { fetchCollegeAdminUserIds, notifyUsersOneAtATime } from '@/lib/notificationService';
import { emailPlacementDriveRequested } from '@/lib/placementDriveEmail';
import { findAcademicYearForDate } from '@/lib/academicYearTenant';
import { AND_DRIVE_NOT_DELETED } from '@/lib/softDeleteSql';
import { DRIVE_APPLICANT_COUNT_SUBQUERY } from '@/lib/employerApplicationCounts';
import { validateEmployerDriveDate } from '@/lib/apiInputValidation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;




async function getEmployerId(userId) {
  const r = await query(`SELECT id, company_name FROM employer_profiles WHERE user_id = $1::uuid`, [userId]);
  return r.rows[0] || null;
}

function isMissingCtcBreakupColumn(err) {
  return err?.code === '42703' && String(err?.message || '').includes('ctc_breakup');
}

/** Insert drive request; omits ctc_breakup when the column is not migrated yet. */
async function insertPlacementDriveRequest(client, params) {
  const {
    tenantId,
    employerId,
      title,
    description,
    driveType,
    driveDate,
    venue,
    ctcBreakup,
    academicYearId,
  } = params;

  const baseValues = [
    tenantId,
    employerId,
    jobId || null,
    title,
    description || '',
    driveType,
    driveDate || null,
    venue,
    academicYearId,
  ];

  try {
    const ins = await client.query(
      `INSERT INTO placement_drives (
         tenant_id, employer_id, job_id, title, description, drive_type, drive_date,
         start_time, end_time, venue, ctc_breakup, status, max_students, registered_count,
         academic_year_id
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::date,
         NULL, NULL, $8, $9, 'requested', 100, 0, $10::uuid
       )
       RETURNING id, title, drive_date, tenant_id`,
      [...baseValues.slice(0, 8), ctcBreakup, baseValues[8]],
    );
    return { row: ins.rows[0], ctcBreakupStored: ctcBreakup };
  } catch (err) {
    if (!isMissingCtcBreakupColumn(err)) throw err;
    const ins = await client.query(
      `INSERT INTO placement_drives (
         tenant_id, employer_id, job_id, title, description, drive_type, drive_date,
         start_time, end_time, venue, status, max_students, registered_count,
         academic_year_id
       ) VALUES (
         $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::date,
         NULL, NULL, $8, 'requested', 100, 0, $9::uuid
       )
       RETURNING id, title, drive_date, tenant_id`,
      baseValues,
    );
    return { row: ins.rows[0], ctcBreakupStored: null };
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emp = await getEmployerId(session.user.id);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    const baseSelect = `
      SELECT d.id, d.tenant_id, t.name AS college, d.title AS role, d.drive_date AS date, d.drive_type AS type,
             d.status, d.venue, ${DRIVE_APPLICANT_COUNT_SUBQUERY} AS registered`;
    const baseFrom = `
      FROM placement_drives d
      JOIN tenants t ON t.id = d.tenant_id
      WHERE d.employer_id = $1::uuid
        AND ($2::uuid IS NULL OR d.tenant_id = $2::uuid)
        ${AND_DRIVE_NOT_DELETED}
      ORDER BY d.drive_date NULLS LAST, d.created_at DESC`;
    const params = [emp.id, campusId || null];

    let rows;
    try {
      const res = await query(`${baseSelect}, d.ctc_breakup AS ctc_breakup ${baseFrom}`, params);
      rows = res.rows;
    } catch (err) {
      if (isMissingCtcBreakupColumn(err)) {
        const res = await query(`${baseSelect} ${baseFrom}`, params);
        rows = res.rows.map((r) => ({ ...r, ctc_breakup: null }));
      } else {
        throw err;
      }
    }

    return NextResponse.json({ drives: rows, companyName: emp.company_name });
  } catch (e) {
    console.error('GET /api/employer/drives', e);
    return NextResponse.json({ error: 'Failed to load drives' }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emp = await getEmployerId(session.user.id);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const {
      tenantId,
      title,
      description = '',
      driveType = 'on_campus',
      driveDate = null,
      venue: venueIn,
      ctcBreakup: ctcBreakupIn,
    } = body;
    const venue =
      typeof venueIn === 'string' && venueIn.trim().length > 0 ? venueIn.trim() : null;
    const ctcBreakupRaw = ctcBreakupIn != null ? String(ctcBreakupIn) : '';
    const ctcBreakup =
      ctcBreakupRaw.trim().length > 0 ? ctcBreakupRaw.trim().slice(0, 10000) : null;

    if (!tenantId || !title?.trim()) {
      return NextResponse.json({ error: 'tenantId and title are required' }, { status: 400 });
    }

    const driveDateErr = validateEmployerDriveDate(driveDate);
    if (driveDateErr) {
      return NextResponse.json({ error: driveDateErr }, { status: 400 });
    }

    const allowedTypes = new Set(['on_campus', 'off_campus', 'virtual', 'hybrid']);
    if (!allowedTypes.has(driveType)) {
      return NextResponse.json({ error: 'Invalid driveType' }, { status: 400 });
    }

    const result = await transaction(async (client) => {
      const ok = await client.query(
        `SELECT 1 FROM employer_approvals
         WHERE tenant_id = $1::uuid AND employer_id = $2::uuid AND status = 'approved'`,
        [tenantId, emp.id],
      );
      if (!ok.rowCount) {
        const e = new Error('No approved partnership with this campus');
        e.statusCode = 403;
        throw e;
      }

      let academicYearId = null;
      if (driveDate) {
        const yearsRes = await client.query(
          `SELECT id, period_start, period_end FROM tenant_academic_years WHERE tenant_id = $1::uuid`,
          [tenantId],
        );
        const match = findAcademicYearForDate(driveDate, yearsRes.rows);
        academicYearId = match?.id || null;
      }

      const { row, ctcBreakupStored } = await insertPlacementDriveRequest(client, {
        tenantId,
        employerId: emp.id,
        jobId: null,
        title: title.trim(),
        description,
        driveType,
        driveDate,
        venue,
        ctcBreakup,
        academicYearId,
      });
      const college = await client.query(`SELECT name FROM tenants WHERE id = $1::uuid`, [tenantId]);
      const collegeName = college.rows[0]?.name || 'your campus';

      const adminIds = await fetchCollegeAdminUserIds(tenantId, client);
      const dateLabel = row.drive_date
        ? new Date(row.drive_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : 'date TBD';

      await notifyUsersOneAtATime(
        adminIds,
        {
          title: `${emp.company_name} requested a drive`,
          message: `${emp.company_name} submitted a placement drive request: "${row.title}" (${dateLabel}, ${driveType.replace('_', ' ')}). Review and approve in Drives.`,
          type: 'drive',
          link: '/dashboard/college/drives',
        },
        client,
      );

      return {
        ok: true,
        drive: {
          id: row.id,
          college: collegeName,
          role: row.title,
          date: row.drive_date,
          type: driveType,
          status: 'requested',
          registered: 0,
          venue,
          ctcBreakup: ctcBreakupStored,
        },
      };
    });

    if (result?.ok && result?.drive) {
      const d = result.drive;
      const dateLabel = d.date
        ? new Date(d.date).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : 'date TBD';
      void emailPlacementDriveRequested({
        companyName: emp.company_name,
        driveTitle: d.role || d.title || 'Untitled',
        collegeName: d.college,
        driveDateLabel: dateLabel,
        driveType: d.type,
        driveId: d.id,
      }).catch((err) => console.error('[mail] placement drive requested', err));
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('POST /api/employer/drives', e);
    const code = e.statusCode || 500;
    const safeMsg = code >= 500 ? 'Failed to create drive' : (e.message || 'Failed to create drive');
    return NextResponse.json({ error: safeMsg }, { status: code });
  }
}

const EMPLOYER_CANCELLABLE_STATUSES = new Set(['requested', 'approved', 'scheduled', 'in_progress']);

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emp = await getEmployerId(session.user.id);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { driveId, action } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'driveId and action=cancel are required' }, { status: 400 });
    }
    if (!driveId) {
      return NextResponse.json({ error: 'driveId is required' }, { status: 400 });
    }

    const result = await transaction(async (client) => {
      const meta = await client.query(
        `SELECT d.id, d.title, d.status, d.tenant_id, d.registered_count, t.name AS college_name
         FROM placement_drives d
         JOIN tenants t ON t.id = d.tenant_id
         WHERE d.id = $1::uuid AND d.employer_id = $2::uuid ${AND_DRIVE_NOT_DELETED}`,
        [driveId, emp.id],
      );
      if (!meta.rows.length) {
        const e = new Error('Drive not found');
        e.statusCode = 404;
        throw e;
      }

      const row = meta.rows[0];
      if (row.status === 'cancelled') {
        const e = new Error('This drive is already cancelled.');
        e.statusCode = 409;
        throw e;
      }
      if (!EMPLOYER_CANCELLABLE_STATUSES.has(row.status)) {
        const e = new Error(`Cannot cancel a drive that is ${String(row.status).replace(/_/g, ' ')}.`);
        e.statusCode = 409;
        throw e;
      }

      const updated = await client.query(
        `UPDATE placement_drives
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1::uuid AND employer_id = $2::uuid
         RETURNING id, title AS role, drive_date AS date, drive_type AS type, status, venue, registered_count AS registered`,
        [driveId, emp.id],
      );

      const adminIds = await fetchCollegeAdminUserIds(row.tenant_id, client);
      const regNote = row.registered_count > 0 ? ` (${row.registered_count} student(s) had registered)` : '';
      await notifyUsersOneAtATime(
        adminIds,
        {
          title: `${emp.company_name} cancelled a drive`,
          message: `${emp.company_name} cancelled the placement drive "${row.title}"${regNote}.`,
          type: 'drive',
          link: '/dashboard/college/drives',
        },
        client,
      );

      return {
        ok: true,
        drive: {
          ...updated.rows[0],
          college: row.college_name,
        },
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('PATCH /api/employer/drives', e);
    const code = e.statusCode || 500;
    const safeMsg = code >= 500 ? 'Failed to cancel drive' : (e.message || 'Failed to cancel drive');
    return NextResponse.json({ error: safeMsg }, { status: code });
  }
}
