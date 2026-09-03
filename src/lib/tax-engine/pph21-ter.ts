// FINOVA Deterministic Tax Engine — PPh Pasal 21 TER
// Regulation: PP 58/2023 & PMK 168/2023
// Effective Date: 2024-01-01

export type TerCategory = 'A' | 'B' | 'C';
export type PtkpStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

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
      throw new Error(`Unsupported PTKP status: ${ptkp}`);
  }
}

export function getPtkpAnnualAmount(ptkp: PtkpStatus): number {
  switch (ptkp) {
    case 'TK/0': return 54_000_000;
    case 'TK/1':
    case 'K/0': return 58_500_000;
    case 'TK/2':
    case 'K/1': return 63_000_000;
    case 'TK/3':
    case 'K/2': return 67_500_000;
    case 'K/3': return 72_000_000;
  }
}

interface TerBracket {
  maxGross: number; // upper bound inclusive
  rate: number;     // e.g. 0.0025 for 0.25%
}

// PP 58/2023 Lampiran A - TER Kategori A
const TER_A_BRACKETS: TerBracket[] = [
  { maxGross: 5_400_000, rate: 0.0 },
  { maxGross: 5_650_000, rate: 0.0025 },
  { maxGross: 5_950_000, rate: 0.005 },
  { maxGross: 6_300_000, rate: 0.0075 },
  { maxGross: 6_750_000, rate: 0.01 },
  { maxGross: 7_500_000, rate: 0.0125 },
  { maxGross: 8_550_000, rate: 0.015 },
  { maxGross: 9_650_000, rate: 0.0175 },
  { maxGross: 10_050_000, rate: 0.02 },
  { maxGross: 10_350_000, rate: 0.0225 },
  { maxGross: 10_700_000, rate: 0.025 },
  { maxGross: 11_050_000, rate: 0.03 },
  { maxGross: 11_600_000, rate: 0.035 },
  { maxGross: 12_500_000, rate: 0.04 },
  { maxGross: 13_750_000, rate: 0.05 },
  { maxGross: 15_100_000, rate: 0.06 },
  { maxGross: 16_950_000, rate: 0.07 },
  { maxGross: 19_750_000, rate: 0.08 },
  { maxGross: 24_100_000, rate: 0.09 },
  { maxGross: 26_450_000, rate: 0.10 },
  { maxGross: 28_000_000, rate: 0.11 },
  { maxGross: 30_050_000, rate: 0.12 },
  { maxGross: 32_400_000, rate: 0.13 },
  { maxGross: 35_400_000, rate: 0.14 },
  { maxGross: 39_100_000, rate: 0.15 },
  { maxGross: 43_850_000, rate: 0.16 },
  { maxGross: 47_800_000, rate: 0.17 },
  { maxGross: 51_400_000, rate: 0.18 },
  { maxGross: 56_300_000, rate: 0.19 },
  { maxGross: 62_200_000, rate: 0.20 },
  { maxGross: 68_600_000, rate: 0.21 },
  { maxGross: 77_500_000, rate: 0.22 },
  { maxGross: 89_000_000, rate: 0.23 },
  { maxGross: 103_000_000, rate: 0.24 },
  { maxGross: 125_000_000, rate: 0.25 },
  { maxGross: 157_000_000, rate: 0.26 },
  { maxGross: 206_000_000, rate: 0.27 },
  { maxGross: 337_000_000, rate: 0.28 },
  { maxGross: 454_000_000, rate: 0.29 },
  { maxGross: 550_000_000, rate: 0.30 },
  { maxGross: 695_000_000, rate: 0.31 },
  { maxGross: 910_000_000, rate: 0.32 },
  { maxGross: 1_400_000_000, rate: 0.33 },
  { maxGross: Infinity, rate: 0.34 },
];

