import { NextResponse } from 'next/server';

/**
 * Student self-registration is disabled — profiles are provisioned by the college (CSV / add student).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Student self-registration is disabled. Ask your placement office to add you to the campus list; you will receive a login email when your account is ready.',
    },
    { status: 403 },
  );
}
