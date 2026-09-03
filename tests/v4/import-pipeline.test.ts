import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { processUploadedFile, executeImportAndNormalize } from '@/lib/importer/pipeline';
import { ImportJob } from '@/types/domain-v4';

describe('R03 / PRD §43: 8-Stage Import & Normalization Pipeline', () => {
  it('processes and validates uploaded XLSX buffer', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode Akun', 'Nama Akun', 'Debit', 'Kredit'],
      ['1110-00', 'Kas Bank', 1000000, 0],
      ['2110-00', 'Utang Usaha', 0, 1000000],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'TB');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = processUploadedFile('test_tb.xlsx', buffer, 'TENANT-001', 'ENG-2026-01', 'USR-01');
    expect(result.fileVersion.originalName).toBe('test_tb.xlsx');
    expect(result.fileVersion.status).toBe('ready');
    expect(result.fileVersion.sheetCount).toBe(1);
    expect(result.fileVersion.checksumSha256).toHaveLength(64);
  });

  it('normalizes accounts and flags missing mandatory fields', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode', 'Nama', 'Deb', 'Kre'],
      ['', 'Kas Tanpa Kode', 500000, 0], // Missing code error
      ['1120-00', 'Piutang Usaha', 2000000, 0],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'TB');

    const job: ImportJob = {
      id: 'IMP-TEST',
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      fileVersionId: 'FV-TEST',
      datasetType: 'trial_balance',
      selectedSheet: 'TB',
      headerRowIndex: 0,
      columnMappings: [
        { targetField: 'account_code', sourceColumn: 'Kode', isRequired: true },
        { targetField: 'account_name', sourceColumn: 'Nama', isRequired: true },
        { targetField: 'debit', sourceColumn: 'Deb', isRequired: true },
        { targetField: 'credit', sourceColumn: 'Kre', isRequired: true },
      ],
      stage: 'validate',
      status: 'validating',
      idempotencyKey: 'idem-test-01',
      totalRows: 2,
      validRows: 1,
      errors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const outcome = executeImportAndNormalize(wb, job);
    expect(outcome.errors.length).toBe(1);
    expect(outcome.errors[0].column).toBe('account_code');
    expect(outcome.accounts.length).toBe(1);
    expect(outcome.accounts[0].accountCode).toBe('1120-00');
  });
});
