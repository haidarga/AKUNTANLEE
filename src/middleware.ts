import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const configuredAuthSecret = process.env.AUTH_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = new TextEncoder().encode(
  configuredAuthSecret || 'finova-local-development-only-secret-change-me',
);

const AUTH_COOKIE_NAME = 'finova_session';

const PROTECTED_PREFIXES = ['/engagements', '/settings', '/admin'];
const PUBLIC_API_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/me',
  '/api/v1/auth/access-key',
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtectedPage = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isProtectedApi = pathname.startsWith('/api/v1/') && !PUBLIC_API_PATHS.has(pathname);
  const isProtected = isProtectedPage || isProtectedApi;

  if (isProtected && isProduction && !configuredAuthSecret) {
    return NextResponse.json(
      { code: 'AUTH_NOT_CONFIGURED', message: 'Konfigurasi autentikasi production belum lengkap.' },
      { status: 503 },
    );
  }

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

    // Redirect legacy 2025 engagement links to 2026
  if (pathname.includes('/ENG-2025-01')) {
    const newUrl = req.nextUrl.clone();
    newUrl.pathname = pathname.replace('/ENG-2025-01', '/ENG-2026-01');
    return NextResponse.redirect(newUrl);
  }

  // Evaluator auto-login is isolated behind an explicit demo-only flag.
  if (isProtectedPage && !isValidSession && process.env.FINOVA_DEMO_MODE === 'true') {
    const isAdvisory = pathname.includes('/advisory');
    const isTax = pathname.includes('/tax');

    const defaultName = isAdvisory
      ? 'Ibu Rina Asmara, Ak.'
      : isTax
      ? 'Bunda'
      : 'Haidar, CPA, CA';

    const defaultEmail = isAdvisory
      ? 'rina.asmara@advisory-partner.id'
      : isTax
      ? 'bunda@pajak-kap.co.id'
      : 'haidar@kaphaidar.co.id';

    const defaultTitle = isAdvisory
      ? 'Senior Financial Advisory Partner'
      : isTax
      ? 'Partner Kepatuhan Pajak'
      : 'Managing Engagement Partner';

    const defaultVariant = isAdvisory
      ? 'variant_b_advisory'
      : isTax
      ? 'variant_a_compliance'
      : 'variant_master';

    const guestToken = await new SignJWT({
      userId: isAdvisory ? 'USR-RINA-01' : isTax ? 'USR-BUNDA-01' : 'USR-PARTNER-01',
      email: defaultEmail,
      role: 'partner',
      name: defaultName,
      title: defaultTitle,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const res = NextResponse.next();

    res.cookies.set(AUTH_COOKIE_NAME, guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('finova_user_name', encodeURIComponent(defaultName), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('finova_ab_variant', defaultVariant, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  }

  if (isProtectedApi && !isValidSession) {
    return NextResponse.json(
      { code: 'UNAUTHENTICATED', message: 'Sesi login diperlukan.' },
      { status: 401 },
    );
  }

  if (isProtectedPage && !isValidSession) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/engagements/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/api/v1/:path*',
    '/login',
  ],
};
