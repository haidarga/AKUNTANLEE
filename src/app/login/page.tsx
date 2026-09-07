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
  UserPlus,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { getSupabaseAnon, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firmProfile = repo.getFirmProfile();

  // Standard enterprise default is credentials (Email & Password)
  const [activeTab, setActiveTab] = useState<'credentials' | 'access_key'>('credentials');
  const [accessKey, setAccessKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const autoAttemptRef = useRef(false);

  // Auto-login if ?key= is in URL
  useEffect(() => {
    const keyFromUrl = searchParams.get('key');
    if (keyFromUrl && !autoAttemptRef.current) {
      autoAttemptRef.current = true;
      setActiveTab('access_key');
      setAccessKey(keyFromUrl);
      handleAccessKeyLogin(keyFromUrl);
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setGoogleNotice(null);

    try {
      if (!isSupabaseConfigured()) {
        setErrorMessage('Supabase Auth belum terkonfigurasi.');
        setIsGoogleLoading(false);
        return;
      }

      const client = getSupabaseAnon();
      if (!client) {
        setErrorMessage('Client autentikasi tidak tersedia.');
        setIsGoogleLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/api/v1/auth/callback`;
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        if (
          error.message?.includes('not enabled') ||
          (error as any).code === 'validation_failed'
        ) {
          setGoogleNotice(
            'Google OAuth belum diaktifkan di Dashboard Supabase. Anda dapat langsung masuk dengan Email & Password atau membuat akun baru.'
          );
        } else {
          setErrorMessage(error.message || 'Gagal memulai autentikasi Google.');
        }
        setIsGoogleLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan saat menghubungkan ke akun Google.');
      setIsGoogleLoading(false);
    }
  };

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
        if (res.status === 404) {
          setErrorMessage(
            'VIP Access Key hanya tersedia dalam mode demonstrasi internal. Silakan gunakan tab Email & Password untuk masuk ke sistem produksi.'
          );
        } else {
          setErrorMessage(data.error || 'Access Key tidak valid.');
        }
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
      if (data.user?.firmId) {
        localStorage.setItem('finova_firm_id', data.user.firmId);
      }

      const redirectPath = searchParams.get('redirect') || '/engagements';
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
          Platform Manajemen Audit & Kepatuhan Kantor Akuntan Publik
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="finova-bezel-outer">
          <div className="finova-bezel-inner p-5 sm:p-6 space-y-4 bg-white">
            <div className="border-b border-[#DDE4E2] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#102A32]">Masuk ke Workspace</h3>
                <p className="text-[11px] text-[#52636A] mt-0.5">
                  Tenant: <strong className="text-[#102A32]">{firmProfile?.name || 'KAP Terdaftar'}</strong>
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Ready
              </span>
            </div>

            {/* Switch Tabs between Email & Password and Access Key */}
            <div className="flex rounded-xl bg-[#F6F7F5] p-1 border border-[#DDE4E2] text-xs">
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
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FCDAD7] text-xs text-[#C83E4D] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {googleNotice && (
              <div className="p-3 rounded-xl bg-[#FFFBF0] border border-[#FEEBC8] text-xs text-[#B7791F] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DD6B20]" />
                <span>{googleNotice}</span>
              </div>
            )}

            {/* TAB 1: EMAIL & PASSWORD (DEFAULT) */}
            {activeTab === 'credentials' && (
              <div className="space-y-3.5 text-xs">
                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#DDE4E2] hover:border-[#CBD5E0] bg-[#F6F7F5] hover:bg-[#EEF2F0] text-xs font-bold text-[#102A32] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  {isGoogleLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#52636A]" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}</span>
                </button>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-[#DDE4E2]" />
                  <span className="shrink-0 mx-2 text-[10px] font-bold text-[#7A8C93] uppercase tracking-wider">
                    atau email & sandi
                  </span>
                  <div className="flex-grow border-t border-[#DDE4E2]" />
                </div>

                <form onSubmit={(e) => handleCredentialsLogin(e)} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#102A32] block">Email Auditor</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="partner@kapanda.co.id"
                        className="w-full pl-9 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs font-medium text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#102A32]">Kata Sandi</label>
                      <span className="text-[10px] text-[#7A8C93]">256-bit Encrypted</span>
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
                    className="w-full finova-pill-cta justify-center bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer py-2.5 mt-2"
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

                {/* Banner Daftar Akun Baru */}
                <div className="mt-3 p-3 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#0F8F7A] block">Belum punya akun KAP?</span>
                    <p className="text-[11px] text-[#52636A]">Daftarkan Kantor Akuntan Publik Anda gratis</p>
                  </div>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-lg bg-[#0F8F7A] hover:bg-[#0C7564] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftar</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: VIP ACCESS KEY (UNTUK PENGUJIAN/DEMO EVALUATOR) */}
            {activeTab === 'access_key' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#102A32] block flex items-center justify-between">
                    <span>Masukkan Access Key</span>
                    <span className="text-[10px] text-[#0F8F7A] font-semibold">Evaluasi Instan</span>
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
                    Pilih Access Key Persona Evaluator:
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

            <div className="pt-2 text-center text-xs text-[#52636A] flex items-center justify-center gap-3">
              <Link href="/" className="text-[#52636A] hover:text-[#102A32] transition-colors">
                &larr; Landing Page
              </Link>
              <span>&bull;</span>
              <Link href="/register" className="text-[#0F8F7A] font-bold hover:underline">
                Daftar Akun KAP Baru
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
