// FINOVA AI - Smart Payroll Importer with Dynamic Column Auto-Detection
// Solves: Format Excel Klien yang Berbeda-beda (Fuzzy/Heuristic Column Matching)

import { PtkpStatus, TerCategory, getTerCategory, calculateMonthlyPph21, EmployeePayrollProfile } from './pph21';

export interface ColumnMappingInference {
  nameColIndex: number;
  nameColHeader: string;
  positionColIndex: number;
  positionColHeader: string;
  ptkpColIndex: number;
  ptkpColHeader: string;
  salaryColIndex: number;
  salaryColHeader: string;
  allowanceColIndex: number;
  allowanceColHeader: string;
  bpjsColIndex: number;
  bpjsColHeader: string;
  confidenceScorePercent: number;
}

export interface SmartImportResult {
  detectedColumns: ColumnMappingInference;
  importedEmployees: EmployeePayrollProfile[];
  totalMonthlyPayrollBrutoIdr: number;
  totalMonthlyPph21Idr: number;
  rawRowCount: number;
  validRowCount: number;
  warnings: string[];
}

// Normalize headers for fuzzy matching
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function inferPayrollColumns(headers: string[]): ColumnMappingInference {
  const normHeaders = headers.map(normalizeHeader);

  let nameIdx = -1;
  let posIdx = -1;
  let ptkpIdx = -1;
  let salIdx = -1;
  let allowIdx = -1;
  let bpjsIdx = -1;

  normHeaders.forEach((nh, idx) => {
    if (nameIdx === -1 && (nh.includes('nama') || nh.includes('karyawan') || nh.includes('pegawai') || nh.includes('employee'))) {
      nameIdx = idx;
    } else if (posIdx === -1 && (nh.includes('jabatan') || nh.includes('posisi') || nh.includes('role') || nh.includes('title'))) {
      posIdx = idx;
    } else if (ptkpIdx === -1 && (nh.includes('ptkp') || nh.includes('status') || nh.includes('marital') || nh.includes('tanggungan'))) {
      ptkpIdx = idx;
    } else if (salIdx === -1 && (nh.includes('gajipokok') || nh.includes('gapok') || nh.includes('basicsalary') || nh.includes('gaji') || nh.includes('salary'))) {
      salIdx = idx;
    } else if (allowIdx === -1 && (nh.includes('tunjangan') || nh.includes('allowance') || nh.includes('lembur') || nh.includes('transport'))) {
      allowIdx = idx;
    } else if (bpjsIdx === -1 && (nh.includes('bpjs') || nh.includes('jamsostek') || nh.includes('premi') || nh.includes('asuransi'))) {
      bpjsIdx = idx;
    }
  });

  // Fallbacks if not detected by keywords
  if (nameIdx === -1 && headers.length > 0) nameIdx = 0;
  if (posIdx === -1 && headers.length > 1) posIdx = 1;
  if (ptkpIdx === -1 && headers.length > 2) ptkpIdx = 2;
  if (salIdx === -1 && headers.length > 3) salIdx = 3;

  let matchedFields = 0;
  if (nameIdx !== -1) matchedFields++;
  if (ptkpIdx !== -1) matchedFields++;
  if (salIdx !== -1) matchedFields++;
  if (allowIdx !== -1) matchedFields++;

  const confidence = Math.round((matchedFields / 4) * 100);

  return {
    nameColIndex: nameIdx,
    nameColHeader: nameIdx !== -1 ? headers[nameIdx] : 'Tidak Terdeteksi',
    positionColIndex: posIdx,
    positionColHeader: posIdx !== -1 ? headers[posIdx] : 'Tidak Terdeteksi',
    ptkpColIndex: ptkpIdx,
    ptkpColHeader: ptkpIdx !== -1 ? headers[ptkpIdx] : 'Tidak Terdeteksi',
    salaryColIndex: salIdx,
    salaryColHeader: salIdx !== -1 ? headers[salIdx] : 'Tidak Terdeteksi',
    allowanceColIndex: allowIdx,
    allowanceColHeader: allowIdx !== -1 ? headers[allowIdx] : 'Tidak Terdeteksi',
    bpjsColIndex: bpjsIdx,
    bpjsColHeader: bpjsIdx !== -1 ? headers[bpjsIdx] : 'Tidak Terdeteksi',
    confidenceScorePercent: confidence,
  };
}

