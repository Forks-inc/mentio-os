/**
 * The password gate (src/lib/session.ts): with DASHBOARD_PASSWORD set, every
 * page, server action and export needs the session cookie; without one a
 * request goes to /login and comes back where it started.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, passwordProtected, sameDigest, sessionToken } from '@/lib/session';

export async function proxy(request: NextRequest) {
  if (!passwordProtected()) return NextResponse.next();
  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  if (cookie && sameDigest(cookie, await sessionToken())) return NextResponse.next();
  const login = new URL('/login', request.url);
  const back = request.nextUrl.pathname + request.nextUrl.search;
  if (back !== '/') login.searchParams.set('next', back);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything but the login page itself and Next's static files.
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico|webp)$).*)'],
};
