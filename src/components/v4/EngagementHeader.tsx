'use client';

import React from 'react';
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

  const tabs = [
    { label: 'Overview', href: `/engagements/${engagementId}/overview`, icon: Layers },
    { label: 'Files', href: `/engagements/${engagementId}/files`, icon: UploadCloud },
    { label: 'Account Mapping', href: `/engagements/${engagementId}/mapping`, icon: Table },
    { label: 'Workpaper', href: `/engagements/${engagementId}/workpaper`, icon: FileSpreadsheet },
    { label: 'Exports', href: `/engagements/${engagementId}/exports`, icon: Download },
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
          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="bg-[#F6F7F5] border border-[#DDE4E2] px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-[#52636A] block">Tahun Fiskal</span>
              <span className="font-mono font-bold text-xs text-[#102A32]">{periodYear} (IDR)</span>
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
                <span>{tab.label}</span>

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
