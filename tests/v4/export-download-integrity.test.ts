import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { POST as generateExport } from '@/app/api/v1/exports/route';
import { GET as downloadExport } from '@/app/api/v1/exports/[id]/download/route';
import { repo } from '@/lib/db/repo-v4';

describe('custom export download integrity', () => {
  it('returns the exact generated workbook payload for a custom engagement', async () => {
    const state = repo.getState();
    const baseWp = state.workpaperVersions[0];
    const customLines = state.workpaperLines.map((line) => ({ ...line }));

    customLines.find((line) => line.lineId === 'WP-A.1')!.currentPeriodIdr = 415_000_000;
    customLines.find((line) => line.lineId === 'WP-A.2')!.currentPeriodIdr = 275_000_000;

    const response = await generateExport(
      new Request('http://localhost/api/v1/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId: 'ENG-MANDIRI-2026',
          userRole: 'partner',
          operatorName: 'Dimas Cakrawala, CPA, CA',
          clientCode: 'CAKRAWALA',
          sourceChecksum: '568c968de29717f115b3d4dfb716e0b7cea3dd60ec90fd091997d679c75a1e91',
          customWp: {
            ...baseWp,
            id: 'WPV-CAKRAWALA-TEST',
            engagementId: 'ENG-MANDIRI-2026',
            isStale: false,
            totals: {
              totalAssetsIdr: 1_805_000_000,
              totalLiabilitiesIdr: 775_000_000,
              totalEquityIdr: 1_030_000_000,
              netIncomeIdr: 210_000_000,
              balanceSheetDiffIdr: 0,
            },
          },
          customLines,
        }),
      }),
    );

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.data.engagementId).toBe('ENG-MANDIRI-2026');
    expect(body.data.filename).toContain('CAKRAWALA_FY2026');
    expect(body.contentBase64).toMatch(/^[A-Za-z0-9+/]+=*$/);

    const workbookBuffer = Buffer.from(body.contentBase64, 'base64');
    const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });
    const leadRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Lead Schedule'], { header: 1 });
    const manifestRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets.Manifest, { header: 1 });
    const flattened = [...leadRows, ...manifestRows].flat().join(' | ');

    expect(flattened).toContain('CAKRAWALA');
    expect(flattened).toContain('ENG-MANDIRI-2026');
    expect(flattened).toContain('568c968de29717f115b3d4dfb716e0b7cea3dd60ec90fd091997d679c75a1e91');
    expect(flattened).toContain('1805000000');
    expect(flattened).toContain('Dimas Cakrawala, CPA, CA');
    expect(flattened).not.toContain('Nusantara Sukses Makmur');
    expect(flattened).not.toContain('ENG-2026-01');
    expect(flattened).not.toContain('Haidar');
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
