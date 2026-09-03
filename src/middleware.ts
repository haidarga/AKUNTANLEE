import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'finova_enterprise_jwt_secret_key_2026_audit_security_super_secure'
);

const AUTH_COOKIE_NAME = 'finova_session';

const PROTECTED_PREFIXES = ['/engagements', '/settings', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  let isValidSession = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // If user tries to access protected page without valid session, redirect to /login
  if (isProtected && !isValidSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and tries to visit /login, redirect to /engagements
  if (pathname === '/login' && isValidSession) {
    const redirectTarget = req.nextUrl.searchParams.get('redirect') || '/engagements';
    return NextResponse.redirect(new URL(redirectTarget, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/engagements/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
  ],
};
