import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import {
  DEFAULT_COMPANY_EMPLOYEES,
  calculateMonthlyPph21,
  calculateAnnualPph21Pasal17,
  getPtkpAnnualAmount,
} from '@/lib/tax/pph21';
import {
  generateDefaultPpnFilings,
  calculatePpnEqualization,
} from '@/lib/tax/ppn-equalization';
import { calculateCorporateFiscalReconciliation } from '@/lib/tax/fiscal-reconciliation';

export async function GET(request: Request) {
  try {
    const state = repo.getState();
    const wpVersion = state.workpaperVersions[0];
    const revenueLine = state.workpaperLines.find((l) => l.lineId === 'WP-F.1');
    const netProfitLine = state.workpaperLines.find((l) => l.lineId === 'WP-E.2');

    const turnover = revenueLine ? revenueLine.currentPeriodIdr : 24_000_000_000;
    const netProfit = netProfitLine ? netProfitLine.currentPeriodIdr : 4_250_000_000;

    // 1. PPh 21 Calculations
    const monthlyCalculations = DEFAULT_COMPANY_EMPLOYEES.map((emp) => calculateMonthlyPph21(emp));
    const totalMonthlyPph21 = monthlyCalculations.reduce((s, c) => s + c.monthlyPph21Idr, 0);

    const annualReconciliations = DEFAULT_COMPANY_EMPLOYEES.map((emp) => {
      const annualGross = (emp.monthlyGrossSalaryIdr + emp.monthlyAllowanceIdr) * 12;
      const biayaJabatan = Math.min(6_000_000, annualGross * 0.05);
      const net = annualGross - biayaJabatan;
      const ptkp = getPtkpAnnualAmount(emp.ptkpStatus);
      const pkp = Math.max(0, net - ptkp);
      const annualTax = calculateAnnualPph21Pasal17(pkp);
      const janToNovTer = monthlyCalculations.find((m) => m.employeeId === emp.id)!.monthlyPph21Idr * 11;
      const decTax = Math.max(0, annualTax - janToNovTer);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        annualGrossIncomeIdr: annualGross,
        biayaJabatanIdr: biayaJabatan,
        netIncomeIdr: net,
        ptkpAmountIdr: ptkp,
        taxableIncomeIdr: pkp,
        annualPph21TarifPasal17Idr: annualTax,
        totalPph21TerJanToNovIdr: janToNovTer,
        decemberPph21Idr: decTax,
      };
    });

    // 2. PPN Equalization
    const ppnFilings = generateDefaultPpnFilings(turnover);
    const ppnEqualization = calculatePpnEqualization(turnover, ppnFilings);

    // 3. Corporate Fiscal Reconciliation
    const corporateFiscal = calculateCorporateFiscalReconciliation(netProfit, turnover);

    return NextResponse.json({
      success: true,
      data: {
        turnoverIdr: turnover,
        netProfitIdr: netProfit,
        pph21: {
          monthlyList: monthlyCalculations,
          totalMonthlyWithholdingIdr: totalMonthlyPph21,
          annualReconciliationList: annualReconciliations,
          totalAnnualWithholdingIdr: annualReconciliations.reduce((s, a) => s + a.annualPph21TarifPasal17Idr, 0),
        },
        ppn: {
          filings: ppnFilings,
          equalization: ppnEqualization,
        },
        corporateTax: corporateFiscal,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
