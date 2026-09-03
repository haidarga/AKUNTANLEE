import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { validateTenantAccess } from '@/lib/security/tenant';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userFirmId = searchParams.get('firmId') || 'FIRM-002'; // Simulating Firm B user by default
  const targetEngagementId = searchParams.get('engagementId') || 'ENG-2025-01'; // Firm A's engagement

  try {
    const engagement = db.getEngagement(targetEngagementId);
    if (!engagement) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

    // Attempt tenant check
    validateTenantAccess(userFirmId, { firmId: engagement.firmId });

    return NextResponse.json({
      success: true,
      message: 'Access granted (Same tenant)',
      data: engagement,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        blocked: true,
        error: error.message,
        securityViolation: 'CROSS_TENANT_ACCESS_BLOCKED',
        attemptedFirmId: userFirmId,
        targetEngagementFirmId: 'FIRM-001',
      },
      { status: 403 }
    );
  }
}
