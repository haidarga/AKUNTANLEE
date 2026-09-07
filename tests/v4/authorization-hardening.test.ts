import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generateExport } from '@/app/api/v1/exports/route';
import { POST as recalculateWorkpaper } from '@/app/api/v1/workpapers/route';
import { POST as sealEngagement } from '@/app/api/v1/engagements/[id]/seal/route';
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth/session';

describe('production authorization hardening', () => {
  it('rejects an unauthenticated direct export handler call', async () => {
    const response = await generateExport(new NextRequest('http://localhost/api/v1/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engagementId: 'ENG-2026-01', userRole: 'partner' }),
    }));

    expect(response.status).toBe(401);
  });

  it('does not let a senior become partner through the request body', async () => {
    const token = await createSessionToken({
      userId: 'USR-SNR-01',
      firmId: 'TENANT-001',
      email: 'senior@example.test',
      role: 'senior',
      name: 'Senior Auditor',
      title: 'Senior In-Charge',
    });
    const response = await generateExport(new NextRequest('http://localhost/api/v1/exports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify({ engagementId: 'ENG-2026-01', userRole: 'partner' }),
    }));

    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN_ROLE');
  });

  it('rejects unauthenticated workpaper recalculation at the handler boundary', async () => {
    const response = await recalculateWorkpaper(new NextRequest('http://localhost/api/v1/workpapers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engagementId: 'ENG-2026-01', userRole: 'partner' }),
    }));
    expect(response.status).toBe(401);
  });

  it('does not let a senior invoke the partner seal endpoint', async () => {
    const token = await createSessionToken({
      userId: 'USR-SNR-01', firmId: 'TENANT-001', email: 'senior@example.test',
      role: 'senior', name: 'Senior Auditor', title: 'Senior In-Charge',
    });
    const response = await sealEngagement(new NextRequest('http://localhost/api/v1/engagements/ENG-2026-01/seal', {
      method: 'POST', headers: { 'Content-Type': 'application/json', cookie: `${AUTH_COOKIE_NAME}=${token}` },
      body: JSON.stringify({ partnerApNumber: 'AP.FORGED' }),
    }), { params: Promise.resolve({ id: 'ENG-2026-01' }) });

    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN_ROLE');
  });
});
