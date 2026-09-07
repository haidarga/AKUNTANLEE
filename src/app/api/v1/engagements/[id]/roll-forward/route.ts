import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireSessionActor(req, ['partner']);
    const data = await getEngagementServerData(id);
    assertTenantAccess(user, data.engagement?.tenantId);
    const eng = repo.getState().engagements.find((e) => e.id === id);
    if (!eng) return NextResponse.json({ success: false, code: 'ENGAGEMENT_NOT_FOUND', error: 'Perikatan tidak ditemukan.' }, { status: 404 });

    const newEng = repo.createEngagement(
      {
        tenantId: user.tenantId,
        clientId: eng.clientId,
        name: `${eng.name.replace(/2026/g, '2027')} (Roll-Forward)`,
        periodStart: '2027-01-01',
        periodEnd: '2027-12-31',
        currency: 'IDR',
        materialityIdr: eng.materialityIdr,
        status: 'preparing',
        leadPartnerId: eng.leadPartnerId,
        managerId: eng.managerId,
        seniorId: eng.seniorId,
        preparerId: eng.preparerId,
      },
      user
    );

    return NextResponse.json({ success: true, data: newEng }, { status: 201 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
