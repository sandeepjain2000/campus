import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { isFacebookPageShareConfigured } from '@/lib/facebookPageShare';
import { emailPlacementDriveApproved } from '@/lib/placementDriveEmail';
import { resolveTenantAcademicYear } from '@/lib/resolveAcademicYearFromRequest';

function getTenantId(session) {
  return session?.user?.tenant_id ?? session?.user?.tenantId ?? null;
}

/** Older DBs may not have run db/migrations/012_employer_poc_drive_social_shared.sql yet. */
async function loadDrivesForTenant(tenantId, academicYearId = null) {
  const yearFilter = academicYearId
    ? ` AND (d.academic_year_id = $2::uuid OR d.academic_year_id IS NULL OR d.status = 'requested')`
    : '';
  const params = academicYearId ? [tenantId, academicYearId] : [tenantId];
  const baseFrom = `
      FROM placement_drives d
      LEFT JOIN employer_profiles ep ON ep.id = d.employer_id
      WHERE d.tenant_id = $1::uuid${yearFilter}
      ORDER BY d.drive_date DESC NULLS LAST, d.created_at DESC`;
  try {
    return await query(
      `SELECT
        d.id,
        ep.company_name AS company,
        ep.website AS website,
        d.title AS role,
        d.drive_date AS date,
        d.drive_type AS type,
        d.status,
        d.registered_count AS registered,
        d.selected_count AS selected,
        d.venue,
        COALESCE(d.social_shared, ARRAY[]::text[]) AS social_shared,
        COALESCE(d.attached_staff_user_ids, ARRAY[]::uuid[]) AS attached_staff_user_ids
      ${baseFrom}`,
      params,
    );
  } catch (err) {
    const msg = String(err?.message || '');
    if (
      err?.code === '42703' &&
      (msg.includes('social_shared') ||
        msg.includes('academic_year_id') ||
        msg.includes('attached_staff_user_ids'))
    ) {
      if (msg.includes('academic_year_id')) {
        return loadDrivesForTenant(tenantId, null);
      }
      const slim = await query(
        `SELECT
        d.id,
        ep.company_name AS company,
        ep.website AS website,
        d.title AS role,
        d.drive_date AS date,
        d.drive_type AS type,
        d.status,
        d.registered_count AS registered,
        d.selected_count AS selected,
        d.venue,
        COALESCE(d.social_shared, ARRAY[]::text[]) AS social_shared
      ${baseFrom}`,
        params,
      );
      return {
        rows: slim.rows.map((r) => ({
          ...r,
          social_shared: r.social_shared ?? [],
          attached_staff_user_ids: [],
        })),
      };
    }
    throw err;
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = getTenantId(session);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const ay = await resolveTenantAcademicYear(tenantId, searchParams);
    const drives = await loadDrivesForTenant(tenantId, ay.year?.id || null);

    const staff = await query(
      `SELECT id, first_name, last_name, role
       FROM users
       WHERE tenant_id = $1::uuid
         AND role = 'college_admin'
         AND is_active = true
       ORDER BY first_name ASC, last_name ASC`,
      [tenantId]
    );

    return NextResponse.json({
      drives: drives.rows,
      staffDirectory: staff.rows.map((s) => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        role: s.role === 'college_admin' ? 'Placement Coordinator' : s.role,
      })),
      integrations: {
        /** True when FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN are set (enables “Post to FB Page” on the UI). */
        facebookPageShare: isFacebookPageShareConfigured(),
      },
    });
  } catch (error) {
    console.error('Failed to load college drives:', error);
    const body = { error: 'Failed to load college drives' };
    if (process.env.NODE_ENV === 'development') {
      body.details = error?.message || String(error);
    }
    return NextResponse.json(body, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'college_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = getTenantId(session);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const { driveId, action } = await request.json();
    if (!driveId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'driveId and valid action are required' }, { status: 400 });
    }

    const nextStatus = action === 'approve' ? 'approved' : 'cancelled';
    const updated = await query(
      `UPDATE placement_drives
       SET status = $1::varchar,
           approved_by = CASE WHEN $1::varchar = 'approved' THEN $2::uuid ELSE approved_by END,
           approved_at = CASE WHEN $1::varchar = 'approved' THEN NOW() ELSE approved_at END,
           updated_at = NOW()
       WHERE id = $3::uuid
         AND tenant_id = $4::uuid
         AND status = 'requested'
       RETURNING id, status, title, drive_date, drive_type, tenant_id, employer_id`,
      [nextStatus, session.user.id, driveId, tenantId]
    );

    if (!updated.rows.length) {
      const meta = await query(
        `SELECT status FROM placement_drives WHERE id = $1::uuid AND tenant_id = $2::uuid`,
        [driveId, tenantId],
      );
      if (!meta.rows[0]) {
        return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
      }
      return NextResponse.json(
        {
          error: 'This drive is not awaiting approval.',
          currentStatus: meta.rows[0].status,
        },
        { status: 409 },
      );
    }

    const row = updated.rows[0];
    if (row.status === 'approved') {
      const meta = await query(
        `SELECT t.name AS college_name, ep.company_name
         FROM placement_drives d
         JOIN tenants t ON t.id = d.tenant_id
         JOIN employer_profiles ep ON ep.id = d.employer_id
         WHERE d.id = $1::uuid`,
        [row.id],
      );
      const m = meta.rows[0];
      const dateLabel = row.drive_date
        ? new Date(row.drive_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : 'date TBD';
      void emailPlacementDriveApproved({
        companyName: m?.company_name || 'Employer',
        driveTitle: row.title || 'Untitled',
        collegeName: m?.college_name || 'College',
        driveDateLabel: dateLabel,
        driveType: row.drive_type,
        driveId: row.id,
      }).catch((err) => console.error('[mail] placement drive approved', err));
    }

    return NextResponse.json({ success: true, drive: { id: row.id, status: row.status } });
  } catch (error) {
    console.error('Failed to update drive status:', error);
    return NextResponse.json({ error: 'Failed to update drive status: ' + (error?.message || String(error)) }, { status: 500 });
  }
}
