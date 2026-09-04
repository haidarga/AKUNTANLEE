type FinancialLine = Pick<
  import('@/types/domain-v4').WorkpaperLineItem,
  'lineId' | 'currentPeriodIdr'
>;

export interface FinancialRatioInputs {
  currentAssetsIdr: number;
  inventoryIdr: number;
  cashAndEquivalentsIdr: number;
  currentLiabilitiesIdr: number;
  totalLiabilitiesIdr: number;
  totalEquityIdr: number;
  totalAssetsIdr: number;
  revenueIdr: number;
  grossProfitIdr: number;
  operatingProfitIdr: number;
  netProfitIdr: number;
}

interface FinancialTotals {
  totalAssetsIdr: number;
  totalLiabilitiesIdr: number;
  totalEquityIdr: number;
  netIncomeIdr: number;
}

export function extractFinancialInputs(
  lines: FinancialLine[],
  totals: FinancialTotals,
): FinancialRatioInputs {
  const amount = (lineId: string) =>
    Math.abs(lines.find((line) => line.lineId === lineId)?.currentPeriodIdr || 0);

  const cash = amount('WP-A.1');
  const receivables = amount('WP-A.2');
  const inventory = amount('WP-A.4');
  const prepaid = amount('WP-A.5');
  const revenue = amount('WP-F.1');
  const cogs = amount('WP-F.2');
  const operatingExpenses = amount('WP-F.3');
  const grossProfit = revenue - cogs;

  return {
    currentAssetsIdr: cash + receivables + inventory + prepaid,
    inventoryIdr: inventory,
    cashAndEquivalentsIdr: cash,
    currentLiabilitiesIdr: amount('WP-C.1') + amount('WP-C.2') + amount('WP-C.3'),
    totalLiabilitiesIdr: totals.totalLiabilitiesIdr,
    totalEquityIdr: totals.totalEquityIdr,
    totalAssetsIdr: totals.totalAssetsIdr,
    revenueIdr: revenue,
    grossProfitIdr: grossProfit,
    operatingProfitIdr: grossProfit - operatingExpenses,
    netProfitIdr: totals.netIncomeIdr,
  };
}
