import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = repo.getState().users.find((u) => u.role === 'partner') || repo.getState().users[0];
    const eng = repo.getState().engagements.find((e) => e.id === id) || repo.getState().engagements[0];

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
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
