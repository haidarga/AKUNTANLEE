import { describe, it, expect } from 'vitest';
import { calculateFinancialRatios } from '../../src/lib/advisory/ratios';
import { analyzeCostAnomaliesAndAdvise } from '../../src/lib/advisory/cost-anomaly-analyzer';
import { calculateManufacturingBreakdown } from '../../src/lib/advisory/manufacturing-breakdown';

describe('Consultant Advisory & Analytical Engine ("Logic Analytical")', () => {
  describe('Financial Health & Ratio Diagnostics', () => {
    it('computes 6 key ratios and overall health scorecard', () => {
      const scorecard = calculateFinancialRatios({
        currentAssetsIdr: 18_700_000_000,
        inventoryIdr: 4_350_000_000,
        cashAndEquivalentsIdr: 4_500_000_000,
        currentLiabilitiesIdr: 6_240_000_000,
        totalLiabilitiesIdr: 12_360_000_000,
        totalEquityIdr: 22_190_000_000,
        totalAssetsIdr: 34_550_000_000,
        revenueIdr: 24_000_000_000,
        grossProfitIdr: 16_450_000_000,
        operatingProfitIdr: 4_250_000_000,
        netProfitIdr: 4_250_000_000,
      });

      expect(scorecard.overallHealthScore).toBeGreaterThanOrEqual(80);
      expect(scorecard.ratingGrade).toContain('AAA');

      const cr = scorecard.metrics.find((m) => m.id === 'RATIO-CR');
      expect(cr?.value).toBeCloseTo(18_700_000_000 / 6_240_000_000, 1);
      expect(cr?.status).toBe('PRIME');

      const der = scorecard.metrics.find((m) => m.id === 'RATIO-DER');
      expect(der?.value).toBeCloseTo((12_360_000_000 / 22_190_000_000) * 100, 1);
      expect(der?.status).toBe('PRIME');
    });
  });

  describe('Cost Anomaly & What\'s Next Engine', () => {
    it('detects swelling expenses and provides 3-tier tactical roadmap', () => {
      const advisory = analyzeCostAnomaliesAndAdvise({
        annualRevenueIdr: 24_000_000_000,
      });

      expect(advisory.detectedAnomaliesCount).toBeGreaterThan(0);
      expect(advisory.totalCostLeakageRiskIdr).toBeGreaterThan(500_000_000);

      const anomaly = advisory.anomalies[0];
      expect(anomaly.whatsNextStrategy.immediateAction).toBeDefined();
      expect(anomaly.whatsNextStrategy.tacticalOptimization).toBeDefined();
      expect(anomaly.whatsNextStrategy.strategicGovernance).toBeDefined();
      expect(anomaly.whatsNextStrategy.estimatedCostSavingsIdr).toBeGreaterThan(0);
    });
  });

  describe('Manufacturing Accounting Complexity (COGM Engine)', () => {
    it('calculates 3 elements of manufacturing: Raw Materials, Direct Labor, and Factory Overhead', () => {
      const mfg = calculateManufacturingBreakdown();

      // Check 3 pillars sum up to total added
      const sumThreePillars = mfg.directMaterials.directMaterialsUsedIdr +
                              mfg.directLabor.totalDirectLaborIdr +
                              mfg.manufacturingOverhead.totalManufacturingOverheadIdr;
      expect(sumThreePillars).toBe(mfg.totalManufacturingCostsAddedIdr);

      // Check COGM equation: Total Added + Beg WIP - End WIP
      expect(mfg.costOfGoodsManufacturedIdr).toBe(
        mfg.totalManufacturingCostsAddedIdr + mfg.workInProcess.beginningWipIdr - mfg.workInProcess.endingWipIdr
      );

      // Check COGS equation: COGM + Beg FG - End FG
      expect(mfg.finishedGoods.costOfGoodsSoldIdr).toBe(
        mfg.costOfGoodsManufacturedIdr + mfg.finishedGoods.beginningFinishedGoodsIdr - mfg.finishedGoods.endingFinishedGoodsIdr
      );
    });
  });
});
