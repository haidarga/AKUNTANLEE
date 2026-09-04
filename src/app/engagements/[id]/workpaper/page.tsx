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
import { calculateWorkpaperVersion } from '@/lib/workpaper/engine';


export default function WorkpaperPage() {
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
  const emptyWp: WorkpaperVersion = {
    id: `WPV-${engagementId}`,
    tenantId: 'TENANT-001',
    engagementId,
    datasetVersionIds: [`DSV-${engagementId}`],
    mappingSetId: `MAPSET-${engagementId}`,
    templateVersion: 'FINOVA-LEAD-v1.0',
    versionNumber: 1,
    status: 'draft',
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

  const activeWp = state.workpaperVersions.find((w) => w.engagementId === engagement.id) || (isCustomEngagement ? emptyWp : state.workpaperVersions[0]);
  const [wpVersion, setWpVersion] = useState<WorkpaperVersion>(activeWp);
  const [lines, setLines] = useState<WorkpaperLineItem[]>(isCustomEngagement ? [] : state.workpaperLines);
  const [checks, setChecks] = useState<ValidationCheckResult[]>(isCustomEngagement ? [] : state.validationChecks);
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

    try {
      const customAccountsRaw = localStorage.getItem('finova_accounts_' + engagementId);
      const customMappingRaw = localStorage.getItem('finova_mapping_' + engagementId);

      if (customAccountsRaw) {
        const accs = JSON.parse(customAccountsRaw);
        if (Array.isArray(accs) && accs.length > 0) {
          let activeDecs = [];
          if (customMappingRaw) {
            try {
              const parsedMap = JSON.parse(customMappingRaw);
              if (Array.isArray(parsedMap) && parsedMap.length > 0) {
                activeDecs = parsedMap;
              }
            } catch (e) {}
          }

          if (activeDecs.length === 0) {
            activeDecs = accs.map((acc: any, idx: number) => {
              let target = 'WP-A.1';
              const nameLower = (acc.accountName || '').toLowerCase();
              const code = acc.accountCode || '';
              if (code.startsWith('10') || code.startsWith('111') || nameLower.includes('kas') || nameLower.includes('bank operasional') || nameLower.includes('bank giro')) target = 'WP-A.1';
              else if (code.startsWith('112') || code.startsWith('12') || nameLower.includes('piutang')) target = 'WP-A.2';
              else if (nameLower.includes('cadangan') || nameLower.includes('ecl') || nameLower.includes('penurunan nilai')) target = 'WP-A.3';
              else if (code.startsWith('13') || code.startsWith('113') || nameLower.includes('persediaan') || nameLower.includes('inventory') || nameLower.includes('barang')) target = 'WP-A.4';
              else if (code.startsWith('14') || code.startsWith('118') || nameLower.includes('muka') || nameLower.includes('prepaid') || nameLower.includes('sewa gedung')) target = 'WP-A.5';
              else if (nameLower.includes('akumulasi') || nameLower.includes('penyusutan aset')) target = 'WP-B.2';
              else if (code.startsWith('121') || code.startsWith('122') || code.startsWith('15') || code.startsWith('16') || nameLower.includes('tetap') || nameLower.includes('gedung') || nameLower.includes('mesin') || nameLower.includes('kendaraan') || nameLower.includes('peralatan') || nameLower.includes('komputer')) target = 'WP-B.1';
              else if (code.startsWith('201') || code.startsWith('211') || (code.startsWith('20') && nameLower.includes('usaha')) || nameLower.includes('utang usaha') || nameLower.includes('pemasok') || nameLower.includes('payable') || nameLower.includes('sub-konsultan')) target = 'WP-C.1';
              else if (code.startsWith('202') || code.startsWith('212') || code.startsWith('22') || nameLower.includes('pajak') || nameLower.includes('tax') || nameLower.includes('pph') || nameLower.includes('ppn')) target = 'WP-C.2';
              else if (code.startsWith('203') || code.startsWith('213') || nameLower.includes('utang gaji') || nameLower.includes('bonus') || nameLower.includes('akrual')) target = 'WP-C.3';
              else if (code.startsWith('221') || code.startsWith('25') || (code.startsWith('2') && (nameLower.includes('bank') || nameLower.includes('pinjaman') || nameLower.includes('kredit') || nameLower.includes('loan')))) target = 'WP-D.1';
              else if (code.startsWith('301') || code.startsWith('30') || nameLower.includes('modal') || nameLower.includes('capital') || nameLower.includes('saham')) target = 'WP-E.1';
              else if (code.startsWith('302') || code.startsWith('31') || nameLower.includes('laba ditahan') || nameLower.includes('retained') || nameLower.includes('saldo laba')) target = 'WP-E.2';
              else if (code.startsWith('4') || nameLower.includes('pendapatan') || nameLower.includes('penjualan') || nameLower.includes('revenue') || nameLower.includes('jasa')) target = 'WP-F.1';
              else if (code.startsWith('501') || code.startsWith('510') || nameLower.includes('pokok') || nameLower.includes('hpp') || nameLower.includes('cogs')) target = 'WP-F.2';
              else if (nameLower.includes('beban') || nameLower.includes('biaya') || nameLower.includes('gaji') || nameLower.includes('sewa') || nameLower.includes('utilitas') || nameLower.includes('listrik') || nameLower.includes('air') || nameLower.includes('telepon') || nameLower.includes('penyusutan') || nameLower.includes('operasional') || nameLower.includes('umum') || code.startsWith('5') || code.startsWith('6')) target = 'WP-F.3';
              else target = 'WP-F.4';

              return {
                id: 'DEC-' + (idx + 1),
                tenantId: 'TENANT-001',
                mappingSetId: 'MAPSET-' + engagementId,
                accountRowId: acc.id || ('ACC-' + (idx + 1)),
                sourceAccountCode: acc.accountCode,
                sourceAccountName: acc.accountName,
                amountIdr: acc.closingBalanceIdr || acc.balanceIdr || 0,
                proposedTarget: target,
                effectiveTarget: target,
                confidenceScore: 96,
                confidenceLevel: 'high' as const,
                rationale: 'Pemetaan Otomatis SAK Standard Pattern',
                status: 'mapped' as const,
                isMaterial: false,
              };
            });
          }

          const customWpCalc = calculateWorkpaperVersion({
            tenantId: engagement.tenantId || 'TENANT-001',
            engagementId,
            datasetVersionId: 'DSV-' + engagementId,
            mappingSetId: 'MAPSET-' + engagementId,
            accounts: accs,
            mappingDecisions: activeDecs,
          });

          setWpVersion(customWpCalc.workpaperVersion);
          setLines(customWpCalc.lines);
          if (customWpCalc.checks) setChecks(customWpCalc.checks);
          localStorage.setItem('finova_wp_' + engagementId, JSON.stringify(customWpCalc));
          return;
        }
      }

      // If finova_wp already cached
      const customWpRaw = localStorage.getItem('finova_wp_' + engagementId);
      if (customWpRaw) {
        const customWp = JSON.parse(customWpRaw);
        if (customWp?.workpaperVersion && customWp?.lines?.length > 0) {
          setWpVersion(customWp.workpaperVersion);
          setLines(customWp.lines);
          if (customWp.checks?.length > 0) setChecks(customWp.checks);
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading custom workpaper in page:', e);
    }

    // Cross-Device API Fallback for Workpaper Hydration
    fetch('/api/v1/engagements/' + engagementId + '/files')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.accounts && json.data.accounts.length > 0) {
          const accs = json.data.accounts;
          const autoDecisions = accs.map((acc: any, idx: number) => {
            let target = 'WP-A.1';
            const nameLower = (acc.accountName || '').toLowerCase();
            const code = acc.accountCode || '';
            if (code.startsWith('10') || code.startsWith('111') || nameLower.includes('kas') || nameLower.includes('bank operasional') || nameLower.includes('bank giro')) target = 'WP-A.1';
            else if (code.startsWith('112') || code.startsWith('12') || nameLower.includes('piutang')) target = 'WP-A.2';
            else if (nameLower.includes('cadangan') || nameLower.includes('ecl') || nameLower.includes('penurunan nilai')) target = 'WP-A.3';
            else if (code.startsWith('13') || code.startsWith('113') || nameLower.includes('persediaan') || nameLower.includes('inventory') || nameLower.includes('barang')) target = 'WP-A.4';
            else if (code.startsWith('14') || code.startsWith('118') || nameLower.includes('muka') || nameLower.includes('prepaid') || nameLower.includes('sewa gedung')) target = 'WP-A.5';
            else if (nameLower.includes('akumulasi') || nameLower.includes('penyusutan aset')) target = 'WP-B.2';
            else if (code.startsWith('121') || code.startsWith('122') || code.startsWith('15') || code.startsWith('16') || nameLower.includes('tetap') || nameLower.includes('gedung') || nameLower.includes('mesin') || nameLower.includes('kendaraan') || nameLower.includes('peralatan') || nameLower.includes('komputer')) target = 'WP-B.1';
            else if (code.startsWith('201') || code.startsWith('211') || (code.startsWith('20') && nameLower.includes('usaha')) || nameLower.includes('utang usaha') || nameLower.includes('pemasok') || nameLower.includes('payable') || nameLower.includes('sub-konsultan')) target = 'WP-C.1';
            else if (code.startsWith('202') || code.startsWith('212') || code.startsWith('22') || nameLower.includes('pajak') || nameLower.includes('tax') || nameLower.includes('pph') || nameLower.includes('ppn')) target = 'WP-C.2';
            else if (code.startsWith('203') || code.startsWith('213') || nameLower.includes('utang gaji') || nameLower.includes('bonus') || nameLower.includes('akrual')) target = 'WP-C.3';
            else if (code.startsWith('221') || code.startsWith('25') || (code.startsWith('2') && (nameLower.includes('bank') || nameLower.includes('pinjaman') || nameLower.includes('kredit') || nameLower.includes('loan')))) target = 'WP-D.1';
            else if (code.startsWith('301') || code.startsWith('30') || nameLower.includes('modal') || nameLower.includes('capital') || nameLower.includes('saham')) target = 'WP-E.1';
            else if (code.startsWith('302') || code.startsWith('31') || nameLower.includes('laba ditahan') || nameLower.includes('retained') || nameLower.includes('saldo laba')) target = 'WP-E.2';
            else if (code.startsWith('4') || nameLower.includes('pendapatan') || nameLower.includes('penjualan') || nameLower.includes('revenue') || nameLower.includes('jasa')) target = 'WP-F.1';
            else if (code.startsWith('501') || code.startsWith('510') || nameLower.includes('pokok') || nameLower.includes('hpp') || nameLower.includes('cogs')) target = 'WP-F.2';
            else if (nameLower.includes('beban') || nameLower.includes('biaya') || nameLower.includes('gaji') || nameLower.includes('sewa') || nameLower.includes('utilitas') || nameLower.includes('listrik') || nameLower.includes('air') || nameLower.includes('telepon') || nameLower.includes('penyusutan') || nameLower.includes('operasional') || nameLower.includes('umum') || code.startsWith('5') || code.startsWith('6')) target = 'WP-F.3';
            else target = 'WP-F.4';

            return {
              id: 'DEC-' + (idx + 1),
              tenantId: 'TENANT-001',
              mappingSetId: 'MAPSET-' + engagementId,
              accountRowId: acc.id || ('ACC-' + (idx + 1)),
              sourceAccountCode: acc.accountCode,
              sourceAccountName: acc.accountName,
              amountIdr: acc.closingBalanceIdr || acc.balanceIdr || 0,
              proposedTarget: target,
              effectiveTarget: target,
              confidenceScore: 96,
              confidenceLevel: 'high' as const,
              rationale: 'Pemetaan Otomatis SAK Standard Pattern',
              status: 'mapped' as const,
              isMaterial: false,
            };
          });

          const customWpCalc = calculateWorkpaperVersion({
            tenantId: engagement.tenantId || 'TENANT-001',
            engagementId,
            datasetVersionId: 'DSV-' + engagementId,
            mappingSetId: 'MAPSET-' + engagementId,
            accounts: accs,
            mappingDecisions: autoDecisions,
          });

          setWpVersion(customWpCalc.workpaperVersion);
          setLines(customWpCalc.lines);
          if (customWpCalc.checks?.length > 0) setChecks(customWpCalc.checks);
          try {
            localStorage.setItem('finova_accounts_' + engagementId, JSON.stringify(accs));
            localStorage.setItem('finova_mapping_' + engagementId, JSON.stringify(autoDecisions));
            localStorage.setItem('finova_wp_' + engagementId, JSON.stringify(customWpCalc));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [engagementId]);

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
      const customAccountsRaw = localStorage.getItem('finova_accounts_' + engagementId);
      const customMappingRaw = localStorage.getItem('finova_mapping_' + engagementId);
      if (customAccountsRaw) {
        const accs = JSON.parse(customAccountsRaw);
        const decs = customMappingRaw ? JSON.parse(customMappingRaw) : [];
        const wpCalc = calculateWorkpaperVersion({
          tenantId: engagement.tenantId || 'TENANT-001',
          engagementId,
          datasetVersionId: 'DSV-' + engagementId,
          mappingSetId: 'MAPSET-' + engagementId,
          accounts: accs,
          mappingDecisions: decs,
        });
        setWpVersion(wpCalc.workpaperVersion);
        setLines(wpCalc.lines);
        if (wpCalc.checks) setChecks(wpCalc.checks);
        localStorage.setItem('finova_wp_' + engagementId, JSON.stringify(wpCalc));
      } else {
        const user = state.users.find((u) => u.role === activeRole) || state.users[0];
        const newWp = repo.recalculateWorkpaper(engagement.id, user);
        setWpVersion(newWp);
        setLines([...repo.getState().workpaperLines]);
        setChecks([...repo.getState().validationChecks]);
      }
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
      <BalanceScaleIllustration
        isBalanced={wpVersion.totals.balanceSheetDiffIdr === 0 && lines.length > 0}
        diff={Math.abs(wpVersion.totals.balanceSheetDiffIdr)}
        assets={wpVersion.totals.totalAssetsIdr}
        liabilities={wpVersion.totals.totalLiabilitiesIdr}
        equity={wpVersion.totals.totalEquityIdr}
      />

      {/* Visual Financial Waterfall Bridge Chart */}
      {(() => {
        const revLine = lines.find((l) => l.lineId === "WP-F.1");
        const cogsLine = lines.find((l) => l.lineId === "WP-F.2");
        const opexLine = lines.find((l) => l.lineId === "WP-F.3");
        const currentRev = Math.abs(revLine?.currentPeriodIdr || 0);
        const currentCogs = Math.abs(cogsLine?.currentPeriodIdr || 0);
        const currentOpex = Math.abs(opexLine?.currentPeriodIdr || 0);
        const currentNet = currentRev - currentCogs - currentOpex;

        return (
          <FinancialWaterfallChart
            revenue={currentRev}
            cogs={currentCogs}
            opex={currentOpex}
            netIncome={currentNet}
          />
        );
      })()}

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
            {/* P1: Jurnal Penyesuaian Button */}
            <button
              onClick={() => setIsAdjustmentsOpen(true)}
              className="px-3.5 py-2 bg-white border border-[#DDE4E2] hover:border-[#0F8F7A] text-[#102A32] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-[#0F8F7A]" />
              <span>Jurnal Penyesuaian (AJE/RJE)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] text-[10px]">
                {adjustments.length}
              </span>
            </button>

            {/* P1: Partner Sign-Off & Seal Button */}
            {currentEngagement.status === 'partner_sealed' ? (
              <div className="px-3.5 py-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Tersegel Partner (AP.0942)</span>
              </div>
            ) : (
              <button
                onClick={() => setIsSealOpen(true)}
                className="px-3.5 py-2 bg-[#102A32] hover:bg-[#1A3F4B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>Partner Sign-Off & Segel</span>
              </button>
            )}

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

        {lines.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DDE4E2] p-12 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-[#F6F7F5] border border-[#DDE4E2] flex items-center justify-center mx-auto text-[#52636A]">
              <Table className="w-8 h-8 text-[#0F8F7A]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#102A32]">Kertas Kerja Belum Memiliki Data Neraca Saldo</h3>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Silakan unggah berkas neraca saldo (Excel / CSV) terlebih dahulu pada tab Berkas Sumber untuk memuat akun dan menghitung Lead Schedule secara otomatis.
              </p>
            </div>
            <Link
              href={`/engagements/${engagement.id}/files`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>Unggah Berkas Sumber Finansial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <AuditSpreadsheet
            lines={lines}
            onOpenEvidence={handleOpenEvidence}
            onOpenComment={(line) => {
              setSelectedNoteLine(line);
              setIsNotesOpen(true);
            }}
          />
        )}

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

      {/* P1: Audit Adjustments Modal */}
      <AuditAdjustmentsModal
        isOpen={isAdjustmentsOpen}
        onClose={() => setIsAdjustmentsOpen(false)}
        engagementId={engagementId}
        adjustments={adjustments}
        onAdjustmentCreated={(newAdj) => {
          setAdjustments((prev) => [...prev, newAdj]);
          const refreshedState = repo.getState();
          setLines(refreshedState.workpaperLines);
          setChecks(refreshedState.validationChecks);
        }}
      />

      {/* P1: Audit Seal Modal */}
      <AuditSealModal
        isOpen={isSealOpen}
        onClose={() => setIsSealOpen(false)}
        engagementId={engagementId}
        onSealed={(hash) => {
          const refreshedState = repo.getState();
          const updatedEng = refreshedState.engagements.find((e) => e.id === engagementId) || currentEngagement;
          setCurrentEngagement({ ...updatedEng, status: "partner_sealed" });
        }}
      />

      {/* P1: Reviewer Notes Drawer */}
      <ReviewerNotesDrawer
        isOpen={isNotesOpen}
        onClose={() => {
          setIsNotesOpen(false);
          setSelectedNoteLine(null);
        }}
        engagementId={engagementId}
        targetLineId={selectedNoteLine?.lineId || "ALL"}
        targetLineLabel={selectedNoteLine?.label || "Seluruh Pos Kertas Kerja"}
        notes={notes}
        onNoteAdded={(newNote) => setNotes((prev) => [newNote, ...prev])}
        onNoteResolved={(noteId) => {
          setNotes((prev) =>
            prev.map((n) => (n.id === noteId ? { ...n, status: "resolved" as const } : n))
          );
        }}
      />
    </div>
  );
}
