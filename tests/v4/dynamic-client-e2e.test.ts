import { describe, it, expect } from 'vitest';
import { POST as createEngagement } from '@/app/api/v1/engagements/route';
import { GET as getEngagementFiles, POST as uploadFiles } from '@/app/api/v1/engagements/[id]/files/route';
import { POST as generateExport } from '@/app/api/v1/exports/route';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import { NextRequest } from 'next/server';

describe('End-to-End Dynamic Multi-Tenant Client Workflow (Zero Hardcoding)', () => {
  it('should run a complete audit engagement workflow for any custom PT and KAP', async () => {
    // 1. Create a brand new engagement for PT Langit Biru Sistem Nusantara
    const createReq = new NextRequest('http://localhost:3000/api/v1/engagements', {
      method: 'POST',
      body: JSON.stringify({
        clientName: 'PT Langit Biru Sistem Nusantara',
        clientCode: 'LBSN',
        name: 'Audit Laporan Keuangan Tahunan PT LBSN FY 2026',
        industry: 'Teknologi & Sistem Informasi',
        periodYear: '2026',
        materialityIdr: 180_000_000,
        userRole: 'partner',
      }),
    });

    const createRes = await createEngagement(createReq);
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json();
    expect(createJson.success).toBe(true);

    const engagementId = createJson.data.id;
    expect(engagementId).toMatch(/^ENG-2026-\d+/);
    expect(createJson.client.legalName).toBe('PT Langit Biru Sistem Nusantara');
    expect(createJson.client.code).toBe('LBSN');

    // 2. Fail-Closed Check: Exporting BEFORE importing files must be strictly blocked (HTTP 422)
    const earlyExportReq = new NextRequest('http://localhost:3000/api/v1/exports', {
      method: 'POST',
      body: JSON.stringify({
        engagementId,
        userRole: 'partner',
        operatorName: 'Budi Santoso, CPA',
        clientCode: 'LBSN',
      }),
    });

    const earlyExportRes = await generateExport(earlyExportReq);
    expect(earlyExportRes.status).toBe(422);
    const earlyExportJson = await earlyExportRes.json();
    expect(earlyExportJson.code).toBe('EXPORT_BLOCKED');

    // 3. Upload a 16-account Trial Balance CSV/JSON
    const sample16Accounts = [
      { accountCode: '1001', accountName: 'Kas Kecil Kantor', debitIdr: 25000000, creditIdr: 0, balanceIdr: 25000000 },
      { accountCode: '1002', accountName: 'Bank BCA Operasional', debitIdr: 450000000, creditIdr: 0, balanceIdr: 450000000 },
      { accountCode: '1101', accountName: 'Piutang Usaha Proyek', debitIdr: 320000000, creditIdr: 0, balanceIdr: 320000000 },
      { accountCode: '1201', accountName: 'Persediaan Perangkat Keras', debitIdr: 180000000, creditIdr: 0, balanceIdr: 180000000 },
      { accountCode: '1301', accountName: 'Sewa Kantor Dibayar Dimuka', debitIdr: 60000000, creditIdr: 0, balanceIdr: 60000000 },
      { accountCode: '1501', accountName: 'Peralatan Server & Komputer', debitIdr: 240000000, creditIdr: 0, balanceIdr: 240000000 },
      { accountCode: '1502', accountName: 'Akumulasi Penyusutan Server', debitIdr: 0, creditIdr: 48000000, balanceIdr: -48000000 },
      { accountCode: '2001', accountName: 'Utang Usaha Subkontraktor', debitIdr: 0, creditIdr: 190000000, balanceIdr: -190000000 },
      { accountCode: '2101', accountName: 'Utang PPh 21 & PPh 23', debitIdr: 0, creditIdr: 35000000, balanceIdr: -35000000 },
      { accountCode: '2201', accountName: 'Utang Gaji Karyawan', debitIdr: 0, creditIdr: 85000000, balanceIdr: -85000000 },
      { accountCode: '2501', accountName: 'Pinjaman Modal Kerja Bank', debitIdr: 0, creditIdr: 300000000, balanceIdr: -300000000 },
      { accountCode: '3001', accountName: 'Modal Saham Disetor', debitIdr: 0, creditIdr: 400000000, balanceIdr: -400000000 },
      { accountCode: '3101', accountName: 'Saldo Laba Ditahan', debitIdr: 0, creditIdr: 117000000, balanceIdr: -117000000 },
      { accountCode: '4001', accountName: 'Pendapatan Jasa Pengembangan Software', debitIdr: 0, creditIdr: 850000000, balanceIdr: -850000000 },
      { accountCode: '5001', accountName: 'Beban Pokok Proyek (HPP)', debitIdr: 450000000, creditIdr: 0, balanceIdr: 450000000 },
      { accountCode: '6001', accountName: 'Beban Operasional & Administrasi', debitIdr: 300000000, creditIdr: 0, balanceIdr: 300000000 },
    ];

    const uploadReq = new NextRequest(`http://localhost:3000/api/v1/engagements/${engagementId}/files`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'TB_PT_LBSN_FY2026.xlsx',
        fileSize: 18450,
        accounts: sample16Accounts,
      }),
    });

    const uploadRes = await uploadFiles(uploadReq, { params: Promise.resolve({ id: engagementId }) });
    expect(uploadRes.status).toBe(200);
    const uploadJson = await uploadRes.json();
    expect(uploadJson.success).toBe(true);
    expect(uploadJson.accountsCount).toBe(16);
    expect(uploadJson.decisionsCount).toBe(16);

    // 4. Test Single Source of Truth API (GET /files)
    const getReq = new NextRequest(`http://localhost:3000/api/v1/engagements/${engagementId}/files`);
    const getRes = await getEngagementFiles(getReq, { params: Promise.resolve({ id: engagementId }) });
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();

    expect(getJson.data.files).toBeDefined();
    expect(getJson.data.files[0].originalName).toBe('TB_PT_LBSN_FY2026.xlsx');
    expect(getJson.data.accounts).toHaveLength(16);
    expect(getJson.data.decisions).toHaveLength(16);
    expect(getJson.data.lines.length).toBeGreaterThan(0);
    expect(getJson.data.workpaper).toBeDefined();

    // Every screen consumes this endpoint after hydration. It must be the same
    // canonical calculation as the server-rendered overview and workpaper.
    const canonical = await getEngagementServerData(engagementId);
    expect(getJson.data.workpaper?.totals).toEqual(canonical.workpaper?.totals);
    expect(getJson.data.lines).toEqual(canonical.lines);
    expect(getJson.data.checks).toEqual(canonical.checks);

    // Verify SAK mapping rationale is dynamic (no "Akun penampungan kurs" nonsense)
    const kasDecision = getJson.data.decisions.find((d: any) => d.sourceAccountCode === '1001');
    expect(kasDecision.effectiveTarget).toBe('WP-A.1');
    expect(kasDecision.rationale).not.toContain('kurs sementara');

    // 5. Generate Official XLSX Export for PT LBSN
    const exportReq = new NextRequest('http://localhost:3000/api/v1/exports', {
      method: 'POST',
      body: JSON.stringify({
        engagementId,
        userRole: 'partner',
        operatorName: 'Dr. Hendra Pratama, CPA',
        clientCode: 'LBSN',
        customWp: getJson.data.workpaper,
        customLines: getJson.data.lines,
        sourceChecksum: getJson.data.files[0].checksumSha256,
      }),
    });

    const exportRes = await generateExport(exportReq);
    expect(exportRes.status).toBe(202);
    const exportJson = await exportRes.json();

    expect(exportJson.data).toBeDefined();
    // Filename must start with LBSN_FY2026 and not NUSANTARA or MANDIRI
    expect(exportJson.data.filename).toMatch(/^LBSN_FY2026_/);
    expect(exportJson.data.filename).not.toContain('NUSANTARA');
    expect(exportJson.data.filename).not.toContain('MANDIRI');
    expect(exportJson.data.readbackVerified).toBe(true);
    expect(exportJson.contentBase64).toBeDefined();
  });
});
