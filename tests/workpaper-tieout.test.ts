import { describe, it, expect } from 'vitest';
import { suggestAccountMapping } from '@/lib/workpaper-engine/mapper';
import { runTieOutAndValidationChecks } from '@/lib/workpaper-engine/tie-out';

describe('Workpaper Account Mapping Engine', () => {
  it('correctly suggests mapping for standard Cash & Bank account with high confidence', () => {
    const res = suggestAccountMapping({
      code: '1112-00',
      name: 'Bank Mandiri Rek Giro Rupiah',
      beginningBalanceIdr: 1_000_000_000,
      debitIdr: 5_000_000_000,
      creditIdr: 4_500_000_000,
      endingBalanceIdr: 1_500_000_000,
      priorYearBalanceIdr: 1_000_000_000,
    });

    expect(res.standardWorkpaperSection).toBe('A.1');
    expect(res.category).toBe('asset');
    expect(res.confidenceScore).toBeGreaterThanOrEqual(0.9);
    expect(res.isAmbiguous).toBe(false);
  });

  it('routes suspicious suspense account to review queue as ambiguous', () => {
    const res = suggestAccountMapping({
      code: '2199-00',
      name: 'Akun Penampungan Selisih Kurs Sementara',
      beginningBalanceIdr: 0,
      debitIdr: 100_000_000,
      creditIdr: 50_000_000,
      endingBalanceIdr: 50_000_000,
      priorYearBalanceIdr: 0,
    });

    expect(res.isAmbiguous).toBe(true);
    expect(res.confidenceScore).toBeLessThan(0.7);
    expect(res.rationale).toContain('Akun penampungan/suspense terdeteksi');
  });
});

describe('Tie-Out & Anomaly Checks', () => {
  it('passes when Trial Balance and Balance Sheet are perfectly in balance', () => {
    const checks = runTieOutAndValidationChecks({
      engagementId: 'ENG-TEST',
      materialityThresholdIdr: 100_000_000,
      trialBalance: {
        totalDebitIdr: 10_000_000_000,
        totalCreditIdr: 10_000_000_000,
      },
      balanceSheet: {
        totalAssetsIdr: 25_000_000_000,
        totalLiabilitiesIdr: 10_000_000_000,
        totalEquityIdr: 15_000_000_000,
      },
      incomeStatement: {
        netIncomeBeforeTaxIdr: 2_000_000_000,
        taxExpenseIdr: 440_000_000,
        netIncomeAfterTaxIdr: 1_560_000_000,
      },
      retainedEarnings: {
        beginningIdr: 5_000_000_000,
        dividendsPaidIdr: 500_000_000,
        endingIdr: 6_060_000_000, // 5000 + 1560 - 500 = 6060
      },
    });

    const tbCheck = checks.find((c) => c.code === 'TIE-001');
    const bsCheck = checks.find((c) => c.code === 'TIE-002');
    const reCheck = checks.find((c) => c.code === 'TIE-003');

    expect(tbCheck?.isCleared).toBe(true);
    expect(bsCheck?.isCleared).toBe(true);
    expect(reCheck?.isCleared).toBe(true);
  });

  it('detects and flags unbalanced balance sheet as critical', () => {
    const checks = runTieOutAndValidationChecks({
      engagementId: 'ENG-TEST',
      materialityThresholdIdr: 100_000_000,
      trialBalance: {
        totalDebitIdr: 10_000_000_000,
        totalCreditIdr: 10_000_000_000,
      },
      balanceSheet: {
        totalAssetsIdr: 25_000_000_000,
        totalLiabilitiesIdr: 10_000_000_000,
        totalEquityIdr: 14_500_000_000, // Missing 500M!
      },
      incomeStatement: {
        netIncomeBeforeTaxIdr: 1_000_000_000,
        taxExpenseIdr: 220_000_000,
        netIncomeAfterTaxIdr: 780_000_000,
      },
      retainedEarnings: {
        beginningIdr: 1_000_000_000,
        dividendsPaidIdr: 0,
        endingIdr: 1_780_000_000,
      },
    });

    const bsCheck = checks.find((c) => c.code === 'TIE-002');
    expect(bsCheck?.severity).toBe('critical');
    expect(bsCheck?.differenceIdr).toBe(500_000_000);
    expect(bsCheck?.isCleared).toBe(false);
  });
});
