import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/sessionPolicy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROLE_HOME_PATHS = {
  student: '/dashboard/student',
  employer: '/dashboard/employer',
  college_admin: '/dashboard/college',
  super_admin: '/dashboard/admin',
};

/**
 * Post–sign-in redirect: read JWT from cookie on the server (no client SessionProvider race).
 */
export async function GET(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });

  if (token?.role && ROLE_HOME_PATHS[token.role]) {
    return NextResponse.redirect(new URL(ROLE_HOME_PATHS[token.role], request.url));
  }

  return NextResponse.redirect(new URL('/login?error=session', request.url));
}
