'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Layers,
  Brain,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { ReusableMapping, UserRoleV4 } from '@/types/domain-v4';

export default function AdminMappingMemoryPage() {
  const state = repo.getState();
  const [reusableList, setReusableList] = useState<ReusableMapping[]>(state.reusableMappings);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState<UserRoleV4>('manager');

  useEffect(() => {
    const saved = localStorage.getItem('finova_v4_role');
    if (saved && ['preparer', 'senior', 'manager', 'partner'].includes(saved)) {
      setActiveRole(saved as UserRoleV4);
    }
  }, []);

  // RBAC check per PRD Section 38.1 (Admin visible only for manager & partner)
  const isAuthorized = activeRole === 'manager' || activeRole === 'partner';

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FDECEF] text-[#C83E4D] flex items-center justify-center mx-auto border border-[#F8B4BD]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-[#102A32]">Akses Terbatas (403 Forbidden)</h1>
        <p className="text-xs text-[#52636A] leading-relaxed">
          Halaman Memori Pemetaan Kantor hanya dapat diakses oleh peran <strong className="text-[#102A32]">Manager</strong> atau <strong className="text-[#102A32]">Partner</strong>. Silakan ubah persona pengguna di navigasi atas jika ingin meninjau memori pemetaan.
        </p>
        <Link
          href="/"
          className="finova-pill-cta bg-[#102A32] text-white text-xs shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Perikatan</span>
        </Link>
      </div>
    );
  }

  const handleRevoke = (id: string) => {
    const item = reusableList.find((r) => r.id === id);
    if (item) {
      item.status = 'revoked';
      setReusableList([...reusableList]);
    }
  };

  const filtered = reusableList.filter(
    (r) =>
      r.sourceAccountPattern.toLowerCase().includes(search.toLowerCase()) ||
      r.targetSection.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#102A32] animate-finova-in">
      {/* Hero Visual Banner */}
      <div className="finova-bezel-outer">
        <div className="finova-bezel-inner p-6 bg-gradient-to-br from-white via-[#F6F7F5] to-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] text-xs font-semibold border border-[#B2DFD6]">
              <Database className="w-3.5 h-3.5" />
              <span>Memori Intelijen Kantor &bull; KAP Tanudiredja</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A32]">
              Penyimpanan Memori Pemetaan Akun (Mapping Memory)
            </h1>
            <p className="text-xs text-[#52636A] leading-relaxed">
              Koleksi pola pemetaan akun yang telah disetujui sebelumnya oleh Partner/Manager untuk digunakan kembali secara otomatis lintas perikatan klien di bawah naungan kantor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-white rounded-xl border border-[#DDE4E2] text-right shadow-2xs">
              <span className="text-[10px] text-[#52636A] block">Aturan Aktif</span>
              <span className="font-mono font-bold text-lg text-[#0F8F7A]">
                {reusableList.filter((r) => r.status === 'active').length} Pola
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#DDE4E2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs text-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari pola akun atau target baris..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#DDE4E2] rounded-xl text-xs bg-[#F6F7F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
          />
        </div>
        <span className="text-[#52636A] text-[11px] font-mono">
          Menampilkan {filtered.length} Aturan Baku
        </span>
      </div>

      {/* Reusable Memory Table */}
      <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F7F5] border-b border-[#DDE4E2] text-[#52636A] font-semibold text-[11px]">
                <th className="py-3 px-3 border-r border-[#DDE4E2]">ID Pola</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2]">Pola Akun Sumber</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2]">Target Kertas Kerja</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] text-center">Tingkat Keyakinan</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2] text-center">Kali Digunakan</th>
                <th className="py-3 px-3 border-r border-[#DDE4E2]">Disetujui Oleh</th>
                <th className="py-3 px-3 text-center">Status / Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE4E2]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F6F7F5] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#102A32] border-r border-[#DDE4E2]">
                    {item.id}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0F8F7A] border-r border-[#DDE4E2]">
                    {item.sourceAccountPattern}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#102A32] border-r border-[#DDE4E2]">
                    {item.targetSection}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-[#DDE4E2]">
                    <span className="font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-center font-bold text-[#102A32] border-r border-[#DDE4E2]">
                    {item.timesReused}x
                  </td>
                  <td className="py-3 px-3 text-[#52636A] border-r border-[#DDE4E2]">
                    {item.approvedByUserId}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.status === 'active' ? (
                      <button
                        onClick={() => handleRevoke(item.id)}
                        className="px-3 py-1 bg-[#F1F4F3] hover:bg-[#FDECEF] text-[#C83E4D] rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Cabut (Revoke)
                      </button>
                    ) : (
                      <span className="text-[#C83E4D] font-semibold text-[11px]">Dicabut</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
