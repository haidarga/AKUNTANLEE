// FINOVA Deterministic Tax Engine — PPh Pasal 23
// Regulation: UU PPh Pasal 23, PMK 141/PMK.03/2015
// Effective Date: 2015-08-24 (Updated under UU Harmonisasi Peraturan Perpajakan No. 7/2021)

export type Pph23Category = 'jasa_teknik_manajemen_konsultasi' | 'sewa_harta' | 'royalti' | 'hadiah_penghargaan';

export interface Pph23TransactionInput {
  transactionId: string;
  vendorName: string;
  vendorNpwp?: string;
  hasValidNpwp: boolean;
  category: Pph23Category;
  description: string;
  dppAmountIdr: number; // Dasar Pengenaan Pajak
}

export interface Pph23CalculationResult {
  transactionId: string;
  vendorName: string;
  hasValidNpwp: boolean;
  category: Pph23Category;
  dppAmountIdr: number;
  statutoryRate: number;
  effectiveRate: number; // 100% surcharge if no NPWP
  withholdingTaxIdr: number;
  netPayableIdr: number;
  ruleId: string;
  sourceRegulation: string;
  effectiveDate: string;
  explanation: string;
}

export function calculatePph23(input: Pph23TransactionInput): Pph23CalculationResult {
  let baseRate = 0.02; // Default 2% for services and asset rentals
  let categoryDesc = 'Jasa Teknik/Manajemen/Konsultasi';

  if (input.category === 'royalti' || input.category === 'hadiah_penghargaan') {
    baseRate = 0.15; // 15% for royalties and awards
    categoryDesc = 'Royalti';
  } else if (input.category === 'sewa_harta') {
    baseRate = 0.02;
    categoryDesc = 'Sewa Harta (selain Tanah & Bangunan)';
  }

  // Under UU PPh Pasal 23 ayat 1a, taxpayers without NPWP are subject to 100% higher rate
  const rateMultiplier = input.hasValidNpwp ? 1.0 : 2.0;
  const effectiveRate = baseRate * rateMultiplier;
  const withholdingTaxIdr = Math.round(input.dppAmountIdr * effectiveRate);
  const netPayableIdr = input.dppAmountIdr - withholdingTaxIdr;

  const surchargeNote = !input.hasValidNpwp
    ? ' (Dikenakan tarif 100% lebih tinggi karena tidak memiliki NPWP/NIK tervalidasi)'
    : '';

  return {
    transactionId: input.transactionId,
    vendorName: input.vendorName,
    hasValidNpwp: input.hasValidNpwp,
    category: input.category,
    dppAmountIdr: input.dppAmountIdr,
    statutoryRate: baseRate,
    effectiveRate,
    withholdingTaxIdr,
    netPayableIdr,
    ruleId: `RULE-PPH23-${input.category.toUpperCase()}-2021`,
    sourceRegulation: 'UU Pajak Penghasilan Pasal 23 & PMK No. 141/PMK.03/2015',
    effectiveDate: '2021-10-29',
    explanation: `Pemotongan PPh Pasal 23 atas ${categoryDesc} DPP Rp ${input.dppAmountIdr.toLocaleString('id-ID')} dengan tarif efektif ${(effectiveRate * 100).toFixed(1)}%${surchargeNote} = Rp ${withholdingTaxIdr.toLocaleString('id-ID')}.`,
  };
}
