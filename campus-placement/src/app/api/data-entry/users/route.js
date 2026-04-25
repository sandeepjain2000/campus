import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const ALLOWED_ROLES = new Set(['student', 'college_admin', 'employer']);

async function assertAccess() {
  const session = await getServerSession(authOptions);
  return session || null;
}

async function resolveTenantId(session) {
  if (session?.user?.tenantId) return session.user.tenantId;
  const fallback = await query(`SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`);
  return fallback.rows[0]?.id || null;
}

export async function GET(request) {
  try {
    const session = await assertAccess();
    const role = request.nextUrl.searchParams.get('role');
    const whereRole = role && ALLOWED_ROLES.has(role) ? 'AND role = $2' : '';
    let users;
    const tenantId = await resolveTenantId(session);
    if (tenantId) {
      const params = whereRole ? [tenantId, role] : [tenantId];
      users = await query(
        `SELECT id, email, role, first_name, last_name, is_verified, is_active, created_at
         FROM users
         WHERE tenant_id = $1 ${whereRole}
         ORDER BY created_at DESC
         LIMIT 300`,
        params
      );
    } else {
      const params = role && ALLOWED_ROLES.has(role) ? [role] : [];
      const roleClause = params.length > 0 ? 'WHERE role = $1' : '';
      users = await query(
        `SELECT id, email, role, first_name, last_name, is_verified, is_active, created_at
         FROM users
         ${roleClause}
         ORDER BY created_at DESC
         LIMIT 300`,
        params
      );
    }
    return NextResponse.json({ users: users.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await assertAccess();

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    const password = String(body?.password || '').trim();
    const role = String(body?.role || 'student').trim();
    const isVerified = Boolean(body?.isVerified);
    const tenantId = await resolveTenantId(session);

    if (!tenantId) return NextResponse.json({ error: 'Missing tenant context for create' }, { status: 400 });
    if (!email || !firstName || !password) {
      return NextResponse.json({ error: 'email, firstName, and password are required' }, { status: 400 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Unsupported role for this form' }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    const created = await query(
      `INSERT INTO users (
        tenant_id, email, password_hash, role, first_name, last_name, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id, email, role, first_name, last_name, is_verified`,
      [tenantId, email, passwordHash, role, firstName, lastName || null, isVerified]
    );

    return NextResponse.json({ user: created.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user from data-entry:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await assertAccess();
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'No tenant available for update' }, { status: 400 });
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    const role = String(body?.role || '').trim();
    const isVerified = Boolean(body?.isVerified);
    const isActive = body?.isActive === false ? false : true;
    if (!id || !firstName || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'id, firstName, and valid role are required' }, { status: 400 });
    }
    const updated = await query(
      `UPDATE users
       SET first_name = $1, last_name = $2, role = $3, is_verified = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7
       RETURNING id, email, role, first_name, last_name, is_verified, is_active`,
      [firstName, lastName || null, role, isVerified, isActive, id, tenantId]
    );
    if (!updated.rows[0]) return NextResponse.json({ error: 'User not found in your tenant' }, { status: 404 });
    return NextResponse.json({ user: updated.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await assertAccess();
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'No tenant available for delete' }, { status: 400 });
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await query(`DELETE FROM users WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
