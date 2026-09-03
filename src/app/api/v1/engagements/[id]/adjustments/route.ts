import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = repo.getAdjustments(id);
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userRole = (body.userRole as UserRoleV4) || 'senior';
    const user = repo.getState().users.find((u) => u.role === userRole) || repo.getState().users[0];

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
        debitAmountIdr: Number(body.debitAmountIdr) || 0,
        creditLineId: body.creditLineId,
        creditAmountIdr: Number(body.creditAmountIdr) || 0,
        preparedByUserId: user.id,
        preparedByName: user.name,
        status: 'approved',
      },
      user
    );

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
