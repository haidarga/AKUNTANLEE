'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  KeyRound,
  Repeat,
  Sliders,
  ShieldCheck,
  UserCheck,
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
  const router = useRouter();

  const [selectedCycle, setSelectedCycle] = useState<'Tahunan' | 'Semester 1' | 'Triwulan 4' | 'Bulanan'>('Tahunan');
  const [abVariant, setAbVariant] = useState<'variant_b_advisory' | 'variant_a_compliance' | 'variant_master'>('variant_master');
  const [userName, setUserName] = useState<string>('Haidar, CPA, CA');
  const [showPersonaBanner, setShowPersonaBanner] = useState<boolean>(true);

  useEffect(() => {
    // Read active variant from localStorage / cookie
    const storedVariant = localStorage.getItem('finova_ab_variant') as any;
    if (storedVariant && (storedVariant === 'variant_b_advisory' || storedVariant === 'variant_a_compliance' || storedVariant === 'variant_master')) {
      setAbVariant(storedVariant);
    }

    const storedName = localStorage.getItem('finova_user_name');
    if (storedName) {
      setUserName(decodeURIComponent(storedName));
    }
  }, []);

  const switchVariant = (newVariant: 'variant_b_advisory' | 'variant_a_compliance') => {
    setAbVariant(newVariant);
    localStorage.setItem('finova_ab_variant', newVariant);
    document.cookie = `finova_ab_variant=${newVariant}; path=/; max-age=604800`;

    if (newVariant === 'variant_b_advisory') {
      const rinaName = 'Ibu Rina Asmara, Ak.';
      setUserName(rinaName);
      localStorage.setItem('finova_user_name', rinaName);
      router.push(`/engagements/${engagementId}/advisory`);
    } else {
      const bundaName = 'Bunda';
      setUserName(bundaName);
      localStorage.setItem('finova_user_name', bundaName);
      router.push(`/engagements/${engagementId}/tax`);
    }
  };

  const tabs = [
    { label: '1. Ringkasan', sub: 'Overview', href: `/engagements/${engagementId}/overview`, icon: Layers },
    { label: '2. Berkas Sumber', sub: 'Files', href: `/engagements/${engagementId}/files`, icon: UploadCloud },
    { label: '3. Pemetaan SAK', sub: 'Mapping', href: `/engagements/${engagementId}/mapping`, icon: Table },
    { label: '4. Kertas Kerja', sub: 'Lead Schedule', href: `/engagements/${engagementId}/workpaper`, icon: FileSpreadsheet },
    {
      label: '5. Analisis Konsultan',
      sub: "What's Next & Ratios",
      href: `/engagements/${engagementId}/advisory`,
      icon: Sparkles,
      highlightVariant: 'variant_b_advisory',
      badgeText: 'Fokus Tante Rina',
    },
    {
      label: '6. Kepatuhan Pajak',
      sub: 'PPh 21 & PPN',
      href: `/engagements/${engagementId}/tax`,
      icon: Calculator,
      highlightVariant: 'variant_a_compliance',
      badgeText: 'Fokus Bunda',
    },
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
    <div className="bg-white border-b border-[#DDE4E2] px-4 sm:px-6 pt-5 pb-0 shadow-xs space-y-3">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Real-Time A/B Testing Switcher Bar */}
        <div className="bg-[#F6F7F5] border border-[#DDE4E2] px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#52636A] flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-[#0F8F7A]" />
              A/B Testing Real-Time:
            </span>
            <span className="font-bold text-[#102A32] bg-white px-2 py-0.5 rounded border border-[#DDE4E2] text-[11px]">
              {userName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#DDE4E2]">
            <button
              onClick={() => switchVariant('variant_a_compliance')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                abVariant === 'variant_a_compliance'
                  ? 'bg-[#0F8F7A] text-white shadow-xs'
                  : 'text-[#52636A] hover:text-[#102A32] hover:bg-[#F6F7F5]'
              }`}
            >
              <span>🟢 Varian A: Kepatuhan Pajak (Bunda)</span>
            </button>
            <button
              onClick={() => switchVariant('variant_b_advisory')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                abVariant === 'variant_b_advisory'
                  ? 'bg-[#805AD5] text-white shadow-xs'
                  : 'text-[#52636A] hover:text-[#102A32] hover:bg-[#F6F7F5]'
              }`}
            >
              <span>🟣 Varian B: Strategic Advisory (Tante Rina)</span>
            </button>
          </div>
        </div>

        {/* Personalized Persona Highlight Banner */}
        {showPersonaBanner && abVariant === 'variant_b_advisory' && (
          <div className="p-3 bg-gradient-to-r from-[#805AD5]/10 via-[#6B46C1]/5 to-white border-l-4 border-[#805AD5] rounded-r-xl flex items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-[#553C9A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#805AD5]" />
                Mode Pengujian A/B: Evaluasi Strategic Advisory & Konsultan (Ibu Rina Asmara, Ak.)
              </div>
              <p className="text-[#52636A] text-[11px] mt-0.5 leading-relaxed">
                Platform disesuaikan untuk kebutuhan CFO & Konsultan: <strong>Diagnosa Anomali Biaya Logistik (+44.5%)</strong>, <strong>Simulator Sensitivitas "What-If" (Kenaikan UMR +8%)</strong>, dan <strong>Dekomposisi HPP Manufaktur (COGM)</strong>.
              </p>
            </div>
            <Link
              href={`/engagements/${engagementId}/advisory`}
              className="finova-pill-cta bg-[#805AD5] hover:bg-[#6B46C1] text-white text-[11px] py-1.5 px-3 shrink-0 shadow-xs cursor-pointer"
            >
              <span>Buka Tab Advisory &rarr;</span>
            </Link>
          </div>
        )}

        {showPersonaBanner && abVariant === 'variant_a_compliance' && (
          <div className="p-3 bg-gradient-to-r from-[#0F8F7A]/10 via-[#0C7564]/5 to-white border-l-4 border-[#0F8F7A] rounded-r-xl flex items-center justify-between gap-4 text-xs">
            <div>
              <div className="font-bold text-[#0F8F7A] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#0F8F7A]" />
                Mode Pengujian A/B: Evaluasi Kepatuhan Pajak & Kertas Kerja Operasional (Bunda)
              </div>
              <p className="text-[#52636A] text-[11px] mt-0.5 leading-relaxed">
                Platform disesuaikan untuk praktisi audit lapangan: <strong>PPh 21 TER (PP 58/2023)</strong>, <strong>Smart Payroll Importer Berbagai Format Klien</strong>, <strong>Ekualisasi Omset SPT PPN 1111 Klop 100%</strong>, dan <strong>Unduh Resmi CSV DJP</strong>.
              </p>
            </div>
            <Link
              href={`/engagements/${engagementId}/tax`}
              className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-[11px] py-1.5 px-3 shrink-0 shadow-xs cursor-pointer"
            >
              <span>Buka Tab Pajak &rarr;</span>
            </Link>
          </div>
        )}

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

        {/* 7-Stage Navigation Tabs with Animated Layout Indicator & Variant Highlights */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-[#DDE4E2] pt-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href.includes('/imports') && pathname.includes('/imports'));
            const Icon = tab.icon;
            const isHighlighted = tab.highlightVariant === abVariant;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap rounded-t-lg ${
                  isActive
                    ? 'text-[#0F8F7A] bg-[#F6F7F5]/50'
                    : isHighlighted
                    ? abVariant === 'variant_b_advisory'
                      ? 'text-[#805AD5] bg-[#805AD5]/5 font-bold animate-pulse'
                      : 'text-[#0F8F7A] bg-[#0F8F7A]/5 font-bold animate-pulse'
                    : 'text-[#52636A] hover:text-[#102A32]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F8F7A]' : isHighlighted ? (abVariant === 'variant_b_advisory' ? 'text-[#805AD5]' : 'text-[#0F8F7A]') : 'text-[#7A8C93]'}`} />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="leading-tight">{tab.label}</span>
                    {isHighlighted && tab.badgeText && (
                      <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        abVariant === 'variant_b_advisory'
                          ? 'bg-[#805AD5] text-white'
                          : 'bg-[#0F8F7A] text-white'
                      }`}>
                        {tab.badgeText}
                      </span>
                    )}
                  </div>
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
