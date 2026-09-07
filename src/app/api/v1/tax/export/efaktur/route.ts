import { NextRequest, NextResponse } from 'next/server';
import { generateDefaultPpnFilings } from '@/lib/tax/ppn-equalization';
import { generateEFakturPpnCsv } from '@/lib/tax/djp-exporter';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';

export async function GET(request: NextRequest) {
  try {
    const engagementId = request.nextUrl.searchParams.get('engagementId');
    if (!engagementId) return NextResponse.json({ error: 'engagementId wajib diisi.' }, { status: 400 });
    const actor = await requireSessionActor(request);
    const canonical = await getEngagementServerData(engagementId);
    assertTenantAccess(actor, canonical.engagement?.tenantId);

    // Derive turnover from the engagement's own mapped Revenue line (WP-F.1)
    // instead of a fixed placeholder — the earlier hardcoded 52.4B figure
    // never reflected what the client actually uploaded.
    const revenueLine = canonical.lines.find((l) => l.lineId === 'WP-F.1');
    const turnoverIdr = Math.abs(revenueLine?.currentPeriodIdr || 0);
    if (turnoverIdr <= 0) {
      return NextResponse.json({ error: 'Belum ada data pendapatan (Neraca Saldo) tersimpan untuk perikatan ini.' }, { status: 409 });
    }

    const periodYear = canonical.engagement?.periodEnd?.slice(0, 4) || '2026';
    const filings = generateDefaultPpnFilings(turnoverIdr);
    const csvContent = generateEFakturPpnCsv(filings, periodYear);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="DJP_eFaktur_PajakKeluaran_FY${periodYear}.csv"`,
      },
    });
  } catch (err: any) {
    return authorizationErrorResponse(err) || NextResponse.json({ error: err.message }, { status: 500 });
  }
}
