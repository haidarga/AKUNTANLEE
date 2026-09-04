import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { calculateFinancialRatios } from '@/lib/advisory/ratios';
import { analyzeCostAnomaliesAndAdvise } from '@/lib/advisory/cost-anomaly-analyzer';
import { calculateManufacturingBreakdown } from '@/lib/advisory/manufacturing-breakdown';

export async function GET(request: Request) {
  try {
    const state = repo.getState();

    // Extract balance sheet & income statement lines
    const lineCurrentAssets = state.workpaperLines.find((l) => l.lineId === 'WP-A.1')?.currentPeriodIdr || 4_500_000_000;
    const lineReceivables = state.workpaperLines.find((l) => l.lineId === 'WP-A.2')?.currentPeriodIdr || 9_850_000_000;
    const lineInventory = state.workpaperLines.find((l) => l.lineId === 'WP-A.4')?.currentPeriodIdr || 4_350_000_000;
    const lineCash = lineCurrentAssets; // WP-A.1 is Cash & Bank

    const totalCurrentAssets = lineCash + lineReceivables + lineInventory;
    const totalAssets = 34_550_000_000;

    const lineCurrentLiab = state.workpaperLines.find((l) => l.lineId === 'WP-C.1')?.currentPeriodIdr || 6_240_000_000;
    const wpTotals = state.workpaperVersions[0]?.totals;
    const totalLiabilities = wpTotals ? wpTotals.totalLiabilitiesIdr : 12_050_000_000;
    const totalEquity = wpTotals ? wpTotals.totalEquityIdr : 22_500_000_000;

    const revenue = state.workpaperLines.find((l) => l.lineId === 'WP-F.1')?.currentPeriodIdr || 24_000_000_000;
    const cogs = state.workpaperLines.find((l) => l.lineId === 'WP-F.2')?.currentPeriodIdr || 7_550_000_000;
    const grossProfit = revenue - cogs; // 16.45 M
    const opex = state.workpaperLines.find((l) => l.lineId === 'WP-F.3')?.currentPeriodIdr || 12_200_000_000;
    const operatingProfit = grossProfit - opex;
    const netProfit = wpTotals ? wpTotals.netIncomeIdr : 4_560_000_000;

    // 1. Ratios Scorecard
    const ratios = calculateFinancialRatios({
      currentAssetsIdr: totalCurrentAssets,
      inventoryIdr: lineInventory,
      cashAndEquivalentsIdr: lineCash,
      currentLiabilitiesIdr: lineCurrentLiab,
      totalLiabilitiesIdr: totalLiabilities,
      totalEquityIdr: totalEquity,
      totalAssetsIdr: totalAssets,
      revenueIdr: revenue,
      grossProfitIdr: grossProfit,
      operatingProfitIdr: operatingProfit,
      netProfitIdr: netProfit,
    });

    // 2. Cost Anomaly & "What's Next" Roadmap
    const costAdvisory = analyzeCostAnomaliesAndAdvise({
      annualRevenueIdr: revenue,
    });

    // 3. Manufacturing Breakdown (COGM)
    const manufacturing = calculateManufacturingBreakdown({
      targetCogsIdr: cogs,
    });

    return NextResponse.json({
      success: true,
      data: {
        ratios,
        costAdvisory,
        manufacturing,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
