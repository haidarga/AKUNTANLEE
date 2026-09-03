'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building,
  UserCheck,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/engagements/ENG-2025-001/overview';

  const [firmProfile, setFirmProfile] = useState(repo.getFirmProfile());
  const [email, setEmail] = useState('haidar@kaphaidar.co.id');
  const [password, setPassword] = useState('Partner123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'Partner',
      name: 'Haidar, CPA, CA',
      email: 'haidar@kaphaidar.co.id',
      pass: 'Partner123!',
      desc: 'Otoritas Finalisasi & Penandatangan Ekspor Resmi',
      badge: 'bg-[#102A32] text-white',
    },
    {
      role: 'Manager',
      name: 'Siti Rahmawati, CA',
      email: 'siti.r@kaphaidar.co.id',
      pass: 'Manager123!',
      desc: 'Review Hasil Kerja & Persetujuan Pemetaan',
      badge: 'bg-[#0F8F7A] text-white',
    },
    {
      role: 'Senior',
      name: 'Ahmad Pratama, S.Ak',
      email: 'ahmad.p@kaphaidar.co.id',
      pass: 'Senior123!',
      desc: 'In-Charge Lapangan & Rekonsiliasi Kertas Kerja',
      badge: 'bg-[#0F8F7A] text-white',
    },
    {
      role: 'Preparer',
      name: 'Budi Santoso, S.Ak',
      email: 'budi.s@kaphaidar.co.id',
      pass: 'Preparer123!',
      desc: 'Junior Associate & Dokumentasi Bukti',
      badge: 'bg-[#52636A] text-white',
    },
  ];

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
        setIsLoading(false);
        return;
      }

      // Also set local role for legacy components
      if (data.user?.role) {
        localStorage.setItem('finova_v4_role', data.user.role);
      }

      router.push(redirectPath);
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan jaringan saat autentikasi.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    handleLogin(undefined, acc.email, acc.pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F7F5] via-[#EBEFED] to-[#E8F5F1]/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#102A32] relative overflow-hidden animate-finova-in">
      <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#0F8F7A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#B7791F]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
          FN
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102A32]">
          FINOVA AI Enterprise Login
        </h1>
        <p className="text-xs text-[#52636A]">
          Autentikasi Terenkripsi &bull; Portal Kantor Akuntan Publik Resmi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="finova-bezel-outer">
          <div className="finova-bezel-inner p-6 sm:p-7 space-y-5 bg-white">
            <div className="border-b border-[#DDE4E2] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#102A32]">Masuk ke Sesi Audit</h3>
                <p className="text-[11px] text-[#52636A] mt-0.5">
                  Tenant: <strong className="text-[#102A32]">{firmProfile?.name || 'KAP Haidar & Rekan'}</strong>
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                ACID Auth
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FCDAD7] text-xs text-[#C83E4D] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#102A32] block">Email Auditor</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@kap.co.id"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs font-medium text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#102A32]">Kata Sandi</label>
                  <span className="text-[10px] text-[#7A8C93]">Terenkripsi Bcrypt</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs font-medium text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8C93] hover:text-[#102A32]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full finova-pill-cta justify-center bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer py-3"
              >
                <span>{isLoading ? 'Memverifikasi Sesi Kredensial...' : 'Masuk ke Workspace Audit'}</span>
                <div className="icon-circle">
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </button>
            </form>

            {/* 1-Click Quick Demo Login Section */}
            <div className="pt-2 border-t border-[#DDE4E2] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#52636A] uppercase tracking-wider">
                  Akses Cepat Pengujian Peran (1-Click Demo)
                </span>
                <span className="text-[10px] text-[#0F8F7A] font-semibold">Bcrypt Verified</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl border border-[#DDE4E2] hover:border-[#0F8F7A] bg-[#F6F7F5]/60 hover:bg-[#E8F5F1]/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#102A32] group-hover:text-[#0F8F7A]">
                        {acc.role}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${acc.badge}`}>
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#52636A] truncate mt-0.5">{acc.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-[#52636A] flex items-center justify-center gap-2">
              <span>Setup profil KAP baru?</span>
              <Link href="/onboarding" className="text-[#0F8F7A] font-bold underline hover:text-[#0C7564]">
                Onboarding Wizard &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F7F5] flex items-center justify-center text-xs text-[#52636A]">Memuat Portal Login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}