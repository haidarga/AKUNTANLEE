import { describe, it, expect } from 'vitest';
import {
  calculateTerRate,
  calculateMonthlyPph21,
  calculateAnnualPph21Pasal17,
  getPtkpAnnualAmount,
  getTerCategory,
  DEFAULT_COMPANY_EMPLOYEES,
} from '../../src/lib/tax/pph21';
import {
  generateDefaultPpnFilings,
  calculatePpnEqualization,
} from '../../src/lib/tax/ppn-equalization';
import { calculateCorporateFiscalReconciliation } from '../../src/lib/tax/fiscal-reconciliation';

describe('Indonesian Tax Intelligence Engine (PP 58/2023, PPN 1111, SPT 1771)', () => {
  describe('PPh 21 TER Engine', () => {
    it('verifies strict accounting invariant Gross - NonCashBenefits - PPh21 = TakeHomePay for all staff', () => {
      for (const emp of DEFAULT_COMPANY_EMPLOYEES) {
        const result = calculateMonthlyPph21(emp);
        const cashSalary = emp.monthlyGrossSalaryIdr + emp.monthlyAllowanceIdr;
        const nonCash = emp.bpjsKetenagakerjaanPaidByCompanyIdr + emp.bpjsKesehatanPaidByCompanyIdr;

        // Invariant 1: Gross Income equals cash salary plus non-cash benefits
        expect(result.grossIncomeIdr).toBe(cashSalary + nonCash);

        // Invariant 2: Take Home Pay equals cash earnings minus monthly tax
        expect(result.takeHomePayIdr).toBe(cashSalary - result.monthlyPph21Idr);

        // Invariant 3: Gross - NonCash - Tax = THP
        expect(result.grossIncomeIdr - nonCash - result.monthlyPph21Idr).toBe(result.takeHomePayIdr);
      }
    });

    it('correctly maps PTKP to TER Categories A, B, and C', () => {
      expect(getTerCategory('TK/0')).toBe('A');
      expect(getTerCategory('K/0')).toBe('A');
      expect(getTerCategory('TK/1')).toBe('A');
      expect(getTerCategory('K/1')).toBe('B');
      expect(getTerCategory('TK/2')).toBe('B');
      expect(getTerCategory('K/3')).toBe('C');
    });

    it('determines exact TER rates for salary brackets', () => {
      // Below 5.4jt -> 0%
      expect(calculateTerRate(5_000_000, 'A')).toBe(0);
      // 8.5jt in TER A -> 1.5%
      expect(calculateTerRate(8_500_000, 'A')).toBe(1.5);
      // 22jt in TER B -> 9%
      expect(calculateTerRate(22_000_000, 'B')).toBe(9);
      // 45jt in TER B -> 18%
      expect(calculateTerRate(45_000_000, 'B')).toBe(18);
    });

    it('calculates monthly PPh 21 and Take Home Pay accurately', () => {
      const staff = {
        id: 'EMP-TEST-01',
        name: 'Staff Test',
        position: 'Akuntan Junior',
        ptkpStatus: 'TK/0' as const,
        terCategory: 'A' as const,
        monthlyGrossSalaryIdr: 8_000_000,
        monthlyAllowanceIdr: 500_000,
        bpjsKetenagakerjaanPaidByCompanyIdr: 200_000,
        bpjsKesehatanPaidByCompanyIdr: 100_000,
      };

      const result = calculateMonthlyPph21(staff);
      expect(result.grossIncomeIdr).toBe(8_800_000);
      expect(result.terRatePercent).toBe(1.75);
      // 1.75% of 8.8jt = 154,000
      expect(result.monthlyPph21Idr).toBe(154_000);
      expect(result.takeHomePayIdr).toBe(8_500_000 - 154_000);
    });

    it('computes annual progressive Pasal 17 UU HPP tax', () => {
      // 0 tax for zero PKP
      expect(calculateAnnualPph21Pasal17(0)).toBe(0);
      // 50jt PKP -> 5% = 2.5jt
      expect(calculateAnnualPph21Pasal17(50_000_000)).toBe(2_500_000);
      // 100jt PKP -> 60jt * 5% + 40jt * 15% = 3jt + 6jt = 9jt
      expect(calculateAnnualPph21Pasal17(100_000_000)).toBe(9_000_000);
    });
  });

  describe('PPN Equalization Engine (SPT Masa 1111 vs Laba Rugi)', () => {
    it('generates 12 monthly PPN filings and balances against accounting revenue', () => {
      const revenue = 24_000_000_000;
      const filings = generateDefaultPpnFilings(revenue);
      expect(filings.length).toBe(12);

      const report = calculatePpnEqualization(revenue, filings);
      expect(report.totalDppSptPpnIdr).toBeGreaterThan(0);
      expect(report.isBalanced).toBe(true);
      expect(report.unexplainedDifferenceIdr).toBe(0);
      expect(report.taxAuditRiskLevel).toBe('LOW');
    });
  });

  describe('Corporate Fiscal Reconciliation (SPT 1771)', () => {
    it('calculates positive and negative fiscal adjustments and Article 31E facility', () => {
      const commercialProfit = 4_250_000_000;
      const turnover = 24_000_000_000;

      const report = calculateCorporateFiscalReconciliation(commercialProfit, turnover);

      expect(report.totalPositiveCorrectionIdr).toBeGreaterThan(0);
      expect(report.totalNegativeCorrectionIdr).toBeGreaterThan(0);
      expect(report.hasArticle31EFacility).toBe(true); // < 50M turnover
      expect(report.effectiveTaxAmountIdr).toBeGreaterThan(0);
      expect(report.underpaymentArticle29Idr).toBeGreaterThanOrEqual(0);
    });
  });
});
