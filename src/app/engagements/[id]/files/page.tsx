import React from 'react';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import FilesClient from './FilesClient';

export default async function FilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: engagementId } = await params;
  const data = await getEngagementServerData(engagementId);

  return (
    <FilesClient
      engagementId={engagementId}
      initialEngagement={data.engagement}
      initialFiles={data.files}
      initialAccounts={data.accounts}
    />
  );
}
