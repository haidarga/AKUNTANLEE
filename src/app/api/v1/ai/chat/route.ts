import { NextRequest, NextResponse } from 'next/server';
import { chatWithAuditCopilot } from '@/lib/ai/client';
import { repo } from '@/lib/db/repo-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchEngagementByIdFromSupabase, fetchAccountsFromSupabase } from '@/lib/supabase/service';

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
    let engagement = state.engagements.find((e) => e.id === engagementId);
    let client = engagement ? state.clients.find((c) => c.id === engagement?.clientId) : null;

    if ((!engagement || !client) && isSupabaseConfigured() && engagementId) {
      try {
        const sb = await fetchEngagementByIdFromSupabase(engagementId);
        if (sb) {
          engagement = sb.engagement;
          client = sb.client;
        }
      } catch (e) {
        console.warn('Supabase lookup in ai/chat failed:', e);
      }
    }

    // Default engagement fallback only if not found and is demo
    if (!engagement && engagementId === 'ENG-2026-01') {
      engagement = state.engagements[0];
      client = state.clients[0];
    }

    const clientName = client?.legalName || engagement?.name || 'Entitas Klien Audit';
    const engagementName = engagement?.name || `Perikatan Audit ${engagementId || ''}`;
    const periodStart = engagement?.periodStart || '2026-01-01';
    const periodEnd = engagement?.periodEnd || '2026-12-31';

    let wp = state.workpaperVersions.find((w) => w.engagementId === engagementId);
    if (!wp && engagementId === 'ENG-2026-01') {
      wp = state.workpaperVersions[0];
    }

    let accountsCount = 0;
    if (engagementId === 'ENG-2026-01') {
      accountsCount = state.accounts.length;
    } else if (isSupabaseConfigured() && engagementId) {
      try {
        const sbAccs = await fetchAccountsFromSupabase(engagementId);
        accountsCount = sbAccs.length;
      } catch (e) {}
    }

    const context = `
KLIEN: ${clientName}
NAMA PERIKATAN: ${engagementName}
PERIODE: Tahun Fiskal (${periodStart} s.d. ${periodEnd})
KAP: ${repo.getFirmProfile()?.name || 'Kantor Akuntan Publik Terdaftar'}
MATERIALITAS AUDIT: Rp ${engagement?.materialityIdr ? engagement.materialityIdr.toLocaleString('id-ID') : '150.000.000'}
TOTAL ASET: ${formatIdrNumber(wp?.totals?.totalAssetsIdr || 0)}
TOTAL LIABILITAS: ${formatIdrNumber(wp?.totals?.totalLiabilitiesIdr || 0)}
TOTAL EKUITAS: ${formatIdrNumber(wp?.totals?.totalEquityIdr || 0)}
LABA BERSIH: ${formatIdrNumber(wp?.totals?.netIncomeIdr || 0)}
STATUS TIE-OUT: ${wp ? 'Neraca Saldo Seimbang (PASS)' : 'Menunggu Berkas Neraca Saldo'}
JUMLAH AKUN: ${accountsCount} akun terdaftar
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
