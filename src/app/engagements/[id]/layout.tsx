import React from 'react';
import { db } from '@/lib/db/mock-db';
import { EngagementNav } from '@/components/EngagementNav';

export default async function EngagementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const state = db.getState();
  const engagement = state.engagements.find((e) => e.id === resolvedParams.id) || state.engagements[0];
  const client = state.clients.find((c) => c.id === engagement.clientId) || state.clients[0];

  return (
    <div className="flex-1 flex flex-col">
      <EngagementNav
        engagementId={engagement.id}
        clientName={client.name}
        fiscalYear={engagement.fiscalYear}
        materialityIdr={engagement.materialityThresholdIdr}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
