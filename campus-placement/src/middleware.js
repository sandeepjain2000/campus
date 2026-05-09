import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** Keep in sync with ROLE_HOME_PATHS in config/dashboardMenu.js (no lucide import here — Edge-safe). */
const ROLE_HOME_PATHS = {
  student:      '/dashboard/student',
  employer:     '/dashboard/employer',
  college_admin:'/dashboard/college',
  super_admin:  '/dashboard/admin',
};

/** Role → the dashboard path prefix that role OWNS. Cross-role access is blocked. */
const ROLE_OWNED_PREFIX = {
  student:      '/dashboard/student',
  employer:     '/dashboard/employer',
  college_admin:'/dashboard/college',
  super_admin:  '/dashboard/admin',
};

/** Dashboard path prefixes that are open to ALL authenticated roles. */
const SHARED_DASHBOARD_ROUTES = [
  '/dashboard/alerts',
  '/dashboard/feedback',
  '/dashboard/my-exports',
];

const DATA_ENTRY_ROLES = new Set(['super_admin', 'college_admin']);

/**
 * Middleware enforces:
 *  1. /data-entry — restricted to ops roles
 *  2. /login — authenticated users are redirected to their home
 *  3. /dashboard/* — each role can only reach its own prefix (or shared routes)
 */
export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── /data-entry ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/data-entry')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.role) return NextResponse.redirect(new URL('/login', request.url));
    if (!DATA_ENTRY_ROLES.has(token.role)) {
      const dest = ROLE_HOME_PATHS[token.role] || '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // ── /login — bounce already-authenticated users (unless ?force=1) ──────────
  if (pathname === '/login') {
    const force = request.nextUrl.searchParams.get('force');
    if (!force) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (token?.role) {
        const dest = ROLE_HOME_PATHS[token.role] || '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.next();
  }

  // ── /dashboard/* — per-role path enforcement ─────────────────────────────
  if (pathname.startsWith('/dashboard/')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Unauthenticated → login
    if (!token?.role) return NextResponse.redirect(new URL('/login', request.url));

    const role = token.role;
    const ownedPrefix = ROLE_OWNED_PREFIX[role];

    // Allow shared routes for all authenticated users
    const isShared = SHARED_DASHBOARD_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
    if (isShared) return NextResponse.next();

    // Allow the role's own dashboard subtree
    if (ownedPrefix && (pathname === ownedPrefix || pathname.startsWith(ownedPrefix + '/'))) {
      return NextResponse.next();
    }

    // Block cross-role access — redirect to the role's own home
    const dest = ROLE_HOME_PATHS[role] || '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/data-entry', '/data-entry/:path*', '/dashboard/:path*'],
};
