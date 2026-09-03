import React from 'react';
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
  const engagement = state.engagements.find((e) => e.id === resolvedParams.id) || state.engagements[0];
  const client = state.clients.find((c) => c.id === engagement.clientId) || state.clients[0];
  const wp = state.workpaperVersions[0];

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
