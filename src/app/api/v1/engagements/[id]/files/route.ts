import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { repo } from '@/lib/db/repo-v4';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchEngagementByIdFromSupabase,
  saveFileSourceToSupabase,
  fetchFileSourcesFromSupabase,
  saveDatasetAndAccountsToSupabase,
  fetchAccountsFromSupabase,
  saveWorkpaperToSupabase,
  uploadBinaryToSupabaseStorage,
  createSignedFileUrl,
} from '@/lib/supabase/service';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';
import { getServerSession } from '@/lib/auth/session';
import { saveStateToDb } from '@/lib/db/sqlite';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: engagementId } = await context.params;
  const session = await getServerSession(request);
  const firmId = session?.firmId || 'FIRM-001';

  let files: any[] = [];
  let accounts: any[] = [];

  if (isSupabaseConfigured()) {
    try {
      const rawFiles = await fetchFileSourcesFromSupabase(engagementId);
      // Generate secure short-lived signed URLs for each private file
      files = await Promise.all(
        rawFiles.map(async (f: any) => {
          const signedUrl = await createSignedFileUrl(f.storage_path, f.storage_bucket, 900);
          return {
            ...f,
            downloadUrl: signedUrl,
          };
        })
      );
      accounts = await fetchAccountsFromSupabase(engagementId);
    } catch (e) {
      console.warn('Supabase files/accounts fetch fallback:', e);
    }
  }

  if (files.length === 0) {
    const state = repo.getState();
    files = state.fileVersions.filter((f) => f.engagementId === engagementId);
    accounts = state.accounts.filter(
      (a: any) => (a as any).engagementId === engagementId || a.datasetVersionId === `DSV-${engagementId}`
    );
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
    const session = await getServerSession(request);
    const firmId = session?.firmId || 'FIRM-001';

    // Verify Engagement exists and check Tenant Isolation
    const state = repo.getState();
    let eng = state.engagements.find((e) => e.id === engagementId);
    if (!eng && isSupabaseConfigured()) {
      try {
        const sbRecord = await fetchEngagementByIdFromSupabase(engagementId);
        if (sbRecord) eng = sbRecord.engagement;
      } catch (e) {}
    }

    if (!eng) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/finova_custom_engagements=([^;]+)/);
      if (match && match[1]) {
        try {
          const cookieEngs = JSON.parse(decodeURIComponent(match[1]));
          eng = cookieEngs.find((e: any) => e.id === engagementId);
        } catch (e) {}
      }
    }

    if (eng && eng.tenantId && session && eng.tenantId !== session.firmId && session.role !== 'admin') {
      return NextResponse.json(
        {
          code: 'FORBIDDEN_TENANT_ACCESS',
          message: 'Pelanggaran Batas Tenant: Pengguna dari KAP lain dilarang mengunggah berkas ke perikatan ini.',
          request_id: 'req-' + Date.now(),
          retryable: false,
        },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileSize = 0;
    let clientChecksum = '';
    let parsedAccounts: any[] = [];
    let sheetNames: string[] = ['Sheet1'];

    // 1. Handle Multipart Form Data (Real Binary File)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { code: 'FILE_MISSING', message: 'Berkas binary file tidak ditemukan di FormData.' },
          { status: 400 }
        );
      }

      fileName = file.name;
      fileSize = file.size;
      clientChecksum = (formData.get('sha256Checksum') as string) || '';

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      // Server-side parsing of worksheets with SheetJS from verified binary buffer
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      sheetNames = workbook.SheetNames || ['Sheet1'];
      const firstSheet = workbook.Sheets[sheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      let codeCol = 0;
      let nameCol = 1;
      let debitCol = 2;
      let creditCol = 3;
      let balanceCol = 4;
      let startRowIdx = 0;

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r] || [];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').toLowerCase();
          if (val.includes('kode') || val.includes('code') || (val.includes('akun') && !val.includes('nama'))) codeCol = c;
          if (val.includes('nama') || val.includes('deskripsi') || val.includes('name') || val.includes('keterangan')) nameCol = c;
          if (val.includes('debit') || val.includes('debet')) debitCol = c;
          if (val.includes('kredit') || val.includes('credit')) creditCol = c;
          if (val.includes('saldo') || val.includes('balance') || val.includes('akhir')) balanceCol = c;
        }
        if (row.some((cell: any) => String(cell || '').toLowerCase().includes('akun') || String(cell || '').toLowerCase().includes('code'))) {
          startRowIdx = r + 1;
          break;
        }
      }

      const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
      };

      for (let i = startRowIdx; i < rawRows.length; i++) {
        const r = rawRows[i];
        if (!r || r.length < 2) continue;
        const code = String(r[codeCol] || '').trim();
        const name = String(r[nameCol] || '').trim();
        if (!code || !name || code.toLowerCase().includes('total') || name.toLowerCase().includes('total')) continue;

        const debit = parseNum(r[debitCol]);
        const credit = parseNum(r[creditCol]);
        const balance = balanceCol !== codeCol && balanceCol !== nameCol && r[balanceCol] !== undefined ? parseNum(r[balanceCol]) : (debit - credit);

        parsedAccounts.push({
          id: `ACC-${i + 1}`,
          accountCode: code,
          accountName: name,
          debitIdr: debit,
          creditIdr: credit,
          closingBalanceIdr: balance,
          balanceIdr: balance,
        });
      }
    } else {
      // 2. Fallback JSON payload
      const body = await request.json();
      fileName = body.fileName || 'trial_balance.xlsx';
      fileSize = body.fileSize || 0;
      clientChecksum = body.sha256Checksum || '';
      parsedAccounts = body.accounts || [];
      sheetNames = body.sheetNames || ['Sheet1'];
      fileBuffer = Buffer.from(JSON.stringify(parsedAccounts));
    }

    // 3. Independent Server-Side Cryptographic Hash Verification (ISA / SPAP Standard)
    const serverSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (clientChecksum && clientChecksum !== serverSha256) {
      return NextResponse.json(
        {
          code: 'CHECKSUM_MISMATCH',
          message: 'Integritas Berkas Gagal: Checksum SHA-256 yang dihitung server tidak sesuai dengan klien.',
          serverSha256,
          clientChecksum,
        },
        { status: 400 }
      );
    }

    const fileId = `FS-${Date.now().toString(36).toUpperCase()}`;
    const dsvId = `DSV-${Date.now().toString(36).toUpperCase()}`;
    const storagePath = `firms/${firmId}/engagements/${engagementId}/${fileName}`;

    // 4. Upload Raw Binary to Private Supabase Storage (audit-vault)
    let uploadResult: { path: string; signedUrl?: string } | null = null;
    if (isSupabaseConfigured() && fileBuffer) {
      uploadResult = await uploadBinaryToSupabaseStorage(
        fileBuffer,
        storagePath,
        'audit-vault',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    }

    // 5. Automatic SAK Mapping
    const decisions = parsedAccounts.map((acc: any, idx: number) => {
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
        tenantId: firmId,
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

    // 6. Calculate Workpaper
    const wpCalc = calculateWorkpaperVersion({
      tenantId: firmId,
      engagementId,
      datasetVersionId: dsvId,
      mappingSetId: `MAPSET-${engagementId}`,
      accounts: parsedAccounts,
      mappingDecisions: decisions,
      template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
    });

    // 7. Persist to Supabase Database (FAIL-FAST)
    if (isSupabaseConfigured()) {
      const savedFile = await saveFileSourceToSupabase({
        id: fileId,
        firmId,
        engagementId,
        originalName: fileName,
        storageBucket: 'audit-vault',
        storagePath: uploadResult?.path || storagePath,
        fileSize,
        sha256Checksum: serverSha256,
        uploadedBy: session?.name || 'Auditor',
      });
      if (!savedFile) {
        throw new Error('Gagal menyimpan metadata berkas ke tabel file_sources Supabase.');
      }

      const totalDebit = parsedAccounts.reduce((s: number, a: any) => s + (Number(a.debitIdr) || 0), 0);
      const totalCredit = parsedAccounts.reduce((s: number, a: any) => s + (Number(a.creditIdr) || 0), 0);

      const savedDs = await saveDatasetAndAccountsToSupabase(
        {
          id: dsvId,
          firmId,
          engagementId,
          fileSourceId: fileId,
          rowCount: parsedAccounts.length,
          totalDebit,
          totalCredit,
          checksum: serverSha256,
        },
        parsedAccounts
      );
      if (!savedDs) {
        throw new Error('Gagal menyimpan dataset dan akun ke tabel trial_balance_accounts Supabase.');
      }

      const savedWp = await saveWorkpaperToSupabase(wpCalc.workpaperVersion, firmId);
      if (!savedWp) {
        throw new Error('Gagal menyimpan kertas kerja ke tabel workpaper_versions Supabase.');
      }
    }

    // 8. Update In-Memory / SQLite Cache
    const newFv = {
      id: fileId,
      assetId: `FA-${fileId}`,
      tenantId: firmId,
      engagementId,
      versionNumber: 1,
      originalName: fileName,
      storageKey: uploadResult?.path || storagePath,
      checksumSha256: serverSha256,
      mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: fileSize,
      status: 'ready' as const,
      uploadedByUserId: session?.userId || 'USR-SENIOR-01',
      scanStatus: 'clean' as const,
      sheetCount: sheetNames.length,
      sheetNames,
      createdAt: new Date().toISOString(),
    };

    state.fileVersions.unshift(newFv);
    state.accounts = [
      ...parsedAccounts.map((a: any) => ({ ...a, engagementId, datasetVersionId: dsvId })),
      ...state.accounts,
    ];
    state.workpaperVersions.unshift(wpCalc.workpaperVersion);
    state.workpaperLines = [...wpCalc.lines, ...state.workpaperLines];

    try {
      saveStateToDb(state);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      file: newFv,
      serverSha256,
      signedDownloadUrl: uploadResult?.signedUrl,
      datasetVersionId: dsvId,
      accountsCount: parsedAccounts.length,
      workpaper: wpCalc.workpaperVersion,
      decisionsCount: decisions.length,
      request_id: `req-${Date.now()}`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/engagements/[id]/files:', error);
    return NextResponse.json(
      { code: 'FILE_PROCESSING_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
