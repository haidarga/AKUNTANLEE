import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const engagementId = body.engagementId || 'ENG-2026-01';
    const user = await requireSessionActor(request, ['senior', 'manager', 'partner']);
    const data = await getEngagementServerData(engagementId);
    assertTenantAccess(user, data.engagement?.tenantId);

    const wp = repo.recalculateWorkpaper(engagementId, user);
    return NextResponse.json({ data: wp, request_id: `req-${Date.now()}` }, { status: 202 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { code: 'CALCULATION_ERROR', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