function parsePtkp(val: string): PtkpStatus {
  const clean = val.toUpperCase().replace(/\s+/g, '');
  if (['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'].includes(clean)) {
    return clean as PtkpStatus;
  }
  // Try parsing TK0, K1 etc
  if (clean === 'TK0') return 'TK/0';
  if (clean === 'TK1') return 'TK/1';
  if (clean === 'TK2') return 'TK/2';
  if (clean === 'TK3') return 'TK/3';
  if (clean === 'K0') return 'K/0';
  if (clean === 'K1') return 'K/1';
  if (clean === 'K2') return 'K/2';
  if (clean === 'K3') return 'K/3';
  return 'TK/0';
}

function parseCurrency(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9]/g, '');
  return Number(str) || 0;
}

export function parseAndImportPayrollRows(
  headers: string[],
  rows: string[][],
  customMapping?: Partial<ColumnMappingInference>
): SmartImportResult {
  const inferred = inferPayrollColumns(headers);
  const mapping: ColumnMappingInference = { ...inferred, ...customMapping };

  const employees: EmployeePayrollProfile[] = [];
  const warnings: string[] = [];

  rows.forEach((row, rowIdx) => {
    if (row.length === 0 || row.every((c) => !c || c.trim() === '')) return;

    const name = mapping.nameColIndex !== -1 && row[mapping.nameColIndex] ? row[mapping.nameColIndex].trim() : `Karyawan ${rowIdx + 1}`;
    const pos = mapping.positionColIndex !== -1 && row[mapping.positionColIndex] ? row[mapping.positionColIndex].trim() : 'Staf Umum';
    const ptkpRaw = mapping.ptkpColIndex !== -1 && row[mapping.ptkpColIndex] ? row[mapping.ptkpColIndex] : 'TK/0';
    const ptkp = parsePtkp(ptkpRaw);
    const salary = mapping.salaryColIndex !== -1 && row[mapping.salaryColIndex] ? parseCurrency(row[mapping.salaryColIndex]) : 0;
    const allowance = mapping.allowanceColIndex !== -1 && row[mapping.allowanceColIndex] ? parseCurrency(row[mapping.allowanceColIndex]) : 0;
    const bpjs = mapping.bpjsColIndex !== -1 && row[mapping.bpjsColIndex] ? parseCurrency(row[mapping.bpjsColIndex]) : Math.round(salary * 0.04);

    if (salary <= 0) {
      warnings.push(`Baris ${rowIdx + 1}: Gaji untuk '${name}' bernilai 0 atau tidak terbaca.`);
    }

    employees.push({
      id: `IMP-${String(rowIdx + 1).padStart(3, '0')}`,
      name,
      position: pos,
      ptkpStatus: ptkp,
      terCategory: getTerCategory(ptkp),
      monthlyGrossSalaryIdr: salary,
      monthlyAllowanceIdr: allowance,
      bpjsKetenagakerjaanPaidByCompanyIdr: Math.round(bpjs * 0.6),
      bpjsKesehatanPaidByCompanyIdr: Math.round(bpjs * 0.4),
    });
  });

  const totalBruto = employees.reduce((s, e) => s + e.monthlyGrossSalaryIdr + e.monthlyAllowanceIdr, 0);
  const totalPph21 = employees.reduce((s, e) => s + calculateMonthlyPph21(e).monthlyPph21Idr, 0);

  return {
    detectedColumns: mapping,
    importedEmployees: employees,
    totalMonthlyPayrollBrutoIdr: totalBruto,
    totalMonthlyPph21Idr: totalPph21,
    rawRowCount: rows.length,
    validRowCount: employees.length,
    warnings,
  };
}
