'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, ArrowLeft, ArrowRight, ShieldCheck, DollarSign, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';

export default function NewEngagementPage() {
  const router = useRouter();
  const state = repo.getState();

  const [mode, setMode] = useState<'new_client' | 'existing_client'>('new_client');
  
  // New Client Fields
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [taxIdNpwp, setTaxIdNpwp] = useState('01.234.567.8-012.000');
  const [industry, setIndustry] = useState('Manufaktur & Fabrikasi');
  
  // Existing Client Field
  const [existingClientId, setExistingClientId] = useState(state.clients[0]?.id || 'CLI-001');

  // Engagement Parameters
  const [engagementName, setEngagementName] = useState('Kertas Kerja Audit & Lead Schedule FY 2026');
  const [periodYear, setPeriodYear] = useState('2026');
  const [periodStart, setPeriodStart] = useState('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-31');
  const [accountingStandard, setAccountingStandard] = useState('SAK_INDONESIA');
  const [materialityIdr, setMaterialityIdr] = useState('250000000');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate client code from client name
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    const words = val.replace(/^(PT|CV|UD|FIRMA)\s+/i, '').trim().split(/\s+/);
    if (words.length > 0 && words[0]) {
      const suggested = words.map((w) => w[0]).join('').substring(0, 4).toUpperCase();
      if (suggested) {
        setClientCode(suggested);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'new_client' && !clientName.trim()) {
      setErrorMsg('Harap masukkan Nama Perusahaan / PT Klien.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        name: engagementName || ('Kertas Kerja Audit FY ' + periodYear),
        periodStart,
        periodEnd,
        materialityIdr: parseFloat(materialityIdr) || 250000000,
        accountingStandard,
        tenantId: 'TENANT-001',
        userRole: 'partner',
      };

      if (mode === 'new_client') {
        payload.clientName = clientName.trim();
        payload.clientCode = (clientCode || 'KLN').toUpperCase();
        payload.industry = industry;
        payload.taxIdNpwp = taxIdNpwp;
      } else {
        payload.clientId = existingClientId;
      }

      const res = await fetch('/api/v1/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Gagal membuat perikatan baru');
      }

      const createdEng = json.data;

      // Also cache to localStorage for instant local reactivity
      if (typeof window !== 'undefined') {
        localStorage.setItem('finova_active_engagement', createdEng.id);
      }

      // Route directly to the files upload zone
      router.push('/engagements/' + createdEng.id + '/files');
    } catch (err: any) {
      console.error('Error creating engagement:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-finova-in">
      <Link
        href="/engagements"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52636A] hover:text-[#102A32] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Direktori Perikatan</span>
      </Link>

      <div className="bg-white rounded-3xl border border-[#DDE4E2] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
            Input Bebas &bull; Siap Pakai Data Sendiri
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A32] mt-2">
            Buat Perikatan Audit & Daftarkan Klien
          </h1>
          <p className="text-xs text-[#52636A] mt-1">
            Masukkan nama PT dan parameter audit Anda sendiri. Anda dapat langsung mengunggah file Trial Balance Excel setelah perikatan dibuat.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FDF2F2] border border-[#F8B4B4] rounded-2xl flex items-center gap-2.5 text-xs text-[#9B1C1C]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E02424]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Client Selection / Creation Mode Toggle */}
          <div className="space-y-3">
            <label className="block font-bold text-sm text-[#102A32]">
              1. Identitas Entitas Klien (Perusahaan yang Diaudit)
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#F6F7F5] rounded-2xl border border-[#DDE4E2]">
              <button
                type="button"
                onClick={() => setMode('new_client')}
                className={
                  'py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ' +
                  (mode === 'new_client'
                    ? 'bg-[#0F8F7A] text-white shadow-xs'
                    : 'text-[#52636A] hover:text-[#102A32]')
                }
              >
                <Building2 className="w-4 h-4" />
                <span>Klien Baru (Ketik Nama PT Sendiri)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('existing_client')}
                className={
                  'py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ' +
                  (mode === 'existing_client'
                    ? 'bg-[#0F8F7A] text-white shadow-xs'
                    : 'text-[#52636A] hover:text-[#102A32]')
                }
              >
                <Briefcase className="w-4 h-4" />
                <span>Pilih Klien Terdaftar ({state.clients.length})</span>
              </button>
            </div>
          </div>

          {mode === 'new_client' ? (
            <div className="p-5 bg-[#FAFCFB] rounded-2xl border border-[#B2DFD6] space-y-4">
              <div>
                <label className="block font-bold text-[#102A32] mb-1.5">
                  Nama Lengkap Perusahaan / PT Klien: <span className="text-[#E02424]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  placeholder="Contoh: PT Sumber Makmur Abadi, PT Sejahtera Sentosa, dsb."
                  className="w-full px-3.5 py-2.5 border border-[#B2DFD6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F8F7A] bg-white text-sm font-semibold text-[#102A32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#52636A] mb-1">
                    Kode / Ticker Klien:
                  </label>
                  <input
                    type="text"
                    required
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: SMA"
                    maxLength={8}
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#52636A] mb-1">
                    NPWP Badan:
                  </label>
                  <input
                    type="text"
                    value={taxIdNpwp}
                    onChange={(e) => setTaxIdNpwp(e.target.value)}
                    placeholder="01.234.567.8-012.000"
                    className="w-full px-3 py-2 border border-[#DDE4E2] rounded-xl bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#52636A] mb-1">
                    Sektor Industri:
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
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
            </div>
          ) : (
            <div className="p-5 bg-[#F6F7F5] rounded-2xl border border-[#DDE4E2] space-y-3">
              <label className="block font-bold text-[#102A32] mb-1">
                Pilih Entitas Klien dari Database:
              </label>
              <select
                value={existingClientId}
                onChange={(e) => setExistingClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl bg-white font-semibold text-[#102A32]"
              >
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.legalName} &bull; {c.industry}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Engagement Parameters */}
          <div className="space-y-4 pt-4 border-t border-[#DDE4E2]">
            <label className="block font-bold text-sm text-[#102A32]">
              2. Detail Kertas Kerja & Parameter Perikatan
            </label>

            <div>
              <label className="block font-semibold text-[#102A32] mb-1.5">Judul Perikatan:</label>
              <input
                type="text"
                required
                value={engagementName}
                onChange={(e) => setEngagementName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] bg-white font-medium"
                placeholder="Contoh: Financial Review & Lead Schedule FY 2026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#102A32] mb-1.5">Tahun Buku:</label>
                <input
                  type="number"
                  required
                  value={periodYear}
                  onChange={(e) => setPeriodYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#102A32] mb-1.5">Awal Periode:</label>
                <input
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#102A32] mb-1.5">Akhir Periode:</label>
                <input
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#102A32] mb-1.5">Standar Akuntansi:</label>
                <select
                  value={accountingStandard}
                  onChange={(e) => setAccountingStandard(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl bg-white font-semibold"
                >
                  <option value="SAK_INDONESIA">SAK Indonesia (PSAK Lengkap)</option>
                  <option value="SAK_EP">SAK EP (Entitas Privat)</option>
                  <option value="SAK_EMKM">SAK EMKM (Mikro, Kecil & Menengah)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#102A32] mb-1.5">Ambang Materialitas (IDR):</label>
                <input
                  type="number"
                  required
                  value={materialityIdr}
                  onChange={(e) => setMaterialityIdr(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8F7A] font-mono bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE4E2]">
            <Link
              href="/engagements"
              className="px-4 py-2.5 border border-[#DDE4E2] rounded-xl text-[#52636A] hover:bg-[#F1F4F3] font-semibold"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Menyimpan Data Klien...' : 'Simpan & Lanjut ke Unggah File Trial Balance'}</span>
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
