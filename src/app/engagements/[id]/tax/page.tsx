'use client';

import React from 'react';
import { TaxEngineView } from '@/components/TaxEngineView';

export default function TaxEnginePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Tax Calculation Engine — Kalkulasi Deterministik & Rekonsiliasi
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Perhitungan pajak berbasis aturan regulasi terverifikasi, bukan tebakan LLM. Menghasilkan perhitungan yang dapat direproduksi 100%.
          </p>
        </div>
      </div>

      <TaxEngineView />
    </div>
  );
}
