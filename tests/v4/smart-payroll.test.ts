import { describe, it, expect } from 'vitest';
import { inferPayrollColumns, parseAndImportPayrollRows } from '../../src/lib/tax/smart-payroll-importer';

describe('Smart Payroll Importer (Fuzzy/Heuristic Header Detection)', () => {
  it('correctly infers column mapping from arbitrary client retail headers', () => {
    const retailHeaders = ['Karyawan', 'Role Jabatan', 'Gapok Bulanan', 'Status PTKP', 'Tunjangan Operasional'];
    const inference = inferPayrollColumns(retailHeaders);

    expect(inference.nameColIndex).toBe(0);
    expect(inference.positionColIndex).toBe(1);
    expect(inference.salaryColIndex).toBe(2);
    expect(inference.ptkpColIndex).toBe(3);
    expect(inference.allowanceColIndex).toBe(4);
    expect(inference.confidenceScorePercent).toBe(100);
  });

  it('correctly infers column mapping from logistics client headers in different order', () => {
    const logistikHeaders = ['No', 'Tanggungan', 'Nama Lengkap', 'Upah Pokok', 'Premi BPJS'];
    const inference = inferPayrollColumns(logistikHeaders);

    expect(inference.ptkpColIndex).toBe(1);
    expect(inference.nameColIndex).toBe(2);
    expect(inference.salaryColIndex).toBe(3);
    expect(inference.bpjsColIndex).toBe(4);
  });

  it('parses raw rows and calculates PPh 21 TER accurately', () => {
    const headers = ['Nama Pegawai', 'Jabatan', 'PTKP', 'Gaji Pokok', 'Tunjangan'];
    const rows = [
      ['Budi Santoso', 'Staf Gudang', 'TK/0', 'Rp 7.500.000', 'Rp 500.000'],
      ['Siti Aminah', 'Supervisor HR', 'K/1', '12000000', '1500000'],
    ];

    const result = parseAndImportPayrollRows(headers, rows);
    expect(result.validRowCount).toBe(2);
    expect(result.importedEmployees[0].monthlyGrossSalaryIdr).toBe(7_500_000);
    expect(result.importedEmployees[0].monthlyAllowanceIdr).toBe(500_000);
    expect(result.importedEmployees[0].ptkpStatus).toBe('TK/0');
    expect(result.importedEmployees[0].terCategory).toBe('A');

    expect(result.importedEmployees[1].ptkpStatus).toBe('K/1');
    expect(result.importedEmployees[1].terCategory).toBe('B');
    expect(result.totalMonthlyPph21Idr).toBeGreaterThan(0);
  });
});
