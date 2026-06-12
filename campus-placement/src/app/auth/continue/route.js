import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/sessionPolicy';
import { writePlatformErrorLog } from '@/lib/platformErrorLog';

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
  const cookieHeader = request.headers.get('cookie') || '';
  console.log('[Auth Continue] GET endpoint invoked.');
  console.log('[Auth Continue] Cookie header:', cookieHeader);

  // Try parsing token using both SESSION_COOKIE_NAME and fallback options
  let token = null;
  let tokenError = null;

  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: SESSION_COOKIE_NAME,
      secureCookie: SESSION_COOKIE_NAME.startsWith('__Secure-'),
    });
  } catch (err) {
    tokenError = err;
    console.error('[Auth Continue] Error getting token with custom name:', err);
  }

  // Let's also log to platform_error_logs for direct inspection
  await writePlatformErrorLog({
    context: 'auth_continue_debug',
    severity: 'info',
    statusCode: 200,
    error: tokenError || new Error('Auth continue debug trace'),
    userMessage: 'Auth continue debug log',
    details: {
      sessionCookieName: SESSION_COOKIE_NAME,
      cookieHeader: cookieHeader.slice(0, 500),
      tokenFound: !!token,
      tokenRole: token?.role || null,
      tokenId: token?.id || null,
      tokenEmail: token?.email || null,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL,
      requestUrl: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    }
  });

  if (token?.role && ROLE_HOME_PATHS[token.role]) {
    const dest = ROLE_HOME_PATHS[token.role];
    console.log(`[Auth Continue] JWT token found. User ID: ${token.id}, Role: ${token.role}. Redirecting to dashboard home: ${dest}`);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  console.warn('[Auth Continue] Token verification failed or role is missing/invalid. Redirecting back to /login?error=session. Token:', token ? { id: token.id, email: token.email, role: token.role } : null);
  return NextResponse.redirect(new URL('/login?error=session', request.url));
}

