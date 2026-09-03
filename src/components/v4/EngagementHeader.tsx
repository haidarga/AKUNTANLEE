'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Table,
  UploadCloud,
  Download,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Calculator,
  Calendar,
} from 'lucide-react';
import { EngagementStatusV4 } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';

interface HeaderProps {
  engagementId: string;
  clientName: string;
  clientCode: string;
  title: string;
  periodYear: string;
  materialityIdr: number;
  status: EngagementStatusV4;
  isStale?: boolean;
}

export function EngagementHeader({
  engagementId,
  clientName,
  clientCode,
  title,
  periodYear,
  materialityIdr,
  status,
  isStale,
}: HeaderProps) {
  const pathname = usePathname();

  const [selectedCycle, setSelectedCycle] = useState<'Tahunan' | 'Semester 1' | 'Triwulan 4' | 'Bulanan'>('Tahunan');

  const tabs = [
    { label: '1. Ringkasan', sub: 'Overview', href: `/engagements/${engagementId}/overview`, icon: Layers },
    { label: '2. Berkas Sumber', sub: 'Files', href: `/engagements/${engagementId}/files`, icon: UploadCloud },
    { label: '3. Pemetaan SAK', sub: 'Mapping', href: `/engagements/${engagementId}/mapping`, icon: Table },
    { label: '4. Kertas Kerja', sub: 'Lead Schedule', href: `/engagements/${engagementId}/workpaper`, icon: FileSpreadsheet },
    { label: '5. Analisis Konsultan', sub: "What's Next & Ratios", href: `/engagements/${engagementId}/advisory`, icon: Sparkles },
    { label: '6. Kepatuhan Pajak', sub: 'PPh 21 & PPN', href: `/engagements/${engagementId}/tax`, icon: Calculator },
    { label: '7. Ekspor Resmi', sub: 'XLSX & Memo', href: `/engagements/${engagementId}/exports`, icon: Download },
  ];

  const getStatusBadge = (s: EngagementStatusV4) => {
    switch (s) {
      case 'approved':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">Disetujui (Approved)</span>;
      case 'ready_for_review':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5]">Siap Review</span>;
      case 'preparing':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">Dalam Persiapan</span>;
      default:
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1F4F3] text-[#52636A]">Draft</span>;
    }
  };

  return (
    <div className="bg-white border-b border-[#DDE4E2] px-4 sm:px-6 pt-5 pb-0 shadow-xs">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Client & Metadata Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#102A32] text-white">
                {clientCode}
              </span>
              <span className="font-semibold text-xs text-[#52636A]">{clientName}</span>
              {getStatusBadge(status)}
              {isStale && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5] flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3 text-[#B7791F]" />
                  Kertas Kerja Perlu Dihitung Ulang
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#102A32]">{title}</h1>
          </div>

          {/* Quick Period & Materiality Stats */}
          <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
            {/* Multi-Period Cycle Selector (Bunda's Request) */}
            <div className="bg-[#F6F7F5] border border-[#DDE4E2] p-1 rounded-xl flex items-center gap-1 text-[11px]">
              {(['Tahunan', 'Semester 1', 'Triwulan 4', 'Bulanan'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setSelectedCycle(cycle)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedCycle === cycle
                      ? 'bg-[#0F8F7A] text-white shadow-xs'
                      : 'text-[#52636A] hover:text-[#102A32]'
                  }`}
                >
                  {cycle}
                </button>
              ))}
            </div>

            <div className="bg-[#F6F7F5] border border-[#DDE4E2] px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-[#52636A] block">Siklus Aktif</span>
              <span className="font-mono font-bold text-xs text-[#102A32]">{selectedCycle} {periodYear}</span>
            </div>
            <div className="bg-[#F6F7F5] border border-[#DDE4E2] px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-[#52636A] block">Materialitas Audit</span>
              <span className="font-mono font-bold text-xs text-[#102A32]">{formatIdrNumber(materialityIdr)}</span>
            </div>
          </div>
        </div>

        {/* 5-Stage Navigation Tabs with Animated Layout Indicator */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-[#DDE4E2] pt-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href.includes('/imports') && pathname.includes('/imports'));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  isActive ? 'text-[#0F8F7A]' : 'text-[#52636A] hover:text-[#102A32]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F8F7A]' : 'text-[#7A8C93]'}`} />
                <div className="flex flex-col text-left">
                  <span className="leading-tight">{tab.label}</span>
                  <span className="text-[10px] text-[#7A8C93] font-normal leading-tight">{tab.sub}</span>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F8F7A]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
