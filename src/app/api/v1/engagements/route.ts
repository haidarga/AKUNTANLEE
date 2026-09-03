import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'TENANT-001';
  const state = repo.getState();
  const list = state.engagements.filter((e) => e.tenantId === tenantId);
  return NextResponse.json({
    data: list,
    request_id: `req-${Date.now()}`,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, clientId, periodStart, periodEnd, materialityIdr, userRole, tenantId } = body;

    const user = repo.getState().users.find((u) => u.role === (userRole as UserRoleV4)) || repo.getState().users[0];

    // Tenant check
    if (tenantId && tenantId !== user.tenantId) {
      return NextResponse.json(
        {
          code: 'FORBIDDEN_TENANT_ACCESS',
          message: 'Pelanggaran Batas Tenant: Pengguna dilarang mengakses tenant lain.',
          request_id: `req-${Date.now()}`,
          retryable: false,
        },
        { status: 403 }
      );
    }

    const eng = repo.createEngagement(
      {
        tenantId: user.tenantId,
        clientId: clientId || 'CLI-001',
        name,
        periodStart: periodStart || '2026-01-01',
        periodEnd: periodEnd || '2026-12-31',
        currency: 'IDR',
        materialityIdr: materialityIdr || 250_000_000,
        status: 'preparing',
        leadPartnerId: 'USR-PARTNER-01',
        managerId: 'USR-MANAGER-01',
        seniorId: 'USR-SENIOR-01',
        preparerId: 'USR-PREPARER-01',
      },
      user
    );

    return NextResponse.json({ data: eng, request_id: `req-${Date.now()}` }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
