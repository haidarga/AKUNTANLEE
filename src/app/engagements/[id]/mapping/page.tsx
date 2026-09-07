import React from 'react';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import MappingClient from './MappingClient';

export default async function AccountMappingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: engagementId } = await params;
  const data = await getEngagementServerData(engagementId);

  return (
    <MappingClient
      engagementId={engagementId}
      initialEngagement={data.engagement}
      initialDecisions={data.decisions}
      initialAccounts={data.accounts}
    />
  );
}
