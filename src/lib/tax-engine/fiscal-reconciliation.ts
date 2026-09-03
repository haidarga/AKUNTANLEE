// FINOVA Deterministic Tax Engine — Rekonsiliasi Fiskal PPh Badan
// Regulation: UU Pajak Penghasilan stdd UU HPP No. 7 Tahun 2021
// Effective Date: 2022-01-01 (Tarif PPh Badan 22%)

export type FiscalAdjustmentType = 'positif' | 'negatif';

export interface FiscalAdjustmentItem {
  id: string;
  accountCode: string;
  accountName: string;
  category:
    | 'biaya_natura_non_deductible'
    | 'entertainment_tanpa_daftar_nominatif'
    | 'sanksi_administrasi_pajak'
    | 'biaya_kepentingan_pribadi'
    | 'penghasilan_final_bunga_deposito'
    | 'penghasilan_dividen_non_objek'
    | 'beda_penyusutan_amortisasi'
    | 'lain_lain';
  adjustmentType: FiscalAdjustmentType;
  nature: 'beda_tetap' | 'beda_waktu'; // Permanent difference vs Temporary difference
  commercialAmountIdr: number;
  fiscalAllowedAmountIdr: number;
  adjustmentAmountIdr: number; // positive number representing the adjustment
  statutoryBasis: string; // e.g. "Pasal 9 ayat 1 huruf k UU PPh", "PMK 66/2023"
  description: string;
}

export interface FiscalReconciliationInput {
  commercialProfitBeforeTaxIdr: number;
  grossRevenueIdr: number; // For Pasal 31E facility assessment (< 50 Miliar)
  adjustments: FiscalAdjustmentItem[];
  priorYearLossCompensationIdr?: number;
  taxCreditsIdr: {
    pph22Idr: number;
    pph23Idr: number;
    pph25Idr: number; // Angsuran bulanan
  };
}

export interface FiscalReconciliationResult {
  commercialProfitBeforeTaxIdr: number;
  grossRevenueIdr: number;
  totalPositiveAdjustmentsIdr: number;
  totalNegativeAdjustmentsIdr: number;
  netFiscalProfitIdr: number;
  lossCompensationAppliedIdr: number;
  taxableIncomePkpIdr: number; // Rounded down to thousands
  isPasal31EEligible: boolean;
  corporateTaxCalculation: {
    portionFacilityTaxableIncomeIdr: number;
    portionFacilityTaxRate: number; // 11% (50% of 22%)
    portionFacilityTaxAmountIdr: number;
    portionNonFacilityTaxableIncomeIdr: number;
    portionNonFacilityTaxRate: number; // 22%
    portionNonFacilityTaxAmountIdr: number;
    totalCorporateTaxPayableIdr: number;
  };
  totalTaxCreditsIdr: number;
  netTaxDueIdr: number;
  taxPosition: 'kurang_bayar_pasal_29' | 'lebih_bayar_pasal_28a' | 'nihil';
  ruleId: string;
  sourceRegulation: string;
  effectiveDate: string;
  explanation: string;
}

