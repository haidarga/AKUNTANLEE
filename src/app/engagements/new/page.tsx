'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, ArrowLeft, ArrowRight, ShieldCheck, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';

export default function NewEngagementPage() {
  const router = useRouter();
  const state = repo.getState();

  const [clientId, setClientId] = useState(state.clients[0]?.id || 'CLI-001');
  const [clients, setClients] = useState(state.clients);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCode, setNewClientCode] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('Manufaktur & Fabrikasi');
  const [newClientSuccessMsg, setNewClientSuccessMsg] = useState<string | null>(null);

  const handleCreateNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientCode) return;

    const created = repo.createClient({
      legalName: newClientName,
      code: newClientCode.toUpperCase(),
      industry: newClientIndustry,
    });

    setClients([...repo.getState().clients]);
    setClientId(created.id);
    setShowNewClientModal(false);
    setNewClientName('');
    setNewClientCode('');
    setNewClientSuccessMsg(`Entitas "${created.legalName}" berhasil didaftarkan dan otomatis terpilih!`);
    setTimeout(() => setNewClientSuccessMsg(null), 4000);
  };
  const [name, setName] = useState('Financial Review & Lead Schedule FY 2026');
  const [periodStart, setPeriodStart] = useState('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-31');
  const [materialityIdr, setMaterialityIdr] = useState('250000000');
  const [leadPartnerId, setLeadPartnerId] = useState('USR-PARTNER-01');
  const [managerId, setManagerId] = useState('USR-MANAGER-01');
  const [seniorId, setSeniorId] = useState('USR-SENIOR-01');
  const [preparerId, setPreparerId] = useState('USR-PREPARER-01');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const user = state.users.find((u) => u.role === 'partner') || state.users[0];

    const newEng = repo.createEngagement(
      {
        tenantId: user.tenantId,
        clientId,
        name,
        periodStart,
        periodEnd,
        currency: 'IDR',
        materialityIdr: parseInt(materialityIdr, 10) || 250_000_000,
        status: 'preparing',
        leadPartnerId,
        managerId,
        seniorId,
        preparerId,
      },
      user
    );

    setTimeout(() => {
      router.push(`/engagements/${newEng.id}/overview`);
    }, 300);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-[#102A32] animate-finova-in">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[#52636A] hover:text-[#102A32] font-semibold mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Perikatan
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#102A32]">
          Buka Perikatan Kerja Baru (New Engagement)
        </h1>
        <p className="text-xs text-[#52636A] mt-1">
          Definisikan entitas klien, periode pelaporan buku, ambang batas materialitas, dan tim penanggung jawab.
        </p>
      </div>

      <div className="finova-bezel-outer">
        <form onSubmit={handleSubmit} className="finova-bezel-inner p-6 sm:p-8 space-y-6 text-xs bg-white">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-[#102A32]">Pilih Klien Terdaftar:</label>
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="text-xs font-bold text-[#0F8F7A] hover:text-[#0C7564] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>+ Daftarkan Klien Baru</span>
              </button>
            </div>

            {newClientSuccessMsg && (
              <div className="mb-2 p-2.5 bg-[#E8F5F1] border border-[#B2DFD6] rounded-xl text-xs text-[#0F8F7A] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{newClientSuccessMsg}</span>
              </div>
            )}

            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.legalName} &bull; {c.industry}
                </option>
              ))}
            </select>
          </div>

          {/* Modal Inline Daftarkan Klien Baru */}
          {showNewClientModal && (
            <div className="p-4 bg-[#F8FAFC] border-2 border-[#0F8F7A]/40 rounded-xl space-y-3 animate-finova-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#102A32]">Daftarkan Entitas Klien Baru</span>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="text-xs text-[#52636A] hover:text-[#102A32]"
                >
                  Tutup
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#52636A] mb-1">Nama Legal Klien (PT / CV / Firma):</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Contoh: PT Surya Mandiri Sejahtera"
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-lg bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#52636A] mb-1">Kode Singkat (3-4 Huruf):</label>
                  <input
                    type="text"
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value)}
                    placeholder="Contoh: SMS"
                    maxLength={5}
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-lg bg-white text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#52636A] mb-1">Sektor Industri:</label>
                <select
                  value={newClientIndustry}
                  onChange={(e) => setNewClientIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-lg bg-white text-xs"
                >
                  <option value="Manufaktur & Fabrikasi">Manufaktur & Fabrikasi</option>
                  <option value="Perdagangan & Distribusi">Perdagangan & Distribusi</option>
                  <option value="Jasa & Konsultasi">Jasa & Konsultasi</option>
                  <option value="Transportasi & Logistik">Transportasi & Logistik</option>
                  <option value="Konstruksi & Properti">Konstruksi & Properti</option>
                  <option value="Teknologi & Digital">Teknologi & Digital</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-1.5 border border-[#DDE4E2] rounded-lg text-xs text-[#52636A]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewClient}
                  className="px-3 py-1.5 bg-[#0F8F7A] text-white rounded-lg text-xs font-bold hover:bg-[#0C7564]"
                >
                  Simpan & Pilih Klien
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#102A32] mb-1.5">Judul Perikatan:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
              placeholder="Contoh: Financial Review & Lead Schedule FY 2026"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#102A32] mb-1.5">Awal Periode Buku:</label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#102A32] mb-1.5">Akhir Periode Buku:</label>
              <input
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#102A32] mb-1.5">Mata Uang Pelaporan:</label>
              <input
                type="text"
                disabled
                value="IDR (Rupiah Indonesia) - Single Currency Scope"
                className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5] text-[#52636A] font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#102A32] mb-1.5">Ambang Materialitas (IDR):</label>
              <input
                type="number"
                required
                value={materialityIdr}
                onChange={(e) => setMaterialityIdr(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono"
              />
            </div>
          </div>

          {/* Team Assignments */}
          <div className="border-t border-[#DDE4E2] pt-5 space-y-4">
            <div className="font-bold text-sm text-[#102A32]">Penugasan Tim Kantor (Engagement Team):</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#52636A] block mb-1">Partner Penanggung Jawab:</span>
                <select
                  value={leadPartnerId}
                  onChange={(e) => setLeadPartnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5]"
                >
                  {state.users.filter((u) => u.role === 'partner').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-[#52636A] block mb-1">Engagement Manager:</span>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5]"
                >
                  {state.users.filter((u) => u.role === 'manager').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-[#52636A] block mb-1">Senior Lapangan (In-Charge):</span>
                <select
                  value={seniorId}
                  onChange={(e) => setSeniorId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5]"
                >
                  {state.users.filter((u) => u.role === 'senior').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-[#52636A] block mb-1">Preparer (Associate):</span>
                <select
                  value={preparerId}
                  onChange={(e) => setPreparerId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-[#F6F7F5]"
                >
                  {state.users.filter((u) => u.role === 'preparer').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE4E2]">
            <Link
              href="/"
              className="px-4 py-2.5 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F1F4F3] font-semibold"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer"
            >
              <span>{isSaving ? 'Menyimpan...' : 'Buat Perikatan & Masuk ke Overview'}</span>
              <div className="icon-circle">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
