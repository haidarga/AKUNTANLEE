import { NextRequest, NextResponse } from 'next/server';
import { generateEBupot21Csv } from '@/lib/tax/djp-exporter';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import { getEngagementPayroll } from '@/lib/tax/payroll-store';

export async function GET(request: NextRequest) {
  try {
    const engagementId = request.nextUrl.searchParams.get('engagementId');
    if (!engagementId) return NextResponse.json({ error: 'engagementId wajib diisi.' }, { status: 400 });
    const actor = await requireSessionActor(request);
    const canonical = await getEngagementServerData(engagementId);
    assertTenantAccess(actor, canonical.engagement?.tenantId);
    const employees = await getEngagementPayroll(engagementId, actor.tenantId);
    if (!employees?.length) return NextResponse.json({ error: 'Belum ada payroll tersimpan untuk perikatan ini.' }, { status: 409 });
    const csvContent = generateEBupot21Csv(employees, canonical.engagement.periodEnd.slice(0, 4), '12');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="DJP_eBupot_PPh21_Masa_FY2026.csv"',
      },
    });
  } catch (err: any) {
    return authorizationErrorResponse(err) || NextResponse.json({ error: err.message }, { status: 500 });
  }
}
