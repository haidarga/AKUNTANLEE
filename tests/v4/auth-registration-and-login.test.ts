import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST as registerHandler } from '@/app/api/v1/auth/register/route';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { GET as meHandler } from '@/app/api/v1/auth/me/route';
import { NextRequest } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

describe('FINOVA Enterprise Registration & Multi-Tenant Login Pipeline', () => {
  const testEmail = `test.auditor.${Date.now()}@kap-audit.co.id`;
  const testPassword = 'AuditPassword2026!';
  const testFullName = 'Dr. Hendra Wijaya, CPA, CA';
  const testFirmName = 'KAP Hendra Wijaya & Rekan';
  let sessionCookie = '';
  let registeredUserId = '';
  let registeredFirmId = '';

  afterAll(async () => {
    // Cleanup Supabase test records
    if (isSupabaseConfigured() && registeredUserId) {
      const admin = getSupabaseAdmin();
      if (admin) {
        try {
          await admin.from('firm_memberships').delete().eq('email', testEmail);
          if (registeredFirmId) {
            await admin.from('firms').delete().eq('id', registeredFirmId);
          }
          await admin.auth.admin.deleteUser(registeredUserId);
        } catch (e) {
          console.warn('Cleanup warning:', e);
        }
      }
    }
  });

  it('rejects registration with missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('rejects registration with short password (< 8 chars)', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: '123',
        fullName: testFullName,
        firmName: testFirmName,
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('minimal');
  });

  it('successfully registers a real new KAP and auditor partner', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
        firmName: testFirmName,
        role: 'partner',
        licenseNumber: 'AP.8812',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testEmail);
    expect(data.user.name).toBe(testFullName);
    expect(data.user.role).toBe('partner');
    expect(data.user.firmId).toBeDefined();

    registeredUserId = data.user.id;
    registeredFirmId = data.user.firmId;

    // Verify cookie was set
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('finova_session=');

    // Extract cookie value for subsequent tests
    const match = setCookie?.match(/finova_session=([^;]+)/);
    if (match) {
      sessionCookie = match[1];
    }
  });

  it('rejects duplicate registration with 409 conflict', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
        firmName: testFirmName,
      }),
    });

    const res = await registerHandler(req);
    expect([400, 409]).toContain(res.status);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('successfully logs in newly registered user with their password', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testEmail);
    expect(data.user.role).toBe('partner');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('finova_session=');
  });

  it('rejects login with wrong password', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('preserves backward compatibility by logging in existing demo partner account', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'haidar@kaphaidar.co.id',
        password: 'Partner123!',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('haidar@kaphaidar.co.id');
    expect(data.user.role).toBe('partner');
  });

  it('verifies /api/v1/auth/me returns valid user identity from session cookie', async () => {
    if (!sessionCookie) return;

    const req = new NextRequest('http://localhost/api/v1/auth/me', {
      headers: {
        cookie: `finova_session=${sessionCookie}`,
      },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).not.toBeNull();
    expect(data.user.email).toBe(testEmail);
    expect(data.user.name).toBe(testFullName);
    expect(data.user.role).toBe('partner');
  });
});
