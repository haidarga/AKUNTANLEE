'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Table,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import {
  WorkpaperVersion,
  WorkpaperLineItem,
  EvidenceLink,
  ValidationCheckResult,
  UserRoleV4,
} from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { EvidenceDrawerV4 } from '@/components/v4/EvidenceDrawerV4';
import { BalanceScaleIllustration } from '@/components/v4/visuals/WorkflowIllustrations';
import { FinancialWaterfallChart } from '@/components/v4/visuals/FinancialWaterfallChart';
import { AuditSpreadsheet } from '@/components/v4/spreadsheet/AuditSpreadsheet';
import { AuditAdjustmentsModal } from '@/components/v4/workpaper/AuditAdjustmentsModal';
import { AuditSealModal } from '@/components/v4/workpaper/AuditSealModal';
import { ReviewerNotesDrawer } from '@/components/v4/workpaper/ReviewerNotesDrawer';
import { Scale, Lock } from 'lucide-react';


export default function WorkpaperPage() {
  const routeParams = useParams();
  const engagementId = (routeParams?.id as string) || 'ENG-2026-01';
  const state = repo.getState();
  const engagement = state.engagements.find((e) => e.id === engagementId) || state.engagements[0];
  const activeWp = state.workpaperVersions.find((w) => w.engagementId === engagement.id) || state.workpaperVersions[0];
  const [wpVersion, setWpVersion] = useState<WorkpaperVersion>(activeWp);
  const [lines, setLines] = useState<WorkpaperLineItem[]>(state.workpaperLines);
  const [checks, setChecks] = useState<ValidationCheckResult[]>(state.validationChecks);
  const [activeRole, setActiveRole] = useState<UserRoleV4>('senior');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evidence Drawer State
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceLink | null>(null);

  // Comment Modal State
  const [activeCommentLine, setActiveCommentLine] = useState<WorkpaperLineItem | null>(null);

  // P1: Adjustments, Seal & Reviewer Notes State
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const [isSealOpen, setIsSealOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedNoteLine, setSelectedNoteLine] = useState<WorkpaperLineItem | null>(null);
  const [adjustments, setAdjustments] = useState(repo.getAdjustments(engagementId));
  const [notes, setNotes] = useState(repo.getReviewerNotes(engagementId));
  const [currentEngagement, setCurrentEngagement] = useState(engagement);

  const [newCommentBody, setNewCommentBody] = useState('');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('finova_v4_role');
    if (saved && ['preparer', 'senior', 'manager', 'partner'].includes(saved)) {
      setActiveRole(saved as UserRoleV4);
    }
  }, []);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/v1/workpapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId: engagement.id,
          userRole: activeRole,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setWpVersion(data.data);
        }
      }
      const user = state.users.find((u) => u.role === activeRole) || state.users[0];
      const newWp = repo.recalculateWorkpaper(engagement.id, user);
      setWpVersion(newWp);
      setLines([...repo.getState().workpaperLines]);
      setChecks([...repo.getState().validationChecks]);
    } catch (e) {
      console.error('Error during recalculate:', e);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleOpenEvidence = (line: WorkpaperLineItem) => {
    const ev = state.evidenceLinks.find((e) => e.targetLineId === line.lineId) || {
      id: `EVL-${line.lineId}`,
      tenantId: engagement.tenantId,
      engagementId: engagement.id,
      workpaperVersionId: wpVersion.id,
      targetLineId: line.lineId,
      targetAmountIdr: line.currentPeriodIdr,
      sourceFileVersionId: 'FV-001',
      sourceFileName: 'TB_PT_Nusantara_Sukses_Makmur_FY2026.xlsx',
      sourceChecksumSha256: '9f83a48e71c9b204683bc48b3017fa489110756e4c7717bc2d043444fb9a7b92',
      sheetName: 'Trial Balance',
      cellRange: 'Trial Balance!A2:F23',
      sourceRowNumber: 14,
      sourceRawValue: line.currentPeriodIdr,
      normalizedValueIdr: line.currentPeriodIdr,
      transformChain: [
        'Raw Parse SheetJS',
        `Penyelarasan Akun ke: ${line.label}`,
        'Agregasi Deterministik',
      ],
      ruleVersion: 'RULE-LEAD-SCHEDULE-SAK-2024',
    };
    setSelectedEvidence(ev);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentLine || !newCommentBody.trim()) return;
    const user = state.users.find((u) => u.role === activeRole) || state.users[0];
    repo.addComment(engagement.id, activeCommentLine.lineId, newCommentBody, user);
    setNewCommentBody('');
    setLines([...repo.getState().workpaperLines]);
  };

  const lineComments = activeCommentLine
    ? state.comments.filter((c) => c.targetLineId === activeCommentLine.lineId)
    : [];

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Evidence Drawer */}
      <EvidenceDrawerV4 evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />

      {/* Stale Version Alert Banner */}
      {wpVersion.isStale && (
        <div className="bg-[#FFF7E8] border-2 border-[#B7791F] p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#B7791F] shrink-0" />
            <div>
              <div className="font-bold text-[#102A32] text-sm">
                Kertas Kerja Perlu Dihitung Ulang (Workpaper is Stale)
              </div>
              <div className="text-[#52636A] mt-0.5">
                {wpVersion.staleReason || 'Terjadi modifikasi pemetaan atau data sumber.'} Ekspor XLSX diblokir sampai rekalkulasi dijalankan.
              </div>
            </div>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="finova-pill-cta bg-[#B7791F] hover:bg-[#966316] text-white text-xs shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Menghitung Ulang...' : 'Hitung Ulang Kertas Kerja'}</span>
          </button>
        </div>
      )}

      {/* Visual Balance Scale Gauge */}
      <BalanceScaleIllustration isBalanced={true} />

      {/* Visual Financial Waterfall Bridge Chart */}
      <FinancialWaterfallChart />

      {/* Tie-Out Validation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DDE4E2] shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-[#102A32] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F8F7A]" />
            Status Uji Tie-Out & Keseimbangan Matematis
          </div>
          <span className="font-mono text-[11px] text-[#52636A]">
            Versi Kertas Kerja: {wpVersion.id} (v{wpVersion.versionNumber})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {checks.map((chk) => (
            <div
              key={chk.id}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                chk.status === 'pass'
                  ? 'bg-[#E8F5F1]/50 border-[#B2DFD6]'
                  : 'bg-[#FDECEF]/60 border-[#F8B4BD]'
              }`}
            >
              <div>
                <div className="font-bold text-[#102A32]">{chk.title}</div>
                <div className="text-[11px] text-[#52636A] mt-0.5">{chk.explanation}</div>
              </div>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  chk.status === 'pass'
                    ? 'bg-[#E8F5F1] text-[#0F8F7A] border-[#B2DFD6]'
                    : 'bg-[#FDECEF] text-[#C83E4D] border-[#F8B4BD]'
                }`}
              >
                {chk.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Audit Spreadsheet with Keyboard Navigation & Formula Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-semibold text-xs">
          <div>
            <span className="text-sm font-bold text-[#102A32]">
              Kertas Kerja Induk Neraca & Laba Rugi (Interactive Audit Spreadsheet)
            </span>
            <span className="text-[11px] text-[#52636A] block mt-0.5 font-normal">
              Gunakan panah keyboard (&uarr;&darr;&larr;&rarr;) untuk navigasi sel &bull; Double-click baris untuk membuka jejak bukti sumber.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/engagements/${engagement.id}/exports`}
              className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-xs"
            >
              <span>Lanjut ke Ekspor XLSX</span>
              <div className="icon-circle">
                <Download className="w-3.5 h-3.5 text-white" />
              </div>
            </Link>
          </div>
        </div>

        <AuditSpreadsheet
          lines={lines}
          onOpenEvidence={handleOpenEvidence}
          onOpenComment={(line) => {
            setSelectedNoteLine(line);
            setIsNotesOpen(true);
          }}
        />

        {/* Totals Summary Footer Card */}
        <div className="p-5 bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#52636A] block text-[11px]">Total Aset:</span>
            <span className="font-mono font-bold text-sm text-[#102A32]">
              {formatIdrNumber(wpVersion.totals.totalAssetsIdr)}
            </span>
          </div>
          <div>
            <span className="text-[#52636A] block text-[11px]">Total Liabilitas:</span>
            <span className="font-mono font-bold text-sm text-[#102A32]">
              {formatIdrNumber(wpVersion.totals.totalLiabilitiesIdr)}
            </span>
          </div>
          <div>
            <span className="text-[#52636A] block text-[11px]">Total Ekuitas:</span>
            <span className="font-mono font-bold text-sm text-[#102A32]">
              {formatIdrNumber(wpVersion.totals.totalEquityIdr)}
            </span>
          </div>
          <div>
            <span className="text-[#52636A] block text-[11px]">Laba Bersih Operasional:</span>
            <span className="font-mono font-bold text-sm text-[#0F8F7A]">
              {formatIdrNumber(wpVersion.totals.netIncomeIdr)}
            </span>
          </div>
        </div>
      </div>

      {/* Inline Comment Modal */}
      {activeCommentLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="border-b border-[#DDE4E2] pb-2">
              <h3 className="font-bold text-sm text-[#102A32]">
                Catatan Review Preparer / Reviewer
              </h3>
              <p className="text-[#52636A] mt-0.5">
                Baris: {activeCommentLine.lineId} &bull; {activeCommentLine.label}
              </p>
            </div>

            {/* Comment Thread */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lineComments.length === 0 ? (
                <div className="text-[#7A8C93] italic py-2">Belum ada catatan pada baris ini.</div>
              ) : (
                lineComments.map((c) => (
                  <div key={c.id} className="p-3 bg-[#F6F7F5] rounded-xl border border-[#DDE4E2] space-y-1">
                    <div className="flex justify-between text-[10px] text-[#52636A]">
                      <span className="font-bold text-[#102A32]">{c.authorName} ({c.authorRole})</span>
                      <span>{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="text-[#102A32] leading-relaxed">{c.body}</div>
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="space-y-3 pt-2 border-t border-[#DDE4E2]">
              <textarea
                required
                rows={2}
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Tuliskan catatan penjelasan audit..."
                className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCommentLine(null)}
                  className="px-4 py-2 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F1F4F3]"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl font-semibold shadow-xs"
                >
                  Kirim Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Step Navigation Footer */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs">
        <Link href={`/engagements/${engagement.id}/mapping`} className="text-xs font-semibold text-[#52636A] hover:text-[#102A32] flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Kembali ke 3. Pemetaan SAK</span>
        </Link>
        <Link href={`/engagements/${engagement.id}/exports`} className="px-4 py-2 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2">
          <span>Lanjut ke 5. Ekspor Resmi XLSX</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
