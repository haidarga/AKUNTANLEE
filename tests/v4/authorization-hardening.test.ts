import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generateExport } from '@/app/api/v1/exports/route';
import { POST as recalculateWorkpaper } from '@/app/api/v1/workpapers/route';
import { POST as sealEngagement } from '@/app/api/v1/engagements/[id]/seal/route';
import { POST as createAdjustment } from '@/app/api/v1/engagements/[id]/adjustments/route';
import { PATCH as resolveNote } from '@/app/api/v1/engagements/[id]/notes/route';
import { POST as updateMappings } from '@/app/api/v1/mapping-sets/[id]/decisions/route';
import { POST as rollForward } from '@/app/api/v1/engagements/[id]/roll-forward/route';
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth/session';

describe('production authorization hardening', () => {
  async function sessionRequest(role: 'preparer' | 'senior' | 'manager' | 'partner', url: string, body: unknown) {
    const token = await createSessionToken({
      userId: `USR-${role.toUpperCase()}-TEST`, firmId: 'TENANT-001', email: `${role}@example.test`,
      role, name: `${role} Auditor`, title: role,
    });
    return new NextRequest(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', cookie: `${AUTH_COOKIE_NAME}=${token}` },
      body: JSON.stringify(body),
    });
  }
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

  it('attributes an adjustment to the authenticated preparer and keeps it in draft', async () => {
    const request = await sessionRequest('preparer', 'http://localhost/api/v1/engagements/ENG-2026-01/adjustments', {
      userRole: 'partner', description: 'Accrual correction', debitLineId: 'WP-F.3', debitAmountIdr: 1000,
      creditLineId: 'WP-C.3', creditAmountIdr: 1000,
    });
    const response = await createAdjustment(request, { params: Promise.resolve({ id: 'ENG-2026-01' }) });
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.data.preparedByUserId).toBe('USR-PREPARER-TEST');
    expect(body.data.status).toBe('draft');
  });

  it('blocks a preparer from resolving a reviewer note by spoofing partner', async () => {
    const request = await sessionRequest('preparer', 'http://localhost/api/v1/engagements/ENG-2026-01/notes', {
      userRole: 'partner', noteId: 'NOTE-FAKE',
    });
    const response = await resolveNote(request);
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN_ROLE');
  });

  it('blocks a preparer from bulk approving mappings by spoofing partner', async () => {
    const request = await sessionRequest('preparer', 'http://localhost/api/v1/mapping-sets/MAPSET-001/decisions', {
      action: 'bulk_approve', userRole: 'partner', decisions: [],
    });
    const response = await updateMappings(request, { params: Promise.resolve({ id: 'MAPSET-001' }) });
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN_ROLE');
  });

  it('blocks a senior from rolling an engagement forward by spoofing partner', async () => {
    const request = await sessionRequest('senior', 'http://localhost/api/v1/engagements/ENG-2026-01/roll-forward', {
      userRole: 'partner',
    });
    const response = await rollForward(request, { params: Promise.resolve({ id: 'ENG-2026-01' }) });
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN_ROLE');
  });
});
