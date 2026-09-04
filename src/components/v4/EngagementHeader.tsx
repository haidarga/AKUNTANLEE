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
  Pencil,
  Building2,
  X,
} from 'lucide-react';
import { EngagementStatusV4 } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { getStoredCustomEngagements, saveStoredCustomEngagement } from '@/lib/storage/finova-store';

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

  // Dynamic Editable Client & Engagement State
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentClientName, setCurrentClientName] = useState(clientName);
  const [currentClientCode, setCurrentClientCode] = useState(clientCode);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentPeriodYear, setCurrentPeriodYear] = useState(periodYear);
  const [currentMateriality, setCurrentMateriality] = useState(materialityIdr);
  const [currentTaxId, setCurrentTaxId] = useState('01.234.567.8-012.000');
  const [currentIndustry, setCurrentIndustry] = useState('Manufaktur & Fabrikasi');

  // Form edit states
  const [editClientName, setEditClientName] = useState(clientName);
  const [editClientCode, setEditClientCode] = useState(clientCode);
  const [editTaxId, setEditTaxId] = useState('01.234.567.8-012.000');
  const [editIndustry, setEditIndustry] = useState('Manufaktur & Fabrikasi');
  const [editTitle, setEditTitle] = useState(title);
  const [editMateriality, setEditMateriality] = useState(String(materialityIdr));
  const [editAccountingStandard, setEditAccountingStandard] = useState('SAK_INDONESIA');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setCurrentClientName(clientName);
    setEditClientName(clientName);
  }, [clientName]);

  useEffect(() => {
    setCurrentClientCode(clientCode);
    setEditClientCode(clientCode);
  }, [clientCode]);

  useEffect(() => {
    setCurrentTitle(title);
    setEditTitle(title);
  }, [title]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedEngs = getStoredCustomEngagements();
      const found = storedEngs.find((e) => e.id === engagementId);
      if (found) {
        if (found.clientName) {
          setCurrentClientName(found.clientName);
          setEditClientName(found.clientName);
        }
        if (found.clientCode) {
          setCurrentClientCode(found.clientCode);
          setEditClientCode(found.clientCode);
        }
        if (found.name) {
          setCurrentTitle(found.name);
          setEditTitle(found.name);
        }
        if (found.materialityIdr) {
          setCurrentMateriality(found.materialityIdr);
          setEditMateriality(String(found.materialityIdr));
        }
      }
    } catch (err) {
      console.warn('Error reading stored engagement in header:', err);
    }
  }, [engagementId]);

  const handleOpenEditModal = () => {
    setEditClientName(currentClientName);
    setEditClientCode(currentClientCode);
    setEditTitle(currentTitle);
    setEditMateriality(String(currentMateriality));
    setEditSuccessMsg(null);
    setShowEditModal(true);
  };

  const handleSaveEngagementDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditSuccessMsg(null);

    try {
      const res = await fetch(`/api/v1/engagements/${engagementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: editClientName.trim(),
          clientCode: editClientCode.trim().toUpperCase(),
          taxIdNpwp: editTaxId.trim(),
          industry: editIndustry,
          name: editTitle.trim(),
          materialityIdr: parseFloat(editMateriality) || 250000000,
          accountingStandard: editAccountingStandard,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Gagal menyimpan data');
      }

      setCurrentClientName(editClientName.trim());
      setCurrentClientCode(editClientCode.trim().toUpperCase());
      setCurrentTitle(editTitle.trim());
      setCurrentMateriality(parseFloat(editMateriality) || 250000000);
      setEditSuccessMsg('Data PT dan parameter perikatan berhasil diperbarui!');

      saveStoredCustomEngagement(
        {
          id: engagementId,
          name: editTitle.trim(),
          clientName: editClientName.trim(),
          clientCode: editClientCode.trim().toUpperCase(),
          taxIdNpwp: editTaxId.trim(),
          industry: editIndustry,
          materialityIdr: parseFloat(editMateriality) || 250000000,
          accountingStandard: editAccountingStandard,
        }
      );

      // Notify other components (Overview, Copilot, etc.)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('finova:engagement-updated', {
            detail: {
              engagementId,
              clientName: editClientName.trim(),
              clientCode: editClientCode.trim().toUpperCase(),
              title: editTitle.trim(),
            },
          })
        );
      }

      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccessMsg(null);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving engagement details:', err);
      alert(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [selectedCycle, setSelectedCycle] = useState<'Tahunan' | 'Semester 1' | 'Triwulan 4' | 'Bulanan'>('Tahunan');
  const [abVariant, setAbVariant] = useState<'variant_b_advisory' | 'variant_a_compliance' | 'variant_master'>('variant_master');
  const [userName, setUserName] = useState<string>('Partner Aktif');
  const [showPersonaBanner] = useState<boolean>(false);

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

    try {
      const storedFirm = localStorage.getItem('finova_firm_profile');
      const firm = storedFirm ? JSON.parse(storedFirm) : null;
      if (firm?.managingPartnerName) setUserName(firm.managingPartnerName);
    } catch {}
  }, []);

  const switchVariant = (newVariant: 'variant_b_advisory' | 'variant_a_compliance') => {
    setAbVariant(newVariant);
    localStorage.setItem('finova_ab_variant', newVariant);
    document.cookie = `finova_ab_variant=${newVariant}; path=/; max-age=604800`;

    if (newVariant === 'variant_b_advisory') {
      router.push(`/engagements/${engagementId}/advisory`);
    } else {
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
        {/* Persistent Demo & Simulation Environment Notice */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] px-3.5 py-1.5 rounded-xl flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold px-1.5 py-0.5 rounded bg-[#F59E0B] text-white text-[10px] uppercase tracking-wider">
              DATA SIMULASI
            </span>
            <span>
              <strong>Lingkungan Demo & Evaluasi FINOVA AI v4.0:</strong> Seluruh entitas klien, nomor izin KAP, dan angka keuangan merupakan data simulasi fiktif untuk keperluan evaluasi fungsional.
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#B45309] hidden md:inline">
            Sandbox Mode &bull; Non-Production Data
          </span>
        </div>

        {/* Real-Time Module Mode Switcher Bar */}
        <div className="bg-[#F6F7F5] border border-[#DDE4E2] px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#52636A] flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-[#0F8F7A]" />
              Mode Evaluasi Aktif:
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
              <span>🟢 Mode Kepatuhan Pajak (Audit & Tax Mode)</span>
            </button>
            <button
              onClick={() => switchVariant('variant_b_advisory')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                abVariant === 'variant_b_advisory'
                  ? 'bg-[#805AD5] text-white shadow-xs'
                  : 'text-[#52636A] hover:text-[#102A32] hover:bg-[#F6F7F5]'
              }`}
            >
              <span>🟣 Mode Analisis Strategis (Strategic Advisory Mode)</span>
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
                {currentClientCode}
              </span>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="font-bold text-xs text-[#102A32] hover:text-[#0F8F7A] underline decoration-dotted decoration-[#0F8F7A] underline-offset-4 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Klik untuk mengubah nama PT, NPWP, atau parameter audit"
              >
                <span>{currentClientName}</span>
                <Pencil className="w-3 h-3 text-[#0F8F7A]" />
              </button>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] hover:bg-[#D3EEE7] text-[#0F8F7A] border border-[#B2DFD6] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ubah Data PT</span>
              </button>
              {getStatusBadge(status)}
              {isStale && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5] flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3 text-[#B7791F]" />
                  Kertas Kerja Perlu Dihitung Ulang
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#102A32]">{currentTitle}</h1>
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
              <span className="font-mono font-bold text-xs text-[#102A32]">{formatIdrNumber(currentMateriality)}</span>
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

      {/* Modal Ubah Data PT & Perikatan */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-finova-in">
          <div className="bg-white rounded-3xl border border-[#DDE4E2] shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 text-xs relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#7A8C93] hover:text-[#102A32] hover:bg-[#F6F7F5] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                Kustomisasi Entitas
              </span>
              <h3 className="text-lg font-bold text-[#102A32]">
                Ubah Identitas PT &amp; Parameter Perikatan
              </h3>
              <p className="text-[#52636A] text-[11px] leading-relaxed">
                Ubah nama PT, NPWP, atau judul perikatan sesuai entitas nyata klien Anda. Seluruh modul (Overview, Workpaper, Tax, dan Ekspor) otomatis tersinkronisasi.
              </p>
            </div>

            {editSuccessMsg && (
              <div className="p-3 bg-[#E8F5F1] border border-[#B2DFD6] rounded-xl flex items-center gap-2 text-[#0F8F7A] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0F8F7A] shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEngagementDetails} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-[#102A32]">
                  Nama Lengkap Perusahaan / PT: <span className="text-[#E02424]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="Contoh: PT Sumber Makmur Abadi"
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F8F7A] font-semibold text-sm text-[#102A32] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#52636A]">
                    Kode / Ticker Klien:
                  </label>
                  <input
                    type="text"
                    required
                    value={editClientCode}
                    onChange={(e) => setEditClientCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white font-mono uppercase text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#52636A]">
                    NPWP Badan:
                  </label>
                  <input
                    type="text"
                    value={editTaxId}
                    onChange={(e) => setEditTaxId(e.target.value)}
                    placeholder="01.234.567.8-012.000"
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#52636A]">
                    Sektor Industri:
                  </label>
                  <select
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="Manufaktur & Fabrikasi">Manufaktur & Fabrikasi</option>
                    <option value="Perdagangan & Retail">Perdagangan & Retail</option>
                    <option value="Jasa & Konsultasi">Jasa & Konsultasi</option>
                    <option value="Transportasi & Logistik">Transportasi & Logistik</option>
                    <option value="Konstruksi & Properti">Konstruksi & Properti</option>
                    <option value="F&B & Restoran">F&B & Restoran</option>
                    <option value="Teknologi & Digital">Teknologi & Digital</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#DDE4E2]">
                <label className="block font-bold text-[#102A32]">
                  Judul Kertas Kerja / Perikatan:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-medium text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#52636A]">
                    Standar Akuntansi:
                  </label>
                  <select
                    value={editAccountingStandard}
                    onChange={(e) => setEditAccountingStandard(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="SAK_INDONESIA">SAK Indonesia (PSAK Lengkap)</option>
                    <option value="SAK_EP">SAK EP (Entitas Privat)</option>
                    <option value="SAK_EMKM">SAK EMKM (Mikro, Kecil &amp; Menengah)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#52636A]">
                    Ambang Materialitas (IDR):
                  </label>
                  <input
                    type="number"
                    required
                    value={editMateriality}
                    onChange={(e) => setEditMateriality(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DDE4E2]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F6F7F5] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan PT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
