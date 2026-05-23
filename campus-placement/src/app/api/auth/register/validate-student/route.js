import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateRegistration, validatePhone } from '@/lib/validators';
import { normalizeSurfaceTokenInput } from '@/lib/shardBinding';
import {
  assertStudentSelfRegistrationAllowed,
  mapStudentRegistrationError,
} from '@/lib/studentRegistrationGuards';

/**
 * Pre-check student registration fields (email, roll, batch) before submit.
 * POST body: same student fields as /api/auth/register.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const { firstName, lastName, password, phone, campusBindingToken, departmentId, batchYear, rollNumber } =
      body;

    const validation = validateRegistration({
      email,
      password,
      firstName,
      lastName,
      role: 'student',
      campusBindingToken,
      departmentId,
      batchYear,
    });
    if (!validation.isValid) {
      return NextResponse.json({ error: Object.values(validation.errors)[0] }, { status: 400 });
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Enter a valid mobile number with country code, or leave blank.' },
        { status: 400 },
      );
    }

    const bindingInput = normalizeSurfaceTokenInput(campusBindingToken);
    const bind = await query(
      `SELECT ref_scope_id FROM shard_binding_pairs WHERE lower(surface_token) = lower($1)`,
      [bindingInput],
    );
    if (bind.rows.length === 0) {
      return NextResponse.json(
        { error: mapStudentRegistrationError({ message: 'INVALID_CAMPUS_KEY' }) },
        { status: 400 },
      );
    }

    const tenantId = bind.rows[0].ref_scope_id;

    try {
      await assertStudentSelfRegistrationAllowed(query, {
        email,
        rollNumber,
        tenantId,
        batchYear,
      });
    } catch (e) {
      const message = mapStudentRegistrationError(e, { email, rollNumber });
      const status =
        e.message === 'EMAIL_EXISTS' || e.message === 'ACCOUNT_ALREADY_REGISTERED' ? 409 : 400;
      return NextResponse.json({ error: message, code: e.message }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/auth/register/validate-student', error);
    return NextResponse.json({ error: 'Could not validate registration' }, { status: 500 });
  }
}
