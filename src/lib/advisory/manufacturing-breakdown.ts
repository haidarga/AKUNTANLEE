// FINOVA AI - Manufacturing Accounting & COGM Engine (Solves Manufaktur Complexity)
// Standard: Kertas Kerja Harga Pokok Produksi (Cost of Goods Manufactured / COGM Schedule)

export interface ManufacturingCostBreakdown {
  periodYear: string;
  directMaterials: {
    beginningInventoryIdr: number;
    rawMaterialPurchasesIdr: number;
    freightInIdr: number;
    purchaseReturnsIdr: number;
    totalAvailableForUseIdr: number;
    endingInventoryIdr: number;
    directMaterialsUsedIdr: number; // Unsur 1
    percentageOfTotalCost: number;
  };
  directLabor: {
    assemblyOperatorsWagesIdr: number;
    fabricationTechniciansWagesIdr: number;
    overtimeProductionWagesIdr: number;
    totalDirectLaborIdr: number; // Unsur 2 (BTKL)
    percentageOfTotalCost: number;
  };
  manufacturingOverhead: {
    factoryUtilitiesAndPowerIdr: number;
    machineryDepreciationIdr: number;
    indirectMaterialsSuppliesIdr: number;
    factorySupervisionWagesIdr: number;
    factoryInsuranceAndMaintenanceIdr: number;
    totalManufacturingOverheadIdr: number; // Unsur 3 (BOP)
    percentageOfTotalCost: number;
  };
  totalManufacturingCostsAddedIdr: number; // Unsur 1 + 2 + 3
  workInProcess: {
    beginningWipIdr: number;
    endingWipIdr: number;
    netWipChangeIdr: number;
  };
  costOfGoodsManufacturedIdr: number; // Harga Pokok Produksi (COGM)
  finishedGoods: {
    beginningFinishedGoodsIdr: number;
    endingFinishedGoodsIdr: number;
    costOfGoodsSoldIdr: number; // HPP Penjualan (COGS)
  };
  keyEfficiencyMetrics: {
    directMaterialToCogmRatio: number;
    directLaborToCogmRatio: number;
    overheadToCogmRatio: number;
    unitCostBenchmarkDescription: string;
  };
}

export function calculateManufacturingBreakdown(params?: {
  targetCogsIdr?: number;
}): ManufacturingCostBreakdown {
  // Calibrated for PT Nusantara Sukses Makmur manufacturing operations
  const dmUsed = 4_250_000_000;
  const dlUsed = 1_680_000_000;
  const mfgOverhead = 1_520_000_000;
  const totalAdded = dmUsed + dlUsed + mfgOverhead; // Rp 7.45 Milyar

  const begWip = 420_000_000;
  const endWip = 380_000_000;
  const cogm = totalAdded + begWip - endWip; // Rp 7.49 Milyar

  const begFg = 650_000_000;
  const endFg = 590_000_000;
  const cogs = cogm + begFg - endFg; // Rp 7.55 Milyar

  return {
    periodYear: '2025',
    directMaterials: {
      beginningInventoryIdr: 850_000_000,
      rawMaterialPurchasesIdr: 4_100_000_000,
      freightInIdr: 120_000_000,
      purchaseReturnsIdr: 70_000_000,
      totalAvailableForUseIdr: 5_000_000_000,
      endingInventoryIdr: 750_000_000,
      directMaterialsUsedIdr: dmUsed,
      percentageOfTotalCost: Number(((dmUsed / totalAdded) * 100).toFixed(1)),
    },
    directLabor: {
      assemblyOperatorsWagesIdr: 1_120_000_000,
      fabricationTechniciansWagesIdr: 380_000_000,
      overtimeProductionWagesIdr: 180_000_000,
      totalDirectLaborIdr: dlUsed,
      percentageOfTotalCost: Number(((dlUsed / totalAdded) * 100).toFixed(1)),
    },
    manufacturingOverhead: {
      factoryUtilitiesAndPowerIdr: 480_000_000,
      machineryDepreciationIdr: 520_000_000,
      indirectMaterialsSuppliesIdr: 190_000_000,
      factorySupervisionWagesIdr: 210_000_000,
      factoryInsuranceAndMaintenanceIdr: 120_000_000,
      totalManufacturingOverheadIdr: mfgOverhead,
      percentageOfTotalCost: Number(((mfgOverhead / totalAdded) * 100).toFixed(1)),
    },
    totalManufacturingCostsAddedIdr: totalAdded,
    workInProcess: {
      beginningWipIdr: begWip,
      endingWipIdr: endWip,
      netWipChangeIdr: begWip - endWip,
    },
    costOfGoodsManufacturedIdr: cogm,
    finishedGoods: {
      beginningFinishedGoodsIdr: begFg,
      endingFinishedGoodsIdr: endFg,
      costOfGoodsSoldIdr: cogs,
    },
    keyEfficiencyMetrics: {
      directMaterialToCogmRatio: Number(((dmUsed / cogm) * 100).toFixed(1)),
      directLaborToCogmRatio: Number(((dlUsed / cogm) * 100).toFixed(1)),
      overheadToCogmRatio: Number(((mfgOverhead / cogm) * 100).toFixed(1)),
      unitCostBenchmarkDescription: 'Struktur biaya didominasi bahan baku (57.0%), sejalan dengan karakteristik industri manufaktur komponen presisi di Jawa Barat.',
    },
  };
}
