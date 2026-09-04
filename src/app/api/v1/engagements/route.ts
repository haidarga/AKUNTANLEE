import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';
import { saveStateToDb } from '@/lib/db/sqlite';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'TENANT-001';
  const state = repo.getState();
  const list = state.engagements.filter((e) => e.tenantId === tenantId);
  return NextResponse.json({
    data: list,
    request_id: 'req-' + Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      clientId: incomingClientId,
      clientName,
      clientCode,
      industry,
      taxIdNpwp,
      periodStart,
      periodEnd,
      materialityIdr,
      accountingStandard,
      userRole,
      tenantId,
    } = body;

    const state = repo.getState();
    const user = state.users.find((u) => u.role === (userRole as UserRoleV4)) || state.users[0];

    // Tenant check
    if (tenantId && tenantId !== user.tenantId) {
      return NextResponse.json(
        {
          code: 'FORBIDDEN_TENANT_ACCESS',
          message: 'Pelanggaran Batas Tenant: Pengguna dilarang mengakses tenant lain.',
          request_id: 'req-' + Date.now(),
          retryable: false,
        },
        { status: 403 }
      );
    }

    let finalClientId = incomingClientId;
    let createdClient = null;

    // If clientName is provided or user wants a brand new client
    if (clientName && clientName.trim().length > 0) {
      const code = (clientCode || clientName.substring(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '');
      createdClient = repo.createClient({
        legalName: clientName.trim(),
        code: code || 'KLN',
        industry: industry || 'Manufaktur & Fabrikasi',
        tenantId: user.tenantId,
      });
      if (taxIdNpwp) {
        createdClient.taxIdNpwp = taxIdNpwp;
      }
      finalClientId = createdClient.id;
    } else if (!finalClientId) {
      finalClientId = state.clients[0]?.id || 'CLI-001';
    }

    const eng = repo.createEngagement(
      {
        tenantId: user.tenantId,
        clientId: finalClientId,
        name: name || ('Perikatan Audit FY ' + new Date().getFullYear()),
        periodStart: periodStart || '2026-01-01',
        periodEnd: periodEnd || '2026-12-31',
        currency: 'IDR',
        materialityIdr: materialityIdr ? Number(materialityIdr) : 250_000_000,
        status: 'preparing',
        leadPartnerId: 'USR-PARTNER-01',
        managerId: 'USR-MANAGER-01',
        seniorId: 'USR-SENIOR-01',
        preparerId: 'USR-PREPARER-01',
      },
      user
    );

    if (accountingStandard) {
      eng.accountingStandard = accountingStandard;
    }

    // Ensure empty initial workpaper exists for this new engagement
    const wpExists = state.workpaperVersions.some((w) => w.engagementId === eng.id);
    if (!wpExists) {
      const emptyWp: any = {
        id: 'WPV-' + Date.now().toString(36).toUpperCase(),
        engagementId: eng.id,
        datasetVersionId: 'DSV-' + eng.id,
        mappingSetId: 'MAPSET-' + eng.id,
        versionNumber: 1,
        status: 'draft',
        isStale: false,
        unmappedCount: 0,
        checksum: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        summary: {
          totalAssets: 0,
          totalLiabilities: 0,
          totalEquity: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0,
          isBalanced: true,
        },
      };
      state.workpaperVersions.unshift(emptyWp);
    }

    // Persist to SQLite and JSON store
    try {
      saveStateToDb(state);
    } catch (e) {
      console.error('Failed saving to SQLite:', e);
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const storePath = path.join(process.cwd(), 'data', 'finova_store.json');
      fs.writeFileSync(storePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed saving to JSON store:', e);
    }

    const clientObj = createdClient || state.clients.find((c) => c.id === finalClientId);

    return NextResponse.json(
      {
        data: eng,
        client: clientObj,
        message: 'Perikatan dan Klien berhasil dibuat.',
        request_id: 'req-' + Date.now(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating engagement:', err);
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: err.message, request_id: 'req-' + Date.now(), retryable: false },
      { status: 422 }
    );
  }
}
