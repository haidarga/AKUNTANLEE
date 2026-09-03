// FINOVA AI v4.0 — 8-Stage Import & Normalization Pipeline
// Authoritative Source: Section 43 of FINOVA PRD v4.0

import * as XLSX from 'xlsx';
import crypto from 'crypto';
import {
  FileVersion,
  ImportJob,
  DatasetType,
  AccountRow,
  DatasetVersion,
  ImportErrorDetail,
} from '@/types/domain-v4';
import { DecimalMoney } from '@/lib/decimal';

export interface SheetPreviewData {
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  columnCount: number;
  previewRows: (string | number)[][];
}

export function computeSha256(buffer: Buffer | Uint8Array | string): string {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Stage 1 & 2: Receive & Persist file buffer
 */
export function processUploadedFile(
  filename: string,
  buffer: Buffer,
  tenantId: string,
  engagementId: string,
  userId: string
): { fileVersion: FileVersion; workbook: XLSX.WorkBook } {
  // Validate extension
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !['xlsx', 'csv', 'tsv', 'xls'].includes(ext)) {
    throw new Error(`Format berkas tidak didukung (.${ext}). Format yang didukung: XLSX, CSV, TSV.`);
  }

  // Validate size (max 100MB per Section 28.3 & 37.1)
  if (buffer.length > 100 * 1024 * 1024) {
    throw new Error('Ukuran berkas melebihi batas maksimum 100 MB.');
  }

  const checksum = computeSha256(buffer);

  // Parse workbook
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellFormula: false });
  } catch (err: any) {
    throw new Error(`Gagal membaca berkas spreadsheet: ${err.message}`);
  }

  // Structural checks (max 25 sheets per Section 28.3)
  if (workbook.SheetNames.length > 25) {
    throw new Error('Jumlah sheet melebihi batas maksimum 25 sheet.');
  }

  const fileVersion: FileVersion = {
    id: `FV-${Date.now().toString(36).toUpperCase()}`,
    assetId: `FA-${checksum.slice(0, 10).toUpperCase()}`,
    tenantId,
    engagementId,
    versionNumber: 1,
    originalName: filename,
    storageKey: `engagements/${engagementId}/sources/${checksum.slice(0, 12)}_${filename}`,
    checksumSha256: checksum,
    mediaType: ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
    sizeBytes: buffer.length,
    status: 'ready',
    uploadedByUserId: userId,
    scanStatus: 'clean',
    sheetCount: workbook.SheetNames.length,
    sheetNames: workbook.SheetNames,
    createdAt: new Date().toISOString(),
  };

  return { fileVersion, workbook };
}

/**
 * Stage 4: Preview sheet contents and detect dimensions
 */
export function previewSheet(
  workbook: XLSX.WorkBook,
  sheetName?: string,
  maxPreviewRows = 15
): SheetPreviewData {
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];

  if (!sheet) {
    throw new Error(`Sheet "${targetSheetName}" tidak ditemukan dalam workbook.`);
  }

  const rawRows: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  const rowCount = rawRows.length;
  const columnCount = rawRows.reduce((max, row) => Math.max(max, row.length), 0);
  const previewRows = rawRows.slice(0, maxPreviewRows);

  return {
    sheetNames: workbook.SheetNames,
    selectedSheet: targetSheetName,
    rowCount,
    columnCount,
    previewRows,
  };
}

/**
 * Stage 5, 6, 7 & 8: Validate rows, map columns, normalize accounts and publish DatasetVersion
 */
