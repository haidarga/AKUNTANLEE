import React from 'react';
import { notFound } from 'next/navigation';
import { repo } from '@/lib/db/repo-v4';
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
  const state = repo.getState();
  let engagement = state.engagements.find((e) => e.id === resolvedParams.id);

  if (!engagement) {
    if (resolvedParams.id.startsWith('ENG-')) {
      engagement = {
        id: resolvedParams.id,
        tenantId: 'TENANT-001',
        clientId: 'CLI-002',
        name: resolvedParams.id === 'ENG-MANDIRI-2026'
          ? 'Kertas Kerja Audit Mandiri FY 2026 (Unggah Berkas Klien Sendiri)'
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
    } else {
      notFound();
    }
  }

  if (!engagement) {
    notFound();
  }

  const client = state.clients.find((c) => c.id === engagement.clientId) || {
    id: 'CLI-CUSTOM',
    legalName: engagement.name,
    code: 'CLIENT',
    industry: 'Jasa & Manufaktur',
    taxIdNpwp: '01.234.567.8-012.000',
    address: 'Jakarta, Indonesia',
    createdAt: new Date().toISOString(),
  };
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
