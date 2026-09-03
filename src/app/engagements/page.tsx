'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { EngagementStatusV4 } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';

export default function EngagementsListPage() {
  const state = repo.getState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const engagements = state.engagements.filter((eng) => {
    const client = state.clients.find((c) => c.id === eng.clientId);
    const matchSearch =
      eng.name.toLowerCase().includes(search.toLowerCase()) ||
      client?.legalName.toLowerCase().includes(search.toLowerCase()) ||
      client?.code.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || eng.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (s: EngagementStatusV4) => {
    switch (s) {
      case 'approved':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">Disetujui</span>;
      case 'ready_for_review':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5]">Siap Review</span>;
      case 'preparing':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">Dalam Persiapan</span>;
      default:
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1F4F3] text-[#52636A]">Draft</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#102A32] animate-finova-in">
      {/* Hero Welcome Banner with Double-Bezel Architecture */}
      <div className="finova-bezel-outer">
        <div className="finova-bezel-inner p-6 sm:p-8 bg-gradient-to-br from-white via-[#F6F7F5] to-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#0F8F7A]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] text-xs font-semibold border border-[#B2DFD6]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{state.firmProfile?.name || "KAP Haidar & Rekan"} &bull; Sistem Kertas Kerja v4.0</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A32]">
                Daftar Perikatan Audit & Atestasi Aktif
              </h1>
              <p className="text-xs sm:text-sm text-[#52636A] leading-relaxed">
                Pusat kerja persiapan kertas kerja, penelaahan neraca saldo, pemetaan akun terstandarisasi, dan pelacakan lineage jejak bukti sumber.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/engagements/new"
                className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white shadow-sm text-xs cursor-pointer"
              >
                <span>Buka Perikatan Baru</span>
                <div className="icon-circle">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-6 border-t border-[#DDE4E2]/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#52636A] text-[11px] block">Perikatan Aktif</span>
              <span className="font-mono font-bold text-lg text-[#102A32]">{state.engagements.length} Entitas</span>
            </div>
            <div>
              <span className="text-[#52636A] text-[11px] block">Total Saldo Dikelola</span>
              <span className="font-mono font-bold text-lg text-[#0F8F7A]">Rp 87,55 Miliar</span>
            </div>
            <div>
              <span className="text-[#52636A] text-[11px] block">Status Keseimbangan TB</span>
              <span className="font-mono font-bold text-lg text-[#0F8F7A] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" /> 100% PASS
              </span>
            </div>
            <div>
              <span className="text-[#52636A] text-[11px] block">Aturan Pemetaan Memori</span>
              <span className="font-mono font-bold text-lg text-[#102A32]">{state.reusableMappings.length} Pola Baku</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#7A8C93] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari perikatan, nama klien, atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#DDE4E2] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-[#52636A] text-[11px]">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#DDE4E2] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
          >
            <option value="all">Semua Status</option>
            <option value="preparing">Dalam Persiapan</option>
            <option value="ready_for_review">Siap Review</option>
            <option value="approved">Disetujui</option>
          </select>
        </div>
      </div>

      {/* Engagements Grid with Interactive Hover Cards */}
      <div className="space-y-3">
        {engagements.map((eng) => {
          const client = state.clients.find((c) => c.id === eng.clientId);

          return (
            <div
              key={eng.id}
              className="bg-white rounded-xl border border-[#DDE4E2] p-5 shadow-2xs hover:border-[#0F8F7A]/60 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#102A32] text-white">
                    {client?.code}
                  </span>
                  <span className="font-bold text-xs text-[#52636A]">{client?.legalName}</span>
                  {getStatusBadge(eng.status)}
                </div>

                <h3 className="text-base font-bold text-[#102A32]">{eng.name}</h3>

                <div className="flex items-center gap-6 text-[11px] text-[#52636A] flex-wrap font-mono">
                  <div>
                    <span>Periode: </span>
                    <strong className="text-[#102A32]">{eng.periodStart} s.d. {eng.periodEnd}</strong>
                  </div>
                  <div>
                    <span>Materialitas: </span>
                    <strong className="text-[#102A32]">{formatIdrNumber(eng.materialityIdr)}</strong>
                  </div>
                  <div>
                    <span>Manager: </span>
                    <strong className="text-[#102A32]">Siti Rahmawati</strong>
                  </div>
                  <div>
                    <span>Senior: </span>
                    <strong className="text-[#102A32]">Ahmad Pratama</strong>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link
                  href={`/engagements/${eng.id}/overview`}
                  className="finova-pill-cta bg-[#102A32] hover:bg-[#0F8F7A] text-white text-xs shadow-xs cursor-pointer"
                >
                  <span>Buka Perikatan</span>
                  <div className="icon-circle">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