export function executeImportAndNormalize(
  workbook: XLSX.WorkBook,
  importJob: ImportJob
): { datasetVersion: DatasetVersion; accounts: AccountRow[]; errors: ImportErrorDetail[] } {
  const sheet = workbook.Sheets[importJob.selectedSheet];
  if (!sheet) {
    throw new Error(`Sheet "${importJob.selectedSheet}" tidak ditemukan.`);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  const headerRow = rawRows[importJob.headerRowIndex] || [];
  const dataRows = rawRows.slice(importJob.headerRowIndex + 1);

  // Identify column indices from mapping
  const colIndexMap: Record<string, number> = {};
  for (const m of importJob.columnMappings) {
    const idx = headerRow.findIndex(
      (h: any) => String(h).trim().toLowerCase() === m.sourceColumn.trim().toLowerCase()
    );
    if (idx !== -1) {
      colIndexMap[m.targetField] = idx;
    }
  }

  const errors: ImportErrorDetail[] = [];
  const accounts: AccountRow[] = [];
  let totalDebit = DecimalMoney.zero();
  let totalCredit = DecimalMoney.zero();

  const dsvId = `DSV-${Date.now().toString(36).toUpperCase()}`;

  dataRows.forEach((row, i) => {
    const rowNum = importJob.headerRowIndex + 2 + i;

    // Check account_code
    const codeIdx = colIndexMap['account_code'];
    const nameIdx = colIndexMap['account_name'];
    const debitIdx = colIndexMap['debit'];
    const creditIdx = colIndexMap['credit'];
    const balIdx = colIndexMap['closing_balance'];

    const code = codeIdx !== undefined ? String(row[codeIdx] || '').trim() : '';
    const name = nameIdx !== undefined ? String(row[nameIdx] || '').trim() : '';

    if (!code && !name) {
      // Empty row, ignore
      return;
    }

    if (!code) {
      errors.push({
        sheet: importJob.selectedSheet,
        row: rowNum,
        column: 'account_code',
        reason: 'Kode akun tidak boleh kosong',
        acceptedFormat: 'String alfanumerik (contoh: 1110-00)',
      });
      return;
    }

    if (!name) {
      errors.push({
        sheet: importJob.selectedSheet,
        row: rowNum,
        column: 'account_name',
        reason: 'Nama akun tidak boleh kosong',
        acceptedFormat: 'Deskripsi teks akun',
      });
      return;
    }

    let debit = 0;
    let credit = 0;
    let closing = 0;

    if (debitIdx !== undefined && creditIdx !== undefined) {
      debit = parseNumeric(row[debitIdx]);
      credit = parseNumeric(row[creditIdx]);
      closing = debit - credit;
    } else if (balIdx !== undefined) {
      closing = parseNumeric(row[balIdx]);
      if (closing >= 0) {
        debit = closing;
      } else {
        credit = Math.abs(closing);
      }
    }

    totalDebit = totalDebit.add(debit);
    totalCredit = totalCredit.add(credit);

    accounts.push({
      id: `ACC-${code}-${rowNum}`,
      datasetVersionId: dsvId,
      accountCode: code,
      accountName: name,
      openingBalanceIdr: 0,
      debitIdr: debit,
      creditIdr: credit,
      closingBalanceIdr: closing,
      periodEnd: '2026-12-31',
      currency: 'IDR',
      sourceLocator: {
        fileVersionId: importJob.fileVersionId,
        sheetName: importJob.selectedSheet,
        rowNumber: rowNum,
        cellRange: `${importJob.selectedSheet}!A${rowNum}:G${rowNum}`,
      },
    });
  });

  const datasetVersion: DatasetVersion = {
    id: dsvId,
    tenantId: importJob.tenantId,
    engagementId: importJob.engagementId,
    importJobId: importJob.id,
    fileVersionId: importJob.fileVersionId,
    datasetType: importJob.datasetType,
    rowCount: accounts.length,
    totals: {
      totalDebitIdr: totalDebit.toNumber(),
      totalCreditIdr: totalCredit.toNumber(),
      netBalanceIdr: totalDebit.subtract(totalCredit).toNumber(),
    },
    publishedAt: new Date().toISOString(),
  };

  return { datasetVersion, accounts, errors };
}

function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.round(val);
  const clean = String(val).replace(/[^0-9.-]/g, '').trim();
  const num = parseFloat(clean);
  return Number.isNaN(num) ? 0 : Math.round(num);
}
