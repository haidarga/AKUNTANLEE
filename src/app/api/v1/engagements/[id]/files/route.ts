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
import { getEngagementServerData } from '@/lib/server/engagement-data';
import { inferLeadScheduleTarget } from '@/lib/workpaper/infer-target';
import {
  assertTenantAccess,
  authorizationErrorResponse,
  requireSessionActor,
} from '@/lib/auth/authorization';

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_SHEETS = 25;
const MAX_ACCOUNT_ROWS = 100_000;
const SUPPORTED_FILE_EXTENSION = /\.(csv|xlsx)$/i;

class UploadInputError extends Error {
  constructor(
    public readonly status: 400 | 413 | 415,
    public readonly code: 'FILE_TOO_LARGE' | 'UNSUPPORTED_FILE_TYPE' | 'NO_ACCOUNT_ROWS' | 'UPLOAD_LIMIT_EXCEEDED' | 'INVALID_ACCOUNT_ROW',
    message: string,
  ) {
    super(message);
  }
}

function validateFileBoundary(fileName: string, fileSize: number) {
  if (!SUPPORTED_FILE_EXTENSION.test(fileName)) {
    throw new UploadInputError(415, 'UNSUPPORTED_FILE_TYPE', 'Hanya berkas .csv dan .xlsx yang didukung.');
  }
  if (!Number.isFinite(fileSize) || fileSize < 0 || fileSize > MAX_FILE_BYTES) {
    throw new UploadInputError(413, 'FILE_TOO_LARGE', 'Ukuran berkas melebihi batas 100 MB.');
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: engagementId } = await context.params;
  const session = await getServerSession(request);
  void session;

  // This endpoint hydrates the client-side dashboard after first paint. Return
  // the exact same calculation used by server-rendered pages so a navigation
  // cannot silently replace valid workpaper figures with a second calculation.
  const canonical = await getEngagementServerData(engagementId);
  return NextResponse.json({
    data: canonical,
    ...canonical,
    request_id: `req-${Date.now()}`,
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });

  /* c8 ignore start -- retained below temporarily for the upload route's
     historical fallback implementation; GET returns via the canonical path. */
  const firmId = 'FIRM-001';

  let files: any[] = [];
  let accounts: any[] = [];

  if (isSupabaseConfigured()) {
    try {
      const rawFiles = await fetchFileSourcesFromSupabase(engagementId);
      // Map to camelCase FileVersion objects
      files = await Promise.all(
        rawFiles.map(async (f: any) => {
          let signedUrl = '';
          try {
            signedUrl = (await createSignedFileUrl(f.storage_path, f.storage_bucket || 'audit-vault', 900)) || '';
          } catch (urlErr) {}
          return {
            id: f.id,
            assetId: `FA-${f.id}`,
            tenantId: f.firm_id || firmId,
            engagementId: f.engagement_id,
            versionNumber: 1,
            originalName: f.original_name || "trial_balance.xlsx",
            fileName: f.original_name || "trial_balance.xlsx",
            storageKey: f.storage_path,
            checksumSha256: f.sha256_checksum || "",
            mediaType: f.mime_type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            sizeBytes: Number(f.file_size) || 0,
            status: 'ready' as const,
            uploadedByUserId: f.uploaded_by || 'Auditor',
            scanStatus: ((f.scan_status as any) || "clean"),
            sheetCount: 1,
            sheetNames: ['Sheet1'],
            createdAt: f.created_at,
            downloadUrl: signedUrl,
          };
        })
      );
      accounts = await fetchAccountsFromSupabase(engagementId);
    } catch (e) {
      console.warn('Supabase files/accounts fetch fallback:', e);
    }
  }

  // Fallback to in-memory/SQLite state if Supabase yielded nothing (e.g. offline, local dev, or unit test)
  if (files.length === 0) {
    const state = repo.getState();
    files = state.fileVersions.filter((f) => f.engagementId === engagementId);
  }
  if (accounts.length === 0) {
    const state = repo.getState();
    accounts = state.accounts.filter(
      (a: any) => (a as any).engagementId === engagementId || a.datasetVersionId === `DSV-${engagementId}`
    );
  }

  let decisions: any[] = [];
  let workpaper: any = null;
  let lines: any[] = [];
  let checks: any[] = [];

  if (accounts.length > 0) {
    decisions = accounts.map((acc: any, idx: number) => {
      const code = String(acc.accountCode || '');
      const target = inferLeadScheduleTarget(code, acc.accountName);

      const amount = Number(acc.closingBalanceIdr) || Number(acc.balanceIdr) || (Number(acc.debitIdr || 0) - Number(acc.creditIdr || 0)) || 0;

      return {
        id: `DEC-${idx + 1}`,
        tenantId: firmId,
        mappingSetId: `MAPSET-${engagementId}`,
        accountRowId: acc.id || `ACC-${idx + 1}`,
        sourceAccountCode: acc.accountCode,
        sourceAccountName: acc.accountName,
        amountIdr: amount,
        proposedTarget: target,
        effectiveTarget: target,
        confidenceScore: 96,
        confidenceLevel: 'high' as const,
        rationale: 'Pemetaan Otomatis SAK Standard Pattern',
        status: 'mapped' as const,
        isMaterial: false,
      };
    });

    try {
      const wpCalc = calculateWorkpaperVersion({
        tenantId: firmId,
        engagementId,
        datasetVersionId: `DSV-${engagementId}`,
        mappingSetId: `MAPSET-${engagementId}`,
        accounts: accounts,
        mappingDecisions: decisions,
        template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
      });
      workpaper = wpCalc.workpaperVersion;
      lines = wpCalc.lines;
      checks = wpCalc.checks || [];
    } catch (wpErr) {
      console.error('Error calculating workpaper version in GET /files:', wpErr);
    }
  }

  return NextResponse.json({
    data: {
      files,
      accounts,
      decisions,
      workpaper,
      lines,
      checks,
    },
    files,
    accounts,
    decisions,
    workpaper,
    lines,
    checks,
    request_id: `req-${Date.now()}`,
  });
  /* c8 ignore stop */
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engagementId } = await context.params;
    const actor = await requireSessionActor(request);
    const firmId = actor.tenantId;

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

    if (!eng) {
      return NextResponse.json({ code: 'ENGAGEMENT_NOT_FOUND', message: 'Perikatan tidak ditemukan.' }, { status: 404 });
    }
    assertTenantAccess(actor, eng.tenantId);

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
      validateFileBoundary(fileName, fileSize);

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
      validateFileBoundary(fileName, Number(fileSize));
      fileBuffer = Buffer.from(JSON.stringify(parsedAccounts));
    }

    if (!Array.isArray(sheetNames) || sheetNames.length === 0 || sheetNames.length > MAX_SHEETS) {
      throw new UploadInputError(400, 'UPLOAD_LIMIT_EXCEEDED', `Berkas harus memiliki 1-${MAX_SHEETS} sheet.`);
    }
    if (!Array.isArray(parsedAccounts) || parsedAccounts.length === 0) {
      throw new UploadInputError(400, 'NO_ACCOUNT_ROWS', 'Tidak ada baris akun yang dapat diproses.');
    }
    if (parsedAccounts.length > MAX_ACCOUNT_ROWS) {
      throw new UploadInputError(400, 'UPLOAD_LIMIT_EXCEEDED', `Jumlah akun melebihi batas ${MAX_ACCOUNT_ROWS.toLocaleString('id-ID')} baris.`);
    }

    // Normalize every ingestion path to the AccountRow contract before any
    // mapping, calculation, or persistence. Browser parsers historically sent
    // `balanceIdr`, while the deterministic engine consumes
    // `closingBalanceIdr`; accepting both without normalization zeroed debit
    // balances in server-side recalculation.
    parsedAccounts = parsedAccounts.map((account: any, index: number) => {
      const debitIdr = Number(account.debitIdr ?? account.debit ?? 0);
      const creditIdr = Number(account.creditIdr ?? account.credit ?? 0);
      const closingBalanceIdr = Number(
        account.closingBalanceIdr ?? account.balanceIdr ?? (debitIdr - creditIdr),
      );
      if (![debitIdr, creditIdr, closingBalanceIdr].every(Number.isFinite)) {
        throw new Error(`Nilai saldo tidak valid pada baris akun ${index + 1}.`);
      }
      if (debitIdr < 0 || creditIdr < 0) {
        throw new Error(`Debit dan kredit tidak boleh negatif pada baris akun ${index + 1}.`);
      }
      const accountCode = String(account.accountCode || '').trim();
      const accountName = String(account.accountName || '').trim();
      if (!accountCode || !accountName) {
        throw new UploadInputError(400, 'INVALID_ACCOUNT_ROW', `Kode dan nama akun wajib diisi pada baris ${index + 1}.`);
      }
      return {
        ...account,
        id: account.id || `ACC-${index + 1}`,
        accountCode,
        accountName,
        debitIdr,
        creditIdr,
        closingBalanceIdr,
        balanceIdr: closingBalanceIdr,
      };
    });

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
      const code = acc.accountCode || '';
      const target = inferLeadScheduleTarget(code, acc.accountName);

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
        uploadedBy: actor.name || 'Auditor',
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
      uploadedByUserId: actor.id,
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
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof UploadInputError) {
      return NextResponse.json({ code: error.code, message: error.message, retryable: false }, { status: error.status });
    }
    console.error('Error in POST /api/v1/engagements/[id]/files:', error);
    return NextResponse.json(
      { code: 'FILE_PROCESSING_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
