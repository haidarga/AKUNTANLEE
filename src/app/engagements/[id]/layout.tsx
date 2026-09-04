import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { repo } from '@/lib/db/repo-v4';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchEngagementByIdFromSupabase } from '@/lib/supabase/service';
import { EngagementHeader } from '@/components/v4/EngagementHeader';
import { AuditCopilotDrawer } from '@/components/v4/AuditCopilotDrawer';

export default async function EngagementV4Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const state = repo.getState();

  // 1. Check in-memory state
  let engagement = state.engagements.find((e) => e.id === resolvedParams.id);
  let client = engagement ? state.clients.find((c) => c.id === engagement?.clientId) : null;

  // 2. Check Supabase if configured
  if ((!engagement || !client) && isSupabaseConfigured()) {
    try {
      const sbRecord = await fetchEngagementByIdFromSupabase(resolvedParams.id);
      if (sbRecord) {
        engagement = sbRecord.engagement;
        client = sbRecord.client;
      }
    } catch (sbErr) {
      console.warn('Supabase layout lookup error:', sbErr);
    }
  }

  // 3. If not found or fallback, check cookie persistence across lambdas
  let customFromCookie: any = null;
  try {
    const rawCookie = cookieStore.get('finova_custom_engagements')?.value;
    if (rawCookie) {
      const decoded = decodeURIComponent(rawCookie);
      const list = JSON.parse(decoded);
      if (Array.isArray(list)) {
        customFromCookie = list.find((item: any) => item.id === resolvedParams.id);
      }
    }
  } catch (e) {
    console.warn('Error reading finova_custom_engagements cookie:', e);
  }

  if (!customFromCookie) {
    try {
      const rawLast = cookieStore.get('finova_last_created_engagement')?.value;
      if (rawLast) {
        const decoded = decodeURIComponent(rawLast);
        const last = JSON.parse(decoded);
        if (last && last.id === resolvedParams.id) {
          customFromCookie = last;
        }
      }
    } catch (e) {
      console.warn('Error reading finova_last_created_engagement cookie:', e);
    }
  }

  // 4. Apply custom data if available from cookie
  if (customFromCookie) {
    engagement = {
      id: customFromCookie.id,
      tenantId: 'TENANT-001',
      clientId: customFromCookie.clientId,
      name: customFromCookie.name,
      periodStart: customFromCookie.periodStart || '2026-01-01',
      periodEnd: customFromCookie.periodEnd || '2026-12-31',
      currency: 'IDR',
      materialityIdr: customFromCookie.materialityIdr || 250_000_000,
      status: customFromCookie.status || 'preparing',
      accountingStandard: customFromCookie.accountingStandard || 'SAK_INDONESIA',
      leadPartnerId: 'USR-PARTNER-01',
      managerId: 'USR-MANAGER-01',
      seniorId: 'USR-SENIOR-01',
      preparerId: 'USR-PREPARER-01',
      createdAt: customFromCookie.createdAt || new Date().toISOString(),
      updatedAt: customFromCookie.updatedAt || new Date().toISOString(),
    };

    client = {
      id: customFromCookie.clientId,
      tenantId: 'TENANT-001',
      legalName: customFromCookie.clientName,
      code: customFromCookie.clientCode,
      industry: customFromCookie.industry || 'Manufaktur & Fabrikasi',
      taxIdNpwp: customFromCookie.taxIdNpwp || '01.234.567.8-012.000',
      address: 'Indonesia',
      status: 'active',
      createdAt: customFromCookie.createdAt || new Date().toISOString(),
    };
  }

  // 5. If still not found, check valid ENG-* format
  if (!engagement) {
    if (resolvedParams.id.startsWith('ENG-')) {
      const isMandiri = resolvedParams.id === 'ENG-MANDIRI-2026';
      engagement = {
        id: resolvedParams.id,
        tenantId: 'TENANT-001',
        clientId: 'CLI-002',
        name: isMandiri
          ? 'Kertas Kerja Audit Mandiri FY 2026'
          : 'Perikatan Audit Mandiri ' + resolvedParams.id,
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
        currency: 'IDR',
        materialityIdr: 250000000,
        status: 'preparing',
        leadPartnerId: 'USR-PARTNER-01',
        managerId: 'USR-MANAGER-01',
        seniorId: 'USR-SENIOR-01',
        preparerId: 'USR-PREPARER-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      client = {
        id: 'CLI-002',
        tenantId: 'TENANT-001',
        legalName: 'PT Klien Mandiri (Klien Anda)',
        code: 'MNDR',
        industry: 'Manufaktur & Fabrikasi',
        taxIdNpwp: '01.234.567.8-012.000',
        address: 'Indonesia',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    } else {
      notFound();
    }
  }

  if (!client) {
    client = state.clients.find((c) => c.id === engagement.clientId) || {
      id: engagement.clientId || 'CLI-CUSTOM',
      tenantId: 'TENANT-001',
      legalName: 'PT Klien Mandiri (Klien Anda)',
      code: 'MNDR',
      industry: 'Manufaktur & Fabrikasi',
      taxIdNpwp: '01.234.567.8-012.000',
      address: 'Indonesia',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }

  const wp = state.workpaperVersions.find((w) => w.engagementId === engagement.id) || state.workpaperVersions[0];

  return (
    <div className="flex-1 flex flex-col relative">
      <EngagementHeader
        engagementId={engagement.id}
        clientName={client.legalName}
        clientCode={client.code}
        title={engagement.name}
        periodYear="2026"
        materialityIdr={engagement.materialityIdr}
        status={engagement.status}
        isStale={wp?.isStale}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {children}
      </div>

      {/* Embedded Live Audit Copilot (Connected to Qwen-3.8 via vLLM) */}
      <AuditCopilotDrawer engagementId={engagement.id} />
    </div>
  );
}
