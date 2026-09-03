'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Table,
  Search,
  ArrowUpDown,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Command,
  Check,
} from 'lucide-react';
import { WorkpaperLineItem } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';

interface AuditSpreadsheetProps {
  lines: WorkpaperLineItem[];
  onOpenEvidence: (line: WorkpaperLineItem) => void;
  onOpenComment: (line: WorkpaperLineItem) => void;
}

export function AuditSpreadsheet({ lines, onOpenEvidence, onOpenComment }: AuditSpreadsheetProps) {
  const [activeRowIdx, setActiveRowIdx] = useState<number>(0);
  const [activeColIdx, setActiveColIdx] = useState<number>(2); // Default to current period column
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'lineId' | 'currentPeriodIdr' | 'variancePercent'>('lineId');
  const [sortAsc, setSortAsc] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const columns = [
    { key: 'lineId', label: 'Kode', width: 'w-24' },
    { key: 'label', label: 'Deskripsi Akun Induk', width: 'flex-1' },
    { key: 'currentPeriodIdr', label: 'FY 2026 (Berjalan)', width: 'w-36' },
    { key: 'comparativePeriodIdr', label: 'FY 2024 (Komparatif)', width: 'w-36' },
    { key: 'varianceAmountIdr', label: 'Varians (IDR)', width: 'w-32' },
    { key: 'variancePercent', label: 'Varians (%)', width: 'w-24' },
    { key: 'commentCount', label: 'Catatan', width: 'w-20' },
    { key: 'actions', label: 'Jejak Bukti', width: 'w-28' },
  ];

  // Filter & Sort
  const filteredLines = lines
    .filter(
      (l) =>
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.lineId.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  const activeLine = filteredLines[activeRowIdx] || filteredLines[0];

  // Keyboard navigation handler (Arrow keys, Enter, Tab)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveRowIdx((prev) => Math.min(filteredLines.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveRowIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        setActiveColIdx((prev) => Math.min(columns.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveColIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeLine) {
          if (activeColIdx === 6) {
            onOpenComment(activeLine);
          } else {
            onOpenEvidence(activeLine);
          }
        }
      }
    },
    [filteredLines, columns.length, activeLine, activeColIdx, onOpenComment, onOpenEvidence]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSort = (field: 'lineId' | 'currentPeriodIdr' | 'variancePercent') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getFormulaDisplay = () => {
    if (!activeLine) return '';
    return `=SUM(TB!${activeLine.lineId}_Accounts) | Nilai SAK: ${formatIdrNumber(activeLine.currentPeriodIdr)} (Varians ${
      activeLine.variancePercent !== undefined ? (activeLine.variancePercent > 0 ? `+${activeLine.variancePercent}%` : `${activeLine.variancePercent}%`) : '0%'
    })`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden text-xs flex flex-col focus:outline-none">
      {/* Top Interactive Formula Bar & Hotkey Cue */}
      <div className="p-3 bg-[#F6F7F5] border-b border-[#DDE4E2] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2 flex-1 w-full">
          {/* Active Coordinate Box */}
          <div className="px-2.5 py-1 rounded-lg bg-[#102A32] text-white font-bold text-xs shadow-xs shrink-0 flex items-center gap-1.5">
            <span className="text-[#0F8F7A] text-[10px]">SEL</span>
            <span>{activeLine ? activeLine.lineId : 'WP-A.1'}</span>
          </div>

          {/* Formula String Display */}
          <div className="flex-1 bg-white border border-[#DDE4E2] rounded-lg px-3 py-1 text-xs text-[#102A32] flex items-center gap-2 overflow-x-auto shadow-2xs">
            <span className="font-bold text-[#0F8F7A] select-none">fx</span>
            <span className="truncate">{getFormulaDisplay()}</span>
          </div>
        </div>

        {/* Keyboard navigation helper pill */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#52636A] shrink-0 font-sans">
          <span className="px-1.5 py-0.5 rounded bg-white border border-[#DDE4E2] font-mono font-bold text-[10px] text-[#102A32]">
            &uarr;&darr;&larr;&rarr;
          </span>
          <span>Navigasi Sel</span>
          <span className="px-1.5 py-0.5 rounded bg-white border border-[#DDE4E2] font-mono font-bold text-[10px] text-[#102A32]">
            Enter
          </span>
          <span>Buka Lineage</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 border-b border-[#DDE4E2] flex items-center justify-between gap-4 bg-white">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari akun atau kode baris..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-[#DDE4E2] rounded-xl text-xs bg-[#F6F7F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#52636A] text-[11px] hidden sm:inline">Urutkan:</span>
          <button
            onClick={() => toggleSort('lineId')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              sortField === 'lineId' ? 'bg-[#102A32] text-white border-[#102A32]' : 'bg-[#F6F7F5] text-[#52636A] border-[#DDE4E2]'
            }`}
          >
            Kode <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('currentPeriodIdr')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              sortField === 'currentPeriodIdr' ? 'bg-[#102A32] text-white border-[#102A32]' : 'bg-[#F6F7F5] text-[#52636A] border-[#DDE4E2]'
            }`}
          >
            Saldo <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleSort('variancePercent')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              sortField === 'variancePercent' ? 'bg-[#102A32] text-white border-[#102A32]' : 'bg-[#F6F7F5] text-[#52636A] border-[#DDE4E2]'
            }`}
          >
            Varians % <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* High-Density Spreadsheet Table with Focus Ring */}
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="bg-[#F6F7F5] border-b border-[#DDE4E2] text-[#52636A] font-semibold text-[11px] sticky top-0 z-10 shadow-2xs">
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] w-24">Kode</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2]">Deskripsi Akun Induk</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-right w-32">Saldo Unadjusted</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-right w-28">Koreksi (AJE/RJE)</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-right w-36 bg-[#E8F5F1]/50 text-[#0F8F7A] font-bold">Audited Final (2026)</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-right w-32">FY 2024 (Komparatif)</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-right w-28">Varians (IDR)</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-right w-20">Varians %</th>
              <th className="py-2.5 px-3 border-r border-[#DDE4E2] text-center w-20">Catatan</th>
              <th className="py-2.5 px-3 text-center w-28">Jejak Bukti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE4E2]">
            {filteredLines.map((l, rowIdx) => {
              const isRowActive = activeRowIdx === rowIdx;

              return (
                <tr
                  key={l.lineId}
                  onClick={() => setActiveRowIdx(rowIdx)}
                  onDoubleClick={() => onOpenEvidence(l)}
                  className={`transition-colors cursor-pointer ${
                    isRowActive ? 'bg-[#E8F5F1]/30' : 'hover:bg-[#F6F7F5]'
                  }`}
                >
                  {/* Col 0: Code */}
                  <td
                    onClick={() => setActiveColIdx(0)}
                    className={`py-2.5 px-3 font-mono font-bold text-[#102A32] border-r border-[#DDE4E2] relative ${
                      isRowActive && activeColIdx === 0 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                    }`}
                  >
                    {l.lineId}
                  </td>

                  {/* Col 1: Label */}
                  <td
                    onClick={() => setActiveColIdx(1)}
                    className={`py-2.5 px-3 text-[#102A32] border-r border-[#DDE4E2] font-medium relative ${
                      isRowActive && activeColIdx === 1 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                    }`}
                  >
                    {l.label}
                  </td>

                  {/* Col 2: Current Period IDR */}
                  <td
                    onClick={() => setActiveColIdx(2)}
                    className={`py-2.5 px-3 font-mono text-right font-bold text-[#102A32] border-r border-[#DDE4E2] relative ${
                      isRowActive && activeColIdx === 2 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                    }`}
                  >
                    <span className={l.currentPeriodIdr < 0 || l.lineId === 'WP-A.3' || l.lineId === 'WP-B.2' ? 'text-[#C83E4D]' : ''}>
                      {l.lineId === 'WP-A.3' || l.lineId === 'WP-B.2' ? `(${formatIdrNumber(Math.abs(l.currentPeriodIdr))})` : formatIdrNumber(l.currentPeriodIdr)}
                    </span>
                  </td>

                  {/* Col 3: Comparative Period IDR */}
                  <td
                    onClick={() => setActiveColIdx(3)}
                    className={`py-2.5 px-3 font-mono text-right text-[#52636A] border-r border-[#DDE4E2] relative ${
                      isRowActive && activeColIdx === 3 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                    }`}
                  >
                    {l.comparativePeriodIdr !== undefined ? (
                      l.lineId === 'WP-A.3' || l.lineId === 'WP-B.2' ? (
                        <span className="text-[#C83E4D]">({formatIdrNumber(Math.abs(l.comparativePeriodIdr))})</span>
                      ) : (
                        formatIdrNumber(l.comparativePeriodIdr)
                      )
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Col 4: Variance Amount (Deterministic Sign Policy) */}
                  {(() => {
                    const isContra = l.lineId === 'WP-A.3' || l.lineId === 'WP-B.2';
                    const curVal = isContra ? Math.abs(l.currentPeriodIdr) : l.currentPeriodIdr;
                    const compVal = l.comparativePeriodIdr !== undefined ? (isContra ? Math.abs(l.comparativePeriodIdr) : l.comparativePeriodIdr) : undefined;
                    const varAmount = compVal !== undefined ? (curVal - compVal) : (l.varianceAmountIdr ?? 0);
                    const varPercent = compVal !== undefined && compVal !== 0 ? Math.round(((curVal - compVal) / Math.abs(compVal)) * 1000) / 10 : (l.variancePercent ?? 0);

                    return (
                      <>
                        <td
                          onClick={() => setActiveColIdx(4)}
                          className={`py-2.5 px-3 font-mono text-right text-[#52636A] border-r border-[#DDE4E2] relative ${
                            isRowActive && activeColIdx === 4 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                          }`}
                        >
                          <span className={varAmount < 0 ? 'text-[#C83E4D]' : ''}>
                            {formatIdrNumber(varAmount)}
                          </span>
                        </td>

                        {/* Col 5: Variance Percent */}
                        <td
                          onClick={() => setActiveColIdx(5)}
                          className={`py-2.5 px-3 font-mono text-right border-r border-[#DDE4E2] relative ${
                            isRowActive && activeColIdx === 5 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                          }`}
                        >
                          <span className={varPercent < 0 ? 'text-[#C83E4D] font-bold' : 'text-[#0F8F7A] font-bold'}>
                            {varPercent > 0 ? `+${varPercent}%` : `${varPercent}%`}
                          </span>
                        </td>
                      </>
                    );
                  })()}

                  {/* Col 6: Comments */}
                  <td
                    onClick={() => setActiveColIdx(6)}
                    className={`py-2.5 px-3 text-center border-r border-[#DDE4E2] relative ${
                      isRowActive && activeColIdx === 6 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComment(l);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors cursor-pointer ${
                        l.commentCount > 0
                          ? 'bg-[#FFF7E8] text-[#B7791F] font-bold border border-[#F6E0B5]'
                          : 'text-[#7A8C93] hover:text-[#102A32]'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      {l.commentCount}
                    </button>
                  </td>

                  {/* Col 7: Lineage Action */}
                  <td
                    onClick={() => setActiveColIdx(7)}
                    className={`py-2.5 px-3 text-center relative ${
                      isRowActive && activeColIdx === 7 ? 'ring-2 ring-inset ring-[#0F8F7A] bg-[#E8F5F1]/70' : ''
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEvidence(l);
                      }}
                      className="px-2.5 py-1 bg-[#F1F4F3] hover:bg-[#E8F5F1] text-[#0F8F7A] rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Lihat Lineage Bukti Sumber (Double-click juga bisa)"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Lineage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