export function runFiscalReconciliation(input: FiscalReconciliationInput): FiscalReconciliationResult {
  let totalPositiveAdjustmentsIdr = 0;
  let totalNegativeAdjustmentsIdr = 0;

  for (const item of input.adjustments) {
    if (item.adjustmentType === 'positif') {
      totalPositiveAdjustmentsIdr += item.adjustmentAmountIdr;
    } else {
      totalNegativeAdjustmentsIdr += item.adjustmentAmountIdr;
    }
  }

  const netFiscalProfit =
    input.commercialProfitBeforeTaxIdr + totalPositiveAdjustmentsIdr - totalNegativeAdjustmentsIdr;

  const lossComp = Math.min(
    Math.max(0, netFiscalProfit),
    input.priorYearLossCompensationIdr || 0
  );

  const pkpBeforeRounding = Math.max(0, netFiscalProfit - lossComp);
  // Indonesian Tax Law rounds PKP down to nearest 1,000 IDR
  const taxableIncomePkpIdr = Math.floor(pkpBeforeRounding / 1000) * 1000;

  // Check Pasal 31E Eligibility: Omzet Bruto <= 50 Miliar
  const isPasal31EEligible = input.grossRevenueIdr <= 50_000_000_000 && input.grossRevenueIdr > 0;

  let portionFacilityTaxableIncomeIdr = 0;
  let portionFacilityTaxAmountIdr = 0;
  let portionNonFacilityTaxableIncomeIdr = taxableIncomePkpIdr;
  let portionNonFacilityTaxAmountIdr = 0;

  if (isPasal31EEligible && taxableIncomePkpIdr > 0) {
    if (input.grossRevenueIdr <= 4_800_000_000) {
      // 100% eligible for 50% tariff discount (11%)
      portionFacilityTaxableIncomeIdr = taxableIncomePkpIdr;
      portionFacilityTaxAmountIdr = Math.round(taxableIncomePkpIdr * 0.11);
      portionNonFacilityTaxableIncomeIdr = 0;
      portionNonFacilityTaxAmountIdr = 0;
    } else {
      // Proportional calculation: (4.8 Miliar / Omzet) * PKP gets 11%, remainder gets 22%
      portionFacilityTaxableIncomeIdr = Math.floor(
        ((4_800_000_000 / input.grossRevenueIdr) * taxableIncomePkpIdr) / 1000
      ) * 1000;
      portionFacilityTaxAmountIdr = Math.round(portionFacilityTaxableIncomeIdr * 0.11);

      portionNonFacilityTaxableIncomeIdr = taxableIncomePkpIdr - portionFacilityTaxableIncomeIdr;
      portionNonFacilityTaxAmountIdr = Math.round(portionNonFacilityTaxableIncomeIdr * 0.22);
    }
  } else {
    portionNonFacilityTaxAmountIdr = Math.round(taxableIncomePkpIdr * 0.22);
  }

  const totalCorporateTaxPayableIdr =
    portionFacilityTaxAmountIdr + portionNonFacilityTaxAmountIdr;

  const totalTaxCreditsIdr =
    (input.taxCreditsIdr.pph22Idr || 0) +
    (input.taxCreditsIdr.pph23Idr || 0) +
    (input.taxCreditsIdr.pph25Idr || 0);

  const netTaxDueIdr = totalCorporateTaxPayableIdr - totalTaxCreditsIdr;
  let taxPosition: FiscalReconciliationResult['taxPosition'] = 'nihil';
  if (netTaxDueIdr > 0) taxPosition = 'kurang_bayar_pasal_29';
  else if (netTaxDueIdr < 0) taxPosition = 'lebih_bayar_pasal_28a';

  return {
    commercialProfitBeforeTaxIdr: input.commercialProfitBeforeTaxIdr,
    grossRevenueIdr: input.grossRevenueIdr,
    totalPositiveAdjustmentsIdr,
    totalNegativeAdjustmentsIdr,
    netFiscalProfitIdr: netFiscalProfit,
    lossCompensationAppliedIdr: lossComp,
    taxableIncomePkpIdr,
    isPasal31EEligible,
    corporateTaxCalculation: {
      portionFacilityTaxableIncomeIdr,
      portionFacilityTaxRate: 0.11,
      portionFacilityTaxAmountIdr,
      portionNonFacilityTaxableIncomeIdr,
      portionNonFacilityTaxRate: 0.22,
      portionNonFacilityTaxAmountIdr,
      totalCorporateTaxPayableIdr,
    },
    totalTaxCreditsIdr,
    netTaxDueIdr,
    taxPosition,
    ruleId: 'RULE-REKON-FISKAL-UU-HPP-2022',
    sourceRegulation: 'UU Pajak Penghasilan stdd UU HPP No. 7 Tahun 2021 Pasal 17 ayat 1b & Pasal 31E',
    effectiveDate: '2022-01-01',
    explanation: `Rekonsiliasi fiskal menghasilkan Penghasilan Kena Pajak (PKP) Rp ${taxableIncomePkpIdr.toLocaleString('id-ID')}. Total PPh Badan terutang Rp ${totalCorporateTaxPayableIdr.toLocaleString('id-ID')}, dikurangi kredit pajak Rp ${totalTaxCreditsIdr.toLocaleString('id-ID')}, menghasilkan PPh Kurang Bayar (Pasal 29) sebesar Rp ${netTaxDueIdr.toLocaleString('id-ID')}.`,
  };
}
