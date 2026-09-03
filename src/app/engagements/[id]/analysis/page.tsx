'use client';

import React from 'react';
import { db } from '@/lib/db/mock-db';
import { AdvisoryCards } from '@/components/AdvisoryCards';
import {
  TrendingDown,
  Clock,
  ShieldAlert,
  Calculator,
  ArrowRight,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { formatIdr } from '@/lib/currency';

export default function AnalysisAndAdvisoryPage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const insights = state.advisoryInsights;
  const evidenceList = state.evidenceList;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Advanced Analytics & Advisory Intelligence (4-Level Framework)
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Integrasi metrik kesehatan finansial, risiko audit substantif, dan rekomendasi konsultasi berbasis bukti yang dapat dipertanggungjawabkan di hadapan Direksi.
          </p>
        </div>
      </div>

      {/* Advanced Financial & Working Capital KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Gross Margin */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Margin Laba Kotor (YoY)</span>
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold text-[10px] flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -6.8%
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">31.4%</div>
          <div className="text-[11px] text-slate-500">Tahun Lalu: 38.2% &bull; Penurunan Efisiensi HPP</div>
        </div>

        {/* Working Capital / DSO */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Days Sales Outstanding (DSO)</span>
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold text-[10px] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +15 Hari
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">68 Hari</div>
          <div className="text-[11px] text-slate-500">Tahun Lalu: 53 Hari &bull; Modal Kerja Terikat</div>
        </div>

        {/* Cash Conversion Cycle */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Cash Conversion Cycle (CCC)</span>
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
              73 Hari (+18h)
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">73 Hari</div>
          <div className="text-[11px] text-slate-500">DIO: 49h &bull; DSO: 68h &bull; DPO: 44h</div>
        </div>

        {/* Corporate Tax Due */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">PPh Badan Kurang Bayar</span>
            <span className="text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
              Pasal 29
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-teal-900">Rp 134.800.000</div>
          <div className="text-[11px] text-slate-500">Koreksi Positif: Rp 285 Jt &bull; Final: Rp 80 Jt</div>
        </div>
      </div>

      {/* 4-Level Advisory Cards Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Paket Analisis Advisory: Laba Rugi, Margin & Modal Kerja
        </h2>
        <AdvisoryCards insights={insights} evidenceList={evidenceList} />
      </div>
    </div>
  );
}
