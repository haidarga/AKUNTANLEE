import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const user = await requireSessionActor(req, ['partner']);
    const data = await getEngagementServerData(id);
    assertTenantAccess(user, data.engagement?.tenantId);
    const failures = data.checks.filter((check) => check.status === 'fail' && check.severity === 'blocking');
    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        code: 'SEAL_BLOCKED',
        error: `Partner sign-off diblokir: ${failures.map((check) => check.title).join(', ')} belum lulus.`,
      }, { status: 422 });
    }

    const partnerApNumber = String(body.partnerApNumber || '').trim();
    if (!partnerApNumber) {
      return NextResponse.json({
        success: false,
        code: 'AP_NUMBER_REQUIRED',
        error: 'Nomor Izin Akuntan Publik (AP) wajib diisi untuk menyegel perikatan.',
      }, { status: 400 });
    }

    const result = repo.sealEngagementWithPartnerCertificate(id, partnerApNumber, user);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
