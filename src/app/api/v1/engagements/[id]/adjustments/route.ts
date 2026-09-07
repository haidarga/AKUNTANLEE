import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import { createPersistentAdjustment, getPersistentAdjustments } from '@/lib/audit/adjustment-store';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await requireSessionActor(req);
    const data = await getEngagementServerData(id);
    assertTenantAccess(actor, data.engagement?.tenantId);
    if (!isSupabaseConfigured() && !process.env.VITEST) {
      return NextResponse.json({ success: false, error: 'Database production belum dikonfigurasi; jurnal audit tidak boleh menggunakan penyimpanan sementara.' }, { status: 503 });
    }
    const persisted = await getPersistentAdjustments(id, actor.tenantId);
    if (process.env.VITEST && persisted === null) {
      return NextResponse.json({ success: true, data: repo.getAdjustments(id) });
    }
    if (persisted === null) {
      return NextResponse.json({ success: false, error: 'Gagal memuat jurnal dari database production.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, data: persisted });
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

    const adjustment = {
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
        status: 'draft' as const,
    };
    if (!isSupabaseConfigured() && !process.env.VITEST) {
      return NextResponse.json({ success: false, error: 'Database production belum dikonfigurasi; jurnal audit tidak boleh menggunakan penyimpanan sementara.' }, { status: 503 });
    }
    const entry = isSupabaseConfigured()
      ? await createPersistentAdjustment(adjustment, user)
      : repo.createAdjustmentEntry(adjustment, user);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Jurnal tidak tersimpan permanen. Periksa database sebelum melanjutkan.' }, { status: 503 });
    }

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
