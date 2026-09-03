'use client';

import React, { use } from 'react';
import { db } from '@/lib/db/mock-db';
import { PBCPortalView } from '@/components/PBCPortalView';
import { ShieldAlert } from 'lucide-react';

export default function GuestPbcPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const state = db.getState();

  // Validate Token Security
  const pbcMatch = state.pbcRequests.find((p) => p.guestAccessToken === token);

  if (!pbcMatch && token !== 'token-nsm-tb2025-secure') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded border border-rose-200 shadow-md max-w-md w-full text-center space-y-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900">Akses Ditolak (403 Forbidden)</h1>
          <p className="text-xs text-slate-600">
            Token akses Portal PBC tidak valid, telah kedaluwarsa, atau perikatan telah ditutup. Silakan hubungi tim perikatan KAP Tanudiredja untuk meminta tautan undangan baru.
          </p>
        </div>
      </div>
    );
  }

  const engagement = state.engagements[0];
  const client = state.clients.find((c) => c.id === engagement.clientId);
  const firm = state.firms.find((f) => f.id === engagement.firmId);
  const clientPbcRequests = state.pbcRequests.filter((p) => p.engagementId === engagement.id);

  const handleSimulateUpload = (pbcId: string, filename: string) => {
    const guestUser = state.users.find((u) => u.role === 'client_guest') || state.users[0];
    db.updatePbcStatus(pbcId, 'uploaded', guestUser);
  };

  return (
    <PBCPortalView
      requests={clientPbcRequests}
      clientName={client?.name || 'PT Nusantara Sukses Makmur'}
      firmName={firm?.name || 'KAP Tanudiredja, Wibisana, Rintis & Rekan'}
      onSimulateUpload={handleSimulateUpload}
    />
  );
}
