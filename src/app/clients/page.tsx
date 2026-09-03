'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { formatIdr } from '@/lib/currency';

export default function ClientsPage() {
  const state = db.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Engagement Form State
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState('2025');
  const [newMateriality, setNewMateriality] = useState('250000000');
  const [selectedClient, setSelectedClient] = useState(state.clients[0].id);

  const filteredClients = state.clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.npwp.includes(searchTerm) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Perikatan "${newTitle || 'Audit FY ' + newYear}" berhasil didaftarkan untuk kantor KAP Tanudiredja.`);
    setShowNewModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & New Engagement Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Klien & Keterlibatan (Clients & Engagements)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data master wajib pajak, perikatan audit, kepatuhan perpajakan, dan advisory.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-2 bg-[#0D5C75] hover:bg-[#09475C] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Perikatan Baru
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama klien, nomor NPWP, atau industri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>
        <span className="text-slate-500 text-xs font-medium">
          Ditemukan {filteredClients.length} Klien Terdaftar
        </span>
      </div>

      {/* Clients Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
          const clientEngagements = state.engagements.filter((e) => e.clientId === client.id);

          return (
            <div
              key={client.id}
              className="bg-white rounded border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between text-xs space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase font-mono">
                      {client.legalType}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">{client.name}</h2>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      NPWP: <span className="font-mono font-medium text-slate-700">{client.npwp}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      Aktif
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Sektor Industri:</span>
                    <span className="font-medium text-slate-800">{client.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kontak Keuangan:</span>
                    <span className="font-medium text-slate-800">{client.contactPerson} ({client.contactEmail})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Akhir Tahun Fiskal:</span>
                    <span className="font-medium text-slate-800">Bulan {client.fiscalYearEndMonth} (Desember)</span>
                  </div>
                </div>
              </div>

              {/* Engagements Section */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Perikatan Berjalan:
                </div>
                {clientEngagements.length > 0 ? (
                  clientEngagements.map((eng) => (
                    <div
                      key={eng.id}
                      className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{eng.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Ambang Materialitas: <span className="font-mono font-semibold text-slate-700">{formatIdr(eng.materialityThresholdIdr)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/engagements/${eng.id}`}
                        className="px-2.5 py-1.5 bg-[#0D5C75] hover:bg-[#09475C] text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                      >
                        Buka
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic text-[11px]">Belum ada perikatan aktif.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Engagement Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Buka Perikatan Audit / Advisory Baru</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Pendaftaran perikatan dengan isolasi tenant dan peran penanggung jawab.
              </p>
            </div>

            <form onSubmit={handleCreateEngagement} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Pilih Klien Wajib Pajak:</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-slate-50 focus:bg-white"
                >
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.npwp})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Judul Perikatan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Audit Laporan Keuangan & Tax Advisory FY 2025"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tahun Fiskal:</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Ambang Materialitas (IDR):</label>
                  <input
                    type="number"
                    value={newMateriality}
                    onChange={(e) => setNewMateriality(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Lead Tim Ditugaskan:</div>
                <div>Partner: Bambang Hendrawan, CPA</div>
                <div>Manager: Siti Rahmawati, CPA</div>
                <div>Senior Field: Ahmad Pratama, S.Ak</div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0D5C75] hover:bg-[#09475C] text-white rounded font-semibold"
                >
                  Daftarkan Perikatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
