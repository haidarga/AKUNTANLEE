import { NextRequest, NextResponse } from 'next/server';
import { chatWithAuditCopilot } from '@/lib/ai/client';
import { repo } from '@/lib/db/repo-v4';
import { formatIdrNumber } from '@/lib/decimal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, engagementId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    const state = repo.getState();
    const engagement = state.engagements.find((e) => e.id === engagementId) || state.engagements[0];
    const client = state.clients.find((c) => c.id === engagement?.clientId) || state.clients[0];
    const wp = state.workpaperVersions[0];
    const decisions = state.mappingDecisions;

    const context = `
KLIEN: ${client?.legalName || 'PT Nusantara Sukses Makmur'}
NAMA PERIKATAN: ${engagement?.name || 'Financial Review & Lead Schedule FY 2025'}
PERIODE: Tahun Fiskal 2025 (${engagement?.periodStart} s.d. ${engagement?.periodEnd})
KAP: KAP Tanudiredja, Wibisana, Rintis & Rekan
MATERIALITAS AUDIT: Rp ${engagement?.materialityIdr ? engagement.materialityIdr.toLocaleString('id-ID') : '250.000.000'}
TOTAL ASET: ${formatIdrNumber(wp?.totals?.totalAssetsIdr || 0)}
TOTAL LIABILITAS: ${formatIdrNumber(wp?.totals?.totalLiabilitiesIdr || 0)}
TOTAL EKUITAS: ${formatIdrNumber(wp?.totals?.totalEquityIdr || 0)}
LABA BERSIH: ${formatIdrNumber(wp?.totals?.netIncomeIdr || 0)}
STATUS TIE-OUT: Neraca Saldo Seimbang (PASS), Persamaan Neraca Terpenuhi (PASS)
JUMLAH AKUN: ${decisions.length} akun terdaftar
AKUN PERLU REVIEW: ${decisions.filter((d) => d.status === 'needs_review').map((d) => `${d.sourceAccountCode} ${d.sourceAccountName} (Rp ${d.amountIdr.toLocaleString('id-ID')})`).join(', ') || 'Semua akun telah dipetakan'}
`;

    const result = await chatWithAuditCopilot(messages, context);

    return NextResponse.json({
      success: true,
      reply: result.reply,
      model: result.model,
      latencyMs: result.latencyMs,
    });
  } catch (err: any) {
    console.error('Error in /api/v1/ai/chat:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to chat with AI Copilot' },
      { status: 500 }
    );
  }
}
