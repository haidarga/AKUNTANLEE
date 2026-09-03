import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { decisions, action, userRole, tenantId } = body;
    const user = repo.getState().users.find((u) => u.role === (userRole as UserRoleV4)) || repo.getState().users[0];

    if (tenantId && tenantId !== user.tenantId) {
      return NextResponse.json(
        { code: 'FORBIDDEN_TENANT', message: 'Akses ditolak: Tenant mismatch', request_id: `req-${Date.now()}` },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { code: 'MAPPING_ERROR', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
