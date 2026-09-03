'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  Calculator,
  UserCheck,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firmProfile = repo.getFirmProfile();

  const [activeTab, setActiveTab] = useState<'access_key' | 'credentials'>('access_key');
  const [accessKey, setAccessKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const autoAttemptRef = useRef(false);

  // Auto-login if ?key= is in URL
  useEffect(() => {
    const keyFromUrl = searchParams.get('key');
    if (keyFromUrl && !autoAttemptRef.current) {
      autoAttemptRef.current = true;
      setAccessKey(keyFromUrl);
      handleAccessKeyLogin(keyFromUrl);
    }
  }, [searchParams]);

  const handleAccessKeyLogin = async (keyToUse?: string) => {
    const finalKey = (keyToUse || accessKey).trim().toUpperCase();
    if (!finalKey) {
      setErrorMessage('Masukkan Access Key (Contoh: FINOVA-RINA-CFO)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: finalKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Access Key tidak valid.');
        setIsLoading(false);
        return;
      }

      // Store local preferences for A/B testing
      localStorage.setItem('finova_ab_variant', data.variant);
      localStorage.setItem('finova_v4_role', data.user.role);
      localStorage.setItem('finova_user_name', data.user.name);

      const redirectPath = searchParams.get('redirect') || data.targetPath || '/engagements';
      router.push(redirectPath);
    } catch (e: any) {
      setErrorMessage('Terjadi kendala jaringan saat memverifikasi Access Key.');
      setIsLoading(false);
    }
  };

  const handleCredentialsLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
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
        setErrorMessage(data.error || 'Autentikasi gagal.');
        setIsLoading(false);
        return;
      }

      if (data.user?.role) {
        localStorage.setItem('finova_v4_role', data.user.role);
        localStorage.setItem('finova_user_name', data.user.name);
      }

      const redirectPath = searchParams.get('redirect') || '/engagements/ENG-2026-01/overview';
      router.push(redirectPath);
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan jaringan saat autentikasi.');
      setIsLoading(false);
    }
  };

  const vipKeys = [
    {
      key: 'FINOVA-RINA-CFO',
      label: 'Ibu Rina Asmara, Ak.',
      desc: 'Mode Strategic Advisory & CFO (Advisory Hub, What-If UMR +8%, COGM Manufaktur)',
      theme: 'purple',
      badge: 'Varian B (Tante Rina)',
      icon: Sparkles,
    },
    {
      key: 'FINOVA-BUNDA-TAX',
      label: 'Bunda',
      desc: 'Mode Kepatuhan Pajak & Audit Operasional (PPh 21 TER, Smart Payroll Importer, PPN 1111)',
      theme: 'teal',
      badge: 'Varian A (Bunda)',
      icon: Calculator,
    },
    {
      key: 'FINOVA-MASTER-2026',
      label: 'Haidar, CPA, CA',
      desc: 'Mode Managing Partner (Semua Modul Terbuka + Header Switcher A/B Realtime)',
      theme: 'blue',
      badge: 'Master Partner',
      icon: UserCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F7F5] via-[#EBEFED] to-[#E8F5F1]/40 flex flex-col justify-center py-10 sm:px-6 lg:px-8 text-[#102A32] relative overflow-hidden animate-finova-in">
      <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#0F8F7A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#805AD5]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2.5 relative z-10 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
          FN
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102A32]">
          FINOVA AI Enterprise Portal
        </h1>
        <p className="text-xs text-[#52636A]">
          Gerbang Evaluasi A/B Testing &bull; Kantor Akuntan Publik Resmi
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="finova-bezel-outer">
          <div className="finova-bezel-inner p-5 sm:p-6 space-y-4 bg-white">
            <div className="border-b border-[#DDE4E2] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#102A32]">Akses Masuk Sistem</h3>
                <p className="text-[11px] text-[#52636A] mt-0.5">
                  Tenant: <strong className="text-[#102A32]">{firmProfile?.name || 'KAP Haidar & Rekan'}</strong>
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Ready
              </span>
            </div>

            {/* Switch Tabs between Access Key and Traditional Login */}
            <div className="flex rounded-xl bg-[#F6F7F5] p-1 border border-[#DDE4E2] text-xs">
              <button
                type="button"
                onClick={() => { setActiveTab('access_key'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'access_key'
                    ? 'bg-white text-[#0F8F7A] shadow-xs'
                    : 'text-[#52636A] hover:text-[#102A32]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>VIP Access Key</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('credentials'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'credentials'
                    ? 'bg-white text-[#0F8F7A] shadow-xs'
                    : 'text-[#52636A] hover:text-[#102A32]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Email & Password</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FCDAD7] text-xs text-[#C83E4D] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: VIP ACCESS KEY (RECOMMENDED FOR TANTE RINA & BUNDA) */}
            {activeTab === 'access_key' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#102A32] block flex items-center justify-between">
                    <span>Masukkan Access Key</span>
                    <span className="text-[10px] text-[#0F8F7A] font-semibold">1-Click Direct Unlock</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAccessKeyLogin(); }}
                      placeholder="FINOVA-RINA-CFO / FINOVA-BUNDA-TAX"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs font-mono font-bold text-[#102A32] uppercase focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAccessKeyLogin()}
                  disabled={isLoading}
                  className="w-full finova-pill-cta justify-center bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer py-2.5"
                >
                  <span>{isLoading ? 'Mengaktifkan Sesi Persona...' : 'Buka Sistem dengan Access Key'}</span>
                  <div className="icon-circle">
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </button>

                {/* 1-Click Preset Access Keys */}
                <div className="pt-2 border-t border-[#DDE4E2] space-y-2">
                  <span className="text-[10.5px] font-bold text-[#52636A] uppercase tracking-wider block">
                    Pilih Access Key Pengujian (1-Click Masuk):
                  </span>

                  <div className="space-y-2">
                    {vipKeys.map((k) => {
                      const Icon = k.icon;
                      const isPurple = k.theme === 'purple';
                      return (
                        <button
                          key={k.key}
                          type="button"
                          onClick={() => {
                            setAccessKey(k.key);
                            handleAccessKeyLogin(k.key);
                          }}
                          disabled={isLoading}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isPurple
                              ? 'border-[#805AD5]/40 bg-[#805AD5]/5 hover:bg-[#805AD5]/10 hover:border-[#805AD5]'
                              : 'border-[#0F8F7A]/40 bg-[#0F8F7A]/5 hover:bg-[#0F8F7A]/10 hover:border-[#0F8F7A]'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isPurple ? 'bg-[#805AD5] text-white' : 'bg-[#0F8F7A] text-white'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-[#102A32]">{k.label}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isPurple ? 'bg-[#805AD5]/20 text-[#553C9A]' : 'bg-[#0F8F7A]/20 text-[#0F8F7A]'
                              }`}>
                                {k.badge}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-[#52636A] leading-snug mt-0.5">{k.desc}</p>
                            <span className="font-mono text-[9.5px] font-bold text-[#7A8C93] mt-1 block">
                              Key: {k.key}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL & PASSWORD (STANDARD ENTERPRISE) */}
            {activeTab === 'credentials' && (
              <form onSubmit={(e) => handleCredentialsLogin(e)} className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#102A32] block">Email Auditor</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="haidar@kaphaidar.co.id"
                      className="w-full pl-9 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs font-medium text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#102A32]">Kata Sandi</label>
                    <span className="text-[10px] text-[#7A8C93]">Bcrypt Salt-10</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs font-medium text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
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
                  className="w-full finova-pill-cta justify-center bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer py-2.5"
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
            )}

            <div className="pt-2 text-center text-xs text-[#52636A] flex items-center justify-center gap-2">
              <span>Ingin kembali ke beranda?</span>
              <Link href="/" className="text-[#0F8F7A] font-bold underline hover:text-[#0C7564]">
                Landing Page &rarr;
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
