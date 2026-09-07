import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as uploadFile } from '@/app/api/v1/engagements/[id]/files/route';
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth/session';

const URL = 'http://localhost/api/v1/engagements/ENG-2026-01/files';
const CONTEXT = { params: Promise.resolve({ id: 'ENG-2026-01' }) };
const VALID_ACCOUNTS = [
  { accountCode: '1101', accountName: 'Kas', debitIdr: 1_000, creditIdr: 0, balanceIdr: 1_000 },
  { accountCode: '3101', accountName: 'Modal', debitIdr: 0, creditIdr: 1_000, balanceIdr: -1_000 },
];

async function request(body: Record<string, unknown>, authenticated = true) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authenticated) {
    const token = await createSessionToken({
      userId: 'USR-SENIOR-UPLOAD', firmId: 'TENANT-001', email: 'senior@example.test',
      role: 'senior', name: 'Senior Auditor', title: 'Senior In-Charge',
    });
    headers.cookie = `${AUTH_COOKIE_NAME}=${token}`;
  }
  return new NextRequest(URL, { method: 'POST', headers, body: JSON.stringify(body) });
}

describe('upload security and resource boundaries', () => {
  it('rejects direct unauthenticated handler calls', async () => {
    const response = await uploadFile(await request({ fileName: 'tb.csv', accounts: VALID_ACCOUNTS }, false), CONTEXT);
    expect(response.status).toBe(401);
  });

  it('rejects files larger than the advertised 100 MB limit before parsing', async () => {
    const response = await uploadFile(await request({
      fileName: 'tb.csv', fileSize: (100 * 1024 * 1024) + 1, accounts: VALID_ACCOUNTS,
    }), CONTEXT);
    expect(response.status).toBe(413);
    expect((await response.json()).code).toBe('FILE_TOO_LARGE');
  });

  it('rejects unsupported executable file names', async () => {
    const response = await uploadFile(await request({ fileName: 'malware.exe', accounts: VALID_ACCOUNTS }), CONTEXT);
    expect(response.status).toBe(415);
    expect((await response.json()).code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('rejects an empty trial balance instead of producing an empty workpaper', async () => {
    const response = await uploadFile(await request({ fileName: 'empty.csv', accounts: [] }), CONTEXT);
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('NO_ACCOUNT_ROWS');
  });
});
