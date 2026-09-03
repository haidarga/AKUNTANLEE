import { NextResponse } from 'next/server';
import { runFiscalReconciliation } from '@/lib/tax-engine/fiscal-reconciliation';
import { calculatePph21MonthlyTer } from '@/lib/tax-engine/pph21-ter';
import { calculatePph23 } from '@/lib/tax-engine/pph23';
import { reconcilePpn } from '@/lib/tax-engine/ppn';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taxType, payload } = body;

    switch (taxType) {
      case 'fiscal_reconciliation': {
        const result = runFiscalReconciliation(payload);
        return NextResponse.json({ success: true, result });
      }
      case 'pph21_ter': {
        const { employeeName, ptkp, grossIncomeIdr } = payload;
        const result = calculatePph21MonthlyTer(employeeName, ptkp, grossIncomeIdr);
        return NextResponse.json({ success: true, result });
      }
      case 'pph23': {
        const result = calculatePph23(payload);
        return NextResponse.json({ success: true, result });
      }
      case 'ppn': {
        const result = reconcilePpn(payload);
        return NextResponse.json({ success: true, result });
      }
      default:
        return NextResponse.json({ error: `Unsupported taxType: ${taxType}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
