import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/sqlite';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = getUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      cpaLicense: user.cpa_license,
    },
  });
}
