'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Briefcase,
  FileText,
} from 'lucide-react';
import { getSupabaseAnon, isSupabaseConfigured } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'partner' | 'manager' | 'senior'>('partner');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !firmName.trim() || !email.trim() || !password) {
      setErrorMessage('Mohon lengkapi seluruh kolom wajib.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Kata sandi minimal 8 karakter demi keamanan data audit klien.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          firmName,
          licenseNumber: licenseNumber.trim() || undefined,
          email,
          role,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Pendaftaran gagal. Silakan coba kembali.');
        setIsLoading(false);
        return;
      }

      if (data.user?.role) {
        localStorage.setItem('finova_v4_role', data.user.role);
        localStorage.setItem('finova_user_name', data.user.name);
      }
      if (data.firm?.id) {
        localStorage.setItem('finova_firm_id', data.firm.id);
      }

      router.push('/engagements');
    } catch (err: any) {
      setErrorMessage('Terjadi kendala jaringan saat memproses pendaftaran.');
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
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
            'Google OAuth belum diaktifkan di Dashboard Supabase. Silakan langsung daftar dengan formulir Email & Password di bawah (instan aktif tanpa perlu konfirmasi email).'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F7F5] via-[#EBEFED] to-[#E8F5F1]/40 flex flex-col justify-center py-10 sm:px-6 lg:px-8 text-[#102A32] relative overflow-hidden animate-finova-in">
      {/* Ambient background glows */}
      <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#0F8F7A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#2B6CB0]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-2 relative z-10 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
          FN
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102A32]">
          Pendaftaran Kantor Akuntan Publik
        </h1>
        <p className="text-xs text-[#52636A]">
          Buat Workspace Audit Baru &bull; SAK & SPAP Compliant &bull; Multi-Tenant Isolated
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        <div className="finova-bezel-outer">
          <div className="finova-bezel-inner p-5 sm:p-7 space-y-4 bg-white">
            <div className="border-b border-[#DDE4E2] pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-[#102A32]">Formulir Pendaftaran KAP</h2>
                <p className="text-[11px] text-[#52636A]">Akun pertama otomatis menjadi Managing Partner KAP</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                256-bit SAK Secure
              </span>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FCDAD7] text-xs text-[#C83E4D] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Notice Alert */}
            {googleNotice && (
              <div className="p-3 rounded-xl bg-[#FFFBF0] border border-[#FEEBC8] text-xs text-[#B7791F] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DD6B20]" />
                <div className="space-y-1">
                  <span className="font-bold block">Pemberitahuan Google OAuth</span>
                  <span>{googleNotice}</span>
                </div>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
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
              <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Daftar Cepat dengan Google'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#DDE4E2]" />
              <span className="shrink-0 mx-3 text-[10.5px] font-bold text-[#7A8C93] uppercase tracking-wider">
                atau gunakan email kantor
              </span>
              <div className="flex-grow border-t border-[#DDE4E2]" />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Auditor */}
                <div className="space-y-1">
                  <label className="font-bold text-[#102A32] block">Nama Lengkap & Gelar *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Haidar, CPA, CA"
                      className="w-full pl-8 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                  </div>
                </div>

                {/* Peran Tim */}
                <div className="space-y-1">
                  <label className="font-bold text-[#102A32] block">Peran di KAP *</label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-8 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    >
                      <option value="partner">Managing Partner (Pemimpin)</option>
                      <option value="manager">Audit Manager</option>
                      <option value="senior">Senior Auditor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama KAP */}
                <div className="space-y-1">
                  <label className="font-bold text-[#102A32] block">Nama Resmi KAP *</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="KAP Haidar & Rekan"
                      className="w-full pl-8 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                  </div>
                </div>

                {/* No Izin AP / KMK */}
                <div className="space-y-1">
                  <label className="font-bold text-[#102A32] block">No. Izin AP / KMK (Opsional)</label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="AP.0942 / KMK No. 492"
                      className="w-full pl-8 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="font-bold text-[#102A32] block">Email Bisnis / Kantor *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@kaphaidar.co.id"
                    className="w-full pl-8 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                  />
                </div>
              </div>

              {/* Kata Sandi & Konfirmasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#102A32] block">Kata Sandi (Min. 8 Karakter) *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-8 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8C93] hover:text-[#102A32]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#102A32] block">Konfirmasi Kata Sandi *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#7A8C93] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-3 py-2 bg-[#F6F7F5] border border-[#DDE4E2] rounded-xl text-xs text-[#102A32] focus:outline-none focus:ring-1 focus:ring-[#0F8F7A]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full finova-pill-cta justify-center bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-md cursor-pointer py-2.5 mt-2"
              >
                <span>{isLoading ? 'Membuat Profil KAP & Akun...' : 'Daftarkan KAP & Masuk Workspace'}</span>
                <div className="icon-circle">
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-[#52636A] flex items-center justify-center gap-1.5 border-t border-[#DDE4E2]">
              <span>Sudah memiliki akun KAP terdaftar?</span>
              <Link href="/login" className="text-[#0F8F7A] font-bold hover:underline">
                Masuk ke Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
