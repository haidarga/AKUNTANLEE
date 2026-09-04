import { describe, it, expect } from 'vitest';
import { GET as getEngagements, POST as postEngagement } from '@/app/api/v1/engagements/route';
import { GET as getEngagementDetail, PATCH as patchEngagementDetail } from '@/app/api/v1/engagements/[id]/route';
import { POST as uploadFiles } from '@/app/api/v1/engagements/[id]/files/route';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/session';
import crypto from 'crypto';

describe('Multi-Tenant Two-Firm Data Isolation & Cryptographic Vault Security', () => {
  const firmA = {
    userId: 'USR-ARUNIKA-01',
    firmId: 'FIRM-ARUNIKA',
    email: 'auditor@arunika-kap.co.id',
    role: 'partner',
    name: 'Partner Arunika',
    title: 'Managing Partner',
  };

  const firmB = {
    userId: 'USR-HAIDAR-01',
    firmId: 'FIRM-HAIDAR',
    email: 'auditor@haidar-kap.co.id',
    role: 'partner',
    name: 'Partner Haidar',
    title: 'Managing Partner',
  };

  let tokenFirmA: string;
  let tokenFirmB: string;
  let createdEngagementId: string;

  it('generates cryptographically signed JWT sessions with firmId binding', async () => {
    tokenFirmA = await createSessionToken(firmA);
    tokenFirmB = await createSessionToken(firmB);

    expect(tokenFirmA).toBeDefined();
    expect(tokenFirmB).toBeDefined();
    expect(tokenFirmA).not.toBe(tokenFirmB);
  });

  it('Firm A creates an engagement bound strictly to FIRM-ARUNIKA', async () => {
    const createReq = new Request('http://localhost:3000/api/v1/engagements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmA}`,
      },
      body: JSON.stringify({
        clientName: 'PT Mandiri Sukses Arunika',
        clientCode: 'ARUNIKA-01',
        name: 'Audit Laporan Keuangan Arunika FY 2026',
        periodYear: '2026',
        materialityIdr: 200_000_000,
        accountingStandard: 'SAK_INDONESIA',
      }),
    });

    const res = await postEngagement(createReq);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.tenantId).toBe('FIRM-ARUNIKA');
    expect(json.data.name).toContain('Arunika');

    createdEngagementId = json.data.id;
    expect(createdEngagementId).toBeDefined();
  });

  it('Firm A lists engagements and sees its own engagement', async () => {
    const listReq = new Request('http://localhost:3000/api/v1/engagements', {
      method: 'GET',
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmA}`,
      },
    });

    const res = await getEngagements(listReq);
    expect(res.status).toBe(200);
    const json = await res.json();
    const found = json.data.find((e: any) => e.id === createdEngagementId);
    expect(found).toBeDefined();
    expect(found.tenantId).toBe('FIRM-ARUNIKA');
  });

  it('Firm B lists engagements and CANNOT see Firm A engagement (Cross-Tenant Filtered)', async () => {
    const listReq = new Request('http://localhost:3000/api/v1/engagements', {
      method: 'GET',
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmB}`,
      },
    });

    const res = await getEngagements(listReq);
    expect(res.status).toBe(200);
    const json = await res.json();
    const leak = json.data.find((e: any) => e.id === createdEngagementId);
    expect(leak).toBeUndefined();
  });

  it('Firm B is blocked with 403 Forbidden when attempting direct GET on Firm A engagement', async () => {
    const detailReq = new Request(`http://localhost:3000/api/v1/engagements/${createdEngagementId}`, {
      method: 'GET',
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmB}`,
      },
    });

    const res = await getEngagementDetail(detailReq, {
      params: Promise.resolve({ id: createdEngagementId }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('FORBIDDEN_TENANT_ACCESS');
    expect(json.message).toContain('Pelanggaran Batas Tenant');
  });

  it('Firm B is blocked with 403 Forbidden when attempting PATCH on Firm A engagement', async () => {
    const patchReq = new Request(`http://localhost:3000/api/v1/engagements/${createdEngagementId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmB}`,
      },
      body: JSON.stringify({
        name: 'Hacked Engagement Name By Firm B',
      }),
    });

    const res = await patchEngagementDetail(patchReq, {
      params: Promise.resolve({ id: createdEngagementId }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('FORBIDDEN_TENANT_ACCESS');
  });

  it('Firm B is blocked with 403 Forbidden when attempting to upload files to Firm A engagement', async () => {
    const uploadReq = new Request(`http://localhost:3000/api/v1/engagements/${createdEngagementId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmB}`,
      },
      body: JSON.stringify({
        fileName: 'malicious_tb.xlsx',
        accounts: [],
      }),
    });

    const res = await uploadFiles(uploadReq as any, {
      params: Promise.resolve({ id: createdEngagementId }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('FORBIDDEN_TENANT_ACCESS');
  });

  it('Rejects file upload with 400 Bad Request when client reports a forged checksum', async () => {
    const fakeChecksum = '0000000000000000000000000000000000000000000000000000000000000000';
    const rawPayload = JSON.stringify([
      { accountCode: '1-1001', accountName: 'Kas Bank', debitIdr: 1000000, creditIdr: 0, balanceIdr: 1000000 },
    ]);

    const uploadReq = new Request(`http://localhost:3000/api/v1/engagements/${createdEngagementId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmA}`,
      },
      body: JSON.stringify({
        fileName: 'tampered_tb.xlsx',
        sha256Checksum: fakeChecksum, // intentional spoofed checksum
        accounts: [
          { accountCode: '1-1001', accountName: 'Kas Bank', debitIdr: 1000000, creditIdr: 0, balanceIdr: 1000000 },
        ],
      }),
    });

    const res = await uploadFiles(uploadReq as any, {
      params: Promise.resolve({ id: createdEngagementId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('CHECKSUM_MISMATCH');
    expect(json.message).toContain('Integritas Berkas Gagal');
    expect(json.serverSha256).toBeDefined();
    expect(json.serverSha256).not.toBe(fakeChecksum);
  });

  it('Firm A successfully uploads Trial Balance with verified server SHA-256', async () => {
    const accounts = [
      { id: 'ACC-1', accountCode: '1-1001', accountName: 'Kas & Setara Kas', debitIdr: 500000000, creditIdr: 0, balanceIdr: 500000000 },
      { id: 'ACC-2', accountCode: '4-1001', accountName: 'Pendapatan Usaha', debitIdr: 0, creditIdr: 500000000, balanceIdr: -500000000 },
    ];
    const buffer = Buffer.from(JSON.stringify(accounts));
    const validHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const uploadReq = new Request(`http://localhost:3000/api/v1/engagements/${createdEngagementId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE_NAME}=${tokenFirmA}`,
      },
      body: JSON.stringify({
        fileName: 'trial_balance_verified.xlsx',
        sha256Checksum: validHash,
        accounts,
      }),
    });

    const res = await uploadFiles(uploadReq as any, {
      params: Promise.resolve({ id: createdEngagementId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.serverSha256).toBe(validHash);
    expect(json.accountsCount).toBe(2);
    expect(json.file.tenantId).toBe('FIRM-ARUNIKA');
  });
});
