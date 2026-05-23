import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isUuid, requireSuperAdmin } from '@/lib/adminAuth';

async function loadEmployer(id) {
  const result = await query(
    `SELECT
        ep.id,
        ep.company_name,
        ep.industry,
        ep.website,
        ep.headquarters,
        ep.contact_person,
        ep.contact_email,
        ep.contact_phone,
        ep.total_hires,
        ep.is_verified,
        ep.is_blacklisted,
        ep.blacklist_reason,
        ep.created_at,
        u.id AS user_id,
        u.email AS account_email,
        u.first_name,
        u.last_name,
        u.is_active AS account_active
      FROM employer_profiles ep
      INNER JOIN users u ON u.id = ep.user_id
      WHERE ep.id = $1::uuid
      LIMIT 1`,
    [id],
  );
  return result.rows[0] || null;
}

function mapEmployer(row) {
  return {
    id: row.id,
    name: row.company_name,
    industry: row.industry || '',
    website: row.website || '',
    headquarters: row.headquarters || '',
    contactPerson: row.contact_person || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    hires: Number(row.total_hires || 0),
    verified: Boolean(row.is_verified),
    blacklisted: Boolean(row.is_blacklisted),
    blacklistReason: row.blacklist_reason || '',
    createdAt: row.created_at,
    userId: row.user_id,
    accountEmail: row.account_email || '',
    accountName: [row.first_name, row.last_name].filter(Boolean).join(' ') || '',
    accountActive: Boolean(row.account_active),
  };
}

export async function GET(_request, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'Invalid employer id' }, { status: 400 });

    const row = await loadEmployer(id);
    if (!row) return NextResponse.json({ error: 'Employer not found' }, { status: 404 });

    return NextResponse.json({ employer: mapEmployer(row) });
  } catch (error) {
    console.error('GET /api/admin/employers/[id]', error);
    return NextResponse.json({ error: 'Failed to load employer' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'Invalid employer id' }, { status: 400 });

    const body = await request.json();
    const name = String(body?.name ?? body?.companyName ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });

    const industry = String(body?.industry ?? '').trim();
    const website = String(body?.website ?? '').trim();
    const headquarters = String(body?.headquarters ?? '').trim();
    const contactPerson = String(body?.contactPerson ?? body?.contact_person ?? '').trim();
    const contactEmail = String(body?.contactEmail ?? body?.contact_email ?? '').trim();
    const contactPhone = String(body?.contactPhone ?? body?.contact_phone ?? '').trim();
    const verified = Boolean(body?.verified ?? body?.is_verified);
    const blacklisted = Boolean(body?.blacklisted ?? body?.is_blacklisted);
    const blacklistReason = String(body?.blacklistReason ?? body?.blacklist_reason ?? '').trim();

    const updated = await query(
      `UPDATE employer_profiles
       SET
         company_name = $2,
         industry = NULLIF($3, ''),
         website = NULLIF($4, ''),
         headquarters = NULLIF($5, ''),
         contact_person = NULLIF($6, ''),
         contact_email = NULLIF($7, ''),
         contact_phone = NULLIF($8, ''),
         is_verified = $9,
         is_blacklisted = $10,
         blacklist_reason = CASE WHEN $10 THEN NULLIF($11, '') ELSE NULL END,
         updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING id`,
      [
        id,
        name,
        industry,
        website,
        headquarters,
        contactPerson,
        contactEmail,
        contactPhone,
        verified,
        blacklisted,
        blacklistReason,
      ],
    );

    if (!updated.rowCount) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 });
    }

    const row = await loadEmployer(id);
    return NextResponse.json({ employer: mapEmployer(row) });
  } catch (error) {
    console.error('PATCH /api/admin/employers/[id]', error);
    return NextResponse.json({ error: 'Failed to update employer' }, { status: 500 });
  }
}
