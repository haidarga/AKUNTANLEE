import React from 'react';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import OverviewClient from './OverviewClient';

export default async function EngagementV4OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: engagementId } = await params;
  const data = await getEngagementServerData(engagementId);

  return (
    <OverviewClient
      engagementId={engagementId}
      initialEngagement={data.engagement}
      initialClient={data.client}
      initialFiles={data.files}
      initialAccounts={data.accounts}
      initialDecisions={data.decisions}
      initialWorkpaper={data.workpaper}
      initialChecks={data.checks}
    />
  );
}
