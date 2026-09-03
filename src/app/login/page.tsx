'use client';

import { repo } from '@/lib/db/repo-v4';
import Link from 'next/link';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, UserCheck, Building, Sparkles } from 'lucide-react';
import { UserRoleV4 } from '@/types/domain-v4';

export default function LoginPage() {
  const firmProfile = repo.getFirmProfile();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRoleV4>('senior');
  const [isLoading, setIsLoading] = useState(false);

  const personas: { role: UserRoleV4; name: string; title: string; desc: string; color: string }[] = [
    {
      role: 'partner',
      name: 'Bambang Hendrawan, CPA',
      title: 'Audit Partner (Signing Engagement Partner)',
      desc: 'Otoritas finalisasi, ekspor resmi XLSX, dan pembukaan perikatan.',
      color: 'border-[#102A32] text-[#102A32]',
    },
    {
      role: 'manager',
      name: 'Siti Rahmawati, CA',
      title: 'Engagement Manager',
      desc: 'Review hasil kerja, persetujuan massal, dan manajemen memori pemetaan.',
      color: 'border-[#0F8F7A] text-[#0F8F7A]',
    },
    {
      role: 'senior',
      name: 'Ahmad Pratama, S.Ak',
      title: 'Senior In-Charge (Field Senior)',
      desc: 'Eksekusi impor dataset, override pemetaan, dan kalkulasi kertas kerja.',
      color: 'border-[#0F8F7A] text-[#0F8F7A]',
    },
    {
      role: 'preparer',
      name: 'Budi Santoso, S.Ak',
      title: 'Preparer (Junior Associate)',
      desc: 'Unggah berkas, verifikasi baris TB, dan dokumentasi catatan kerja.',
      color: 'border-[#52636A] text-[#52636A]',
    },
  ];

  const handleSignIn = (roleToSet: UserRoleV4) => {
    setIsLoading(true);
    localStorage.setItem('finova_v4_role', roleToSet);
    setTimeout(() => {
      router.push('/engagements/ENG-2025-01/overview');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F7F5] via-[#EBEFED] to-[#E8F5F1]/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#102A32] relative overflow-hidden animate-finova-in">
      <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#0F8F7A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#B7791F]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
          FN
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102A32]">
          FINOVA AI <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">v4.0 &bull; Rel 0.1</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#52636A]">
          Sistem Operasi Kertas Kerja Finansial Berstandar Akuntansi Indonesia
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="finova-bezel-outer">
          <div className="finova-bezel-inner p-6 sm:p-8 space-y-6 bg-white">
            <div className="border-b border-[#DDE4E2] pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#102A32]">Pilih Persona Pengguna (Internal KAP)</h3>
                <p className="text-[11px] text-[#52636A] mt-0.5">
                  Tenant: <strong className="text-[#102A32]">{firmProfile?.name || "KAP Haidar & Rekan"}</strong>
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                RBAC Matrix
              </span>
            </div>

            <div className="space-y-3">
              {personas.map((p) => {
                const isSelected = selectedRole === p.role;
                return (
                  <div
                    key={p.role}
                    onClick={() => setSelectedRole(p.role)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0F8F7A] bg-[#E8F5F1]/30 shadow-xs'
                        : 'border-[#DDE4E2] hover:border-[#7A8C93] bg-[#F6F7F5]/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#102A32]">{p.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white border border-[#DDE4E2] text-[#52636A]">
                          {p.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#0F8F7A]">{p.title}</div>
                      <p className="text-[10px] text-[#52636A]">{p.desc}</p>
                    </div>

                    <div className="shrink-0">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedRole(p.role)}
                        className="w-4 h-4 text-[#0F8F7A] focus:ring-[#0F8F7A]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSignIn(selectedRole)}
                className="w-full finova-pill-cta justify-center bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer py-3"
              >
                <span>{isLoading ? 'Memuat Sesi Pengguna...' : `Masuk Sebagai ${selectedRole.toUpperCase()}`}</span>
                <div className="icon-circle">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            </div>
            <div className="pt-2 text-center text-xs text-[#52636A] flex items-center justify-center gap-2">
              <span>Ingin setup KAP baru?</span>
              <Link href="/onboarding" className="text-[#0F8F7A] font-bold underline hover:text-[#0C7564]">
                Onboarding KAP &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
