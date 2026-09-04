'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  BrainCircuit,
  Lock,
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Scale,
  Hash,
  Briefcase,
} from 'lucide-react';
import {
  DEMO_FIRM,
  DEMO_CLIENT,
  DEMO_ENGAGEMENT,
  DEMO_RAW_ACCOUNTS,
  DEMO_TOTALS,
} from '@/lib/demo/fixtures';
import { formatIdrNumber } from '@/lib/decimal';

export default function DemoShowroomPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'mapping' | 'workpaper' | 'advisory' | 'export'>('overview');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#0F8F7A]/20 selection:text-[#0F8F7A]">
      {/* Top Banner: Distinct Showroom Notice */}
      <div className="bg-gradient-to-r from-[#102A32] via-[#0F8F7A] to-[#102A32] text-white px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 font-mono font-bold text-[10px] tracking-wider uppercase">
              Demo Showroom
            </span>
            <span className="font-medium">
              Data Simulasi: <strong className="underline underline-offset-2">{DEMO_CLIENT.legalName}</strong> oleh <strong>{DEMO_FIRM.name}</strong>.
            </span>
            <span className="hidden md:inline text-white/70">
              (Data ini 100% terpisah dari database produksi Supabase Anda)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/engagements"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#102A32] font-bold hover:bg-slate-100 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Buka Workspace Produksi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Showroom Header */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-base shadow-xs">
              FN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-[#0F172A] tracking-tight">
                  {DEMO_ENGAGEMENT.name}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {DEMO_ENGAGEMENT.accountingStandard}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Klien: <strong className="text-[#0F172A]">{DEMO_CLIENT.legalName}</strong> ({DEMO_CLIENT.industry}) &bull; Materialitas: <strong>{formatIdrNumber(DEMO_ENGAGEMENT.materialityIdr)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/engagements/new"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0F8F7A] hover:bg-[#0C7564] text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>+ Buat Perikatan Riil Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-[#F1F5F9] overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Ringkasan & Metrik', icon: BarChart3 },
            { id: 'files', label: 'Berkas & Hash (1)', icon: FileSpreadsheet },
            { id: 'mapping', label: 'Pemetaan SAK (22)', icon: Layers },
            { id: 'workpaper', label: 'Master Lead Schedule', icon: Scale },
            { id: 'advisory', label: 'Advisory Manufaktur', icon: BrainCircuit },
            { id: 'export', label: 'Ekspor Resmi KAP', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0F8F7A] text-[#0F8F7A] bg-emerald-50/40 font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xs font-medium text-[#64748B] block">Total Aset (Per Client)</span>
                <span className="text-2xl font-black font-mono text-[#0F172A] block mt-1">
                  {formatIdrNumber(DEMO_TOTALS.totalAssetsIdr)}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Neraca Balance (Tie-Out Pas)
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xs font-medium text-[#64748B] block">Pendapatan Bersih (Omset)</span>
                <span className="text-2xl font-black font-mono text-[#0F8F7A] block mt-1">
                  {formatIdrNumber(DEMO_TOTALS.revenueIdr)}
                </span>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  HPP: {formatIdrNumber(DEMO_TOTALS.cogsIdr)}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xs font-medium text-[#64748B] block">Laba Bersih Tahun Berjalan</span>
                <span className="text-2xl font-black font-mono text-emerald-600 block mt-1">
                  {formatIdrNumber(DEMO_TOTALS.netIncomeIdr)}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                  Margin Laba: 8.11%
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xs font-medium text-[#64748B] block">Selisih Tie-Out Neraca</span>
                <span className="text-2xl font-black font-mono text-[#0F172A] block mt-1">
                  Rp 0
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" /> Deterministik Math Pass
                </span>
              </div>
            </div>

            {/* Client Context & Audit Scope */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
              <h2 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0F8F7A]" />
                Profil Klien Auditee & Ruang Lingkup Perikatan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[#64748B] block">Entitas Klien</span>
                  <strong className="text-[#0F172A] block text-sm mt-0.5">{DEMO_CLIENT.legalName}</strong>
                  <span className="text-[#64748B] block mt-1">NPWP: {DEMO_CLIENT.taxIdNpwp}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[#64748B] block">Sektor Industri</span>
                  <strong className="text-[#0F172A] block text-sm mt-0.5">{DEMO_CLIENT.industry}</strong>
                  <span className="text-[#64748B] block mt-1">Pabrik & Perakitan GIIC Cikarang</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[#64748B] block">Tim Auditor KAP</span>
                  <strong className="text-[#0F172A] block text-sm mt-0.5">{DEMO_FIRM.name}</strong>
                  <span className="text-[#64748B] block mt-1">Lead Partner: {DEMO_FIRM.managingPartnerName} ({DEMO_FIRM.managingPartnerApNumber})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0F8F7A]" />
              Arsip Bukti Audit & Neraca Saldo Klien (Demo Fixture)
            </h2>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  XLSX
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#0F172A]">TB_PT_Nusantara_Sukses_Makmur_FY2026.xlsx</h3>
                  <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                    SHA-256: 9f83a48e71c9b204683bc48b3017fa489110756e4c7717bc2d043444fb9a7b92
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                Clean &bull; 22 Baris Akun
              </span>
            </div>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F8F7A]" />
                Pemetaan 22 Akun Standar SAK Indonesia
              </h2>
              <span className="text-xs font-mono text-emerald-600 font-bold">100% Terpetakan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[#64748B] border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Kode Akun</th>
                    <th className="py-2.5 px-4">Nama Akun Klien</th>
                    <th className="py-2.5 px-4 text-right">Debit</th>
                    <th className="py-2.5 px-4 text-right">Kredit</th>
                    <th className="py-2.5 px-4">Target WP SAK</th>
                    <th className="py-2.5 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DEMO_RAW_ACCOUNTS.map((acc) => (
                    <tr key={acc.code} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0F172A]">{acc.code}</td>
                      <td className="py-2.5 px-4 text-[#0F172A] font-medium">{acc.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{acc.d ? formatIdrNumber(acc.d) : '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{acc.c ? formatIdrNumber(acc.c) : '-'}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-[11px] text-[#0F172A]">
                          {acc.target}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.conf > 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {acc.conf}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'workpaper' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0F8F7A]" />
              Master Lead Schedule Kertas Kerja Induk (SAK Indonesia)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs text-[#64748B]">WP-A Aset Lancar</span>
                <strong className="block text-lg font-mono font-bold mt-1">Rp 18.200.000.000</strong>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs text-[#64748B]">WP-B Aset Tidak Lancar</span>
                <strong className="block text-lg font-mono font-bold mt-1">Rp 16.350.000.000</strong>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs text-[#64748B]">WP-C & D Total Kewajiban</span>
                <strong className="block text-lg font-mono font-bold mt-1">Rp 12.360.000.000</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advisory' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#0F8F7A]" />
              Advisory Finansial & Anomali Biaya Pabrikasi
            </h2>
            <p className="text-xs text-[#64748B]">
              Analisis khusus sektor manufaktur komponen otomotif PT Nusantara Sukses Makmur.
            </p>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <strong className="font-bold block">Temuan Audit (Risk Point):</strong>
              <p>Akun 2199-00 (Selisih Kurs Sementara Rp 310.000.000) memerlukan reklasifikasi akhir tahun ke WP-F.4 Beban Lain-lain agar tidak mendistorsi Utang Usaha.</p>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-center">
            <h2 className="text-base font-bold text-[#0F172A]">
              Kertas Kerja Induk Siap Ekspor Resmi
            </h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Seluruh tie-out saldo neraca telah terverifikasi Rp 0. File siap diunduh dalam format Excel formal KAP.
            </p>
            <a
              href="/api/v1/exports"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F8F7A] text-white font-bold text-xs hover:bg-[#0C7564] transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Kertas_Kerja_Induk_NSM_FY2026.xlsx</span>
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
