'use client';

import React from 'react';
import { db } from '@/lib/db/mock-db';
import { WorkpaperGrid } from '@/components/WorkpaperGrid';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WorkpapersPage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const mappings = state.accountMappings;

  const handleOverride = (mappingId: string, newSection: string, reason: string) => {
    const user = state.users.find((u) => u.role === 'senior') || state.users[0];
    db.overrideMapping(mappingId, newSection, user, reason);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            AI Workpaper Engine — Pemetaan Akun & Kertas Kerja
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Neraca Saldo komparatif dinormalisasi dan dipetakan secara otomatis ke bagan akun SAK Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Neraca Saldo Seimbang (Debit = Kredit)
          </span>
        </div>
      </div>

      {/* Interactive Workpaper Grid Component */}
      <WorkpaperGrid
        mappings={mappings}
        materialityThresholdIdr={engagement.materialityThresholdIdr}
        onOverrideMapping={handleOverride}
      />
    </div>
  );
}
