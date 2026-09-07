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
    return NextResponse.json({ success: true, data: repo.getReviewerNotes(id) });
  } catch (error) {
    return authorizationErrorResponse(error) || NextResponse.json({ success: false, error: 'Gagal memuat catatan review.' }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const user = await requireSessionActor(req);
    const data = await getEngagementServerData(id);
    assertTenantAccess(user, data.engagement?.tenantId);
    if (!body.content?.trim()) {
      return NextResponse.json({ success: false, code: 'INVALID_NOTE', error: 'Isi catatan review wajib diisi.' }, { status: 400 });
    }

    const note = repo.addReviewerNote(
      {
        tenantId: user.tenantId,
        engagementId: id,
        targetLineId: body.targetLineId || 'WP-GENERAL',
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        content: body.content,
        status: 'open',
      },
      user
    );

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await requireSessionActor(req, ['manager', 'partner']);

    const updated = repo.resolveReviewerNote(body.noteId, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
