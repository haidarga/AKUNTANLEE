import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { engagementId, userRole } = body;
    const user = repo.getState().users.find((u) => u.role === (userRole as UserRoleV4)) || repo.getState().users[0];

    // Authorization check
    repo.assertPermission(user.role, 'authorize_export');

    const result = repo.generateExport(engagementId || 'ENG-2025-01', user);
    return NextResponse.json({ data: result.artifact, request_id: `req-${Date.now()}` }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json(
      { code: 'EXPORT_BLOCKED', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
