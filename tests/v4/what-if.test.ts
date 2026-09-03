import { describe, it, expect } from 'vitest';
import { runWhatIfSimulation } from '../../src/lib/advisory/what-if-simulator';

describe('Consultant "What-If" Sensitivity & Price Markup Simulator', () => {
  it('accurately computes cost swelling when UMR increases by 8%', () => {
    const res = runWhatIfSimulation({
      umrLaborHikePercent: 8,
      rawMaterialShockPercent: 0,
      logisticsEfficiencyPercent: 0,
    });

    // 8% of 1.68 Milyar BTKL = 134,400,000
    expect(res.simulatedModel.laborVarianceIdr).toBe(134_400_000);
    expect(res.simulatedModel.cogsVarianceIdr).toBe(134_400_000);
    expect(res.simulatedModel.newTotalCogmIdr).toBe(res.baseModel.totalCogmIdr + 134_400_000);

    // Recommended Price Markup to neutralize: 134.4jt / 24M = 0.56%
    expect(res.consultantRecommendations.recommendedPriceMarkupPercent).toBe(0.56);
  });

  it('computes compound impact of 8% UMR hike + 10% Raw Material shock with 15% logistics mitigation', () => {
    const res = runWhatIfSimulation({
      umrLaborHikePercent: 8,
      rawMaterialShockPercent: 10,
      logisticsEfficiencyPercent: 15,
    });

    expect(res.simulatedModel.laborVarianceIdr).toBe(134_400_000);
    expect(res.simulatedModel.materialVarianceIdr).toBe(425_000_000); // 10% of 4.25M
    expect(res.simulatedModel.logisticsSavingsIdr).toBe(277_500_000); // 15% of 1.85M

    // Net required addition = (134.4M + 425M) - 277.5M = 281.9M
    // 281.9M / 24M = 1.17%
    expect(res.consultantRecommendations.recommendedPriceMarkupPercent).toBe(1.17);
    expect(res.consultantRecommendations.actionSteps.length).toBeGreaterThan(2);
  });
});
