'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Users,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Award,
  Sliders,
} from 'lucide-react';
import { FirmProfile, TeamMemberProfile, UserRoleV4 } from '@/types/domain-v4';
import { repo } from '@/lib/db/repo-v4';

export default function SettingsPage() {
  const initialFirm = repo.getState().firmProfile;
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'standards'>('profile');
  const [profile, setProfile] = useState<FirmProfile | null>(initialFirm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields initialized with canonical firm profile
  const [name, setName] = useState(initialFirm?.name || 'KAP Haidar & Rekan');
  const [shortName, setShortName] = useState(initialFirm?.shortName || 'KAP Haidar');
  const [licenseNumber, setLicenseNumber] = useState(initialFirm?.licenseNumber || 'KMK No. 492/KM.1/2024');
  const [managingPartnerName, setManagingPartnerName] = useState(initialFirm?.managingPartnerName || 'Haidar, CPA, CA');
  const [managingPartnerApNumber, setManagingPartnerApNumber] = useState(initialFirm?.managingPartnerApNumber || 'AP.0942');
  const [address, setAddress] = useState(initialFirm?.address || 'Menara Finansial Indonesia Lt. 18, Jl. Jend. Sudirman Kav. 52-53');
  const [city, setCity] = useState(initialFirm?.city || 'Jakarta Selatan');
  const [email, setEmail] = useState(initialFirm?.email || 'contact@kaphaidar.co.id');
  const [phone, setPhone] = useState(initialFirm?.phone || '+62 21 5299 8800');
  const [defaultAccountingStandard, setDefaultAccountingStandard] = useState<'SAK_INDONESIA' | 'SAK_EP' | 'PSAK_IFRS'>(initialFirm?.defaultAccountingStandard || 'SAK_INDONESIA');
  const [defaultMaterialityIdr, setDefaultMaterialityIdr] = useState(initialFirm?.defaultMaterialityIdr || 250000000);
  const [teamMembers, setTeamMembers] = useState<TeamMemberProfile[]>(initialFirm?.teamMembers || []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('finova_firm_profile');
      if (cached) {
        const f = JSON.parse(cached);
        if (f.name) setName(f.name);
        if (f.shortName) setShortName(f.shortName);
        if (f.licenseNumber) setLicenseNumber(f.licenseNumber);
        if (f.managingPartnerName) setManagingPartnerName(f.managingPartnerName);
        if (f.managingPartnerApNumber) setManagingPartnerApNumber(f.managingPartnerApNumber);
        if (f.address) setAddress(f.address);
        if (f.city) setCity(f.city);
        if (f.email) setEmail(f.email);
        if (f.phone) setPhone(f.phone);
        if (f.defaultAccountingStandard) setDefaultAccountingStandard(f.defaultAccountingStandard);
        if (f.defaultMaterialityIdr) setDefaultMaterialityIdr(f.defaultMaterialityIdr);
        if (f.teamMembers && f.teamMembers.length > 0) setTeamMembers(f.teamMembers);
      }
    } catch (e) {}

    fetch('/api/v1/firm')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const f: FirmProfile = data.data;
          setProfile(f);
          setName(f.name || '');
          setShortName(f.shortName || '');
          setLicenseNumber(f.licenseNumber || '');
          setManagingPartnerName(f.managingPartnerName || '');
          setManagingPartnerApNumber(f.managingPartnerApNumber || '');
          setAddress(f.address || '');
          setCity(f.city || '');
          setEmail(f.email || '');
          setPhone(f.phone || '');
          if (f.defaultAccountingStandard) setDefaultAccountingStandard(f.defaultAccountingStandard);
          if (f.defaultMaterialityIdr) setDefaultMaterialityIdr(f.defaultMaterialityIdr);
          if (f.teamMembers) setTeamMembers(f.teamMembers);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddMember = () => {
    const newM: TeamMemberProfile = {
      id: `usr-${Date.now()}`,
      name: 'Auditor Baru',
      title: 'Associate Auditor',
      email: `auditor${teamMembers.length + 1}@${email.split('@')[1] || 'kap.co.id'}`,
      role: 'preparer',
    };
    setTeamMembers([...teamMembers, newM]);
  };

  const handleUpdateMember = (id: string, field: keyof TeamMemberProfile, value: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveMember = (id: string) => {
    if (teamMembers.length <= 1) return;
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<FirmProfile> = {
        name,
        shortName,
        licenseNumber,
        managingPartnerName,
        managingPartnerApNumber,
        address,
        city,
        email,
        phone,
        defaultAccountingStandard,
        defaultMaterialityIdr,
        teamMembers,
      };

      const res = await fetch('/api/v1/firm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const savedProfile = data.data || payload;
        try {
          localStorage.setItem('finova_firm_profile', JSON.stringify(savedProfile));
          document.cookie = "finova_firm_profile=" + encodeURIComponent(JSON.stringify(savedProfile)) + "; path=/; max-age=31536000; SameSite=Lax";
          window.dispatchEvent(new CustomEvent('finova_firm_updated', { detail: savedProfile }));
          repo.updateFirmProfile(savedProfile);
        } catch (e) {}
        showToast('Profil KAP dan tim berhasil disimpan.');
      } else {
        alert(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (e: any) {
      alert('Terjadi kesalahan: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6 animate-finova-in max-w-5xl mx-auto">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 p-3.5 rounded-xl bg-[#102A32] text-white shadow-xl flex items-center gap-2 text-xs font-semibold animate-finova-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/engagements"
                className="p-1.5 rounded-lg border border-[#DDE4E2] text-[#52636A] hover:text-[#102A32] hover:bg-[#F6F7F5] transition-colors"
                title="Kembali ke Direktori"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A32]">
                Pengaturan Kantor Akuntan Publik (KAP)
              </h1>
            </div>
            <p className="text-xs text-[#52636A] pl-8">
              Kelola legalitas kantor, tim auditor internal, dan standar atestasi default yang digunakan di seluruh kertas kerja.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-[#DDE4E2] flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#0F8F7A] text-[#0F8F7A]'
                : 'border-transparent text-[#52636A] hover:text-[#102A32]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Profil & Legalitas</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'team'
                ? 'border-[#0F8F7A] text-[#0F8F7A]'
                : 'border-transparent text-[#52636A] hover:text-[#102A32]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen Tim ({teamMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'standards'
                ? 'border-[#0F8F7A] text-[#0F8F7A]'
                : 'border-transparent text-[#52636A] hover:text-[#102A32]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferensi Standar</span>
          </button>
        </div>

        {/* Tab 1: Profil */}
        {activeTab === 'profile' && (
          <div className="finova-bezel-outer">
            <div className="finova-bezel-inner p-6 space-y-5 bg-white text-xs">
              <div className="border-b border-[#DDE4E2] pb-3">
                <h3 className="font-bold text-sm text-[#102A32]">Identitas Resmi Kantor Akuntan Publik</h3>
                <p className="text-[#52636A]">Nama dan izin usaha ini akan tercantum di Sheet 2 Manifest ekspor resmi XLSX.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-[#102A32] mb-1">Nama Resmi KAP *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none font-semibold text-xs text-[#102A32] bg-[#F6F7F5]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">Nama Singkat / Brand</label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">Nomor Izin Usaha KAP (KMK) *</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none font-mono text-xs text-[#102A32] bg-[#F6F7F5]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] space-y-3">
                  <span className="font-bold text-xs text-[#0F8F7A] block uppercase tracking-wider">
                    Managing Partner (Signing Partner)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#102A32] mb-1">Nama Partner *</label>
                      <input
                        type="text"
                        value={managingPartnerName}
                        onChange={(e) => setManagingPartnerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#B2DFD6] font-bold text-xs text-[#102A32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#102A32] mb-1">Nomor Izin Akuntan Publik (AP) *</label>
                      <input
                        type="text"
                        value={managingPartnerApNumber}
                        onChange={(e) => setManagingPartnerApNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#B2DFD6] font-mono text-xs text-[#102A32]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">Kota Domisili</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">Email Kantor</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#102A32] mb-1">Alamat Kantor</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tim */}
        {activeTab === 'team' && (
          <div className="finova-bezel-outer">
            <div className="finova-bezel-inner p-6 space-y-5 bg-white text-xs">
              <div className="flex items-center justify-between border-b border-[#DDE4E2] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#102A32]">Daftar Auditor Internal KAP</h3>
                  <p className="text-[#52636A]">Auditor yang terdaftar memiliki akses ke perikatan audit sesuai matriks RBAC.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-3 py-1.5 bg-[#E8F5F1] hover:bg-[#D3EEE7] text-[#0F8F7A] border border-[#B2DFD6] rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Anggota
                </button>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl border border-[#DDE4E2] bg-[#F6F7F5] grid grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="col-span-4">
                      <label className="block text-[10px] text-[#52636A] font-semibold mb-0.5">Nama Auditor</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DDE4E2] font-bold text-xs text-[#102A32]"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-[10px] text-[#52636A] font-semibold mb-0.5">Email Akun</label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleUpdateMember(member.id, 'email', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DDE4E2] text-xs text-[#52636A]"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-[10px] text-[#52636A] font-semibold mb-0.5">Peran (Role RBAC)</label>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value as UserRoleV4)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32]"
                      >
                        <option value="partner">Partner (Signing)</option>
                        <option value="manager">Manager (Reviewer)</option>
                        <option value="senior">Senior In-Charge</option>
                        <option value="preparer">Preparer (Associate)</option>
                      </select>
                    </div>

                    <div className="col-span-1 text-right pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded-lg text-[#7A8C93] hover:text-[#C83E4D] hover:bg-white transition-colors cursor-pointer"
                        title="Hapus Auditor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Standar */}
        {activeTab === 'standards' && (
          <div className="finova-bezel-outer">
            <div className="finova-bezel-inner p-6 space-y-5 bg-white text-xs">
              <div className="border-b border-[#DDE4E2] pb-3">
                <h3 className="font-bold text-sm text-[#102A32]">Standar Akuntansi & Batas Materialitas</h3>
                <p className="text-[#52636A]">Parameter dasar yang digunakan sistem untuk mengevaluasi pemetaan akun dan anomali neraca.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-[#102A32] mb-1">Standar Akuntansi Keuangan Rujukan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div
                      onClick={() => setDefaultAccountingStandard('SAK_INDONESIA')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        defaultAccountingStandard === 'SAK_INDONESIA'
                          ? 'border-[#0F8F7A] bg-[#E8F5F1]/50 shadow-xs'
                          : 'border-[#DDE4E2] bg-[#F6F7F5]'
                      }`}
                    >
                      <strong className="block text-xs text-[#102A32]">SAK Indonesia (PSAK)</strong>
                      <span className="text-[11px] text-[#52636A]">Standar penuh untuk korporasi umum dan entitas publik.</span>
                    </div>

                    <div
                      onClick={() => setDefaultAccountingStandard('SAK_EP')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        defaultAccountingStandard === 'SAK_EP'
                          ? 'border-[#0F8F7A] bg-[#E8F5F1]/50 shadow-xs'
                          : 'border-[#DDE4E2] bg-[#F6F7F5]'
                      }`}
                    >
                      <strong className="block text-xs text-[#102A32]">SAK Entitas Privat (SAK EP)</strong>
                      <span className="text-[11px] text-[#52636A]">Berlaku efektif 1 Januari 2025 menggantikan SAK ETAP.</span>
                    </div>

                    <div
                      onClick={() => setDefaultAccountingStandard('PSAK_IFRS')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        defaultAccountingStandard === 'PSAK_IFRS'
                          ? 'border-[#0F8F7A] bg-[#E8F5F1]/50 shadow-xs'
                          : 'border-[#DDE4E2] bg-[#F6F7F5]'
                      }`}
                    >
                      <strong className="block text-xs text-[#102A32]">Full IFRS Convergence</strong>
                      <span className="text-[11px] text-[#52636A]">Untuk emiten multinasional dan terdaftar bursa.</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#102A32] mb-1">Ambang Batas Materialitas Awal (Overall Materiality)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#52636A]">Rp</span>
                    <input
                      type="number"
                      value={defaultMaterialityIdr}
                      onChange={(e) => setDefaultMaterialityIdr(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs font-mono font-bold text-[#102A32] bg-[#F6F7F5]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
