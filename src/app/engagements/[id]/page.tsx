'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Table,
  Calculator,
  LineChart,
  FileCheck2,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { formatIdr } from '@/lib/currency';
import { StatusBadge } from '@/components/StatusBadge';

export default function EngagementOverviewPage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const client = state.clients.find((c) => c.id === engagement.clientId);
  const pendingPbc = state.pbcRequests.filter((p) => p.status === 'required' || p.status === 'needs_replacement');
  const unclearedReview = state.reviewPoints.filter((p) => !p.isCleared);
  const findings = state.findings;

  return (
    <div className="space-y-6">
      {/* 4-Phase Progress Timeline */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">Kemajuan Fase Perikatan (Engagement Lifecycle)</span>
          <span className="font-semibold text-teal-800">Fase 3: Review & Finalisasi Laporan</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          {/* Phase 1 */}
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              1. Intake & Dokumen
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">3 Berkas Terekstraksi (98%)</div>
          </div>

          {/* Phase 2 */}
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              2. Kertas Kerja & Pajak
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Tie-Out Seimbang & Rekon 22%</div>
          </div>

          {/* Phase 3 */}
          <div className="p-2.5 rounded bg-teal-100/70 border border-teal-300 text-teal-900 font-semibold ring-1 ring-teal-400">
            <div className="font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              3. Review & QC
            </div>
            <div className="text-[10px] text-teal-800 mt-0.5 font-normal">1 Catatan Review Terbuka</div>
          </div>

          {/* Phase 4 */}
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
            <div className="font-medium flex items-center gap-1">
              <span>4. Finalisasi Memo</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Siap Dikirim ke Klien</div>
          </div>
        </div>
      </div>

      {/* Primary Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">Laba Sebelum Pajak</div>
          <div className="text-lg font-bold font-mono text-slate-900">Rp 4.250.000.000</div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Sesuai Laporan Audit
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">Koreksi Fiskal Positif</div>
          <div className="text-lg font-bold font-mono text-amber-800">+ Rp 285.000.000</div>
          <div className="text-[11px] text-amber-800 font-medium">Beban Tanpa Nominatif & Natura</div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">PPh Kurang Bayar (Pasal 29)</div>
          <div className="text-lg font-bold font-mono text-teal-900">Rp 134.800.000</div>
          <div className="text-[11px] text-slate-500 font-medium">Setelah Kredit Pajak Rp 820 Jt</div>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-1">
          <div className="text-slate-500 font-medium">Gross Margin Contraction</div>
          <div className="text-lg font-bold font-mono text-rose-700">-6.8% YoY</div>
          <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Dari 38.2% ke 31.4%
          </div>
        </div>
      </div>

      {/* Two Column Work Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quick Access to Core Modules */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Modul Kerja Perikatan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Workpapers Card */}
            <Link
              href={`/engagements/${engagement.id}/workpapers`}
              className="bg-white p-4 rounded border border-slate-200 hover:border-teal-400 shadow-sm transition-all text-xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-teal-50 text-teal-700 rounded border border-teal-200">
                  <Table className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Tie-Out Seimbang
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  AI Workpaper Engine & Pemetaan
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  22 akun dipetakan otomatis ke SAK Indonesia. 1 akun penampungan sementara dalam antrean review.
                </p>
              </div>
            </Link>

            {/* Tax Engine Card */}
            <Link
              href={`/engagements/${engagement.id}/tax`}
              className="bg-white p-4 rounded border border-slate-200 hover:border-teal-400 shadow-sm transition-all text-xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-teal-50 text-teal-700 rounded border border-teal-200">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                  UU HPP 22%
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Tax Calculation Engine
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Rekonsiliasi fiskal PPh Badan, TER PPh 21, withholding PPh 23, dan e-Faktur PPN.
                </p>
              </div>
            </Link>

            {/* Advisory Intelligence Card */}
            <Link
              href={`/engagements/${engagement.id}/analysis`}
              className="bg-white p-4 rounded border border-slate-200 hover:border-teal-400 shadow-sm transition-all text-xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  <LineChart className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-indigo-800 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  4 Level Advisory
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Advisory Intelligence & Analisis
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Diagnostik kontraksi margin, kenaikan DSO +15 hari, dan proyeksi skenario EBITDA FY 2026.
                </p>
              </div>
            </Link>

            {/* Findings & Report Card */}
            <Link
              href={`/engagements/${engagement.id}/report`}
              className="bg-white p-4 rounded border border-slate-200 hover:border-teal-400 shadow-sm transition-all text-xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Disetujui Partner
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Executive Advisory Memo & Report
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Laporan memo eksekutif dengan rincian temuan CCCER siap cetak untuk Direksi.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Top Attention & Pending Items */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Poin Perhatian Segera</h2>

          <div className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Temuan Berulang / Risiko Audit
              </span>
              <div className="font-bold text-slate-900 mt-0.5">
                Konfirmasi Piutang 10 Debitur Terbesar
              </div>
              <p className="text-slate-600 text-[11px] mt-1">
                Saldo piutang tumbuh 45.1% YoY menjadi Rp 9.85 Miliar. Wajib verifikasi konfirmasi eksternal untuk melengkapi WP-B.
              </p>
            </div>

            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Permintaan Dokumen Klien (PBC)
              </span>
              <div className="font-bold text-slate-900 mt-0.5">
                Daftar Nominatif Entertainment
              </div>
              <p className="text-slate-600 text-[11px] mt-1">
                Status: <strong className="text-rose-700">Perlu Penggantian</strong>. Format belum mencantumkan daftar nama relasi bisnis.
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/portal/pbc/token-nsm-tb2025-secure"
                target="_blank"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                Lihat Portal Klien &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
