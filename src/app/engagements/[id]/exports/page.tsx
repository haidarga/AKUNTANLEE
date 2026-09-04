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
import { ExportArtifact, UserRoleV4, WorkpaperVersion, ValidationCheckResult, MappingDecision, FileVersion } from '@/types/domain-v4';

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
  const defaultWp = state.workpaperVersions.find((w) => w.engagementId === engagement.id) || state.workpaperVersions[0];
  const [wpVersion, setWpVersion] = useState<WorkpaperVersion>(defaultWp);
  const [checks, setChecks] = useState<ValidationCheckResult[]>(state.validationChecks);
  const [lines, setLines] = useState<any[]>(state.workpaperLines);
  const [mappingDecisions, setMappingDecisions] = useState<MappingDecision[]>(state.mappingDecisions);
  const [fileVersions, setFileVersions] = useState<FileVersion[]>(state.fileVersions);

  const initialArtifacts = isCustomEngagement
    ? state.exportArtifacts.filter((a) => a.engagementId === engagement.id)
    : state.exportArtifacts;
  const [artifacts, setArtifacts] = useState<ExportArtifact[]>(initialArtifacts);
  const [artifactPayloads, setArtifactPayloads] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRoleV4>('partner');
  const [mounted, setMounted] = useState(false);
  const [activeSigner, setActiveSigner] = useState<string>("Lee Jonathan, CPA");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('finova_v4_role');
    if (saved && ['preparer', 'senior', 'manager', 'partner'].includes(saved)) {
      setActiveRole(saved as UserRoleV4);
    }

    try {
      const savedFirm = localStorage.getItem("finova_firm_profile");
      if (savedFirm) {
        const parsed = JSON.parse(savedFirm);
        if (parsed?.managingPartnerName) setActiveSigner(parsed.managingPartnerName);
      }
    } catch (e) {}

    if (isCustomEngagement) {
      try {
        const storedWp = localStorage.getItem('finova_wp_' + engagementId);
        if (storedWp) {
          const parsed = JSON.parse(storedWp);
          const activeVer = parsed?.workpaperVersion || (parsed?.totals ? parsed : null);
          if (activeVer) {
            setWpVersion(activeVer);
          }
          const activeChecks = parsed?.checks || parsed?.validationChecks;
          if (activeChecks && Array.isArray(activeChecks)) {
            setChecks(activeChecks);
          }
          if (parsed?.lines && Array.isArray(parsed.lines)) {
            setLines(parsed.lines);
          }
        }

        const storedMapping = localStorage.getItem('finova_mapping_' + engagementId);
        if (storedMapping) {
          const parsedMapping = JSON.parse(storedMapping);
          if (Array.isArray(parsedMapping)) {
            setMappingDecisions(parsedMapping);
          }
        }

        const storedFiles = localStorage.getItem('finova_files_' + engagementId);
        if (storedFiles) {
          const parsedFiles = JSON.parse(storedFiles);
          if (Array.isArray(parsedFiles)) {
            setFileVersions(parsedFiles);
          }
        }

        const storedArtifacts = localStorage.getItem('finova_exports_' + engagementId);
        if (storedArtifacts) {
          const parsed = JSON.parse(storedArtifacts);
          if (Array.isArray(parsed)) {
            setArtifacts(parsed);
          }
        }

        const storedPayloads = localStorage.getItem('finova_export_payloads_' + engagementId);
        if (storedPayloads) {
          const parsed = JSON.parse(storedPayloads);
          if (parsed && typeof parsed === 'object') setArtifactPayloads(parsed);
        }
      } catch (e) {}
    }
  }, [engagementId, isCustomEngagement]);

  // Pre-Flight Eligibility Checklist (Section 45.3)
  const isStale = Boolean(wpVersion?.isStale);
  const hasBlockingErrors = checks.some((c) => c.status === 'fail' && c.severity === 'blocking');
  const relevantMapping = isCustomEngagement ? mappingDecisions : state.mappingDecisions;
  const needsReviewCount = relevantMapping.filter((d) => d.status === 'needs_review').length;
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
          operatorName: activeSigner || user.name,
          clientCode: (() => {
            if (!isCustomEngagement) {
              return state.clients.find((client) => client.id === engagement.clientId)?.code || 'EXP';
            }

            const sourceName = fileVersions[0]?.originalName || '';
            const candidate = sourceName
              .replace(/\.[^.]+$/, '')
              .split(/[^a-zA-Z0-9]+/)
              .filter(Boolean)
              .find((part) => !/^(trial|balance|tb|pt|cv|fy|20\d{2}|final|uji)$/i.test(part));

            return (candidate || 'MANDIRI').toUpperCase().slice(0, 24);
          })(),
          customWp: isCustomEngagement ? wpVersion : undefined,
          customLines: isCustomEngagement && lines.length > 0 ? lines : undefined,
          sourceChecksum: isCustomEngagement && fileVersions[0] ? fileVersions[0].checksumSha256 : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Gagal membuat ekspor XLSX.');
      }

      if (data.data) {
        const updated = [data.data, ...artifacts.filter((a) => a.id !== data.data.id)];
        setArtifacts(updated);
        if (typeof data.contentBase64 === 'string' && data.contentBase64) {
          const updatedPayloads = { ...artifactPayloads, [data.data.id]: data.contentBase64 };
          setArtifactPayloads(updatedPayloads);
          try {
            localStorage.setItem('finova_export_payloads_' + engagement.id, JSON.stringify(updatedPayloads));
          } catch (e) {}
        }
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
    const payload = artifactPayloads[artifactId];
    const artifact = artifacts.find((item) => item.id === artifactId);

    if (payload && artifact) {
      const binary = window.atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const url = URL.createObjectURL(
        new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = artifact.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return;
    }

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
      {(() => {
        const cashLine = lines.find((l) => l.lineId === "WP-A.1");
        const recLine = lines.find((l) => l.lineId === "WP-A.2");
        const cashVal = Math.abs(cashLine?.currentPeriodIdr || 0);
        const recVal = Math.abs(recLine?.currentPeriodIdr || 0);
        const totalAssetsVal = wpVersion.totals.totalAssetsIdr || 0;
        const activeSha = fileVersions[0]?.checksumSha256 || "568c968de29717f115b3d4dfb716e0b7cea3dd60ec90fd091997d679c75a1e91";
        const clientCode = (engagement.clientId && engagement.clientId !== "CLI-002") ? engagement.clientId : (engagement.id === "ENG-MANDIRI-2026" ? "MANDIRI" : "CKI");

        return (
          <IsometricWorkbookPreview
            signerName={activeSigner}
            checksumSha256={activeSha}
            cashAmountIdr={cashVal}
            receivableAmountIdr={recVal}
            totalAssetsIdr={totalAssetsVal}
            clientCode={clientCode}
          />
        );
      })()}

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