// PP 58/2023 Lampiran B - TER Kategori B
const TER_B_BRACKETS: TerBracket[] = [
  { maxGross: 6_200_000, rate: 0.0 },
  { maxGross: 6_500_000, rate: 0.0025 },
  { maxGross: 6_850_000, rate: 0.005 },
  { maxGross: 7_300_000, rate: 0.0075 },
  { maxGross: 9_200_000, rate: 0.01 },
  { maxGross: 10_750_000, rate: 0.015 },
  { maxGross: 12_500_000, rate: 0.02 },
  { maxGross: 14_300_000, rate: 0.03 },
  { maxGross: 16_000_000, rate: 0.04 },
  { maxGross: 19_450_000, rate: 0.05 },
  { maxGross: 23_250_000, rate: 0.06 },
  { maxGross: 26_000_000, rate: 0.07 },
  { maxGross: 29_000_000, rate: 0.08 },
  { maxGross: 33_000_000, rate: 0.09 },
  { maxGross: 36_000_000, rate: 0.10 },
  { maxGross: 40_000_000, rate: 0.12 },
  { maxGross: 54_000_000, rate: 0.15 },
  { maxGross: 70_000_000, rate: 0.19 },
  { maxGross: 100_000_000, rate: 0.23 },
  { maxGross: 150_000_000, rate: 0.25 },
  { maxGross: 300_000_000, rate: 0.28 },
  { maxGross: 500_000_000, rate: 0.30 },
  { maxGross: Infinity, rate: 0.34 },
];

export function getTerRate(monthlyGrossIdr: number, category: TerCategory): number {
  const brackets = category === 'A' ? TER_A_BRACKETS : TER_B_BRACKETS;
  for (const b of brackets) {
    if (monthlyGrossIdr <= b.maxGross) {
      return b.rate;
    }
  }
  return 0.34;
}

export interface Pph21MonthlyCalculation {
  employeeName: string;
  ptkp: PtkpStatus;
  category: TerCategory;
  grossIncomeIdr: number;
  terRate: number;
  terTaxWithheldIdr: number;
  ruleId: string;
  sourceRegulation: string;
  effectiveDate: string;
  calculationExplanation: string;
}

export function calculatePph21MonthlyTer(
  employeeName: string,
  ptkp: PtkpStatus,
  grossIncomeIdr: number
): Pph21MonthlyCalculation {
  const category = getTerCategory(ptkp);
  const rate = getTerRate(grossIncomeIdr, category);
  const taxWithheld = Math.round(grossIncomeIdr * rate);

  return {
    employeeName,
    ptkp,
    category,
    grossIncomeIdr,
    terRate: rate,
    terTaxWithheldIdr: taxWithheld,
    ruleId: `RULE-PPH21-TER-${category}-2024`,
    sourceRegulation: 'PP Nomor 58 Tahun 2023 & PMK Nomor 168 Tahun 2023',
    effectiveDate: '2024-01-01',
    calculationExplanation: `PPh 21 bulanan dihitung berdasarkan TER Kategori ${category} untuk penghasilan bruto Rp ${grossIncomeIdr.toLocaleString('id-ID')} dengan tarif ${(rate * 100).toFixed(2)}% menghasilkan potongan PPh 21 Rp ${taxWithheld.toLocaleString('id-ID')}.`,
  };
}

/**
 * Calculates December annual reconciliation under Pasal 17 ayat 1 huruf a UU HPP:
 * 0 - 60M: 5%
 * > 60M - 250M: 15%
 * > 250M - 500M: 25%
 * > 500M - 5M: 30%
 * > 5M: 35%
 */
export function calculateAnnualPasal17Tax(taxableIncomePkp: number): number {
  if (taxableIncomePkp <= 0) return 0;

  let remaining = taxableIncomePkp;
  let totalTax = 0;

  // Bracket 1: 0 - 60M (5%)
  const b1 = Math.min(remaining, 60_000_000);
  totalTax += b1 * 0.05;
  remaining -= b1;
  if (remaining <= 0) return Math.round(totalTax);

  // Bracket 2: > 60M - 250M (15%)
  const b2 = Math.min(remaining, 190_000_000);
  totalTax += b2 * 0.15;
  remaining -= b2;
  if (remaining <= 0) return Math.round(totalTax);

  // Bracket 3: > 250M - 500M (25%)
  const b3 = Math.min(remaining, 250_000_000);
  totalTax += b3 * 0.25;
  remaining -= b3;
  if (remaining <= 0) return Math.round(totalTax);

  // Bracket 4: > 500M - 5M (30%)
  const b4 = Math.min(remaining, 4_500_000_000);
  totalTax += b4 * 0.30;
  remaining -= b4;
  if (remaining <= 0) return Math.round(totalTax);

  // Bracket 5: > 5M (35%)
  totalTax += remaining * 0.35;
  return Math.round(totalTax);
}
