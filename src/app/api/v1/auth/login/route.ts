import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/sqlite';
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    // Create JWT session
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      title: user.title,
    });

    // Set secure HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        cpaLicense: user.cpa_license,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat autentikasi.' },
      { status: 500 }
    );
  }
}
