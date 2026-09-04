import { describe, it, expect } from 'vitest';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';
import { generateWorkpaperXlsx } from '@/lib/exporter/xlsx-builder';
import { AccountRow, MappingDecision, WorkpaperVersion } from '@/types/domain-v4';
import { POST as postEngagement } from '@/app/api/v1/engagements/route';
import { GET as getEngagementDetail } from '@/app/api/v1/engagements/[id]/route';

describe('Cakrawala End-to-End Audit Trail (ChatGPT Scenario)', () => {
  it('should successfully process PT Cakrawala Konsultan Indonesia from creation to workpaper & export', async () => {
    // 1. Create Engagement
    const createReq = new Request('http://localhost:3000/api/v1/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'PT Cakrawala Konsultan Indonesia',
        clientCode: 'CKI',
        industry: 'Konsultasi & Jasa Profesional',
        taxIdNpwp: '03.888.777.6-015.000',
        periodYear: '2026',
        materialityIdr: 150_000_000,
        accountingStandard: 'SAK_INDONESIA',
        name: 'Audit Kertas Kerja Tahunan CKI FY 2026',
      }),
    });

    const createRes = await postEngagement(createReq);
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json();
    const engagementId = createJson.data.id;
    expect(createJson.client.legalName).toBe('PT Cakrawala Konsultan Indonesia');
    expect(createJson.client.code).toBe('CKI');
    expect(createJson.data.materialityIdr).toBe(150_000_000);

    // 2. Simulate 16 Accounts Trial Balance from CSV/Excel
    // Total Debit = Credit = Rp 2.295.000.000
    const rawAccounts = [
      { code: '1010-00', name: 'Kas Kecil Kantor', debit: 25_000_000, credit: 0, balance: 25_000_000, target: 'WP-A.1' },
      { code: '1020-00', name: 'Bank Mandiri Giro', debit: 350_000_000, credit: 0, balance: 350_000_000, target: 'WP-A.1' },
      { code: '1030-00', name: 'Bank BCA Operasional', debit: 175_000_000, credit: 0, balance: 175_000_000, target: 'WP-A.1' },
      { code: '1110-00', name: 'Piutang Jasa Konsultasi', debit: 450_000_000, credit: 0, balance: 450_000_000, target: 'WP-A.2' },
      { code: '1120-00', name: 'Piutang Retensi Klien', debit: 85_000_000, credit: 0, balance: 85_000_000, target: 'WP-A.2' },
      { code: '1180-00', name: 'Uang Muka Sewa Gedung', debit: 60_000_000, credit: 0, balance: 60_000_000, target: 'WP-A.5' },
      { code: '1210-00', name: 'Peralatan & Komputer IT', debit: 320_000_000, credit: 0, balance: 320_000_000, target: 'WP-B.1' },
      { code: '1220-00', name: 'Kendaraan Operasional', debit: 280_000_000, credit: 0, balance: 280_000_000, target: 'WP-B.1' },
      { code: '1290-00', name: 'Akumulasi Penyusutan Aset', debit: 0, credit: 95_000_000, balance: -95_000_000, target: 'WP-B.2' },
      { code: '2010-00', name: 'Utang Usaha Sub-konsultan', debit: 0, credit: 160_000_000, balance: -160_000_000, target: 'WP-C.1' },
      { code: '2020-00', name: 'Utang Pajak PPh 21 & PPh 23', debit: 0, credit: 45_000_000, balance: -45_000_000, target: 'WP-C.2' },
      { code: '2030-00', name: 'Utang Gaji & Bonus Karyawan', debit: 0, credit: 95_000_000, balance: -95_000_000, target: 'WP-C.3' },
      { code: '3010-00', name: 'Modal Disetor Pendiri', debit: 0, credit: 800_000_000, balance: -800_000_000, target: 'WP-E.1' },
      { code: '3020-00', name: 'Saldo Laba Ditahan', debit: 0, credit: 450_000_000, balance: -450_000_000, target: 'WP-E.2' },
      { code: '4010-00', name: 'Pendapatan Jasa Konsultasi Manajemen', debit: 0, credit: 650_000_000, balance: -650_000_000, target: 'WP-F.1' },
      { code: '5010-00', name: 'Beban Gaji Tenaga Ahli Konsultan', debit: 550_000_000, credit: 0, balance: 550_000_000, target: 'WP-F.2' },
    ];

    expect(rawAccounts.length).toBe(16);

    const totalDebit = rawAccounts.reduce((s, a) => s + a.debit, 0);
    const totalCredit = rawAccounts.reduce((s, a) => s + a.credit, 0);
    expect(totalDebit).toBe(2_295_000_000);
    expect(totalCredit).toBe(2_295_000_000);
    expect(totalDebit - totalCredit).toBe(0);

    // 3. Build AccountRow with sourceLocator (Testing Gemini's bugfix)
    const accounts: AccountRow[] = rawAccounts.map((a, idx) => ({
      id: `ACC-CKI-${idx + 1}`,
      datasetVersionId: `DSV-${engagementId}`,
      accountCode: a.code,
      accountName: a.name,
      openingBalanceIdr: 0,
      debitIdr: a.debit,
      creditIdr: a.credit,
      closingBalanceIdr: a.balance,
      periodEnd: '2026-12-31',
      currency: 'IDR',
      sourceLocator: {
        fileVersionId: `FV-001`,
        fileName: 'TB_PT_Cakrawala_Konsultan_Indonesia_FY2026.csv',
        checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        sheetName: 'Sheet1',
        rowNumber: idx + 2,
        cellRange: `A${idx + 2}:F${idx + 2}`,
      },
    }));

    // 4. Build Mapping Decisions
    const mappingDecisions: MappingDecision[] = accounts.map((acc, idx) => ({
      id: `DEC-CKI-${idx + 1}`,
      mappingSetId: `MAPSET-${engagementId}`,
      tenantId: 'TENANT-001',
      accountRowId: acc.id,
      sourceAccountCode: acc.accountCode,
      sourceAccountName: acc.accountName,
      amountIdr: acc.closingBalanceIdr,
      proposedTarget: rawAccounts[idx].target,
      effectiveTarget: rawAccounts[idx].target,
      confidenceScore: 96,
      confidenceLevel: 'high',
      rationale: 'Pemetaan Otomatis SAK Standard Pattern',
      status: 'mapped',
      isMaterial: Math.abs(acc.closingBalanceIdr) >= 150_000_000,
    }));

    // 5. Run Calculation Engine (Must not throw reading fileVersionId)
    const wpResult = calculateWorkpaperVersion({
      tenantId: 'TENANT-001',
      engagementId,
      datasetVersionId: `DSV-${engagementId}`,
      mappingSetId: `MAPSET-${engagementId}`,
      accounts,
      mappingDecisions,
    });

    expect(wpResult.workpaperVersion).toBeDefined();
    expect(wpResult.lines.length).toBeGreaterThan(0);
    expect(wpResult.evidenceLinks.length).toBeGreaterThan(0);

    // Evidence link must point to CKI CSV, not hardcoded NSM!
    const firstEv = wpResult.evidenceLinks[0];
    expect(firstEv.sourceFileVersionId).toBe('FV-001');
    expect(firstEv.sourceFileName).toBe('TB_PT_Cakrawala_Konsultan_Indonesia_FY2026.csv');

    // 6. Test XLSX Export Generation with CKI Metadata
    const exportResult = generateWorkpaperXlsx({
      tenantId: 'TENANT-001',
      engagementId,
      clientCode: 'CKI',
      periodYear: '2026',
      workpaperVersion: wpResult.workpaperVersion,
      lines: wpResult.lines,
      checks: wpResult.checks,
      userId: 'USR-PARTNER-01',
      operatorName: 'Haidar, CPA',
      sourceFileVersionChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    expect(exportResult.artifact).toBeDefined();
    expect(exportResult.artifact.filename).toContain('CKI_FY2026_');
    expect(exportResult.readbackSuccess).toBe(true);
    expect(exportResult.buffer.length).toBeGreaterThan(5000);
  });
});
