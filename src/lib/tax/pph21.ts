// FINOVA AI - Indonesian PPh 21 Tax Engine
// Implements PP 58/2023 (Tarif Efektif Rata-Rata / TER) & PMK 168/2023

export type PtkpStatus = 
  | 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3'
  | 'K/0'  | 'K/1'  | 'K/2'  | 'K/3';

export type TerCategory = 'A' | 'B' | 'C';

export interface EmployeePayrollProfile {
  id: string;
  name: string;
  position: string;
  ptkpStatus: PtkpStatus;
  terCategory: TerCategory;
  monthlyGrossSalaryIdr: number;
  monthlyAllowanceIdr: number;
  bpjsKetenagakerjaanPaidByCompanyIdr: number;
  bpjsKesehatanPaidByCompanyIdr: number;
}

export interface Pph21MonthlyCalculation {
  employeeId: string;
  employeeName: string;
  position: string;
  ptkpStatus: PtkpStatus;
  terCategory: TerCategory;
  grossIncomeIdr: number;
  terRatePercent: number;
  monthlyPph21Idr: number;
  takeHomePayIdr: number;
}

export interface Pph21AnnualReconciliation {
  employeeId: string;
  employeeName: string;
  annualGrossIncomeIdr: number;
  biayaJabatanIdr: number; // 5% max 6jt/yr
  iuranPensiunPaidByEmployeeIdr: number;
  netIncomeIdr: number;
  ptkpAmountIdr: number;
  taxableIncomeIdr: number; // PKP
  annualPph21TarifPasal17Idr: number;
  totalPph21TerJanToNovIdr: number;
  decemberPph21Idr: number; // Underpayment/Overpayment in Dec
}

export function getTerCategory(ptkp: PtkpStatus): TerCategory {
  switch (ptkp) {
    case 'TK/0':
    case 'TK/1':
    case 'K/0':
      return 'A';
    case 'TK/2':
    case 'TK/3':
    case 'K/1':
    case 'K/2':
      return 'B';
    case 'K/3':
      return 'C';
    default:
      return 'A';
  }
}

export function getPtkpAnnualAmount(ptkp: PtkpStatus): number {
  switch (ptkp) {
    case 'TK/0': return 54_000_000;
    case 'TK/1': return 58_500_000;
    case 'TK/2': return 63_000_000;
    case 'TK/3': return 67_500_000;
    case 'K/0':  return 58_500_000;
    case 'K/1':  return 63_000_000;
    case 'K/2':  return 67_500_000;
    case 'K/3':  return 72_000_000;
    default:     return 54_000_000;
  }
}

// PP 58/2023 Table TER Kategori A (Monthly gross threshold -> rate %)
const TER_A_BRACKETS: { max: number; rate: number }[] = [
  { max: 5_400_000, rate: 0.00 },
  { max: 5_650_000, rate: 0.25 },
  { max: 5_950_000, rate: 0.50 },
  { max: 6_300_000, rate: 0.75 },
  { max: 6_750_000, rate: 1.00 },
  { max: 7_500_000, rate: 1.25 },
  { max: 8_550_000, rate: 1.50 },
  { max: 9_650_000, rate: 1.75 },
  { max: 10_050_000, rate: 2.00 },
  { max: 10_350_000, rate: 2.25 },
  { max: 10_700_000, rate: 2.50 },
  { max: 11_050_000, rate: 3.00 },
  { max: 11_600_000, rate: 3.50 },
  { max: 12_500_000, rate: 4.00 },
  { max: 13_750_000, rate: 5.00 },
  { max: 15_100_000, rate: 6.00 },
  { max: 16_950_000, rate: 7.00 },
  { max: 19_750_000, rate: 8.00 },
  { max: 24_150_000, rate: 9.00 },
  { max: 26_450_000, rate: 10.00 },
  { max: 28_000_000, rate: 11.00 },
  { max: 30_050_000, rate: 12.00 },
  { max: 32_400_000, rate: 13.00 },
  { max: 35_400_000, rate: 14.00 },
  { max: 39_100_000, rate: 15.00 },
  { max: 43_850_000, rate: 16.00 },
  { max: 47_800_000, rate: 17.00 },
  { max: 51_400_000, rate: 18.00 },
  { max: 56_300_000, rate: 19.00 },
  { max: 62_200_000, rate: 20.00 },
  { max: 68_600_000, rate: 21.00 },
  { max: 77_500_000, rate: 22.00 },
  { max: 89_000_000, rate: 23.00 },
  { max: 103_000_000, rate: 24.00 },
  { max: 120_000_000, rate: 25.00 },
  { max: 140_000_000, rate: 26.00 },
  { max: Infinity, rate: 30.00 },
];

const TER_B_BRACKETS: { max: number; rate: number }[] = [
  { max: 6_200_000, rate: 0.00 },
  { max: 6_500_000, rate: 0.25 },
  { max: 6_850_000, rate: 0.50 },
  { max: 7_300_000, rate: 0.75 },
  { max: 9_200_000, rate: 1.00 },
  { max: 10_750_000, rate: 1.50 },
  { max: 12_300_000, rate: 2.00 },
  { max: 15_200_000, rate: 4.00 },
  { max: 18_500_000, rate: 6.00 },
  { max: 23_000_000, rate: 9.00 },
  { max: 29_000_000, rate: 12.00 },
  { max: 37_000_000, rate: 15.00 },
  { max: 50_000_000, rate: 18.00 },
  { max: 70_000_000, rate: 21.00 },
  { max: 100_000_000, rate: 24.00 },
  { max: Infinity, rate: 30.00 },
];

