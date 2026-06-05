import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isUuid, requireSuperAdmin } from '@/lib/adminAuth';
import {
  assertCollegeNameAvailable,
  formatCollegeNameInUseMessage,
  normalizeOrganizationName,
} from '@/lib/organizationNames';
import { SP_ACTIVE_ON } from '@/lib/studentProfileActive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;




async function loadCollege(id) {
  const result = await query(
    `SELECT
        t.id,
        t.name,
        t.slug,
        t.city,
        t.state,
        t.pincode,
        t.website,
        t.email,
        t.phone,
        t.naac_grade,
        t.nirf_rank,
        t.is_active,
        t.created_at,
        COUNT(sp.id) AS students,
        SUM(CASE WHEN sp.placement_status = 'placed' THEN 1 ELSE 0 END) AS placed,
        (
          SELECT json_build_object(
            'email', u.email,
            'firstName', u.first_name,
            'lastName', u.last_name
          )
          FROM users u
          WHERE u.tenant_id = t.id AND u.role = 'college_admin'
          ORDER BY u.created_at ASC
          LIMIT 1
        ) AS primary_admin
      FROM tenants t
      LEFT JOIN student_profiles sp ON sp.tenant_id = t.id AND ${SP_ACTIVE_ON}
      WHERE t.id = $1::uuid AND t.type = 'college'
      GROUP BY t.id`,
    [id],
  );
  return result.rows[0] || null;
}

function mapCollege(row) {
  const admin = row.primary_admin || {};
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    website: row.website || '',
    email: row.email || '',
    phone: row.phone || '',
    naac: row.naac_grade || '',
    nirfRank: row.nirf_rank != null ? Number(row.nirf_rank) : null,
    active: Boolean(row.is_active),
    students: Number(row.students || 0),
    placed: Number(row.placed || 0),
    createdAt: row.created_at,
    adminEmail: admin.email || '',
    adminName: [admin.firstName, admin.lastName].filter(Boolean).join(' ') || '',
  };
}

export async function GET(_request, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'Invalid college id' }, { status: 400 });

    const row = await loadCollege(id);
    if (!row) return NextResponse.json({ error: 'College not found' }, { status: 404 });

    return NextResponse.json({ college: mapCollege(row) });
  } catch (error) {
    console.error('GET /api/admin/colleges/[id]', error);
    return NextResponse.json({ error: 'Failed to load college' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'Invalid college id' }, { status: 400 });

    const body = await request.json();
    const name = normalizeOrganizationName(body?.name ?? '');
    if (!name) return NextResponse.json({ error: 'College name is required' }, { status: 400 });

    try {
      await assertCollegeNameAvailable(query, name, { excludeTenantId: id });
    } catch (e) {
      if (e.message === 'COLLEGE_NAME_EXISTS') {
        return NextResponse.json(
          { error: formatCollegeNameInUseMessage(e.existing, { name }) },
          { status: 409 },
        );
      }
      throw e;
    }

    const city = String(body?.city ?? '').trim();
    const state = String(body?.state ?? '').trim();
    const pincode = String(body?.pincode ?? '').trim();
    const website = String(body?.website ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const naac = String(body?.naac ?? body?.naacGrade ?? '').trim();
    const nirfRaw = body?.nirfRank ?? body?.nirf_rank;
    const nirfRank =
      nirfRaw === '' || nirfRaw == null || nirfRaw === undefined
        ? null
        : Number.parseInt(String(nirfRaw), 10);
    if (nirfRank != null && !Number.isFinite(nirfRank)) {
      return NextResponse.json({ error: 'NIRF rank must be a number' }, { status: 400 });
    }
    const active = Boolean(body?.active ?? body?.is_active ?? true);

    const updated = await query(
      `UPDATE tenants
       SET
         name = $2,
         city = NULLIF($3, ''),
         state = NULLIF($4, ''),
         pincode = NULLIF($5, ''),
         website = NULLIF($6, ''),
         email = NULLIF($7, ''),
         communication_email = COALESCE(NULLIF($7, ''), communication_email),
         phone = NULLIF($8, ''),
         naac_grade = NULLIF($9, ''),
         nirf_rank = $10,
         is_active = $11,
         updated_at = NOW()
       WHERE id = $1::uuid AND type = 'college'
       RETURNING id`,
      [id, name, city, state, pincode, website, email, phone, naac, nirfRank, active],
    );

    if (!updated.rowCount) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const row = await loadCollege(id);
    return NextResponse.json({ college: mapCollege(row) });
  } catch (error) {
    console.error('PATCH /api/admin/colleges/[id]', error);
    return NextResponse.json({ error: 'Failed to update college' }, { status: 500 });
  }
}
