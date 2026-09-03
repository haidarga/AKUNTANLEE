// FINOVA AI - Interactive "What-If" Sensitivity Simulator for Financial Consultants
// Solves: "Jika UMR naik 8%, HPP bengkak berapa dan harga jual harus naik berapa %?"

export interface WhatIfSimulationInputs {
  umrLaborHikePercent: number;        // e.g. 8% (0 - 25%)
  rawMaterialShockPercent: number;    // e.g. 10% (0 - 30%)
  logisticsEfficiencyPercent: number; // e.g. 15% (0 - 40%)
}

export interface WhatIfSimulationResults {
  baseModel: {
    revenueIdr: number;
    directMaterialsIdr: number;
    directLaborIdr: number;
    factoryOverheadIdr: number;
    totalCogmIdr: number;
    cogsIdr: number;
    logisticsExpenseIdr: number;
    netProfitIdr: number;
    netProfitMarginPercent: number;
  };
  simulatedModel: {
    newDirectLaborIdr: number;
    laborVarianceIdr: number;
    newDirectMaterialsIdr: number;
    materialVarianceIdr: number;
    newTotalCogmIdr: number;
    newCogsIdr: number;
    cogsVarianceIdr: number;
    newLogisticsExpenseIdr: number;
    logisticsSavingsIdr: number;
    newNetProfitUnadjustedIdr: number;
    newNetProfitMarginUnadjustedPercent: number;
    marginErosionPercent: number;
  };
  consultantRecommendations: {
    recommendedPriceMarkupPercent: number;
    adjustedRevenueIdr: number;
    restoredNetProfitIdr: number;
    executiveAdviceHeadline: string;
    actionSteps: string[];
  };
}

export function runWhatIfSimulation(inputs: WhatIfSimulationInputs): WhatIfSimulationResults {
  const { umrLaborHikePercent, rawMaterialShockPercent, logisticsEfficiencyPercent } = inputs;

  // Base production figures from PT Nusantara Sukses Makmur
  const baseRevenue = 24_000_000_000;
  const baseDm = 4_250_000_000;
  const baseDl = 1_680_000_000;
  const baseBop = 1_520_000_000;
  const baseCogm = 7_490_000_000;
  const baseCogs = 7_550_000_000;
  const baseLogistics = 1_850_000_000;
  const baseNetProfit = 4_250_000_000;
  const baseNpm = (baseNetProfit / baseRevenue) * 100; // 17.7% / 8.1%

  // 1. Direct Labor Hike (UMR effect)
  const laborHikeFactor = umrLaborHikePercent / 100;
  const newDl = Math.round(baseDl * (1 + laborHikeFactor));
  const laborVariance = newDl - baseDl;

  // 2. Raw Material Shock
  const materialShockFactor = rawMaterialShockPercent / 100;
  const newDm = Math.round(baseDm * (1 + materialShockFactor));
  const materialVariance = newDm - baseDm;

  // 3. Simulated COGM & COGS
  const totalCostAddedIncrease = laborVariance + materialVariance;
  const newCogm = baseCogm + totalCostAddedIncrease;
  const newCogs = baseCogs + totalCostAddedIncrease;
  const cogsVariance = newCogs - baseCogs;

  // 4. Logistics Savings
  const logisticsSavingsFactor = logisticsEfficiencyPercent / 100;
  const logisticsSavings = Math.round(baseLogistics * logisticsSavingsFactor);
  const newLogistics = baseLogistics - logisticsSavings;

  // 5. Unadjusted Net Profit (If Selling Price Stays Constant)
  const netProfitImpact = -cogsVariance + logisticsSavings;
  const newNetProfitUnadjusted = baseNetProfit + netProfitImpact;
  const newNpmUnadjusted = (newNetProfitUnadjusted / baseRevenue) * 100;
  const marginErosion = Number((baseNpm - newNpmUnadjusted).toFixed(2));

  // 6. Required Price Markup to neutralize COGS increase
  // To protect base profit: Target Revenue = Base Revenue + COGS Increase - Logistics Savings
  const requiredRevenueAddition = Math.max(0, cogsVariance - logisticsSavings);
  const recommendedPriceMarkup = Number(((requiredRevenueAddition / baseRevenue) * 100).toFixed(2));
  const adjustedRevenue = baseRevenue + requiredRevenueAddition;
  const restoredNetProfit = adjustedRevenue - newCogs - (12_200_000_000 - baseLogistics + newLogistics);

  return {
    baseModel: {
      revenueIdr: baseRevenue,
      directMaterialsIdr: baseDm,
      directLaborIdr: baseDl,
      factoryOverheadIdr: baseBop,
      totalCogmIdr: baseCogm,
      cogsIdr: baseCogs,
      logisticsExpenseIdr: baseLogistics,
      netProfitIdr: baseNetProfit,
      netProfitMarginPercent: Number(baseNpm.toFixed(1)),
    },
    simulatedModel: {
      newDirectLaborIdr: newDl,
      laborVarianceIdr: laborVariance,
      newDirectMaterialsIdr: newDm,
      materialVarianceIdr: materialVariance,
      newTotalCogmIdr: newCogm,
      newCogsIdr: newCogs,
      cogsVarianceIdr: cogsVariance,
      newLogisticsExpenseIdr: newLogistics,
      logisticsSavingsIdr: logisticsSavings,
      newNetProfitUnadjustedIdr: newNetProfitUnadjusted,
      newNetProfitMarginUnadjustedPercent: Number(newNpmUnadjusted.toFixed(2)),
      marginErosionPercent: marginErosion,
    },
    consultantRecommendations: {
      recommendedPriceMarkupPercent: recommendedPriceMarkup,
      adjustedRevenueIdr: adjustedRevenue,
      restoredNetProfitIdr: restoredNetProfit,
      executiveAdviceHeadline: `Analisis Sensitivitas: Penyesuaian Harga Jual +${recommendedPriceMarkup}% Diperlukan untuk Menjaga Ketahanan Laba Bersih.`,
      actionSteps: [
        `Kenaikan UMR ${umrLaborHikePercent}% menambah beban upah pabrik sebesar Rp ${laborVariance.toLocaleString('id-ID')}/tahun.`,
        `Fluktuasi bahan baku ${rawMaterialShockPercent}% mendongkrak HPP manufaktur sebesar Rp ${materialVariance.toLocaleString('id-ID')}.`,
        logisticsEfficiencyPercent > 0
          ? `Efisiensi logistik ${logisticsEfficiencyPercent}% berhasil memitigasi Rp ${logisticsSavings.toLocaleString('id-ID')}, meredam kebutuhan lonjakan harga.`
          : 'Belum ada efisiensi logistik yang diaktifkan untuk meredam lonjakan biaya.',
        `Untuk mempertahankan target laba bersih Rp 4.25 Milyar, lakukan penyesuaian harga jual minimum +${recommendedPriceMarkup}% secara bertahap pada kuartal mendatang.`,
      ],
    },
  };
}