const TER_C_BRACKETS: { max: number; rate: number }[] = [
  { max: 6_600_000, rate: 0.00 },
  { max: 6_950_000, rate: 0.25 },
  { max: 7_350_000, rate: 0.50 },
  { max: 7_800_000, rate: 0.75 },
  { max: 9_700_000, rate: 1.00 },
  { max: 11_350_000, rate: 1.50 },
  { max: 13_000_000, rate: 2.00 },
  { max: 16_000_000, rate: 4.00 },
  { max: 19_500_000, rate: 6.00 },
  { max: 24_200_000, rate: 9.00 },
  { max: 30_500_000, rate: 12.00 },
  { max: 39_000_000, rate: 15.00 },
  { max: 52_000_000, rate: 18.00 },
  { max: 72_000_000, rate: 21.00 },
  { max: 105_000_000, rate: 24.00 },
  { max: Infinity, rate: 30.00 },
];

export function calculateTerRate(monthlyGross: number, category: TerCategory): number {
  const brackets = category === 'A' ? TER_A_BRACKETS : category === 'B' ? TER_B_BRACKETS : TER_C_BRACKETS;
  for (const b of brackets) {
    if (monthlyGross <= b.max) {
      return b.rate;
    }
  }
  return 30.00;
}

export function calculateMonthlyPph21(emp: EmployeePayrollProfile): Pph21MonthlyCalculation {
  const gross = emp.monthlyGrossSalaryIdr + 
                emp.monthlyAllowanceIdr + 
                emp.bpjsKetenagakerjaanPaidByCompanyIdr + 
                emp.bpjsKesehatanPaidByCompanyIdr;
  
  const terRate = calculateTerRate(gross, emp.terCategory);
  const pph21 = Math.round((gross * terRate) / 100);
  const thp = (emp.monthlyGrossSalaryIdr + emp.monthlyAllowanceIdr) - pph21;

  return {
    employeeId: emp.id,
    employeeName: emp.name,
    position: emp.position,
    ptkpStatus: emp.ptkpStatus,
    terCategory: emp.terCategory,
    grossIncomeIdr: gross,
    terRatePercent: terRate,
    monthlyPph21Idr: pph21,
    takeHomePayIdr: thp,
  };
}

// Pasal 17 UU HPP Annual Tax Brackets
export function calculateAnnualPph21Pasal17(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  
  let tax = 0;
  let remaining = taxableIncome;

  // Bracket 1: 0 - 60jt (5%)
  const b1 = Math.min(remaining, 60_000_000);
  tax += b1 * 0.05;
  remaining -= b1;

  // Bracket 2: 60jt - 250jt (15%)
  if (remaining > 0) {
    const b2 = Math.min(remaining, 190_000_000);
    tax += b2 * 0.15;
    remaining -= b2;
  }

  // Bracket 3: 250jt - 500jt (25%)
  if (remaining > 0) {
    const b3 = Math.min(remaining, 250_000_000);
    tax += b3 * 0.25;
    remaining -= b3;
  }

  // Bracket 4: 500jt - 5 Milyar (30%)
  if (remaining > 0) {
    const b4 = Math.min(remaining, 4_500_000_000);
    tax += b4 * 0.30;
    remaining -= b4;
  }

  // Bracket 5: > 5 Milyar (35%)
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  return Math.round(tax);
}

// Sample production staff for PT Nusantara Sukses Makmur
export const DEFAULT_COMPANY_EMPLOYEES: EmployeePayrollProfile[] = [
  {
    id: 'EMP-001',
    name: 'Ir. Bambang Trihatmojo',
    position: 'Direktur Utama',
    ptkpStatus: 'K/2',
    terCategory: 'B',
    monthlyGrossSalaryIdr: 45_000_000,
    monthlyAllowanceIdr: 5_000_000,
    bpjsKetenagakerjaanPaidByCompanyIdr: 1_200_000,
    bpjsKesehatanPaidByCompanyIdr: 800_000,
  },
  {
    id: 'EMP-002',
    name: 'Dewi Sartika, S.E',
    position: 'Manajer Keuangan & Akuntansi',
    ptkpStatus: 'K/1',
    terCategory: 'B',
    monthlyGrossSalaryIdr: 22_000_000,
    monthlyAllowanceIdr: 2_500_000,
    bpjsKetenagakerjaanPaidByCompanyIdr: 600_000,
    bpjsKesehatanPaidByCompanyIdr: 400_000,
  },
  {
    id: 'EMP-003',
    name: 'Rian Pratama, S.T',
    position: 'Supervisor Operasional Pabrik',
    ptkpStatus: 'TK/1',
    terCategory: 'A',
    monthlyGrossSalaryIdr: 12_500_000,
    monthlyAllowanceIdr: 1_500_000,
    bpjsKetenagakerjaanPaidByCompanyIdr: 350_000,
    bpjsKesehatanPaidByCompanyIdr: 250_000,
  },
  {
    id: 'EMP-004',
    name: 'Siti Aisyah',
    position: 'Senior Staff Pembukuan',
    ptkpStatus: 'TK/0',
    terCategory: 'A',
    monthlyGrossSalaryIdr: 8_500_000,
    monthlyAllowanceIdr: 1_000_000,
    bpjsKetenagakerjaanPaidByCompanyIdr: 240_000,
    bpjsKesehatanPaidByCompanyIdr: 160_000,
  },
  {
    id: 'EMP-005',
    name: 'Agus Setiawan',
    position: 'Operator Mesin Manufaktur',
    ptkpStatus: 'K/0',
    terCategory: 'A',
    monthlyGrossSalaryIdr: 6_000_000,
    monthlyAllowanceIdr: 800_000,
    bpjsKetenagakerjaanPaidByCompanyIdr: 180_000,
    bpjsKesehatanPaidByCompanyIdr: 120_000,
  },
];
