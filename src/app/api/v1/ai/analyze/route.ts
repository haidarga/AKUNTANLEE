import { NextRequest, NextResponse } from 'next/server';
import { analyzeAccountWithAI } from '@/lib/ai/client';
import { authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';

export async function POST(req: NextRequest) {
  try {
    await requireSessionActor(req);
    const body = await req.json();
    const { accountCode, accountName, amountIdr, currentProposedTarget, clientIndustry } = body;

    if (!accountCode || !accountName) {
      return NextResponse.json(
        { error: 'accountCode and accountName are required' },
        { status: 400 }
      );
    }

    const result = await analyzeAccountWithAI({
      accountCode,
      accountName,
      amountIdr: Number(amountIdr || 0),
      currentProposedTarget,
      clientIndustry: clientIndustry || 'Manufaktur & Perdagangan',
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    console.error('Error in /api/v1/ai/analyze:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to analyze account with AI' },
      { status: 500 }
    );
  }
}
