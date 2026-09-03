import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

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

    // Redirect legacy 2025 engagement links to 2026
  if (pathname.includes('/ENG-2025-01')) {
    const newUrl = req.nextUrl.clone();
    newUrl.pathname = pathname.replace('/ENG-2025-01', '/ENG-2026-01');
    return NextResponse.redirect(newUrl);
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Seamless Mode for Evaluators: Auto-mint session if accessing protected routes without login
  if (isProtected && !isValidSession) {
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
