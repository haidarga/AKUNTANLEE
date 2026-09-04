'use client';

import React, { useState, useEffect } from 'react';
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
  Layers,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { EngagementStatusV4 } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { getStoredCustomEngagements, getStoredCustomClients } from '@/lib/storage/finova-store';

export default function EngagementsListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allEngagements, setAllEngagements] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [firmName, setFirmName] = useState<string>('Kantor Akuntan Publik');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedEngs = getStoredCustomEngagements();
    const storedClients = getStoredCustomClients();

    const clientMap = new Map<string, any>();
    for (const c of storedClients) clientMap.set(c.id, c);

    const mergedMap = new Map<string, any>();
    try {
      const savedFirm = localStorage.getItem('finova_firm_profile');
      if (savedFirm) {
        const parsed = JSON.parse(savedFirm);
        if (parsed?.name) setFirmName(parsed.name);
      }
    } catch (e) {}

    // Only add custom / real engagements (exclude hardcoded demo NSM from production list)
    for (const e of storedEngs) {
      if (e.id !== 'ENG-2026-01' && e.id !== 'ENG-DEMO-2026') {
        mergedMap.set(e.id, e);
      }
    }

    // Fetch fresh from API (which queries Supabase)
    fetch('/api/v1/engagements')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          for (const e of json.data) {
            if (e.id !== 'ENG-2026-01' && e.id !== 'ENG-DEMO-2026') {
              mergedMap.set(e.id, { ...mergedMap.get(e.id), ...e });
            }
          }
          setAllEngagements(Array.from(mergedMap.values()));
        }
      })
      .catch((err) => console.warn('Directory API fetch fallback to local:', err))
      .finally(() => setIsLoading(false));

    setAllEngagements(Array.from(mergedMap.values()));
    setAllClients(Array.from(clientMap.values()));
  }, []);

  const engagements = allEngagements.filter((eng) => {
    const client = allClients.find((c) => c.id === eng.clientId) || {
      legalName: eng.clientName || 'PT Klien Audit Baru',
      code: eng.clientCode || 'KLN',
    };
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
      {/* Hero Welcome Banner */}
      <div className="finova-bezel-outer">
        <div className="finova-bezel-inner p-6 sm:p-8 bg-gradient-to-br from-white via-[#F6F7F5] to-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#0F8F7A]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] text-xs font-semibold border border-[#B2DFD6]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{firmName} &bull; Sistem Audit Produksi v4.0</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A32]">
                Direktori Perikatan Audit Klien
              </h1>
              <p className="text-xs sm:text-sm text-[#52636A] leading-relaxed">
                Pusat data perikatan riil auditee, penelaahan neraca saldo kustom, pemetaan akun SAK, dan kertas kerja berlisensi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/demo"
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-[#102A32] border border-[#DDE4E2] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F8F7A]" />
                <span>🎮 Buka Showroom Demo</span>
              </Link>

              <Link
                href="/engagements/new"
                className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white shadow-sm text-xs cursor-pointer"
              >
                <span>+ Buka Perikatan Baru</span>
                <div className="icon-circle">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 pt-6 border-t border-[#DDE4E2]/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#52636A] text-[11px] block">Perikatan Riil Aktif</span>
              <span className="font-mono font-bold text-lg text-[#102A32]">{allEngagements.length} Entitas</span>
            </div>
            <div>
              <span className="text-[#52636A] text-[11px] block">Database Single Source</span>
              <span className="font-mono font-bold text-lg text-[#0F8F7A]">Postgres Supabase</span>
            </div>
            <div>
              <span className="text-[#52636A] text-[11px] block">Penyimpanan Berkas</span>
              <span className="font-mono font-bold text-lg text-[#102A32]">audit-vault</span>
            </div>
            <div>
              <span className="text-[#52636A] text-[11px] block">Standar Pelaporan</span>
              <span className="font-mono font-bold text-lg text-[#0F8F7A]">SAK Indonesia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#52636A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari PT klien, kode, atau perikatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] placeholder-[#52636A] focus:outline-hidden focus:border-[#0F8F7A] shadow-2xs transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-hidden focus:border-[#0F8F7A] shadow-2xs"
          >
            <option value="all">Semua Status</option>
            <option value="preparing">Dalam Persiapan</option>
            <option value="ready_for_review">Siap Review</option>
            <option value="approved">Disetujui</option>
          </select>
        </div>
      </div>

      {/* Engagements Grid or Empty State */}
      {engagements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#DDE4E2] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0F8F7A] flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-base text-[#102A32]">Belum Ada Perikatan Audit Riil</h3>
            <p className="text-xs text-[#52636A] leading-relaxed">
              Database produksi Anda saat ini bersih tanpa data mockup. Mulai dengan membuat perikatan audit klien baru Anda, atau buka Showroom Demo untuk melihat simulasi contoh.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/engagements/new"
              className="px-4 py-2 rounded-xl bg-[#0F8F7A] text-white text-xs font-bold hover:bg-[#0C7564] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Klien & Perikatan Pertama</span>
            </Link>
            <Link
              href="/demo"
              className="px-4 py-2 rounded-xl bg-slate-100 text-[#102A32] text-xs font-bold hover:bg-slate-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0F8F7A]" />
              <span>Jelajahi Demo Showroom</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engagements.map((eng) => {
            const client = allClients.find((c) => c.id === eng.clientId) || {
              legalName: eng.clientName || 'PT Klien Audit Baru',
              code: eng.clientCode || 'KLN',
              industry: eng.industry || 'Jasa & Perdagangan',
            };

            return (
              <div
                key={eng.id}
                className="bg-white rounded-2xl border border-[#DDE4E2] p-5 shadow-2xs hover:shadow-md hover:border-[#0F8F7A]/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#52636A]">
                      {eng.id}
                    </span>
                    {getStatusBadge(eng.status)}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#102A32] group-hover:text-[#0F8F7A] transition-colors line-clamp-1">
                      {client.legalName}
                    </h3>
                    <p className="text-xs text-[#52636A] mt-0.5 line-clamp-1">
                      {eng.name}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#52636A] block">Materialitas</span>
                      <span className="font-mono font-bold text-[#102A32]">
                        {formatIdrNumber(eng.materialityIdr || 150000000)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#52636A] block">Standar</span>
                      <span className="font-mono text-[#0F8F7A] font-semibold">
                        {eng.accountingStandard || 'SAK'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#52636A]">Periode {eng.periodStart?.slice(0, 4) || '2026'}</span>
                  <Link
                    href={`/engagements/${eng.id}/overview`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0F8F7A] hover:underline cursor-pointer"
                  >
                    <span>Buka Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
