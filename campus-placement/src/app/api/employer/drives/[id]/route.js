import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { fetchCollegeAdminUserIds, notifyUsersOneAtATime } from '@/lib/notificationService';
import { findAcademicYearForDate } from '@/lib/academicYearTenant';
import { AND_DRIVE_NOT_DELETED } from '@/lib/softDeleteSql';
import { DRIVE_APPLICANT_COUNT_SUBQUERY } from '@/lib/employerApplicationCounts';
import { validateEmployerDriveDate } from '@/lib/apiInputValidation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EDITABLE_STATUSES = new Set(['requested', 'approved', 'scheduled', 'in_progress']);
const ALLOWED_TYPES = new Set(['on_campus', 'off_campus', 'virtual', 'hybrid']);

async function getEmployerId(userId) {
  const r = await query(`SELECT id, company_name FROM employer_profiles WHERE user_id = $1::uuid`, [userId]);
  return r.rows[0] || null;
}

function isMissingCtcBreakupColumn(err) {
  return err?.code === '42703' && String(err?.message || '').includes('ctc_breakup');
}

async function loadEmployerDrive(driveId, employerId) {
  const baseSelect = `
    SELECT d.id, d.tenant_id, t.name AS college, d.title AS role, d.description,
           d.drive_date AS date, d.drive_type AS type, d.status, d.venue,
           ${DRIVE_APPLICANT_COUNT_SUBQUERY} AS registered`;
  const baseFrom = `
    FROM placement_drives d
    JOIN tenants t ON t.id = d.tenant_id
    WHERE d.id = $1::uuid AND d.employer_id = $2::uuid ${AND_DRIVE_NOT_DELETED}`;

  try {
    const res = await query(`${baseSelect}, d.ctc_breakup ${baseFrom}`, [driveId, employerId]);
    return res.rows[0] || null;
  } catch (err) {
    if (!isMissingCtcBreakupColumn(err)) throw err;
    const res = await query(`${baseSelect} ${baseFrom}`, [driveId, employerId]);
    const row = res.rows[0];
    return row ? { ...row, ctc_breakup: null } : null;
  }
}

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emp = await getEmployerId(session.user.id);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const { id: driveId } = await params;
    if (!driveId) return NextResponse.json({ error: 'Drive id required' }, { status: 400 });

    const drive = await loadEmployerDrive(driveId, emp.id);
    if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

    return NextResponse.json({ drive });
  } catch (e) {
    console.error('GET /api/employer/drives/[id]', e);
    return NextResponse.json({ error: 'Failed to load drive' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emp = await getEmployerId(session.user.id);
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });

    const { id: driveId } = await params;
    if (!driveId) return NextResponse.json({ error: 'Drive id required' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const {
      title,
      description = '',
      driveType = 'on_campus',
      driveDate = null,
      venue: venueIn,
      ctcBreakup: ctcBreakupIn,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Drive title is required' }, { status: 400 });
    }
    const driveDateErr = validateEmployerDriveDate(driveDate);
    if (driveDateErr) {
      return NextResponse.json({ error: driveDateErr }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(driveType)) {
      return NextResponse.json({ error: 'Invalid driveType' }, { status: 400 });
    }

    const venue =
      typeof venueIn === 'string' && venueIn.trim().length > 0 ? venueIn.trim() : null;
    const ctcBreakupRaw = ctcBreakupIn != null ? String(ctcBreakupIn) : '';
    const ctcBreakup =
      ctcBreakupRaw.trim().length > 0 ? ctcBreakupRaw.trim().slice(0, 10000) : null;

    const result = await transaction(async (client) => {
      const meta = await client.query(
        `SELECT d.id, d.title, d.status, d.tenant_id, t.name AS college_name
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
      if (!EDITABLE_STATUSES.has(row.status)) {
        const e = new Error(`Cannot edit a drive that is ${String(row.status).replace(/_/g, ' ')}.`);
        e.statusCode = 409;
        throw e;
      }

      let academicYearId = null;
      if (driveDate) {
        const yearsRes = await client.query(
          `SELECT id, period_start, period_end FROM tenant_academic_years WHERE tenant_id = $1::uuid`,
          [row.tenant_id],
        );
        const match = findAcademicYearForDate(driveDate, yearsRes.rows);
        academicYearId = match?.id || null;
      }

      const updateValues = [
        title.trim(),
        description || '',
        driveType,
        driveDate || null,
        venue,
        academicYearId,
        driveId,
        emp.id,
      ];

      let updated;
      try {
        updated = await client.query(
          `UPDATE placement_drives
           SET title = $1,
               description = $2,
               drive_type = $3,
               drive_date = $4::date,
               venue = $5,
               ctc_breakup = $6,
               academic_year_id = $7::uuid,
               updated_at = NOW()
           WHERE id = $8::uuid AND employer_id = $9::uuid
           RETURNING id, title AS role, drive_date AS date, drive_type AS type, status, venue,
                     registered_count AS registered, description, ctc_breakup`,
          [...updateValues.slice(0, 5), ctcBreakup, ...updateValues.slice(5)],
        );
      } catch (err) {
        if (!isMissingCtcBreakupColumn(err)) throw err;
        updated = await client.query(
          `UPDATE placement_drives
           SET title = $1,
               description = $2,
               drive_type = $3,
               drive_date = $4::date,
               venue = $5,
               academic_year_id = $6::uuid,
               updated_at = NOW()
           WHERE id = $7::uuid AND employer_id = $8::uuid
           RETURNING id, title AS role, drive_date AS date, drive_type AS type, status, venue,
                     registered_count AS registered, description`,
          updateValues,
        );
      }

      const adminIds = await fetchCollegeAdminUserIds(row.tenant_id, client);
      await notifyUsersOneAtATime(
        adminIds,
        {
          title: `${emp.company_name} updated a drive`,
          message: `${emp.company_name} updated the placement drive "${title.trim()}". Review the latest details in Drives.`,
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
          ctc_breakup: updated.rows[0].ctc_breakup ?? null,
        },
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('PATCH /api/employer/drives/[id]', e);
    const code = e.statusCode || 500;
    const safeMsg = code >= 500 ? 'Failed to update drive' : (e.message || 'Failed to update drive');
    return NextResponse.json({ error: safeMsg }, { status: code });
  }
}
