import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { saveStateToDb } from '@/lib/db/sqlite';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchEngagementsFromSupabase,
  saveEngagementToSupabase,
} from '@/lib/supabase/service';
import { ClientV4, EngagementV4, UserRoleV4 } from '@/types/domain-v4';
import { DEMO_CLIENT, DEMO_ENGAGEMENT } from '@/lib/demo/fixtures';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  const firmId = session?.firmId || searchParams.get('tenantId') || 'FIRM-001';
  const isDemo = searchParams.get('demo') === '1';

  const mergedMap = new Map<string, any>();

  // 1. If demo mode is explicitly requested, include demo engagement
  if (isDemo) {
    mergedMap.set(DEMO_ENGAGEMENT.id, {
      ...DEMO_ENGAGEMENT,
      clientName: DEMO_CLIENT.legalName,
      clientCode: DEMO_CLIENT.code,
    });
  }

  // 2. Query from Supabase if configured (Strictly filtered by firm_id)
  if (isSupabaseConfigured()) {
    try {
      const sbResult = await fetchEngagementsFromSupabase(firmId);
      if (sbResult && sbResult.engagements.length > 0) {
        for (const sbEng of sbResult.engagements) {
          mergedMap.set(sbEng.id, sbEng);
        }
      }
    } catch (sbErr) {
      console.warn('Supabase fetch failed, falling back to local cache:', sbErr);
    }
  }

  // 3. Custom engagements from cookie (cross-lambda serverless persistence)
  const cookieEngs = parseCustomEngagementsCookie(request);
  for (const eng of cookieEngs) {
    if (eng.id !== 'ENG-2026-01' && eng.id !== 'ENG-DEMO-2026') {
      if (!eng.tenantId || eng.tenantId === firmId) {
        const existing = mergedMap.get(eng.id) || {};
        mergedMap.set(eng.id, { ...existing, ...eng });
      }
    }
  }

  // 4. Custom engagements from repo state (excluding demo unless isDemo)
  const state = repo.getState();
  for (const eng of state.engagements) {
    if (eng.id !== 'ENG-2026-01' && eng.id !== 'ENG-DEMO-2026') {
      if (eng.tenantId === firmId && !mergedMap.has(eng.id)) {
        mergedMap.set(eng.id, eng);
      }
    }
  }

  const list = Array.from(mergedMap.values());

  return NextResponse.json({
    data: list,
    request_id: 'req-' + Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    const firmId = session?.firmId || 'FIRM-001';

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
      periodYear,
      materialityIdr,
      accountingStandard,
      userRole,
    } = body;

    const state = repo.getState();
    const user = state.users.find((u) => u.role === (userRole as UserRoleV4)) || state.users[0];

    let finalClientId = incomingClientId;
    let createdClient: ClientV4 | any = null;

    // Derive or create client
    const effectiveClientName = clientName ? clientName.trim() : 'PT Klien Baru';
    const effectiveClientCode = (
      clientCode ||
      effectiveClientName.replace(/^(PT|CV|UD)\s+/i, '').substring(0, 4) ||
      'KLN'
    )
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (clientName && clientName.trim().length > 0) {
      createdClient = repo.createClient({
        legalName: effectiveClientName,
        code: effectiveClientCode || 'KLN',
        industry: industry || 'Manufaktur & Fabrikasi',
        tenantId: firmId,
      });
      if (taxIdNpwp) {
        createdClient.taxIdNpwp = taxIdNpwp;
      }
      finalClientId = createdClient.id;
    } else if (!finalClientId) {
      createdClient = repo.createClient({
        legalName: effectiveClientName,
        code: effectiveClientCode || 'KLN',
        industry: industry || 'Manufaktur & Fabrikasi',
        tenantId: firmId,
      });
      finalClientId = createdClient.id;
    } else {
      createdClient = state.clients.find((c) => c.id === finalClientId);
    }

    const nextIdNumber = String(state.engagements.length + 1).padStart(2, '0');
    const newEngId = `ENG-${periodYear || new Date().getFullYear()}-${nextIdNumber}`;

    const eng = repo.createEngagement(
      {
        tenantId: firmId,
        clientId: finalClientId,
        name: name || ('Audit Laporan Keuangan FY ' + (periodYear || '2026')),
        periodStart: periodStart || '2026-01-01',
        periodEnd: periodEnd || '2026-12-31',
        currency: 'IDR',
        materialityIdr: materialityIdr ? Number(materialityIdr) : 150_000_000,
        status: 'preparing',
        leadPartnerId: session?.userId || 'USR-PARTNER-01',
        managerId: 'USR-MANAGER-01',
        seniorId: 'USR-SENIOR-01',
        preparerId: 'USR-PREPARER-01',
      },
      user
    );

    // Explicit ID guarantee
    if (newEngId && !state.engagements.some((e) => e.id === newEngId)) {
      eng.id = newEngId;
    }
    if (accountingStandard) {
      eng.accountingStandard = accountingStandard;
    }

    const clientObj = createdClient || {
      id: eng.clientId,
      tenantId: firmId,
      legalName: effectiveClientName,
      code: effectiveClientCode,
      industry: industry || 'Manufaktur & Fabrikasi',
      taxIdNpwp: taxIdNpwp || '01.234.567.8-012.000',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // 1. FAIL-FAST: Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      const savedSuccess = await saveEngagementToSupabase(eng, clientObj, firmId);
      if (!savedSuccess) {
        return NextResponse.json(
          {
            code: 'DATABASE_PERSISTENCE_FAILED',
            message: 'Gagal menyimpan perikatan ke Supabase Postgres produksi. Operasi dibatalkan.',
            retryable: false,
          },
          { status: 500 }
        );
      }
    }

    // 2. Persist to SQLite and local JSON store
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
    } catch (e) {}

    // 3. Prepare cross-lambda persistent cookie
    const currentCookieEngs = parseCustomEngagementsCookie(request);
    const customRecord = {
      id: eng.id,
      tenantId: firmId,
      clientId: clientObj.id,
      name: eng.name,
      clientName: clientObj.legalName,
      clientCode: clientObj.code,
      taxIdNpwp: clientObj.taxIdNpwp || taxIdNpwp,
      industry: clientObj.industry || industry,
      periodStart: eng.periodStart,
      periodEnd: eng.periodEnd,
      periodYear: periodYear || '2026',
      materialityIdr: eng.materialityIdr,
      status: eng.status,
      accountingStandard: eng.accountingStandard || 'SAK_INDONESIA',
      createdAt: eng.createdAt,
      updatedAt: eng.updatedAt,
    };

    const updatedCookieList = [
      customRecord,
      ...currentCookieEngs.filter((e: any) => e.id !== eng.id),
    ].slice(0, 10);
    const cookieString = encodeURIComponent(JSON.stringify(updatedCookieList));

    const response = NextResponse.json(
      {
        success: true,
        data: eng,
        client: clientObj,
        request_id: 'req-' + Date.now(),
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'finova_custom_engagements',
      value: cookieString,
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error creating engagement:', error);
    return NextResponse.json(
      {
        code: 'ENGAGEMENT_CREATION_FAILED',
        message: error.message || 'Gagal membuat perikatan audit baru.',
        request_id: 'req-' + Date.now(),
        retryable: false,
      },
      { status: 500 }
    );
  }
}
