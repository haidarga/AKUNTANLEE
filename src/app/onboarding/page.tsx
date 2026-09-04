'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  ShieldCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Award,
  Sliders,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { FirmProfile, TeamMemberProfile, UserRoleV4 } from '@/types/domain-v4';
import { completeOnboarding } from '@/lib/onboarding/complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [name, setName] = useState('KAP Haidar & Rekan');
  const [shortName, setShortName] = useState('KAP Haidar');
  const [licenseNumber, setLicenseNumber] = useState('KMK No. 492/KM.1/2024');
  const [managingPartnerName, setManagingPartnerName] = useState('Haidar, CPA, CA');
  const [managingPartnerApNumber, setManagingPartnerApNumber] = useState('AP.0942');
  const [address, setAddress] = useState('Menara Finansial Indonesia Lt. 18, Jl. Jend. Sudirman Kav. 52-53');
  const [city, setCity] = useState('Jakarta Selatan');
  const [email, setEmail] = useState('contact@kaphaidar.co.id');
  const [phone, setPhone] = useState('+62 21 5299 8800');
  const [defaultAccountingStandard, setDefaultAccountingStandard] = useState<'SAK_INDONESIA' | 'SAK_EP' | 'PSAK_IFRS'>('SAK_INDONESIA');
  const [defaultMaterialityIdr, setDefaultMaterialityIdr] = useState(250000000);

  const [teamMembers, setTeamMembers] = useState<TeamMemberProfile[]>([
    {
      id: 'usr-1',
      name: 'Haidar, CPA, CA',
      title: 'Audit Partner (Signing Partner)',
      email: 'haidar@kaphaidar.co.id',
      role: 'partner',
      cpaLicense: 'AP.0942',
    },
    {
      id: 'usr-2',
      name: 'Siti Rahmawati, CA',
      title: 'Engagement Manager',
      email: 'siti.r@kaphaidar.co.id',
      role: 'manager',
      cpaLicense: 'CA.18471',
    },
    {
      id: 'usr-3',
      name: 'Ahmad Pratama, S.Ak',
      title: 'Senior In-Charge (Field Senior)',
      email: 'ahmad.p@kaphaidar.co.id',
      role: 'senior',
    },
    {
      id: 'usr-4',
      name: 'Budi Santoso, S.Ak',
      title: 'Preparer (Junior Associate)',
      email: 'budi.s@kaphaidar.co.id',
      role: 'preparer',
    },
  ]);

  // Load existing profile if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem('finova_firm_profile');
      if (cached) {
        const f: FirmProfile = JSON.parse(cached);
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
          setName(f.name || 'KAP Haidar & Rekan');
          setShortName(f.shortName || 'KAP Haidar');
          setLicenseNumber(f.licenseNumber || 'KMK No. 492/KM.1/2024');
          setManagingPartnerName(f.managingPartnerName || 'Haidar, CPA, CA');
          setManagingPartnerApNumber(f.managingPartnerApNumber || 'AP.0942');
          setAddress(f.address || '');
          setCity(f.city || 'Jakarta');
          setEmail(f.email || '');
          setPhone(f.phone || '');
          if (f.defaultAccountingStandard) setDefaultAccountingStandard(f.defaultAccountingStandard);
          if (f.defaultMaterialityIdr) setDefaultMaterialityIdr(f.defaultMaterialityIdr);
          if (f.teamMembers && f.teamMembers.length > 0) setTeamMembers(f.teamMembers);
        }
      })
      .catch((e) => console.error(e));
  }, []);

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

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
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

      await completeOnboarding(payload, {
        request: fetch,
        persistProfile: (savedProfile) => {
          localStorage.setItem('finova_firm_profile', JSON.stringify(savedProfile));
          document.cookie = "finova_firm_profile=" + encodeURIComponent(JSON.stringify(savedProfile)) + "; path=/; max-age=31536000; SameSite=Lax";
          window.dispatchEvent(new CustomEvent('finova_firm_updated', { detail: savedProfile }));
        },
        navigate: (destination) => router.replace(destination),
      });
    } catch (e: any) {
      alert('Terjadi kesalahan jaringan: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F7F5] via-[#EBEFED] to-[#E8F5F1]/30 text-[#102A32] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#0F8F7A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#B7791F]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Top Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-base shadow-sm">
              FN
            </div>
            <span className="font-extrabold text-lg text-[#102A32] tracking-tight">FINOVA AI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A32] tracking-tight">
            Setup Kantor Akuntan Publik (KAP)
          </h1>
          <p className="text-xs sm:text-sm text-[#52636A]">
            Sesuaikan identitas kantor, tim penandatangan resmi, dan preferensi standar audit Anda.
          </p>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="bg-white rounded-2xl border border-[#DDE4E2] p-4 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div
              onClick={() => setStep(1)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                step === 1
                  ? 'bg-[#0F8F7A] text-white font-bold shadow-xs'
                  : step > 1
                  ? 'bg-[#E8F5F1] text-[#0F8F7A] font-semibold'
                  : 'text-[#52636A]'
              }`}
            >
              <span>1. Identitas KAP</span>
            </div>

            <div
              onClick={() => setStep(2)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                step === 2
                  ? 'bg-[#0F8F7A] text-white font-bold shadow-xs'
                  : step > 2
                  ? 'bg-[#E8F5F1] text-[#0F8F7A] font-semibold'
                  : 'text-[#52636A]'
              }`}
            >
              <span>2. Tim & Penandatangan</span>
            </div>

            <div
              onClick={() => setStep(3)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                step === 3
                  ? 'bg-[#0F8F7A] text-white font-bold shadow-xs'
                  : step > 3
                  ? 'bg-[#E8F5F1] text-[#0F8F7A] font-semibold'
                  : 'text-[#52636A]'
              }`}
            >
              <span>3. Standar Audit</span>
            </div>

            <div
              onClick={() => setStep(4)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                step === 4
                  ? 'bg-[#0F8F7A] text-white font-bold shadow-xs'
                  : 'text-[#52636A]'
              }`}
            >
              <span>4. Konfirmasi</span>
            </div>
          </div>
        </div>

        {/* Form Container (Double-Bezel) */}
        <div className="finova-bezel-outer shadow-xl">
          <div className="finova-bezel-inner bg-white p-6 sm:p-8 space-y-6">
            {/* STEP 1: IDENTITAS KAP */}
            {step === 1 && (
              <div className="space-y-5 animate-finova-in">
                <div className="border-b border-[#DDE4E2] pb-3">
                  <h3 className="text-base font-bold text-[#102A32] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#0F8F7A]" />
                    Profil & Izin Kantor Akuntan Publik
                  </h3>
                  <p className="text-xs text-[#52636A]">
                    Informasi ini akan tercantum di seluruh lembar kerja atestasi dan manifest resmi XLSX.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">
                      Nama Resmi Kantor Akuntan Publik (KAP) *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: KAP Haidar, Pratama & Rekan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs font-semibold text-[#102A32] bg-[#F6F7F5]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#102A32] mb-1">
                        Nama Singkat / Brand KAP
                      </label>
                      <input
                        type="text"
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value)}
                        placeholder="Contoh: KAP Haidar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#102A32] mb-1">
                        Nomor Izin Usaha KAP (KMK) *
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="Contoh: KMK No. 492/KM.1/2024"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs font-mono text-[#102A32] bg-[#F6F7F5]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#102A32] mb-1">
                        Kota Domisili Kantor
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Jakarta Selatan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#102A32] mb-1">
                        Email Resmi KAP
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="audit@kaphaidar.co.id"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">
                      Alamat Lengkap Kantor
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Gedung, lantai, dan jalan..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] bg-[#F6F7F5]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#DDE4E2]">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Lanjut: Tim & Penandatangan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TIM & PENANDATANGAN */}
            {step === 2 && (
              <div className="space-y-5 animate-finova-in">
                <div className="border-b border-[#DDE4E2] pb-3">
                  <h3 className="text-base font-bold text-[#102A32] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0F8F7A]" />
                    Managing Partner & Tim Auditor
                  </h3>
                  <p className="text-xs text-[#52636A]">
                    Tentukan Partner penandatangan atestasi resmi dan auditor yang memiliki akses ke perikatan.
                  </p>
                </div>

                {/* Managing Partner Highlight */}
                <div className="p-4 rounded-2xl bg-[#E8F5F1] border border-[#B2DFD6] space-y-3">
                  <span className="font-bold text-xs text-[#0F8F7A] block uppercase tracking-wider">
                    Signing Engagement Partner (Partner Penandatangan)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#102A32] mb-1">Nama Partner *</label>
                      <input
                        type="text"
                        value={managingPartnerName}
                        onChange={(e) => setManagingPartnerName(e.target.value)}
                        placeholder="Contoh: Haidar, CPA, CA"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#B2DFD6] font-bold text-xs text-[#102A32]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#102A32] mb-1">Nomor Izin Akuntan Publik (AP) *</label>
                      <input
                        type="text"
                        value={managingPartnerApNumber}
                        onChange={(e) => setManagingPartnerApNumber(e.target.value)}
                        placeholder="Contoh: AP.0942"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#B2DFD6] font-mono text-xs text-[#102A32]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#102A32]">Daftar Anggota Tim & Peran RBAC</span>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1 bg-[#E8F5F1] hover:bg-[#D3EEE7] text-[#0F8F7A] border border-[#B2DFD6] rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah Auditor
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl border border-[#DDE4E2] bg-[#F6F7F5] grid grid-cols-12 gap-2 items-center text-xs"
                      >
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                            placeholder="Nama Lengkap"
                            className="w-full px-2.5 py-1.5 rounded bg-white border border-[#DDE4E2] font-semibold text-xs text-[#102A32]"
                          />
                        </div>

                        <div className="col-span-4">
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleUpdateMember(member.id, 'email', e.target.value)}
                            placeholder="email@kap.co.id"
                            className="w-full px-2.5 py-1.5 rounded bg-white border border-[#DDE4E2] text-xs text-[#52636A]"
                          />
                        </div>

                        <div className="col-span-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value as UserRoleV4)}
                            className="w-full px-2 py-1.5 rounded bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32]"
                          >
                            <option value="partner">Partner</option>
                            <option value="manager">Manager</option>
                            <option value="senior">Senior In-Charge</option>
                            <option value="preparer">Preparer (Junior)</option>
                          </select>
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-[#7A8C93] hover:text-[#C83E4D] p-1 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#DDE4E2]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-[#DDE4E2] text-[#52636A] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Lanjut: Standar Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: STANDAR AUDIT & MATERIALITAS */}
            {step === 3 && (
              <div className="space-y-5 animate-finova-in">
                <div className="border-b border-[#DDE4E2] pb-3">
                  <h3 className="text-base font-bold text-[#102A32] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#0F8F7A]" />
                    Standar Akuntansi & Batas Materialitas
                  </h3>
                  <p className="text-xs text-[#52636A]">
                    Pengaturan bawaan untuk pembentukan Lead Schedule dan deteksi akun penampungan suspensi.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">
                      Standar Akuntansi Rujukan Default *
                    </label>
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
                        <span className="text-[11px] text-[#52636A]">Untuk entitas dengan akuntabilitas publik signifikan.</span>
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
                        <span className="text-[11px] text-[#52636A]">Pengganti SAK ETAP untuk korporasi menengah/privat.</span>
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
                        <span className="text-[11px] text-[#52636A]">Untuk emiten tercatat di Bursa Efek Indonesia (IDX).</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#102A32] mb-1">
                      Ambang Batas Materialitas Awal (Overall Materiality)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#52636A]">Rp</span>
                      <input
                        type="number"
                        value={defaultMaterialityIdr}
                        onChange={(e) => setDefaultMaterialityIdr(Number(e.target.value))}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs font-mono font-bold text-[#102A32] bg-[#F6F7F5]"
                      />
                    </div>
                    <p className="text-[11px] text-[#52636A] mt-1">
                      Akun yang bersaldo di atas nilai ini akan otomatis ditandai sebagai <strong>Material</strong> dan diwajibkan penelaahan mendalam.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#DDE4E2]">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-[#DDE4E2] text-[#52636A] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-5 py-2.5 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Lanjut: Konfirmasi & Peluncuran</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: KONFIRMASI */}
            {step === 4 && (
              <div className="space-y-5 animate-finova-in">
                <div className="border-b border-[#DDE4E2] pb-3">
                  <h3 className="text-base font-bold text-[#102A32] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" />
                    Konfirmasi Profil & Siap Digunakan
                  </h3>
                  <p className="text-xs text-[#52636A]">
                    Tinjau ringkasan konfigurasi sebelum diterapkan ke seluruh perikatan audit Anda.
                  </p>
                </div>

                {/* Digital Certificate Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#102A32] to-[#0C333D] text-white space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-300" />
                      <span className="font-bold text-sm tracking-tight">{name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-white/60 block">Nomor Izin Usaha KMK:</span>
                      <strong className="font-mono text-emerald-200">{licenseNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">Managing Partner:</span>
                      <strong className="text-white">{managingPartnerName} ({managingPartnerApNumber})</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">Domisili:</span>
                      <span className="text-white/90">{city}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">Standar Default:</span>
                      <span className="text-white/90">{defaultAccountingStandard}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
                    <span>Jumlah Auditor Terdaftar: {teamMembers.length} personil</span>
                    <span>Materialitas: Rp {defaultMaterialityIdr.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#DDE4E2]">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-[#DDE4E2] text-[#52636A] font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Menerapkan Profil...</span>
                    ) : (
                      <>
                        <span>Terapkan Profil & Masuk ke Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
