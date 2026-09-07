import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { decisions, action } = body;
    const user = await requireSessionActor(request, ['senior', 'manager', 'partner']);

    if (action === 'bulk_approve') {
      const count = repo.bulkApproveMappings(decisions, user);
      return NextResponse.json({ success: true, count, request_id: `req-${Date.now()}` });
    }

    if (action === 'single_update') {
      const { decisionId, targetLineId, reason, subAction } = body;
      const updated = repo.updateMappingDecision({
        decisionId,
        action: subAction || 'override',
        targetLineId,
        reason,
        actor: user,
      });
      return NextResponse.json({ data: updated, request_id: `req-${Date.now()}` });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { code: 'MAPPING_ERROR', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
