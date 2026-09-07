import { NextRequest, NextResponse } from 'next/server';
import { parseAndImportPayrollRows } from '@/lib/tax/smart-payroll-importer';
import { getEngagementPayroll, saveEngagementPayroll } from '@/lib/tax/payroll-store';
import { assertTenantAccess, authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { getEngagementServerData } from '@/lib/server/engagement-data';

export async function GET(request: NextRequest) {
  try {
    const engagementId = request.nextUrl.searchParams.get('engagementId');
    if (!engagementId) return NextResponse.json({ success: false, error: 'engagementId wajib diisi.' }, { status: 400 });
    const actor = await requireSessionActor(request);
    const engagement = await getEngagementServerData(engagementId);
    assertTenantAccess(actor, engagement.engagement?.tenantId);
    const employees = await getEngagementPayroll(engagementId, actor.tenantId);
    return NextResponse.json({ success: true, data: { employees: employees || [] } });
  } catch (error) {
    return authorizationErrorResponse(error) || NextResponse.json({ success: false, error: 'Gagal memuat payroll perikatan.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { engagementId, headers, rows, customMapping } = body;

    if (!engagementId || !Array.isArray(headers) || !Array.isArray(rows) || rows.length > 10_000) {
      return NextResponse.json(
        { success: false, error: 'engagementId, headers, dan rows valid (maks. 10.000 baris) wajib diisi.' },
        { status: 400 }
      );
    }

    const actor = await requireSessionActor(request);
    const engagement = await getEngagementServerData(engagementId);
    assertTenantAccess(actor, engagement.engagement?.tenantId);
    const result = parseAndImportPayrollRows(headers, rows, customMapping);
    if (result.validRowCount === 0 || result.importedEmployees.some((employee) => employee.monthlyGrossSalaryIdr <= 0)) {
      return NextResponse.json({ success: false, error: 'Payroll tidak disimpan: nama dan gaji bruto positif wajib terbaca untuk setiap baris.' }, { status: 400 });
    }
    const persisted = await saveEngagementPayroll(engagementId, actor.tenantId, result.importedEmployees);
    if (!persisted) {
      return NextResponse.json({ success: false, error: 'Payroll tidak tersimpan secara permanen. Periksa koneksi database sebelum melanjutkan.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: { ...result, persisted: true },
    });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
