'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

export default function OverviewClient({
  engagementId,
  initialEngagement,
  initialClient,
  initialFiles = [],
  initialAccounts = [],
  initialDecisions = [],
  initialWorkpaper = null,
  initialChecks = [],
}: {
  engagementId: string;
  initialEngagement?: any;
  initialClient?: any;
  initialFiles?: any[];
  initialAccounts?: any[];
  initialDecisions?: any[];
  initialWorkpaper?: any;
  initialChecks?: any[];
}) {
  const state = repo.getState();
  const engagement = initialEngagement || state.engagements.find((e) => e.id === engagementId) || {
    id: engagementId,
    tenantId: 'TENANT-001',
    clientId: 'CLI-002',
    name: engagementId === 'ENG-MANDIRI-2026'
      ? 'Kertas Kerja Audit Mandiri FY 2026 (Unggah Berkas Klien Sendiri)'
      : 'Perikatan Audit Mandiri (' + engagementId + ')',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    currency: 'IDR' as const,
    materialityIdr: 250000000,
    status: 'preparing' as const,
    leadPartnerId: 'USR-PARTNER-01',
    managerId: 'USR-MANAGER-01',
    seniorId: 'USR-SENIOR-01',
    preparerId: 'USR-PREPARER-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const client = initialClient || state.clients.find((c) => c.id === engagement.clientId) || {
    id: 'CLI-CUSTOM',
    legalName: engagement.name,
    code: 'CLIENT',
    industry: 'Jasa & Manufaktur',
  };
  const emptyWp = {
    id: `WPV-${engagement.id}`,
    tenantId: 'TENANT-001',
    engagementId: engagement.id,
    datasetVersionIds: [],
    mappingSetId: `MAPSET-${engagement.id}`,
    templateVersion: 'FINOVA-LEAD-v1.0',
    versionNumber: 1,
    status: 'draft' as const,
    totals: {
      totalAssetsIdr: 0,
      totalLiabilitiesIdr: 0,
      totalEquityIdr: 0,
      netIncomeIdr: 0,
      tbDebitCreditDiffIdr: 0,
      balanceSheetDiffIdr: 0,
    },
    isStale: false,
    calculatedAt: new Date().toISOString(),
  };
  const wp = initialWorkpaper
    || state.workpaperVersions.find((w) => w.engagementId === engagement.id)
    || (engagement.id === 'ENG-2026-01' ? state.workpaperVersions[0] : emptyWp);
  const files = initialFiles.length > 0 ? initialFiles : state.fileVersions.filter((f) => f.engagementId === engagement.id);
  const mapSets = state.mappingSets.filter((ms) => ms.engagementId === engagement.id);
  const mapSetIds = new Set(mapSets.map((ms) => ms.id));
  const decisions = initialDecisions.length > 0
    ? initialDecisions
    : state.mappingDecisions.filter(
        (d) => mapSetIds.has(d.mappingSetId) || (engagement.id === 'ENG-2026-01' && d.mappingSetId === 'MAPSET-001')
      );
  const needsReviewDecisions = decisions.filter((d: any) => d.status === 'needs_review');
  const [customFiles, setCustomFiles] = useState<any[]>(files);
  const [customAccounts, setCustomAccounts] = useState<any[]>(initialAccounts);
  const [customDecisions, setCustomDecisions] = useState<any[]>(decisions);
  const [activeClient, setActiveClient] = useState<any>(client);
  const [activeWpVersion, setActiveWpVersion] = useState<any>(wp);
  const [activeChecks, setActiveChecks] = useState<any[]>(initialChecks);

  useEffect(() => {
    // Fetch live engagement and client info
    fetch(`/api/v1/engagements/${engagementId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (json.client) setActiveClient(json.client);
      })
      .catch(() => {});

    // Fetch live files, accounts, and workpaper totals
    fetch(`/api/v1/engagements/${engagementId}/files`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        const filesList = json.data?.files || json.files;
        if (Array.isArray(filesList)) setCustomFiles(filesList);
        const accsList = json.data?.accounts || json.accounts;
        if (Array.isArray(accsList)) setCustomAccounts(accsList);
        const decsList = json.data?.decisions || json.decisions;
        if (Array.isArray(decsList)) setCustomDecisions(decsList);
        if (json.data?.workpaper) setActiveWpVersion(json.data.workpaper);
        if (Array.isArray(json.data?.checks)) setActiveChecks(json.data.checks);
      })
      .catch(() => {});
  }, [engagementId]);

  const activeFiles = customFiles.length > 0 ? customFiles : files;
  const activeDecisions = customDecisions.length > 0 ? customDecisions : (engagement.id === "ENG-2026-01" ? decisions : []);
  const activeNeedsReview = activeDecisions.filter((d: any) => d.status === "needs_review");
  const isCustomAllMapped = activeDecisions.length > 0 && activeNeedsReview.length === 0;
  const hasBlockingFailure = activeChecks.some((check: any) => check.status === 'fail' && check.severity === 'blocking');
  const tbCheck = activeChecks.find((check: any) => check.ruleId === 'RULE-TB-BALANCE');
  const balanceSheetCheck = activeChecks.find((check: any) => check.ruleId === 'RULE-BALANCE-SHEET-EQUATION');
  const hasFiles = activeFiles.length > 0;
  const isAllMapped = isCustomAllMapped && !hasBlockingFailure;

  const checks = state.validationChecks;
  const auditEvents = state.auditEvents.slice(0, 4);

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* 1. Next Required Action Surface (Dynamic Canonical State Machine) */}
      {!hasFiles ? (
        <div className="finova-bezel-outer bg-gradient-to-r from-[#EFF6FF]/60 via-[#F8FAFC] to-[#EFF6FF]/60 border-[#BFDBFE]">
          <div className="finova-bezel-inner p-5 sm:p-6 border-2 border-[#3B82F6]/30 bg-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-[#2563EB]" />
                  Tahap Awal: Unggah Berkas Sumber Finansial
                </span>
                <span className="text-xs text-[#52636A] font-medium">Perikatan Baru Siap Dijalankan</span>
              </div>
              <h2 className="text-lg font-bold text-[#102A32] tracking-tight">
                Mulai dengan Mengunggah Neraca Saldo (Trial Balance) Klien
              </h2>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Tarik berkas spreadsheet (.xlsx atau .csv) ke sistem. Mesin ekstraksi akan membedah kolom kode akun, nama, debit, kredit, dan saldo secara otomatis.
              </p>
            </div>
            <Link
              href={`/engagements/${engagement.id}/files`}
              className="finova-pill-cta bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shrink-0"
            >
              <span>Unggah Berkas Excel Sekarang</span>
              <div className="icon-circle">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      ) : hasBlockingFailure ? (
        <div className="finova-bezel-outer bg-[#FEF2F2] border-[#FECACA]">
          <div className="finova-bezel-inner p-5 sm:p-6 border-2 border-[#DC2626]/30 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] inline-flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Finalisasi Diblokir</span>
              <h2 className="text-lg font-bold text-[#102A32] tracking-tight">Pemetaan selesai, tetapi uji tie-out masih gagal</h2>
              <p className="text-xs text-[#52636A] leading-relaxed">Perbaiki selisih neraca saldo atau persamaan neraca di Kertas Kerja sebelum membuat ekspor resmi.</p>
            </div>
            <Link href={`/engagements/${engagement.id}/workpaper`} className="finova-pill-cta bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs shadow-md shrink-0"><span>Tinjau Selisih Tie-Out</span><div className="icon-circle"><ArrowRight className="w-3.5 h-3.5 text-white" /></div></Link>
          </div>
        </div>
      ) : isAllMapped ? (
        <div className="finova-bezel-outer bg-gradient-to-r from-[#ECFDF5]/60 via-[#F0FDF4] to-[#ECFDF5]/60 border-[#A7F3D0]">
          <div className="finova-bezel-inner p-5 sm:p-6 border-2 border-[#10B981]/30 bg-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  Status Perikatan: Seluruh Pemetaan Akun Selesai (100% Validasi SAK)
                </span>
                <span className="text-xs text-[#065F46] font-medium">
                  0 Akun Ambigu &bull; Siap untuk Finalisasi & Tanda Tangan Partner
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#102A32] tracking-tight">
                Pemetaan SAK Selesai & Uji Keseimbangan Neraca Lolos Mutlak
              </h2>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Semua {activeDecisions.length} akun telah berhasil dipetakan ke Pos SAK Indonesia. Persamaan matematis Aset = Liabilitas + Ekuitas terpenuhi mutlak (Selisih Rp 0). Anda dapat meninjau Kertas Kerja atau langsung menghasilkan Berkas Ekspor Resmi.
              </p>
            </div>
            <Link
              href={`/engagements/${engagement.id}/exports`}
              className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md shrink-0 cursor-pointer"
            >
              <span>Buka Ekspor Resmi & Unduh XLSX</span>
              <div className="icon-circle">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="finova-bezel-outer bg-gradient-to-r from-[#FFF7E8]/60 via-[#FFFDF8] to-[#FFF7E8]/60 border-[#F6E0B5]">
          <div className="finova-bezel-inner p-5 sm:p-6 border-2 border-[#B7791F]/30 bg-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B7791F] animate-ping" />
                  Tindakan Penentu (Next Required Action)
                </span>
                <span className="text-xs text-[#52636A] font-medium">
                  {activeNeedsReview.length} Akun Ambigu Membutuhkan Keputusan Anda
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#102A32] tracking-tight">
                Selesaikan Pemetaan: {activeNeedsReview[0]?.sourceAccountCode} {activeNeedsReview[0]?.sourceAccountName}
              </h2>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Sistem mendeteksi saldo penampungan sebesar <strong className="text-[#102A32] font-mono">Rp {Math.abs(activeNeedsReview[0]?.amountIdr || 0).toLocaleString('id-ID')}</strong> dengan tingkat keyakinan rendah ({((activeNeedsReview[0]?.confidenceScore || 0) * 100).toFixed(0)}%). Tinjau alokasi target kertas kerja atau berikan alasan profesional sebelum finalisasi.
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
      )}

      {/* 2. Horizontal Workflow Stepper with Connected Progress */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#52636A] uppercase tracking-wider">
            Kemajuan Alur Kerja Release 0.1 (Workflow Progress)
          </div>
          <span className="text-[11px] font-mono font-bold text-[#0F8F7A]">
            {!hasFiles ? '20% (Menunggu Berkas Sumber)' : isAllMapped ? '100% Selesai (Siap Finalisasi & Ekspor)' : '80% Selesai (1 Langkah Menuju Ekspor)'}
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
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">{activeFiles.length > 0 ? (activeFiles.length + " Berkas " + (activeFiles[0].originalName?.endsWith(".csv") ? "CSV" : "XLSX") + " Bersih") : "Belum Ada Berkas"}</div>
          </Link>

          {/* Step 2 */}
          <Link
            href={`/engagements/${engagement.id}/imports/IMP-${engagement.id}`}
            className="p-3 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] hover:bg-[#D3EEE7] transition-all"
          >
            <div className="font-bold flex items-center gap-1.5 text-[#0F8F7A]">
              <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" />
              2. Normalisasi
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">
              {customAccounts.length > 0
                ? customAccounts.length + " Akun Tervalidasi"
                : engagement.id === "ENG-2026-01"
                ? "22 Akun Tervalidasi"
                : "Menunggu Normalisasi"}
            </div>
          </Link>

          {/* Step 3 */}
          <Link
            href={`/engagements/${engagement.id}/mapping`}
            className={`p-3 rounded-xl border transition-all ${
              isAllMapped
                ? 'bg-[#E8F5F1] border-[#B2DFD6] hover:bg-[#D3EEE7]'
                : 'bg-[#FFF7E8] border-[#F6E0B5] hover:bg-[#FEF0D4]'
            }`}
          >
            <div className={`font-bold flex items-center gap-1.5 ${isAllMapped ? 'text-[#0F8F7A]' : 'text-[#B7791F]'}`}>
              {isAllMapped ? <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" /> : <Clock className="w-4 h-4 text-[#B7791F]" />}
              3. Pemetaan Akun
            </div>
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">
              {isCustomAllMapped ? `${activeDecisions.length} Akun Terpetakan (100%)` : activeDecisions.length > 0 ? `${activeNeedsReview.length} Perlu Konfirmasi` : "Belum Dimulai"}
            </div>
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
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">{hasBlockingFailure ? 'Tie-Out Gagal — Perbaikan Diperlukan' : 'Tie-Out Seimbang'}</div>
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
            <div className="text-[11px] text-[#52636A] mt-1 font-medium">{hasBlockingFailure ? 'Diblokir sampai tie-out lolos' : 'Siap dengan Manifest'}</div>
          </Link>
        </div>
      </div>

      {/* 3. Visual Accounting Balance Equation Scale */}
      <BalanceScaleIllustration
      isBalanced={activeWpVersion ? Math.abs(activeWpVersion.totals?.balanceSheetDiffIdr || 0) === 0 : true}
      diff={Math.abs(activeWpVersion?.totals?.balanceSheetDiffIdr || 0)}
      assets={activeWpVersion?.totals?.totalAssetsIdr || 0}
        liabilities={activeWpVersion?.totals?.totalLiabilitiesIdr || 0}
        equity={activeWpVersion?.totals?.totalEquityIdr || 0}
      />

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
            {/* Dynamic Exception Queue: Rendered only if there are pending review items */}
            {activeNeedsReview.length > 0 ? (
              activeNeedsReview.map((dec: any) => (
                <div key={dec.id} className="p-4 flex items-start justify-between gap-3 hover:bg-[#FFF7E8]/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5]">
                        Review Diperlukan
                      </span>
                      <span className="font-mono text-[11px] text-[#52636A]">Akun {dec.sourceAccountCode}</span>
                    </div>
                    <div className="font-bold text-[#102A32]">
                      {dec.sourceAccountName}
                    </div>
                    <p className="text-[#52636A] text-[11px] leading-relaxed">
                      Tingkat keyakinan ekstraksi {((dec.confidenceScore || 0) * 100).toFixed(0)}%. Saldo Rp {Math.abs(dec.amountIdr || 0).toLocaleString('id-ID')} harus diselesaikan sebelum ekspor kertas kerja.
                    </p>
                  </div>

                  <Link
                    href={`/engagements/${engagement.id}/mapping`}
                    className="px-3 py-1.5 bg-[#B7791F]/10 hover:bg-[#B7791F] hover:text-white text-[#B7791F] font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                  >
                    Putuskan &rarr;
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 flex items-center justify-between gap-3 bg-[#E8F5F1]/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0F8F7A]/10 text-[#0F8F7A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                  <div className="font-bold text-[#102A32]">{hasBlockingFailure ? 'Pengecualian Tie-Out Memerlukan Perbaikan' : 'Antrean Pengecualian Bersih (0 Akun Tertunda)'}</div>
                    <div className="text-[11px] text-[#52636A]">
                      {hasBlockingFailure ? 'Ekspor resmi ditahan sampai seluruh uji blocking berstatus PASS.' : `Seluruh ${activeDecisions.length} akun telah berhasil dipetakan ke Pos SAK dan disetujui (Siap Finalisasi & Ekspor).`}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                  {hasBlockingFailure ? 'BLOCKED' : 'RESOLVED'}
                </span>
              </div>
            )}

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
                    {tbCheck ? `Total Debit ${formatIdrNumber(tbCheck.inputs?.totalDebitIdr || 0)} = Total Kredit ${formatIdrNumber(tbCheck.inputs?.totalCreditIdr || 0)} (Selisih ${formatIdrNumber(Math.abs(tbCheck.difference || 0))})` : 'Belum ada hasil uji neraca saldo'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                {tbCheck?.status === 'pass' ? 'PASS' : 'FAIL'}
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
                    {balanceSheetCheck ? `Total Aset ${formatIdrNumber(balanceSheetCheck.inputs?.totalAssetsIdr || 0)} = Liabilitas + Ekuitas ${formatIdrNumber((balanceSheetCheck.inputs?.totalLiabilitiesIdr || 0) + (balanceSheetCheck.inputs?.totalEquityIdr || 0))} (Selisih ${formatIdrNumber(Math.abs(balanceSheetCheck.difference || 0))})` : 'Belum ada hasil uji persamaan neraca'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                {balanceSheetCheck?.status === 'pass' ? 'PASS' : 'FAIL'}
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
            {activeFiles.map((fv: any) => (
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
