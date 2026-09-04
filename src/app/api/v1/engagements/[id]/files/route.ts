import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  saveFileSourceToSupabase,
  fetchFileSourcesFromSupabase,
  saveDatasetAndAccountsToSupabase,
  fetchAccountsFromSupabase,
  saveWorkpaperToSupabase,
} from '@/lib/supabase/service';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';
import { saveStateToDb } from '@/lib/db/sqlite';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: engagementId } = await context.params;

  let files: any[] = [];
  let accounts: any[] = [];

  if (isSupabaseConfigured()) {
    try {
      files = await fetchFileSourcesFromSupabase(engagementId);
      accounts = await fetchAccountsFromSupabase(engagementId);
    } catch (e) {
      console.warn('Supabase files/accounts fetch fallback:', e);
    }
  }

  if (files.length === 0) {
    const state = repo.getState();
    files = state.fileVersions.filter((f) => f.engagementId === engagementId);
    accounts = state.accounts.filter((a: any) => (a as any).engagementId === engagementId || a.datasetVersionId === `DSV-${engagementId}`);
  }

  return NextResponse.json({
    data: {
      files,
      accounts,
    },
    request_id: `req-${Date.now()}`,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await context.params;
    const body = await request.json();
    const {
      fileName,
      fileSize,
      sha256Checksum,
      accounts = [],
      sheetNames = ['Sheet1'],
      storageBucket = 'audit-vault',
    } = body;

    const state = repo.getState();
    const eng = state.engagements.find((e) => e.id === engagementId) || {
      id: engagementId,
      tenantId: 'FIRM-001',
      clientId: 'CLI-001',
      name: `Perikatan ${engagementId}`,
    };

    const fileId = `FS-${Date.now().toString(36).toUpperCase()}`;
    const dsvId = `DSV-${Date.now().toString(36).toUpperCase()}`;
    const storagePath = `engagements/${engagementId}/${fileName}`;

    const totalDebit = accounts.reduce((s: number, a: any) => s + (Number(a.debitIdr) || 0), 0);
    const totalCredit = accounts.reduce((s: number, a: any) => s + (Number(a.creditIdr) || 0), 0);

    // 1. Build automatic SAK mapping decisions
    const decisions = accounts.map((acc: any, idx: number) => {
      let target = 'WP-A.1';
      const nameLower = (acc.accountName || '').toLowerCase();
      const code = acc.accountCode || '';
      if (code.startsWith('10') || code.startsWith('11') || nameLower.includes('kas') || nameLower.includes('bank')) target = 'WP-A.1';
      else if (code.startsWith('12') || nameLower.includes('piutang')) target = 'WP-A.2';
      else if (code.startsWith('13') || nameLower.includes('persediaan') || nameLower.includes('inventory')) target = 'WP-A.4';
      else if (code.startsWith('14') || nameLower.includes('muka') || nameLower.includes('prepaid')) target = 'WP-A.5';
      else if (nameLower.includes('akumulasi')) target = 'WP-B.2';
      else if (code.startsWith('15') || code.startsWith('16') || nameLower.includes('tetap') || nameLower.includes('gedung') || nameLower.includes('mesin') || nameLower.includes('kendaraan')) target = 'WP-B.1';
      else if (code.startsWith('20') || code.startsWith('21') || nameLower.includes('utang usaha') || nameLower.includes('payable')) target = 'WP-C.1';
      else if (code.startsWith('22') || nameLower.includes('pajak') || nameLower.includes('tax')) target = 'WP-C.2';
      else if (code.startsWith('25') || nameLower.includes('bank') || nameLower.includes('pinjaman')) target = 'WP-D.1';
      else if (code.startsWith('30') || nameLower.includes('modal') || nameLower.includes('capital')) target = 'WP-E.1';
      else if (code.startsWith('31') || nameLower.includes('laba') || nameLower.includes('retained')) target = 'WP-E.2';
      else if (code.startsWith('4') || nameLower.includes('pendapatan') || nameLower.includes('penjualan') || nameLower.includes('revenue')) target = 'WP-F.1';
      else if (code.startsWith('5') || nameLower.includes('pokok') || nameLower.includes('hpp') || nameLower.includes('cogs')) target = 'WP-F.2';
      else target = 'WP-F.3';

      return {
        id: `DEC-${idx + 1}`,
        tenantId: eng.tenantId || 'FIRM-001',
        mappingSetId: `MAPSET-${engagementId}`,
        accountRowId: acc.id || `ACC-${idx + 1}`,
        sourceAccountCode: acc.accountCode,
        sourceAccountName: acc.accountName,
        amountIdr: acc.closingBalanceIdr || acc.balanceIdr || 0,
        proposedTarget: target,
        effectiveTarget: target,
        confidenceScore: 96,
        confidenceLevel: 'high' as const,
        rationale: 'Pemetaan Otomatis SAK Standard Pattern',
        status: 'mapped' as const,
        isMaterial: false,
      };
    });

    // 2. Calculate Workpaper
    const wpCalc = calculateWorkpaperVersion({
      tenantId: eng.tenantId || 'FIRM-001',
      engagementId,
      datasetVersionId: dsvId,
      mappingSetId: `MAPSET-${engagementId}`,
      accounts,
      mappingDecisions: decisions,
      template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
    });

    // 3. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await saveFileSourceToSupabase({
          id: fileId,
          firmId: eng.tenantId || 'FIRM-001',
          engagementId,
          originalName: fileName,
          storageBucket: storageBucket as any,
          storagePath,
          fileSize: fileSize || 0,
          sha256Checksum,
          uploadedBy: 'Auditor',
        });

        await saveDatasetAndAccountsToSupabase(
          {
            id: dsvId,
            firmId: eng.tenantId || 'FIRM-001',
            engagementId,
            fileSourceId: fileId,
            rowCount: accounts.length,
            totalDebit,
            totalCredit,
            checksum: sha256Checksum,
          },
          accounts
        );

        await saveWorkpaperToSupabase(wpCalc.workpaperVersion, eng.tenantId || 'FIRM-001');
      } catch (sbErr) {
        console.error('Error saving file & accounts to Supabase:', sbErr);
      }
    }

    // 4. Update memory & SQLite
    const newFv = {
      id: fileId,
      assetId: `FA-${fileId}`,
      tenantId: eng.tenantId || 'FIRM-001',
      engagementId,
      versionNumber: 1,
      originalName: fileName,
      storageKey: storagePath,
      checksumSha256: sha256Checksum,
      mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: fileSize || 0,
      status: 'ready' as const,
      uploadedByUserId: 'USR-SENIOR-01',
      scanStatus: 'clean' as const,
      sheetCount: sheetNames.length,
      sheetNames,
      createdAt: new Date().toISOString(),
    };

    state.fileVersions.unshift(newFv);
    state.accounts = [...accounts.map((a: any) => ({ ...a, engagementId, datasetVersionId: dsvId })), ...state.accounts];
    state.workpaperVersions.unshift(wpCalc.workpaperVersion);
    state.workpaperLines = [...wpCalc.lines, ...state.workpaperLines];

    try {
      saveStateToDb(state);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      file: newFv,
      datasetVersionId: dsvId,
      accountsCount: accounts.length,
      workpaper: wpCalc.workpaperVersion,
      decisionsCount: decisions.length,
      request_id: `req-${Date.now()}`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/engagements/[id]/files:', error);
    return NextResponse.json(
      { code: 'FILE_UPLOAD_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
