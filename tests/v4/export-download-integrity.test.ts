import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { POST as generateExport } from '@/app/api/v1/exports/route';
import { GET as downloadExport } from '@/app/api/v1/exports/[id]/download/route';
import { repo } from '@/lib/db/repo-v4';
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth/session';

describe('custom export download integrity', () => {
  it('returns the canonical workbook and ignores browser-supplied audit figures', async () => {
    const state = repo.getState();
    const token = await createSessionToken({
      userId: 'USR-PARTNER-01', firmId: 'TENANT-001', email: 'partner@example.test',
      role: 'partner', name: 'Authenticated Partner', title: 'Engagement Partner',
    });

    const response = await generateExport(
      new Request('http://localhost/api/v1/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: `${AUTH_COOKIE_NAME}=${token}` },
        body: JSON.stringify({
          engagementId: 'ENG-2026-01',
          userRole: 'partner',
          operatorName: 'Browser Impostor',
          clientCode: 'TAMPERED',
          sourceChecksum: '0'.repeat(64),
          customWp: { totals: { totalAssetsIdr: 1 } },
          customLines: [{ lineId: 'FAKE-LINE', currentPeriodIdr: 1 }],
        }),
      }),
    );

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.data.engagementId).toBe('ENG-2026-01');
    expect(body.data.filename).not.toContain('TAMPERED');
    expect(body.contentBase64).toMatch(/^[A-Za-z0-9+/]+=*$/);

    const workbookBuffer = Buffer.from(body.contentBase64, 'base64');
    const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });
    const leadRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Lead Schedule'], { header: 1 });
    const manifestRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets.Manifest, { header: 1 });
    const flattened = [...leadRows, ...manifestRows].flat().join(' | ');

    expect(flattened).toContain('ENG-2026-01');
    expect(flattened).toContain(state.fileVersions[0].checksumSha256);
    expect(flattened).toContain('Authenticated Partner');
    expect(flattened).not.toContain('Browser Impostor');
    expect(flattened).not.toContain('FAKE-LINE');
    expect(flattened).not.toContain('TAMPERED');
  });

  it('returns 404 instead of silently downloading another engagement artifact', async () => {
    const response = await downloadExport(
      new Request('http://localhost/api/v1/exports/EXP-DOES-NOT-EXIST/download'),
      { params: Promise.resolve({ id: 'EXP-DOES-NOT-EXIST' }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      code: 'EXPORT_NOT_FOUND',
      message: 'Berkas ekspor tidak ditemukan.',
    });
  });
});
