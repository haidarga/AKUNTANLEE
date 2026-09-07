import { NextRequest, NextResponse } from 'next/server';
import { chatWithAuditCopilot } from '@/lib/ai/client';
import { formatIdrNumber } from '@/lib/decimal';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import {
  assertTenantAccess,
  authorizationErrorResponse,
  requireSessionActor,
} from '@/lib/auth/authorization';

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_CHARS = 20_000;

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSessionActor(req);
    const body = await req.json();
    const { messages, engagementId } = body;

    if (!engagementId || typeof engagementId !== 'string') {
      return NextResponse.json({ error: 'engagementId is required' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    const normalizedMessages = messages.map((message: any) => ({
      role: message?.role,
      content: typeof message?.content === 'string' ? message.content.trim() : '',
    }));
    const totalChars = normalizedMessages.reduce((sum: number, message: any) => sum + message.content.length, 0);
    if (
      normalizedMessages.length > MAX_MESSAGES ||
      totalChars > MAX_TOTAL_CHARS ||
      normalizedMessages.some((message: any) =>
        !['user', 'assistant'].includes(message.role) ||
        !message.content ||
        message.content.length > MAX_MESSAGE_CHARS
      )
    ) {
      return NextResponse.json({ error: 'Conversation payload exceeds the permitted limits.' }, { status: 400 });
    }

    const canonical = await getEngagementServerData(engagementId);
    const { engagement, client, workpaper: wp, accounts, checks } = canonical;
    assertTenantAccess(actor, engagement?.tenantId);

    const clientName = client?.legalName || engagement?.name || 'Entitas Klien Audit';
    const engagementName = engagement?.name || `Perikatan Audit ${engagementId || ''}`;
    const periodStart = engagement?.periodStart || '2026-01-01';
    const periodEnd = engagement?.periodEnd || '2026-12-31';

    const blockingChecks = checks.filter((check) => check.status === 'fail');
    const tieOutStatus = !wp
      ? 'Menunggu Berkas Neraca Saldo'
      : blockingChecks.length === 0
        ? 'Neraca Saldo Seimbang (PASS)'
        : `Belum seimbang (${blockingChecks.length} pemeriksaan gagal)`;

    const context = `
KLIEN: ${clientName}
NAMA PERIKATAN: ${engagementName}
PERIODE: Tahun Fiskal (${periodStart} s.d. ${periodEnd})
KAP: Kantor Akuntan Publik pengguna aktif
MATERIALITAS AUDIT: Rp ${engagement?.materialityIdr ? engagement.materialityIdr.toLocaleString('id-ID') : '150.000.000'}
TOTAL ASET: ${formatIdrNumber(wp?.totals?.totalAssetsIdr || 0)}
TOTAL LIABILITAS: ${formatIdrNumber(wp?.totals?.totalLiabilitiesIdr || 0)}
TOTAL EKUITAS: ${formatIdrNumber(wp?.totals?.totalEquityIdr || 0)}
LABA BERSIH: ${formatIdrNumber(wp?.totals?.netIncomeIdr || 0)}
STATUS TIE-OUT: ${tieOutStatus}
JUMLAH AKUN: ${accounts.length} akun terdaftar
`;

    const result = await chatWithAuditCopilot(normalizedMessages, context);

    return NextResponse.json({
      success: true,
      reply: result.reply,
      model: result.model,
      latencyMs: result.latencyMs,
    });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    console.error('Error in /api/v1/ai/chat:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to chat with AI Copilot' },
      { status: 500 }
    );
  }
}
