import { NextResponse } from 'next/server';
import { runWhatIfSimulation } from '@/lib/advisory/what-if-simulator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { umrLaborHikePercent = 8, rawMaterialShockPercent = 10, logisticsEfficiencyPercent = 15 } = body;

    const results = runWhatIfSimulation({
      umrLaborHikePercent: Number(umrLaborHikePercent),
      rawMaterialShockPercent: Number(rawMaterialShockPercent),
      logisticsEfficiencyPercent: Number(logisticsEfficiencyPercent),
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
