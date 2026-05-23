import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { fetchCollegeAdminUserIds, notifyUsersOneAtATime } from '@/lib/notificationService';
import { emailPlacementDriveRequested } from '@/lib/placementDriveEmail';
import { findAcademicYearForDate } from '@/lib/academicYearTenant';

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
    jobId,
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
      SELECT d.id, t.name AS college, d.title AS role, d.drive_date AS date, d.drive_type AS type,
             d.status, d.venue, d.registered_count AS registered`;
    const baseFrom = `
      FROM placement_drives d
      JOIN tenants t ON t.id = d.tenant_id
      WHERE d.employer_id = $1::uuid
        AND ($2::uuid IS NULL OR d.tenant_id = $2::uuid)
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
      jobId = null,
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

      if (jobId) {
        const j = await client.query(
          `SELECT 1 FROM job_postings WHERE id = $1::uuid AND employer_id = $2::uuid`,
          [jobId, emp.id],
        );
        if (!j.rowCount) {
          const e = new Error('jobId must belong to your company');
          e.statusCode = 400;
          throw e;
        }
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
        jobId,
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
