import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { saveStateToDb } from '@/lib/db/sqlite';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchEngagementByIdFromSupabase,
  updateEngagementInSupabase,
} from '@/lib/supabase/service';
import { getServerSession } from '@/lib/auth/session';

function parseCustomEngagementsCookie(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/finova_custom_engagements=([^;]+)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      return JSON.parse(decoded);
    }
  } catch (e) {
    console.error('Error parsing cookie finova_custom_engagements:', e);
  }
  return [];
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(request);
  const firmId = session?.firmId || 'FIRM-001';
  const state = repo.getState();

  // 1. Check in-memory state
  let engagement = state.engagements.find((e) => e.id === id);
  let client = engagement ? state.clients.find((c) => c.id === engagement?.clientId) : null;

  // 2. Check Supabase if configured
  if ((!engagement || !client) && isSupabaseConfigured()) {
    try {
      const sbRecord = await fetchEngagementByIdFromSupabase(id);
      if (sbRecord) {
        engagement = sbRecord.engagement;
        client = sbRecord.client;
      }
    } catch (sbErr) {
      console.warn('Supabase detail lookup error:', sbErr);
    }
  }

  // 3. Check cookie persistence across serverless lambdas
  if (!engagement) {
    const cookieEngs = parseCustomEngagementsCookie(request);
    const found = cookieEngs.find((e: any) => e.id === id);
    if (found) {
      engagement = {
        id: found.id,
        tenantId: found.tenantId || firmId,
        clientId: found.clientId,
        name: found.name,
        periodStart: found.periodStart,
        periodEnd: found.periodEnd,
        currency: 'IDR',
        materialityIdr: found.materialityIdr,
        status: found.status,
        accountingStandard: found.accountingStandard || 'SAK_INDONESIA',
        leadPartnerId: 'USR-PARTNER-01',
        managerId: 'USR-MANAGER-01',
        seniorId: 'USR-SENIOR-01',
        preparerId: 'USR-PREPARER-01',
        createdAt: found.createdAt || new Date().toISOString(),
        updatedAt: found.updatedAt || new Date().toISOString(),
      };
      client = {
        id: found.clientId || 'CLI-002',
        tenantId: found.tenantId || firmId,
        legalName: found.clientName || 'PT Klien Audit',
        code: found.clientCode || 'KLN',
        industry: found.industry || 'Manufaktur & Fabrikasi',
        taxIdNpwp: found.taxIdNpwp || '01.234.567.8-012.000',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }
  }

  if (!engagement) {
    return NextResponse.json(
      {
        code: 'ENGAGEMENT_NOT_FOUND',
        message: 'Perikatan audit tidak ditemukan.',
        request_id: 'req-' + Date.now(),
        retryable: false,
      },
      { status: 404 }
    );
  }

  // Strict Tenant Isolation: Firm A cannot access Firm B's engagements
  if (engagement.tenantId && session && engagement.tenantId !== session.firmId && session.role !== 'admin') {
    return NextResponse.json(
      {
        code: 'FORBIDDEN_TENANT_ACCESS',
        message: 'Pelanggaran Batas Tenant: Pengguna dari KAP lain dilarang mengakses perikatan ini.',
        request_id: 'req-' + Date.now(),
        retryable: false,
      },
      { status: 403 }
    );
  }

  const finalClient = client || {
    id: engagement.clientId,
    tenantId: engagement.tenantId,
    legalName: "PT Klien Audit",
    code: "KLN",
    industry: "Manufaktur & Fabrikasi",
    taxIdNpwp: "01.234.567.8-012.000",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({
    data: {
      engagement,
      client: finalClient,
    },
    engagement,
    client: finalClient,
    request_id: "req-" + Date.now(),
  });
}


export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(request);
    const firmId = session?.firmId || 'FIRM-001';
    const body = await request.json();
    const state = repo.getState();

    let engagement = state.engagements.find((e) => e.id === id);

    if (!engagement && isSupabaseConfigured()) {
      const sbRecord = await fetchEngagementByIdFromSupabase(id);
      if (sbRecord) {
        engagement = sbRecord.engagement;
      }
    }

    if (!engagement) {
      return NextResponse.json(
        {
          code: 'ENGAGEMENT_NOT_FOUND',
          message: 'Perikatan audit tidak ditemukan untuk diperbarui.',
          request_id: 'req-' + Date.now(),
          retryable: false,
        },
        { status: 404 }
      );
    }

    // Strict Tenant Isolation
    if (engagement.tenantId && session && engagement.tenantId !== session.firmId && session.role !== 'admin') {
      return NextResponse.json(
        {
          code: 'FORBIDDEN_TENANT_ACCESS',
          message: 'Pelanggaran Batas Tenant: Anda tidak berhak mengubah perikatan milik KAP lain.',
          request_id: 'req-' + Date.now(),
          retryable: false,
        },
        { status: 403 }
      );
    }

    const {
      name,
      materialityIdr,
      accountingStandard,
      periodStart,
      periodEnd,
      status,
      clientName,
      clientCode,
      industry,
      taxIdNpwp,
    } = body;

    if (name !== undefined) engagement.name = name;
    if (materialityIdr !== undefined) engagement.materialityIdr = Number(materialityIdr);
    if (accountingStandard !== undefined) engagement.accountingStandard = accountingStandard;
    if (periodStart !== undefined) engagement.periodStart = periodStart;
    if (periodEnd !== undefined) engagement.periodEnd = periodEnd;
    if (status !== undefined) engagement.status = status;
    engagement.updatedAt = new Date().toISOString();

    let client = state.clients.find((c) => c.id === engagement?.clientId);
    if (client) {
      if (clientName !== undefined) client.legalName = clientName;
      if (clientCode !== undefined) client.code = clientCode;
      if (industry !== undefined) client.industry = industry;
      if (taxIdNpwp !== undefined) client.taxIdNpwp = taxIdNpwp;
    }

    // 1. FAIL-FAST Update in Supabase
    if (isSupabaseConfigured()) {
      const updatedOk = await updateEngagementInSupabase(
        id,
        engagement,
        client
          ? {
              legalName: client.legalName,
              code: client.code,
              industry: client.industry,
              taxIdNpwp: client.taxIdNpwp,
            }
          : undefined
      );
      if (!updatedOk) {
        return NextResponse.json(
          {
            code: 'DATABASE_UPDATE_FAILED',
            message: 'Gagal memperbarui perikatan di Supabase Postgres produksi.',
            retryable: false,
          },
          { status: 500 }
        );
      }
    }

    // 2. Update SQLite and JSON store
    try {
      saveStateToDb(state);
    } catch (dbErr) {
      console.error('Failed to save state to SQLite:', dbErr);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        engagement,
        client,
      },
      engagement,
      client,
      request_id: "req-" + Date.now(),
    });

    return response;
  } catch (error: any) {
    console.error('Error updating engagement:', error);
    return NextResponse.json(
      {
        code: 'ENGAGEMENT_UPDATE_FAILED',
        message: error.message || 'Gagal memperbarui perikatan audit.',
        request_id: 'req-' + Date.now(),
        retryable: false,
      },
      { status: 500 }
    );
  }
}
