'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
  Briefcase,
  Building2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { formatIdr } from '@/lib/currency';
import { StatusBadge } from '@/components/StatusBadge';

export default function HomePage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const client = state.clients.find((c) => c.id === engagement.clientId);
  const unclearedReviewPoints = state.reviewPoints.filter((p) => !p.isCleared);
  const ambiguousAccounts = state.accountMappings.filter((m) => m.isAmbiguous);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Attention Directive */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
              Antrean Perhatian Utama
            </span>
            <span className="text-xs text-slate-500 font-medium">Hari Ini &bull; 14 Februari 2026</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Apa yang Memerlukan Tindakan Anda Hari Ini?
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Sistem mendeteksi 3 item kritis pada perikatan aktif <span className="font-semibold text-slate-800">{client?.name}</span> yang membutuhkan pertimbangan profesional sebelum finalisasi laporan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/engagements/${engagement.id}`}
            className="px-4 py-2 bg-[#0D5C75] hover:bg-[#09475C] text-white text-xs font-semibold rounded shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Buka Keterlibatan Aktif
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3 Urgent Attention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Item 1: Ambiguous Account Mapping */}
        <div className="bg-white rounded border border-amber-200 p-4 shadow-sm hover:border-amber-400 transition-colors flex flex-col justify-between text-xs space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                Pemetaan Akun Ambigu
              </span>
              <span className="text-[11px] font-mono text-slate-500">2199-00</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              Akun Penampungan Selisih Kurs Sementara
            </h3>
            <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed">
              Tingkat keyakinan ekstraksi hanya 38%. Saldo Rp 110.000.000 berpotensi merupakan akun antara yang harus dialokasikan ke Beban/Pendapatan Lain-lain sebelum penutupan buku.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Perlu Konfirmasi Senior
            </span>
            <Link
              href={`/engagements/${engagement.id}/workpapers`}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-0.5"
            >
              Review Pemetaan &rarr;
            </Link>
          </div>
        </div>

        {/* Item 2: Material Review Point (DSO & CKPN) */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition-colors flex flex-col justify-between text-xs space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-rose-100 text-rose-900 border border-rose-300">
                Review Point Material
              </span>
              <span className="text-[11px] font-mono text-slate-500">WP-B (Piutang)</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              Lonjakan Piutang Usaha (+45.1% YoY)
            </h3>
            <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed">
              Kenaikan piutang Rp 3.000.000.000 melampaui ambang materialitas Rp 250 Jt, namun CKPN hanya bertambah Rp 50 Jt. Diperlukan konfirmasi saldo 10 debitur terbesar.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Ditugaskan ke: <strong className="text-slate-700">Ahmad Pratama</strong></span>
            <Link
              href={`/engagements/${engagement.id}/findings`}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-0.5"
            >
              Bersihkan Catatan &rarr;
            </Link>
          </div>
        </div>

        {/* Item 3: Tax PPN Discrepancy */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition-colors flex flex-col justify-between text-xs space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-blue-100 text-blue-900 border border-blue-300">
                Pajak Masukan Anomali
              </span>
              <span className="text-[11px] font-mono text-slate-500">e-Faktur PPN</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              Tarif PPN Masukan 10% Terdeteksi
            </h3>
            <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed">
              Faktur Masukan CV Supplier Logam Lama masih menggunakan tarif lama 10% (selisih Rp 2.000.000 terhadap UU HPP 11%). Berisiko ditolak pengkreditannya oleh DJP.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Aturan: <strong className="text-slate-700">UU HPP 11%</strong></span>
            <Link
              href={`/engagements/${engagement.id}/tax`}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-0.5"
            >
              Cek e-Faktur &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Split Section: Active Engagements & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagements Needing Action (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Perikatan Aktif Dalam Proses</h2>
            <Link href="/clients" className="text-xs text-teal-700 font-semibold hover:underline">
              Lihat Semua Klien ({state.clients.length}) &rarr;
            </Link>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{client?.name}</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {engagement.title}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>NPWP: <strong className="font-mono text-slate-700">{client?.npwp}</strong></span>
                  <span>Industri: {client?.industry}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/engagements/${engagement.id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs transition-colors"
                >
                  Buka Ruang Kerja
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar inside Engagement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 bg-slate-50/50 p-3 text-xs">
              <div className="px-3">
                <span className="text-slate-500 text-[10px] block">Materialitas Audit</span>
                <span className="font-mono font-bold text-slate-900">{formatIdr(engagement.materialityThresholdIdr)}</span>
              </div>
              <div className="px-3">
                <span className="text-slate-500 text-[10px] block">Kertas Kerja Kas</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              </div>
              <div className="px-3">
                <span className="text-slate-500 text-[10px] block">Review Points</span>
                <span className="font-bold text-amber-800">{unclearedReviewPoints.length} Terbuka</span>
              </div>
              <div className="px-3">
                <span className="text-slate-500 text-[10px] block">Advisory Memo</span>
                <span className="font-semibold text-emerald-700">Disetujui Partner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Audit Evidence & Activity Stream (1 Column) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Jejak Bukti & Aktivitas Terbaru</h2>
            <Link href={`/engagements/${engagement.id}/activity`} className="text-xs text-teal-700 font-semibold hover:underline">
              Audit Trail &rarr;
            </Link>
          </div>

          <div className="bg-white rounded border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            {state.auditEvents.slice(0, 4).map((evt) => (
              <div key={evt.id} className="border-b border-slate-100 pb-2.5 last:border-b-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{evt.actorName} ({evt.actorRole})</span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-slate-800 font-medium text-[11px] leading-tight">
                  {evt.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
