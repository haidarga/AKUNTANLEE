import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const user = repo.getState().users.find((u) => u.role === 'partner') || repo.getState().users[0];

    const result = repo.sealEngagementWithPartnerCertificate(id, body.partnerApNumber || 'AP.0942', user);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
