import { describe, it, expect } from 'vitest';
import {
  calculatePph21MonthlyTer,
  getTerCategory,
  calculateAnnualPasal17Tax,
} from '@/lib/tax-engine/pph21-ter';
import { calculatePph23 } from '@/lib/tax-engine/pph23';
import { reconcilePpn } from '@/lib/tax-engine/ppn';
import { runFiscalReconciliation } from '@/lib/tax-engine/fiscal-reconciliation';

describe('PPh 21 TER Engine (PP 58/2023 & PMK 168/2023)', () => {
  it('correctly maps PTKP status to TER Category', () => {
    expect(getTerCategory('TK/0')).toBe('A');
    expect(getTerCategory('K/0')).toBe('A');
    expect(getTerCategory('TK/1')).toBe('A');
    expect(getTerCategory('K/1')).toBe('B');
    expect(getTerCategory('TK/2')).toBe('B');
    expect(getTerCategory('K/3')).toBe('C');
  });

  it('calculates 0% TER for gross income <= 5.4M in Category A', () => {
    const res = calculatePph21MonthlyTer('Dewi Lestari', 'TK/0', 5_000_000);
    expect(res.category).toBe('A');
    expect(res.terRate).toBe(0.0);
    expect(res.terTaxWithheldIdr).toBe(0);
    expect(res.ruleId).toBe('RULE-PPH21-TER-A-2024');
  });

  it('calculates 1.25% TER for gross income 7M in Category A (Bracket > 6.75M - 7.5M)', () => {
    const res = calculatePph21MonthlyTer('Ahmad Pratama', 'TK/0', 7_000_000);
    expect(res.category).toBe('A');
    expect(res.terRate).toBe(0.0125);
    expect(res.terTaxWithheldIdr).toBe(87_500);
  });

  it('calculates December annual Pasal 17 reconciliation progressively', () => {
    // PKP 100M: 60M @ 5% = 3M + 40M @ 15% = 6M => 9M
    const tax = calculateAnnualPasal17Tax(100_000_000);
    expect(tax).toBe(9_000_000);
  });
});

describe('PPh 23 Withholding Engine (UU PPh Pasal 23)', () => {
  it('calculates 2% withholding on services for vendors with valid NPWP', () => {
    const res = calculatePph23({
      transactionId: 'TX-01',
      vendorName: 'PT Konsultan Mutu',
      vendorNpwp: '01.234.567.8-011.000',
      hasValidNpwp: true,
      category: 'jasa_teknik_manajemen_konsultasi',
      description: 'Jasa Konsultasi Manajemen ISO',
      dppAmountIdr: 50_000_000,
    });
    expect(res.statutoryRate).toBe(0.02);
    expect(res.effectiveRate).toBe(0.02);
    expect(res.withholdingTaxIdr).toBe(1_000_000);
    expect(res.netPayableIdr).toBe(49_000_000);
  });

  it('applies 100% surcharge (4% effective) for vendors without NPWP', () => {
    const res = calculatePph23({
      transactionId: 'TX-02',
      vendorName: 'CV Jasa Teknik Mandiri',
      hasValidNpwp: false,
      category: 'jasa_teknik_manajemen_konsultasi',
      description: 'Maintenance Mesin Pabrik',
      dppAmountIdr: 20_000_000,
    });
    expect(res.statutoryRate).toBe(0.02);
    expect(res.effectiveRate).toBe(0.04);
    expect(res.withholdingTaxIdr).toBe(800_000);
    expect(res.netPayableIdr).toBe(19_200_000);
  });
});

describe('PPN Reconciliation Engine (UU HPP 11%)', () => {
  it('correctly reconciles input and output VAT and flags rate anomaly', () => {
    const result = reconcilePpn([
      {
        fakturNumber: '010.000-25.00000001',
        transactionDate: '2025-05-10',
        counterpartyName: 'PT Pelanggan Utama',
        counterpartyNpwp: '01.111.222.3-011.000',
        dppAmountIdr: 100_000_000,
        ppnReportedIdr: 11_000_000, // Exact 11%
        type: 'keluaran',
        isCreditable: true,
      },
      {
        fakturNumber: '010.000-25.00000002',
        transactionDate: '2025-06-15',
        counterpartyName: 'PT Supplier Bahan',
        counterpartyNpwp: '01.333.444.5-012.000',
        dppAmountIdr: 50_000_000,
        ppnReportedIdr: 5_000_000, // Anomaly: 10% instead of 11% (Rp 5.5M)
        type: 'masukan',
        isCreditable: true,
      },
    ]);

    expect(result.totalPpnKeluaranIdr).toBe(11_000_000);
    expect(result.totalPpnMasukanCreditableIdr).toBe(5_000_000);
    expect(result.netPpnPositionIdr).toBe(6_000_000);
    expect(result.positionType).toBe('kurang_bayar');
    expect(result.anomaliesDetected.length).toBe(1);
    expect(result.anomaliesDetected[0].differenceIdr).toBe(500_000);
  });
});

describe('Fiscal Reconciliation Engine (Rekonsiliasi Fiskal PPh Badan)', () => {
  it('computes positive and negative corrections and applies 22% corporate tax rate', () => {
    const res = runFiscalReconciliation({
      commercialProfitBeforeTaxIdr: 4_250_000_000,
      grossRevenueIdr: 52_400_000_000, // > 50 Miliar (Non-Pasal 31E)
      adjustments: [
        {
          id: 'ADJ-1',
          accountCode: '6105-00',
          accountName: 'Biaya Entertainment Tanpa Daftar Nominatif',
          category: 'entertainment_tanpa_daftar_nominatif',
          adjustmentType: 'positif',
          nature: 'beda_tetap',
          commercialAmountIdr: 150_000_000,
          fiscalAllowedAmountIdr: 0,
          adjustmentAmountIdr: 150_000_000,
          statutoryBasis: 'SE-27/PJ.22/1986',
          description: 'Koreksi positif beban representasi tanpa nominatif',
        },
        {
          id: 'ADJ-2',
          accountCode: '7101-00',
          accountName: 'Pendapatan Bunga Deposito (PPh Final)',
          category: 'penghasilan_final_bunga_deposito',
          adjustmentType: 'negatif',
          nature: 'beda_tetap',
          commercialAmountIdr: 60_000_000,
          fiscalAllowedAmountIdr: 0,
          adjustmentAmountIdr: 60_000_000,
          statutoryBasis: 'PP 131/2000',
          description: 'Koreksi negatif bunga deposito telah dipotong PPh Final',
        },
      ],
      taxCreditsIdr: {
        pph22Idr: 50_000_000,
        pph23Idr: 70_000_000,
        pph25Idr: 700_000_000,
      },
    });

    // Net Fiscal Profit = 4.250M + 150M - 60M = 4.340M
    expect(res.netFiscalProfitIdr).toBe(4_340_000_000);
    expect(res.taxableIncomePkpIdr).toBe(4_340_000_000);
    expect(res.isPasal31EEligible).toBe(false);

    // 22% of 4.340M = 954.800.000
    expect(res.corporateTaxCalculation.totalCorporateTaxPayableIdr).toBe(954_800_000);
    // Credits = 820.000.000 -> Kurang Bayar = 134.800.000
    expect(res.totalTaxCreditsIdr).toBe(820_000_000);
    expect(res.netTaxDueIdr).toBe(134_800_000);
    expect(res.taxPosition).toBe('kurang_bayar_pasal_29');
  });
});
