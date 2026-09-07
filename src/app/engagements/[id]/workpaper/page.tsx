import React from 'react';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import WorkpaperClient from './WorkpaperClient';

export default async function LeadSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: engagementId } = await params;
  const data = await getEngagementServerData(engagementId);

  return (
    <WorkpaperClient
      engagementId={engagementId}
      initialEngagement={data.engagement}
      initialFiles={data.files}
      initialAccounts={data.accounts}
      initialDecisions={data.decisions}
      initialWorkpaper={data.workpaper}
      initialLines={data.lines}
      initialChecks={data.checks}
    />
  );
}
