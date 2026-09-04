'use client';
import { IsometricWorkbookPreview } from "@/components/v4/visuals/IsometricWorkbookPreview";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Hash,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { ExportArtifact, UserRoleV4 } from '@/types/domain-v4';

export default function ExportsPage() {
  const routeParams = useParams();
  const engagementId = (routeParams?.id as string) || 'ENG-2026-01';
  const state = repo.getState();
  const engagement = state.engagements.find((e) => e.id === engagementId) || {
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
  const isCustomEngagement = engagementId !== 'ENG-2026-01';
  const wpVersion = state.workpaperVersions.find((w) => w.engagementId === engagement.id) || state.workpaperVersions[0];
  const checks = state.validationChecks;
  const initialArtifacts = isCustomEngagement
    ? state.exportArtifacts.filter((a) => a.engagementId === engagement.id)
    : state.exportArtifacts;
  const [artifacts, setArtifacts] = useState<ExportArtifact[]>(initialArtifacts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRoleV4>('partner');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('finova_v4_role');
    if (saved && ['preparer', 'senior', 'manager', 'partner'].includes(saved)) {
      setActiveRole(saved as UserRoleV4);
    }

    if (isCustomEngagement) {
      try {
        const storedArtifacts = localStorage.getItem('finova_exports_' + engagementId);
        if (storedArtifacts) {
          const parsed = JSON.parse(storedArtifacts);
          if (Array.isArray(parsed)) {
            setArtifacts(parsed);
          }
        }
      } catch (e) {}
    }
  }, [engagementId, isCustomEngagement]);

  // Pre-Flight Eligibility Checklist (Section 45.3)
  const isStale = wpVersion?.isStale;
  const hasBlockingErrors = checks.some((c) => c.status === 'fail' && c.severity === 'blocking');
  const needsReviewCount = state.mappingDecisions.filter((d) => d.status === 'needs_review').length;
  const hasUnmapped = needsReviewCount > 0;
  const isEligible = !isStale && !hasBlockingErrors && !hasUnmapped;

  const handleGenerateExport = async () => {
    if (hasUnmapped) {
      setErrorMessage(`Ekspor Ditolak: Masih terdapat ${needsReviewCount} akun berstatus Needs Review yang belum diputuskan.`);
      return;
    }
    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationStep('1/3: Memvalidasi Integritas Versi Kertas Kerja & Hash Sumber...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep('2/3: Menyusun Workbook XLSX & Menyematkan Manifest Audit...');
      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep('3/3: Menjalankan Verifikasi Read-Back Otomatis...');

      const user = state.users.find((u) => u.role === activeRole) || state.users[0];

      const response = await fetch('/api/v1/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId: engagement.id,
          userRole: activeRole,
          userId: user.id,
          operatorName: user.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Gagal membuat ekspor XLSX.');
      }

      if (data.data) {
        const updated = [data.data, ...artifacts.filter((a) => a.id !== data.data.id)];
        setArtifacts(updated);
        try {
          localStorage.setItem('finova_exports_' + engagement.id, JSON.stringify(updated));
        } catch (e) {}
      } else {
        setArtifacts([...repo.getState().exportArtifacts]);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleDownloadFile = (artifactId: string) => {
    window.open(`/api/v1/exports/${artifactId}/download`, '_blank');
  };

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Top Banner with Double-Bezel Architecture */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div>
          <h2 className="text-base font-bold text-[#102A32]">
            Pusat Ekspor Kertas Kerja Resmi (XLSX Export Center)
          </h2>
          <p className="text-xs text-[#52636A] mt-0.5">
            Menghasilkan berkas spreadsheet `.xlsx` resmi yang memuat Sheet Kertas Kerja (Lead Schedule) dan Sheet Manifest dengan integritas hash SHA-256.
          </p>
        </div>

        <Link
          href={`/engagements/${engagement.id}/workpaper`}
          className="finova-pill-cta bg-[#F6F7F5] hover:bg-[#EBEFED] text-[#102A32] text-xs border border-[#DDE4E2]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#52636A]" />
          <span>Kembali ke Kertas Kerja</span>
        </Link>
      </div>

      {/* Isometric 3D Workbook Architecture Preview */}
      <IsometricWorkbookPreview />

      {/* Pre-Flight Eligibility Checklist */}
      <div className="bg-white rounded-2xl border border-[#DDE4E2] p-6 shadow-2xs space-y-5 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#102A32] text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F8F7A]" />
            Daftar Kelayakan Sebelum Ekspor (Pre-Flight Eligibility)
          </h3>
          <span className="text-[11px] font-mono text-[#52636A]">
            Kepatuhan Prosedur Seksi 45.3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Check 1: Non-Stale */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              !isStale ? 'bg-[#E8F5F1]/60 border-[#B2DFD6]' : 'bg-[#FDECEF]/60 border-[#F8B4BD]'
            }`}
          >
            {!isStale ? (
              <CheckCircle2 className="w-4 h-4 text-[#0F8F7A] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#C83E4D] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-[#102A32]">Versi Kertas Kerja Terkini</div>
              <div className="text-[11px] text-[#52636A] mt-0.5">
                {!isStale
                  ? 'Kertas kerja telah mencerminkan dataset dan pemetaan terkini.'
                  : 'Upstream berubah, harap rekalkulasi sebelum ekspor.'}
              </div>
            </div>
          </div>

          {/* Check 2: Blocking Checks Pass */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              !hasBlockingErrors ? 'bg-[#E8F5F1]/60 border-[#B2DFD6]' : 'bg-[#FDECEF]/60 border-[#F8B4BD]'
            }`}
          >
            {!hasBlockingErrors ? (
              <CheckCircle2 className="w-4 h-4 text-[#0F8F7A] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#C83E4D] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-[#102A32]">Tie-Out Kritis Lulus (100%)</div>
              <div className="text-[11px] text-[#52636A] mt-0.5">
                {!hasBlockingErrors
                  ? 'Neraca saldo seimbang & persamaan neraca terpenuhi.'
                  : 'Terdapat selisih matematis yang memblokir ekspor.'}
              </div>
            </div>
          </div>

          {/* Check 3: Zero Unmapped Accounts */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              !hasUnmapped ? 'bg-[#E8F5F1]/60 border-[#B2DFD6]' : 'bg-[#FFF7E8]/80 border-[#F6E0B5]'
            }`}
          >
            {!hasUnmapped ? (
              <CheckCircle2 className="w-4 h-4 text-[#0F8F7A] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#B7791F] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-[#102A32]">Pemetaan Akun Selesai</div>
              <div className="text-[11px] text-[#52636A] mt-0.5">
                {!hasUnmapped
                  ? 'Seluruh akun telah dipetakan atau dieksklusi secara sah.'
                  : 'Masih terdapat akun berstatus Needs Review.'}
              </div>
            </div>
          </div>
        </div>

        {generationStep && (
          <div className="p-3.5 bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6] rounded-xl font-mono text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{generationStep}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-[#FDECEF] text-[#C83E4D] border border-[#F8B4BD] rounded-xl font-semibold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#DDE4E2]">
          <div className="text-[11px] text-[#52636A]">
            Hanya Partner atau Manager yang berwenang mengesahkan ekspor resmi (Role aktif: <strong className="font-mono text-[#102A32]">{activeRole}</strong>).
          </div>

          <button
            onClick={handleGenerateExport}
            disabled={!isEligible || isGenerating}
            className={`finova-pill-cta text-xs shadow-md ${
              isEligible && !isGenerating
                ? 'bg-[#0F8F7A] hover:bg-[#0C7564] text-white cursor-pointer'
                : 'bg-[#DDE4E2] text-[#7A8C93] cursor-not-allowed'
            }`}
          >
            <span>{isGenerating ? 'Memproses Ekspor & Verifikasi...' : 'Generate XLSX Kertas Kerja Resmi'}</span>
            <div className="icon-circle">
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Generated Export Artifacts List */}
      <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden text-xs">
        <div className="p-4 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between font-semibold">
          <span>Arsip Berkas Ekspor Resmi ({artifacts.length} Berkas Dibuat)</span>
          <span className="font-mono text-[11px] text-[#52636A]">Verifikasi Read-Back Wajib Selesai</span>
        </div>

        {artifacts.length === 0 ? (
          <div className="p-10 text-center text-[#7A8C93] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F6F7F5] text-[#7A8C93] flex items-center justify-center mx-auto border border-[#DDE4E2]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm text-[#102A32]">Belum ada berkas ekspor yang dihasilkan</div>
            <p className="text-xs text-[#52636A] max-w-sm mx-auto">
              Selesaikan pemetaan akun untuk memenuhi kelayakan pra-ekspor lalu klik tombol generate di atas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DDE4E2]">
            {artifacts.map((art) => (
              <div key={art.id} className="p-5 hover:bg-[#F6F7F5]/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F1F4F3] text-[#102A32] border border-[#DDE4E2]">
                      {art.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      READ-BACK TERVERIFIKASI
                    </span>
                    <span className="text-[11px] text-[#52636A]">
                      {(art.fileSizeBytes / 1024).toFixed(1)} KB &bull; Format XLSX Resmi
                    </span>
                  </div>

                  <div className="font-bold text-sm text-[#102A32] flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#0F8F7A]" />
                    {art.filename}
                  </div>

                  <div className="font-mono text-[11px] text-[#7A8C93] flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#7A8C93]" />
                    SHA-256: {art.checksumSha256}
                  </div>

                  <div className="text-[11px] text-[#52636A]">
                    Dibuat: <span suppressHydrationWarning>{mounted ? new Date(art.createdAt).toLocaleDateString('id-ID') : ''}</span> &bull; Memuat Sheet <strong className="text-[#102A32]">Lead Schedule</strong> & <strong className="text-[#102A32]">Manifest</strong>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(art.id)}
                    className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-xs cursor-pointer"
                  >
                    <span>Unduh Berkas XLSX</span>
                    <div className="icon-circle">
                      <Download className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Step Navigation Footer */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs">
        <Link href={`/engagements/${engagement.id}/workpaper`} className="text-xs font-semibold text-[#52636A] hover:text-[#102A32] flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Kembali ke 4. Kertas Kerja Lead Schedule</span>
        </Link>
        <Link href={`/engagements/${engagement.id}/overview`} className="px-4 py-2 bg-[#102A32] hover:bg-[#0F8F7A] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2">
          <span>Selesai &bull; Kembali ke 1. Ringkasan</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </Link>
      </div>
    </div>
  );
}
