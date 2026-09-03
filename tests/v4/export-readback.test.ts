import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { repo } from '@/lib/db/repo-v4';
import { generateWorkpaperXlsx } from '@/lib/exporter/xlsx-builder';

describe('R07 / PRD §45.3: Safe XLSX Export & Post-Generation Read-Back Verification', () => {
  it('generates valid XLSX with Lead Schedule and Manifest sheets, passing read-back', () => {
    const user = repo.getState().users.find((u) => u.role === 'partner')!;
    const wp = repo.getState().workpaperVersions[0];

    // Ensure non-stale for export
    wp.isStale = false;

    const result = generateWorkpaperXlsx({
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      clientCode: 'NSM',
      periodYear: '2026',
      workpaperVersion: wp,
      lines: repo.getState().workpaperLines,
      checks: repo.getState().validationChecks,
      userId: user.id,
      operatorName: user.name,
      sourceFileVersionChecksum: '9f83a48e71c9b204683bc48b3017fa489110756e4c7717bc2d043444fb9a7b92',
    });

    expect(result.readbackSuccess).toBe(true);
    expect(result.artifact.status).toBe('complete');
    expect(result.artifact.filename).toContain('NSM_FY2026');
    expect(result.artifact.checksumSha256).toHaveLength(64);

    // Verify read-back content in test
    const parsed = XLSX.read(result.buffer, { type: 'buffer' });
    expect(parsed.SheetNames).toContain('Lead Schedule');
    expect(parsed.SheetNames).toContain('Manifest');
  });

  it('blocks export when workpaper is stale', () => {
    const user = repo.getState().users.find((u) => u.role === 'partner')!;
    const wp = { ...repo.getState().workpaperVersions[0], isStale: true };

    expect(() => {
      generateWorkpaperXlsx({
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        clientCode: 'NSM',
        periodYear: '2026',
        workpaperVersion: wp,
        lines: repo.getState().workpaperLines,
        checks: repo.getState().validationChecks,
        userId: user.id,
        operatorName: user.name,
        sourceFileVersionChecksum: '9f83a48e',
      });
    }).toThrow('Export diblokir: Kertas kerja dalam status kadaluarsa');
  });
});
