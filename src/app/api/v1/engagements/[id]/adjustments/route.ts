import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireSessionActor(req);
    const data = await getEngagementServerData(id);
    assertTenantAccess(actor, data.engagement?.tenantId);
    return NextResponse.json({ success: true, data: repo.getAdjustments(id) });
  } catch (error) {
    return authorizationErrorResponse(error) || NextResponse.json({ success: false, error: 'Gagal memuat jurnal.' }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const user = await requireSessionActor(req);
    const data = await getEngagementServerData(id);
    assertTenantAccess(user, data.engagement?.tenantId);
    const debitAmountIdr = Number(body.debitAmountIdr) || 0;
    const creditAmountIdr = Number(body.creditAmountIdr) || 0;
    if (!body.description?.trim() || debitAmountIdr <= 0 || debitAmountIdr !== creditAmountIdr) {
      return NextResponse.json({ success: false, code: 'INVALID_ADJUSTMENT', error: 'Jurnal wajib memiliki deskripsi dan nilai debit/kredit positif yang seimbang.' }, { status: 400 });
    }

    const entry = repo.createAdjustmentEntry(
      {
        tenantId: user.tenantId,
        engagementId: id,
        entryNumber: body.entryNumber || repo.getAdjustments(id).length + 1,
        type: body.type || 'reclassification',
        referenceWp: body.referenceWp || 'WP-GENERAL',
        description: body.description,
        standardReference: body.standardReference || 'SAK Indonesia',
        debitLineId: body.debitLineId,
        debitAmountIdr,
        creditLineId: body.creditLineId,
        creditAmountIdr,
        preparedByUserId: user.id,
        preparedByName: user.name,
        status: 'draft',
      },
      user
    );

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
