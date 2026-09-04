import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getUserByEmail, getUserById, DbUser } from '@/lib/db/sqlite';

function getJwtSecret(): Uint8Array {
  const configured = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production' && !configured) {
    throw new Error('AUTH_SECRET wajib dikonfigurasi di production.');
  }
  return new TextEncoder().encode(configured || 'finova-local-development-only-secret-change-me');
}

export const AUTH_COOKIE_NAME = 'finova_session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  title: string;
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Sign JWT session token with HMAC-SHA256 (24h expiry)
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret());
}

/**
 * Verify JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
      title: payload.title as string,
    };
  } catch {
    return null;
  }
}

/**
 * Get the currently authenticated user from incoming server request cookies
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    return getUserById(payload.userId);
  } catch (e) {
    return null;
  }
}
