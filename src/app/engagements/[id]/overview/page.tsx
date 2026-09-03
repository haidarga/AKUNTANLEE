'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Table,
  UploadCloud,
  Download,
  AlertCircle,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { BalanceScaleIllustration } from '@/components/v4/visuals/WorkflowIllustrations';

export default function EngagementOverviewPage() {
  const state = repo.getState();
  const engagement = state.engagements[0];
  const client = state.clients.find((c) => c.id === engagement.clientId);
  const wp = state.workpaperVersions[0];
  const files = state.fileVersions;
  const needsReviewDecisions = state.mappingDecisions.filter((d) => d.status === 'needs_review');
  const checks = state.validationChecks;
  const auditEvents = state.auditEvents.slice(0, 4);

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* 1. Next Required Action Surface (Double-Bezel Architecture & Button-in-Button CTA) */}
      <div className="finova-bezel-outer bg-gradient-to-r from-[#FFF7E8]/60 via-[#FFFDF8] to-[#FFF7E8]/60 border-[#F6E0B5]">
        <div className="finova-bezel-inner p-5 sm:p-6 border-2 border-[#B7791F]/30 bg-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B7791F] animate-ping" />
                Tindakan Penentu (Next Required Action)
              </span>
              <span className="text-xs text-[#52636A] font-medium">
                1 Akun Ambigu Membutuhkan Keputusan Anda
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#102A32] tracking-tight">
              Selesaikan Pemetaan: 2199-00 Akun Penampungan Selisih Kurs Sementara
            </h2>
            <p className="text-xs text-[#52636A] leading-relaxed">
              Sistem mendeteksi saldo penampungan sebesar <strong className="text-[#102A32] font-mono">Rp 310.000.000</strong> dengan tingkat keyakinan rendah (38%). Tinjau alokasi target kertas kerja atau berikan alasan profesional sebelum finalisasi.
            </p>
          </div>

          <Link
            href={`/engagements/${engagement.id}/mapping`}
            className="finova-pill-cta bg-[#B7791F] hover:bg-[#9E6516] text-white text-xs shadow-md shrink-0"
          >
            <span>Tinjau Pemetaan Sekarang</span>
            <div className="icon-circle">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Horizontal Workflow Stepper with Connected Progress */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#52636A] uppercase tracking-wider">
            Kemajuan Alur Kerja Release 0.1 (Workflow Progress)
          </div>
          <span className="text-[11px] font-mono font-bold text-[#0F8F7A]">
            80% Selesai (1 Langkah Menuju Ekspor)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Step 1 */}
          <Link
            href={`/engagements/${engagement.id}/files`}
            className="p-3 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] hover:bg-[#D3EEE7] transition-all group"
          >
            <div className="font-bold flex items-center gap-1.5 text-[#0F8F7A]">
              <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" />
              1. Berkas Sumber
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">1 File XLSX Bersih</div>
          </Link>

          {/* Step 2 */}
          <Link
            href={`/engagements/${engagement.id}/imports/IMP-001`}
            className="p-3 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] hover:bg-[#D3EEE7] transition-all"
          >
            <div className="font-bold flex items-center gap-1.5 text-[#0F8F7A]">
              <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" />
              2. Normalisasi
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">22 Akun Tervalidasi</div>
          </Link>

          {/* Step 3 */}
          <Link
            href={`/engagements/${engagement.id}/mapping`}
            className="p-3 rounded-xl bg-[#FFF7E8] border border-[#F6E0B5] hover:bg-[#FEF0D4] transition-all relative overflow-hidden"
          >
            <div className="font-bold flex items-center gap-1.5 text-[#B7791F]">
              <Clock className="w-4 h-4 text-[#B7791F]" />
              3. Pemetaan Akun
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">1 Perlu Konfirmasi</div>
          </Link>

          {/* Step 4 */}
          <Link
            href={`/engagements/${engagement.id}/workpaper`}
            className="p-3 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] hover:bg-[#E8F5F1] transition-all"
          >
            <div className="font-bold flex items-center gap-1.5 text-[#102A32]">
              <Table className="w-4 h-4 text-[#0F8F7A]" />
              4. Kertas Kerja
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">Tie-Out Seimbang</div>
          </Link>

          {/* Step 5 */}
          <Link
            href={`/engagements/${engagement.id}/exports`}
            className="p-3 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] hover:bg-[#E8F5F1] transition-all"
          >
            <div className="font-bold flex items-center gap-1.5 text-[#102A32]">
              <Download className="w-4 h-4 text-[#7A8C93]" />
              5. Ekspor XLSX
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">Siap dengan Manifest</div>
          </Link>
        </div>
      </div>

      {/* 3. Visual Accounting Balance Equation Scale */}
      <BalanceScaleIllustration isBalanced={true} />

      {/* 4. Two-Column Layout: Exception Queue & Recent Versions/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Prioritized Exceptions & Tie-Out Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#102A32]">
              Antrean Pengecualian & Hasil Uji Tie-Out
            </h3>
            <span className="text-xs text-[#52636A]">
              Materialitas: <strong className="font-mono text-[#102A32]">{formatIdrNumber(engagement.materialityIdr)}</strong>
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#DDE4E2] divide-y divide-[#DDE4E2] text-xs shadow-2xs overflow-hidden">
            {/* Exception 1: Ambiguous Account */}
            <div className="p-4 flex items-start justify-between gap-3 hover:bg-[#FFF7E8]/20 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5]">
                    Review Diperlukan
                  </span>
                  <span className="font-mono text-[11px] text-[#52636A]">Akun 2199-00</span>
                </div>
                <div className="font-bold text-[#102A32]">
                  Akun Penampungan Selisih Kurs Sementara
                </div>
                <p className="text-[#52636A] text-[11px] leading-relaxed">
                  Tingkat keyakinan ekstraksi hanya 38%. Saldo Rp 310.000.000 harus diselesaikan sebelum ekspor kertas kerja.
                </p>
              </div>

              <Link
                href={`/engagements/${engagement.id}/mapping`}
                className="px-3 py-1.5 bg-[#B7791F]/10 hover:bg-[#B7791F] hover:text-white text-[#B7791F] font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
              >
                Putuskan &rarr;
              </Link>
            </div>

            {/* Tie-Out Check 1: TB Balance */}
            <div className="p-4 flex items-center justify-between gap-3 bg-[#E8F5F1]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F8F7A]/10 text-[#0F8F7A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#102A32]">
                    Keseimbangan Neraca Saldo (TB Debit = Credit)
                  </div>
                  <div className="text-[11px] text-[#52636A] font-mono">
                    Total Debit Rp 87.550.000.000 = Total Kredit Rp 87.550.000.000 (Selisih Rp 0)
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                PASS
              </span>
            </div>

            {/* Tie-Out Check 2: Balance Sheet Equation */}
            <div className="p-4 flex items-center justify-between gap-3 bg-[#E8F5F1]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F8F7A]/10 text-[#0F8F7A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#102A32]">
                    Persamaan Neraca (Aset = Liabilitas + Ekuitas)
                  </div>
                  <div className="text-[11px] text-[#52636A] font-mono">
                    Total Aset = Total Liabilitas + Total Ekuitas (Selisih Rp 0)
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                PASS
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Source File Versions & Audit Trail */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#102A32]">
            Berkas & Versi Sumber Terkini
          </h3>

          <div className="bg-white rounded-2xl border border-[#DDE4E2] p-4 shadow-2xs space-y-3 text-xs">
            {files.map((fv) => (
              <div key={fv.id} className="space-y-1.5 border-b border-[#DDE4E2] pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F4F3] text-[#52636A]">
                    {fv.id} (v{fv.versionNumber})
                  </span>
                  <span className="text-[10px] text-[#0F8F7A] font-semibold bg-[#E8F5F1] px-2 py-0.5 rounded-full border border-[#B2DFD6]">
                    SCAN BERSIH
                  </span>
                </div>
                <div className="font-bold text-[#102A32] truncate">{fv.originalName}</div>
                <div className="text-[10px] font-mono text-[#7A8C93] truncate">
                  SHA-256: {fv.checksumSha256.slice(0, 16)}...
                </div>
              </div>
            ))}

            <Link
              href={`/engagements/${engagement.id}/files`}
              className="block text-center py-2 bg-[#F6F7F5] hover:bg-[#F1F4F3] rounded-xl text-xs font-semibold text-[#102A32] transition-colors border border-[#DDE4E2]"
            >
              Kelola Berkas Sumber &rarr;
            </Link>
          </div>

          {/* Quiet Activity Summary */}
          <div className="bg-white rounded-2xl border border-[#DDE4E2] p-4 shadow-2xs space-y-2 text-xs">
            <h4 className="font-bold text-xs text-[#52636A] uppercase tracking-wider">
              Aktivitas Perikatan Terbaru
            </h4>
            <div className="space-y-2 pt-1">
              {auditEvents.map((evt) => (
                <div key={evt.id} className="text-[11px] border-b border-[#DDE4E2]/60 pb-1.5 last:border-b-0 last:pb-0">
                  <div className="flex justify-between text-[#7A8C93] text-[10px]">
                    <span className="font-medium text-[#102A32]">{evt.actorName.split(',')[0]}</span>
                    <span>{new Date(evt.timestamp).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="text-[#52636A] font-medium">{evt.action.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
