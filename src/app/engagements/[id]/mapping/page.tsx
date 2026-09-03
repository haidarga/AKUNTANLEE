'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Table,
  Check,
  CheckCheck,
  Edit2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Zap,
  BrainCircuit,
  Bot,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { MappingDecision, MappingStatus, UserRoleV4 } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { MappingFlowIllustration } from '@/components/v4/visuals/WorkflowIllustrations';

export default function AccountMappingPage() {
  const state = repo.getState();
  const engagement = state.engagements[0];
  const [decisions, setDecisions] = useState<MappingDecision[]>(state.mappingDecisions);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'needs_review' | 'mapped' | 'excluded' | 'material'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<UserRoleV4>('senior');
  const [aiInspectingDecision, setAiInspectingDecision] = useState<MappingDecision | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [liveAiResult, setLiveAiResult] = useState<any>(null);

  const handleOpenAiInspector = async (dec: MappingDecision) => {
    setAiInspectingDecision(dec);
    setIsAnalyzingAi(true);
    setLiveAiResult(null);
    try {
      const res = await fetch('/api/v1/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountCode: dec.sourceAccountCode,
          accountName: dec.sourceAccountName,
          amountIdr: dec.amountIdr,
          currentProposedTarget: dec.effectiveTarget || dec.proposedTarget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLiveAiResult(data.data);
      }
    } catch (err) {
      console.error('Failed to analyze with live AI:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [focusedRowIdx, setFocusedRowIdx] = useState<number>(0);

  // Modal State for Override / Exclude
  const [editingDecision, setEditingDecision] = useState<MappingDecision | null>(null);
  const [overrideTarget, setOverrideTarget] = useState('WP-F.4');
  const [overrideReason, setOverrideReason] = useState('Alokasi ke Pendapatan / Beban Lain-lain Bersih');
  const [excludingDecision, setExcludingDecision] = useState<MappingDecision | null>(null);
  const [exclusionReason, setExclusionReason] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('finova_v4_role');
    if (saved && ['preparer', 'senior', 'manager', 'partner'].includes(saved)) {
      setActiveRole(saved as UserRoleV4);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = (decId: string) => {
    const user = state.users.find((u) => u.role === activeRole) || state.users[0];
    const updated = repo.updateMappingDecision({
      decisionId: decId,
      action: 'approve',
      actor: user,
    });
    setDecisions([...repo.getState().mappingDecisions]);
    showToast(`Pemetaan ${updated.sourceAccountCode} berhasil disetujui.`);
  };

  const handleInlineChangeTarget = (decId: string, newTarget: string) => {
    const user = state.users.find((u) => u.role === activeRole) || state.users[0];
    repo.updateMappingDecision({
      decisionId: decId,
      action: 'override',
      targetLineId: newTarget,
      reason: 'Penyesuaian cepat langsung dari baris tabel (inline)',
      actor: user,
    });
    setDecisions([...repo.getState().mappingDecisions]);
    showToast(`Target diubah ke ${newTarget}`);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDecision) return;
    const user = state.users.find((u) => u.role === activeRole) || state.users[0];
    repo.updateMappingDecision({
      decisionId: editingDecision.id,
      action: 'override',
      targetLineId: overrideTarget,
      reason: overrideReason,
      actor: user,
    });
    setEditingDecision(null);
    setDecisions([...repo.getState().mappingDecisions]);
    showToast(`Override ${editingDecision.sourceAccountCode} ke ${overrideTarget} berhasil disimpan.`);
  };

  const handleSaveExclude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excludingDecision) return;
    const user = state.users.find((u) => u.role === activeRole) || state.users[0];
    repo.updateMappingDecision({
      decisionId: excludingDecision.id,
      action: 'exclude',
      reason: exclusionReason,
      actor: user,
    });
    setExcludingDecision(null);
    setExclusionReason('');
    setDecisions([...repo.getState().mappingDecisions]);
    showToast(`Akun ${excludingDecision.sourceAccountCode} dieksklusi.`);
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    const user = state.users.find((u) => u.role === activeRole) || state.users[0];
    const count = repo.bulkApproveMappings(selectedIds, user);
    setSelectedIds([]);
    setDecisions([...repo.getState().mappingDecisions]);
    showToast(`${count} akun berhasil disetujui pemetaannya secara massal.`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDecisions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDecisions.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    const matchSearch =
      d.sourceAccountCode.toLowerCase().includes(search.toLowerCase()) ||
      d.sourceAccountName.toLowerCase().includes(search.toLowerCase()) ||
      d.proposedTarget.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (selectedFilter === 'needs_review') return d.status === 'needs_review';
    if (selectedFilter === 'mapped') return d.status === 'mapped';
    if (selectedFilter === 'excluded') return d.status === 'excluded';
    if (selectedFilter === 'material') return d.isMaterial;
    return true;
  });

  // Keyboard Shortcuts (A: Approve focused, E: Exclude focused)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIdx((prev) => Math.min(filteredDecisions.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'a' || e.key === 'A') {
        const item = filteredDecisions[focusedRowIdx];
        if (item && item.status !== 'mapped') {
          e.preventDefault();
          handleApprove(item.id);
        }
      }
    },
    [filteredDecisions, focusedRowIdx]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const mappedCount = decisions.filter((d) => d.status === 'mapped').length;
  const progressPercent = Math.round((mappedCount / decisions.length) * 100);

  const getConfidenceBadge = (level: string, score: number) => {
    if (level === 'high') {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-[#0F8F7A] bg-[#E8F5F1] px-2.5 py-0.5 rounded-full border border-[#B2DFD6]">
          High ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    if (level === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-[#B7791F] bg-[#FFF7E8] px-2.5 py-0.5 rounded-full border border-[#F6E0B5]">
          Medium ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-[#C83E4D] bg-[#FDECEF] px-2.5 py-0.5 rounded-full border border-[#F8B4BD]">
        Low ({(score * 100).toFixed(0)}%)
      </span>
    );
  };

  const getStatusBadge = (status: MappingStatus) => {
    switch (status) {
      case 'mapped':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">Mapped</span>;
      case 'needs_review':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5]">Needs Review</span>;
      case 'excluded':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F4F3] text-[#52636A] border border-[#DDE4E2]">Excluded</span>;
      default:
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F4F3] text-[#52636A]">Proposed</span>;
    }
  };

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Visual Flow Illustration */}
      <MappingFlowIllustration />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#102A32] text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <Check className="w-4 h-4 text-[#0F8F7A]" />
          {toastMessage}
        </div>
      )}

      {/* Top Banner with Progress Donut Gauge */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] text-[11px] font-semibold border border-[#B2DFD6]">
            <Zap className="w-3 h-3" />
            <span>Mode Cepat: Tombol [A] untuk Setujui Baris yang Dipilih</span>
          </div>
          <h2 className="text-base font-bold text-[#102A32]">
            Ruang Kerja Pemetaan Akun (Interactive Mapping Workspace)
          </h2>
          <p className="text-xs text-[#52636A] leading-relaxed">
            Pilih target SAK langsung dari kolom *dropdown* baris atau gunakan *override* untuk mencatat alasan profesional ke jejak audit.
          </p>
        </div>

        {/* Live Circular Progress Card */}
        <div className="flex items-center gap-4 bg-[#F6F7F5] p-3 rounded-xl border border-[#DDE4E2] shrink-0">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="18" stroke="#DDE4E2" strokeWidth="4" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#0F8F7A"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * progressPercent) / 100}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute font-mono font-bold text-[11px] text-[#102A32]">{progressPercent}%</span>
          </div>
          <div>
            <span className="font-bold text-xs text-[#102A32] block">{mappedCount} dari {decisions.length} Terpetakan</span>
            <span className="text-[10px] text-[#52636A]">
              {decisions.length - mappedCount === 0 ? 'Semua Beres' : `${decisions.length - mappedCount} Perlu Ditinjau`}
            </span>
          </div>
          <Link
            href={`/engagements/${engagement.id}/workpaper`}
            className="finova-pill-cta bg-[#102A32] hover:bg-[#0F8F7A] text-white text-xs shadow-xs ml-2"
          >
            <span>Kertas Kerja</span>
            <div className="icon-circle">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE4E2] shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-[#102A32] text-white shadow-2xs'
                  : 'bg-[#F6F7F5] text-[#52636A] hover:bg-[#F1F4F3]'
              }`}
            >
              Semua Akun ({decisions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('needs_review')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFilter === 'needs_review'
                  ? 'bg-[#B7791F] text-white shadow-2xs'
                  : 'bg-[#FFF7E8] text-[#B7791F] hover:bg-[#FEF0D4] border border-[#F6E0B5]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Perlu Review ({decisions.filter((d) => d.status === 'needs_review').length})
            </button>
            <button
              onClick={() => setSelectedFilter('mapped')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedFilter === 'mapped'
                  ? 'bg-[#0F8F7A] text-white shadow-2xs'
                  : 'bg-[#F6F7F5] text-[#52636A] hover:bg-[#F1F4F3]'
              }`}
            >
              Terpetakan ({decisions.filter((d) => d.status === 'mapped').length})
            </button>
            <button
              onClick={() => setSelectedFilter('material')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedFilter === 'material'
                  ? 'bg-[#102A32] text-white shadow-2xs'
                  : 'bg-[#F6F7F5] text-[#52636A] hover:bg-[#F1F4F3]'
              }`}
            >
              Akun Material &ge; Rp 250Jt ({decisions.filter((d) => d.isMaterial).length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode atau nama akun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#DDE4E2] rounded-xl text-xs bg-[#F6F7F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
            />
          </div>
        </div>

        {/* Bulk Action Sticky Bar when items selected */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-[#E8F5F1] rounded-xl border border-[#B2DFD6] flex items-center justify-between">
            <span className="font-semibold text-[#0F8F7A] text-xs">
              {selectedIds.length} akun dipilih untuk tindakan massal
            </span>
            <button
              onClick={handleBulkApprove}
              className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Setujui Massal ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* High-Density Data Workspace Table */}
      <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F7F5] border-b border-[#DDE4E2] text-[#52636A] font-semibold text-[11px] sticky top-0 z-10">
                <th className="py-3 px-3 border-r border-[#DDE4E2] w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredDecisions.length && filteredDecisions.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[#DDE4E2] text-[#0F8F7A] focus:ring-[#0F8F7A]"
                  />
                </th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] w-28">Kode Akun</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2]">Nama Akun Sumber</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] text-right w-36">Saldo Bersih (IDR)</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] w-64">Target Baris Kertas Kerja (Inline Edit)</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] text-center w-36">Keyakinan</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] text-center w-28">Status</th>
                <th className="py-3 px-3 text-center w-40">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE4E2]">
              {filteredDecisions.map((dec, rowIdx) => {
                const isSelected = selectedIds.includes(dec.id);
                const isNeedsReview = dec.status === 'needs_review';
                const isFocused = focusedRowIdx === rowIdx;
                const currentTarget = dec.effectiveTarget || dec.proposedTarget;

                return (
                  <tr
                    key={dec.id}
                    onClick={() => setFocusedRowIdx(rowIdx)}
                    className={`transition-colors ${
                      isFocused ? 'ring-1 ring-inset ring-[#0F8F7A]' : ''
                    } ${
                      isNeedsReview
                        ? 'bg-[#FFF7E8]/40 hover:bg-[#FFF7E8]/70'
                        : isSelected
                        ? 'bg-[#E8F5F1]/40 hover:bg-[#E8F5F1]/70'
                        : 'hover:bg-[#F6F7F5]'
                    }`}
                  >
                    <td className="py-2.5 px-3 border-r border-[#DDE4E2] text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(dec.id)}
                        className="rounded border-[#DDE4E2] text-[#0F8F7A] focus:ring-[#0F8F7A]"
                      />
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-[#102A32] border-r border-[#DDE4E2]">
                      {dec.sourceAccountCode}
                    </td>

                    <td className="py-2.5 px-3 text-[#102A32] border-r border-[#DDE4E2]">
                      <div className="font-semibold">{dec.sourceAccountName}</div>
                      <div className="text-[10px] text-[#7A8C93]">{dec.rationale}</div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-right text-[#102A32] border-r border-[#DDE4E2]">
                      <span className={dec.amountIdr < 0 ? 'text-[#C83E4D]' : ''}>
                        {formatIdrNumber(dec.amountIdr)}
                      </span>
                    </td>

                    {/* Inline Target Selector Column */}
                    <td className="py-2.5 px-3 border-r border-[#DDE4E2]">
                      <select
                        value={currentTarget}
                        onChange={(e) => handleInlineChangeTarget(dec.id, e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#DDE4E2] rounded-lg text-xs font-bold text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] cursor-pointer shadow-2xs"
                      >
                        <option value="WP-A.1">WP-A.1 Kas & Setara Kas</option>
                        <option value="WP-A.2">WP-A.2 Piutang Usaha Bruto</option>
                        <option value="WP-A.3">WP-A.3 Cadangan ECL Piutang</option>
                        <option value="WP-A.4">WP-A.4 Persediaan Barang</option>
                        <option value="WP-A.5">WP-A.5 Uang Muka & Biaya Dimuka</option>
                        <option value="WP-B.1">WP-B.1 Aset Tetap - Perolehan</option>
                        <option value="WP-B.2">WP-B.2 Akumulasi Penyusutan</option>
                        <option value="WP-B.3">WP-B.3 Aset Hak Guna & Lainnya</option>
                        <option value="WP-C.1">WP-C.1 Utang Usaha (Accounts Payable)</option>
                        <option value="WP-C.2">WP-C.2 Utang Pajak</option>
                        <option value="WP-C.3">WP-C.3 Beban Akrual & Lainnya</option>
                        <option value="WP-D.1">WP-D.1 Utang Bank Jangka Panjang</option>
                        <option value="WP-D.2">WP-D.2 Kewajiban Imbalan Kerja</option>
                        <option value="WP-E.1">WP-E.1 Modal Disetor</option>
                        <option value="WP-E.2">WP-E.2 Saldo Laba Ditahan</option>
                        <option value="WP-F.1">WP-F.1 Pendapatan Usaha</option>
                        <option value="WP-F.2">WP-F.2 Beban Pokok Penjualan (HPP)</option>
                        <option value="WP-F.3">WP-F.3 Beban Operasional & Umum</option>
                        <option value="WP-F.4">WP-F.4 Pendapatan / Beban Lain-lain</option>
                      </select>
                      {dec.overrideReason && (
                        <div className="text-[10px] text-[#B7791F] italic mt-0.5">
                          {dec.overrideReason}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center border-r border-[#DDE4E2]">
                      {getConfidenceBadge(dec.confidenceLevel, dec.confidenceScore)}
                    </td>

                    <td className="py-2.5 px-3 text-center border-r border-[#DDE4E2]">
                      {getStatusBadge(dec.status)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {dec.status !== 'mapped' && (
                          <button
                            onClick={() => handleApprove(dec.id)}
                            className="px-2.5 py-1 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                            title="Setujui Usulan (atau tekan tombol [A])"
                          >
                            <Check className="w-3 h-3" />
                            Setujui
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingDecision(dec);
                            setOverrideTarget(currentTarget);
                          }}
                          className="px-2 py-1 bg-[#F1F4F3] hover:bg-[#DDE4E2] text-[#102A32] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Alasan Lengkap (Override Modal)"
                        >
                          <Edit2 className="w-3 h-3" />
                          Alasan
                        </button>
                        <button
                          onClick={() => handleOpenAiInspector(dec)}
                          className="px-2 py-1 bg-[#E8F5F1] hover:bg-[#D3EEE7] text-[#0F8F7A] border border-[#B2DFD6] rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Buka Analisis Semantik AI"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI
                        </button>
                        {dec.status !== 'excluded' && (
                          <button
                            onClick={() => setExcludingDecision(dec)}
                            className="px-2 py-1 bg-[#F1F4F3] hover:bg-[#FDECEF] text-[#C83E4D] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Eksklusi Akun"
                          >
                            Eksklusi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {editingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div>
              <h3 className="text-base font-bold text-[#102A32]">
                Catat Alasan Override: {editingDecision.sourceAccountCode}
              </h3>
              <p className="text-[#52636A] mt-0.5">
                {editingDecision.sourceAccountName} (Saldo: {formatIdrNumber(editingDecision.amountIdr)})
              </p>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#102A32] mb-1">Pilih Target Baris Kertas Kerja:</label>
                <select
                  value={overrideTarget}
                  onChange={(e) => setOverrideTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                >
                  <option value="WP-A.1">WP-A.1 Kas & Setara Kas</option>
                  <option value="WP-A.2">WP-A.2 Piutang Usaha Bruto</option>
                  <option value="WP-A.5">WP-A.5 Uang Muka & Biaya Dibayar Dimuka</option>
                  <option value="WP-C.1">WP-C.1 Utang Usaha (Trade Accounts Payable)</option>
                  <option value="WP-C.3">WP-C.3 Beban Akrual & Utang Lainnya</option>
                  <option value="WP-F.3">WP-F.3 Beban Operasional (OPEX)</option>
                  <option value="WP-F.4">WP-F.4 Pendapatan / Beban Lain-lain Bersih</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#102A32] mb-1">Alasan Penyesuaian (Audit Trail):</label>
                <textarea
                  required
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                  placeholder="Jelaskan pertimbangan profesional..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE4E2]">
                <button
                  type="button"
                  onClick={() => setEditingDecision(null)}
                  className="px-4 py-2 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F1F4F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl font-semibold shadow-xs"
                >
                  Simpan Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exclude Modal */}
      {excludingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div>
              <h3 className="text-base font-bold text-[#102A32]">
                Eksklusi Akun: {excludingDecision.sourceAccountCode}
              </h3>
              <p className="text-[#52636A] mt-0.5">
                {excludingDecision.sourceAccountName} (Saldo: {formatIdrNumber(excludingDecision.amountIdr)})
              </p>
            </div>

            <form onSubmit={handleSaveExclude} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  Alasan Eksklusi {excludingDecision.isMaterial && <span className="text-[#C83E4D]">* Wajib untuk akun material</span>}:
                </label>
                <textarea
                  required={excludingDecision.isMaterial}
                  rows={2}
                  value={exclusionReason}
                  onChange={(e) => setExclusionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C83E4D]"
                  placeholder="Contoh: Akun off-balance sheet atau catatan memo internal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE4E2]">
                <button
                  type="button"
                  onClick={() => setExcludingDecision(null)}
                  className="px-4 py-2 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F1F4F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C83E4D] hover:bg-[#A82E3C] text-white rounded-xl font-semibold shadow-xs"
                >
                  Konfirmasi Eksklusi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* AI Semantic Reasoning & Standard Guidance Inspector */}
      {aiInspectingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-finova-in">
          <div className="bg-white rounded-2xl border-2 border-[#0F8F7A] shadow-2xl max-w-xl w-full p-6 space-y-5 text-xs text-[#102A32] relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-44 h-44 bg-[#0F8F7A]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between border-b border-[#DDE4E2] pb-3.5 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F8F7A] text-white flex items-center justify-center shadow-sm">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A32] flex items-center gap-2">
                    FINOVA AI Semantic Reasoning Inspector
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                      Model: {liveAiResult?.model || 'qwen3.8-nvfp4'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#52636A]">
                    Bedah penalaran AI dan rekomendasi kepatuhan SAK untuk akun: <strong>{aiInspectingDecision.sourceAccountCode} - {aiInspectingDecision.sourceAccountName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAiInspectingDecision(null);
                  setLiveAiResult(null);
                }}
                className="text-[#7A8C93] hover:text-[#102A32] text-sm font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* If analyzing */}
            {isAnalyzingAi && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 relative z-10 text-center">
                <div className="w-10 h-10 rounded-full border-3 border-[#0F8F7A] border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <div className="font-bold text-xs text-[#102A32]">Menghubungi Live Model Qwen 3.8 via vLLM...</div>
                  <p className="text-[11px] text-[#52636A]">
                    Mengevaluasi penalaran semantik nama akun, memeriksa kepatuhan PSAK 10, dan menghitung skor keyakinan.
                  </p>
                </div>
              </div>
            )}

            {/* When ready */}
            {!isAnalyzingAi && (
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-[#52636A] uppercase tracking-wider block">
                      1. Analisis Semantik Token Nama Akun
                    </span>
                    {liveAiResult?.latencyMs && (
                      <span className="text-[10px] font-mono text-[#0F8F7A]">
                        {liveAiResult.latencyMs}ms {liveAiResult.cached ? '(Cache Memori)' : '(Inferensi vLLM)'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                    <span className="px-2 py-1 rounded bg-white border border-[#DDE4E2] text-[#102A32]">
                      Kode: <strong>{aiInspectingDecision.sourceAccountCode}</strong>
                    </span>
                    <span className="px-2 py-1 rounded bg-white border border-[#DDE4E2] text-[#102A32]">
                      Saldo: <strong>{formatIdrNumber(aiInspectingDecision.amountIdr)}</strong>
                    </span>
                    <span className="px-2 py-1 rounded bg-[#FDECEF] border border-[#F8B4BD] text-[#C83E4D]">
                      Status: <strong>{aiInspectingDecision.status.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFF7E8] border border-[#F6E0B5] space-y-1.5">
                  <div className="font-bold text-[11px] text-[#B7791F] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    2. Rujukan Standar & Analisis AI ({liveAiResult?.psakReference || 'PSAK 10 / SAK Entitas Privat'})
                  </div>
                  <p className="text-[11px] text-[#52636A] leading-relaxed">
                    {liveAiResult?.accountingStandardAnalysis || liveAiResult?.rationale || 'Sistem mendeteksi bahwa akun penampungan selisih kurs sementara memiliki saldo material yang harus direklasifikasi ke Laporan Laba Rugi sesuai PSAK 10, bukan dibiarkan menggantung di neraca.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] space-y-2">
                  <span className="font-bold text-[11px] text-[#0F8F7A] uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    3. Rekomendasi Target Kertas Kerja
                  </span>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-white border border-[#B2DFD6] flex items-center justify-between gap-3">
                      <div>
                        <strong className="text-[#102A32] block text-[11px]">
                          Target SAK: {liveAiResult?.proposedTarget || 'WP-F.4'} (Keyakinan {Math.round((liveAiResult?.confidenceScore || 0.88) * 100)}%)
                        </strong>
                        <span className="text-[10px] text-[#52636A]">
                          {liveAiResult?.rationale || 'Reklasifikasi ke WP-F.4 Pendapatan / Beban Lain-lain Bersih.'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const target = liveAiResult?.proposedTarget || 'WP-F.4';
                          handleInlineChangeTarget(aiInspectingDecision.id, target);
                          setAiInspectingDecision(null);
                          setLiveAiResult(null);
                        }}
                        className="px-3 py-1.5 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        Terapkan {liveAiResult?.proposedTarget || 'WP-F.4'} &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DDE4E2] relative z-10">
              <button
                type="button"
                onClick={() => {
                  setAiInspectingDecision(null);
                  setLiveAiResult(null);
                }}
                className="px-4 py-2 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F1F4F3] font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

</div>
  );
}
