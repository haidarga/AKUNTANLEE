'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  BrainCircuit,
  Lock,
  Download,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Cpu,
  ChevronRight,
  Calculator,
  Compass,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'waterfall' | 'ai' | 'export'>('spreadsheet');
  const firmProfile = repo.getFirmProfile();

  return (
    <div className="min-h-screen bg-[#F6F7F5] text-[#102A32] selection:bg-[#0F8F7A]/20 selection:text-[#0F8F7A] relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0F8F7A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] -right-40 w-[500px] h-[500px] bg-[#B7791F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[700px] h-[700px] bg-[#0F8F7A]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Navigation Pill */}
      <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-white/80 backdrop-blur-md rounded-full border border-[#DDE4E2] shadow-lg shadow-black/5 px-4 py-2.5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                FN
              </div>
              <span className="font-bold text-sm tracking-tight text-[#102A32]">
                FINOVA AI <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">v4.0</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#52636A]">
            <a href="#fitur" className="hover:text-[#0F8F7A] transition-colors">Fitur Unggulan</a>
            <a href="#arsitektur" className="hover:text-[#0F8F7A] transition-colors">Arsitektur Math</a>
            <a href="#standar" className="hover:text-[#0F8F7A] transition-colors">Standar SAK</a>
            <Link href="/settings" className="hover:text-[#0F8F7A] transition-colors">Profil KAP</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#52636A] hover:text-[#102A32] hover:bg-[#F6F7F5] transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/onboarding"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0F8F7A] hover:bg-[#0C7564] text-white shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Setup KAP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative z-10">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DDE4E2] shadow-xs text-xs font-semibold text-[#52636A] animate-finova-in">
            <span className="w-2 h-2 rounded-full bg-[#0F8F7A] animate-ping" />
            <span className="font-mono text-[#0F8F7A] font-bold">Release 0.1 Production</span>
            <span className="text-[#DDE4E2]">&bull;</span>
            <span>Standar Akuntansi Keuangan (SAK) Indonesia</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#102A32] leading-[1.15]">
            Platform Kertas Kerja Audit & Konsultasi Finansial
            <br />
            <span className="bg-gradient-to-r from-[#0F8F7A] via-[#0C7564] to-[#102A32] bg-clip-text text-transparent">
              Cepat, Presisi, dan Berstandar SAK Indonesia
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-[#52636A] max-w-2xl mx-auto leading-relaxed">
            Otomasi lengkap proses audit dan perpajakan untuk Kantor Akuntan Publik (KAP) serta penasihat keuangan: dari verifikasi neraca saldo Excel, otomasi pajak PPh 21 TER dan PPN 1111, hingga simulasi keputusan bisnis strategis bagi direksi perusahaan.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#805AD5] hover:bg-[#6B46C1] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span className="text-base">🔑</span>
              <span>Masuk via Access Key (A/B Test)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/engagements"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-white" />
              <span>Buka Direktori Klien</span>
            </Link>

            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-[#F6F7F5] border border-[#DDE4E2] hover:border-[#0F8F7A] text-[#102A32] font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Setup Profil KAP Baru</span>
            </Link>
          </div>

          {/* Active Firm Banner */}
          <div className="pt-2 text-xs text-[#52636A] flex items-center justify-center gap-2">
            <Building className="w-3.5 h-3.5 text-[#0F8F7A]" />
            <span>KAP Aktif Terkonfigurasi: <strong className="text-[#102A32]">{firmProfile.name}</strong> ({firmProfile.licenseNumber})</span>
            <Link href="/settings" className="text-[#0F8F7A] underline font-semibold hover:text-[#0C7564]">Ubah Profil</Link>
          </div>
        </div>

        {/* Interactive Double-Bezel Hardware Showcase */}
        <div className="mt-14 max-w-5xl mx-auto text-left">
          <div className="finova-bezel-outer shadow-2xl">
            <div className="finova-bezel-inner bg-white overflow-hidden">
              {/* Showcase Navigation Bar */}
              <div className="p-3 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('spreadsheet')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'spreadsheet'
                        ? 'bg-white text-[#0F8F7A] shadow-xs border border-[#DDE4E2]'
                        : 'text-[#52636A] hover:text-[#102A32]'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>AuditSpreadsheet</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('waterfall')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'waterfall'
                        ? 'bg-white text-[#0F8F7A] shadow-xs border border-[#DDE4E2]'
                        : 'text-[#52636A] hover:text-[#102A32]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Waterfall Laba Bersih</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'ai'
                        ? 'bg-white text-[#0F8F7A] shadow-xs border border-[#DDE4E2]'
                        : 'text-[#52636A] hover:text-[#102A32]'
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>AI Reasoning (PSAK 10)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('export')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'export'
                        ? 'bg-white text-[#0F8F7A] shadow-xs border border-[#DDE4E2]'
                        : 'text-[#52636A] hover:text-[#102A32]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Arsitektur XLSX</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[#52636A]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Kertas Kerja: PT Nusantara Sukses Makmur</span>
                </div>
              </div>

              {/* Showcase Content Area */}
              <div className="p-6 sm:p-8 min-h-[380px]">
                {activeTab === 'spreadsheet' && (
                  <div className="space-y-4 animate-finova-in">
                    <div className="flex items-center justify-between border-b border-[#DDE4E2] pb-3">
                      <div>
                        <h3 className="font-bold text-sm text-[#102A32]">Kertas Kerja Induk Neraca & Laba Rugi</h3>
                        <p className="text-xs text-[#52636A]">Formula kohesif real-time dengan ring fokus sel aktif.</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5F1] text-[#0F8F7A] font-bold border border-[#B2DFD6]">
                        Keyboard: ↑ ↓ ← → Enter
                      </span>
                    </div>

                    {/* Formula bar mock */}
                    <div className="p-2.5 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#102A32] text-white font-bold text-[11px]">SEL WP-A.1</span>
                      <span className="text-[#0F8F7A] font-bold">fx</span>
                      <span className="text-[#102A32]">=SUM(TB!WP-A.1_Accounts) | Nilai SAK: Rp 4.500.000.000 (Varians +7.1%)</span>
                    </div>

                    {/* Table snippet */}
                    <div className="border border-[#DDE4E2] rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-12 bg-[#F6F7F5] p-2.5 font-bold text-[#52636A] border-b border-[#DDE4E2]">
                        <div className="col-span-2">Kode WP</div>
                        <div className="col-span-5">Deskripsi Akun SAK</div>
                        <div className="col-span-3 text-right">FY 2026 (Berjalan)</div>
                        <div className="col-span-2 text-right">Varians %</div>
                      </div>
                      <div className="grid grid-cols-12 p-2.5 bg-[#E8F5F1]/30 border-l-4 border-[#0F8F7A] items-center">
                        <div className="col-span-2 font-mono font-bold text-[#0F8F7A]">WP-A.1</div>
                        <div className="col-span-5 font-semibold text-[#102A32]">Kas & Setara Kas (Cash & Equivalents)</div>
                        <div className="col-span-3 text-right font-mono font-bold text-[#102A32]">Rp 4.500.000.000</div>
                        <div className="col-span-2 text-right font-mono text-[#0F8F7A] font-bold">+7.1%</div>
                      </div>
                      <div className="grid grid-cols-12 p-2.5 border-t border-[#DDE4E2] items-center text-[#52636A]">
                        <div className="col-span-2 font-mono">WP-A.2</div>
                        <div className="col-span-5">Piutang Usaha Bruto (Accounts Receivable)</div>
                        <div className="col-span-3 text-right font-mono">Rp 9.850.000.000</div>
                        <div className="col-span-2 text-right font-mono text-[#0F8F7A]">+43.8%</div>
                      </div>
                      <div className="grid grid-cols-12 p-2.5 border-t border-[#DDE4E2] items-center text-[#52636A]">
                        <div className="col-span-2 font-mono">WP-F.1</div>
                        <div className="col-span-5 font-semibold text-[#102A32]">Pendapatan Usaha (Revenue)</div>
                        <div className="col-span-3 text-right font-mono text-[#102A32]">Rp 52.400.000.000</div>
                        <div className="col-span-2 text-right font-mono text-[#0F8F7A]">+16.4%</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'waterfall' && (
                  <div className="space-y-4 animate-finova-in">
                    <div className="border-b border-[#DDE4E2] pb-3">
                      <h3 className="font-bold text-sm text-[#102A32]">Jembatan Dekomposisi Laba Bersih (Waterfall Chart)</h3>
                      <p className="text-xs text-[#52636A]">Analisis visual pergerakan pendapatan hingga laba bersih tahun berjalan yang diserap ke ekuitas.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] space-y-3">
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-3 bg-white rounded-xl border border-[#B2DFD6]">
                          <span className="text-[10px] text-[#52636A] block">Pendapatan Usaha</span>
                          <strong className="text-sm font-bold text-[#0F8F7A]">Rp 52,4 M</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-[#F8B4BD]">
                          <span className="text-[10px] text-[#52636A] block">HPP (COGS)</span>
                          <strong className="text-sm font-bold text-[#C83E4D]">-Rp 35,95 M</strong>
                        </div>
                        <div className="p-3 bg-[#E8F5F1] rounded-xl border border-[#0F8F7A]">
                          <span className="text-[10px] text-[#52636A] block">Laba Kotor</span>
                          <strong className="text-sm font-bold text-[#0F8F7A]">Rp 16,45 M</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-[#F8B4BD]">
                          <span className="text-[10px] text-[#52636A] block">Beban Operasional</span>
                          <strong className="text-sm font-bold text-[#C83E4D]">-Rp 12,2 M</strong>
                        </div>
                        <div className="p-3 bg-[#102A32] text-white rounded-xl shadow-xs">
                          <span className="text-[10px] text-emerald-200 block">Laba Bersih SAK</span>
                          <strong className="text-sm font-bold text-emerald-300">Rp 4,25 M</strong>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#52636A] text-center pt-2">
                        &check; Tie-out 100%: Diserap ke Kertas Kerja <strong className="text-[#102A32]">WP-E.2 (Saldo Laba Ditahan)</strong>. Neraca Seimbang Sempurna.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-4 animate-finova-in">
                    <div className="border-b border-[#DDE4E2] pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#102A32] flex items-center gap-2">
                          FINOVA AI Semantic Reasoning Inspector
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                            Model: qwen3.8-nvfp4
                          </span>
                        </h3>
                        <p className="text-xs text-[#52636A]">Bedah semantik akun penampungan suspensi kurs & kepatuhan PSAK 10.</p>
                      </div>
                      <span className="text-xs font-mono text-[#0F8F7A] font-bold">12ms (Cached)</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#FFF7E8] border border-[#F6E0B5]">
                        <strong className="text-[#B7791F] block text-xs">Temuan Anomali Suspensi:</strong>
                        <p className="text-[#52636A] mt-1 leading-relaxed">
                          Akun <strong className="text-[#102A32]">2199-00 Akun Penampungan Selisih Kurs Sementara (Rp 310Jt)</strong> melampaui batas materialitas (Rp 250Jt). Menurut <strong>PSAK 10 / SAK EP Seksi 30</strong>, selisih kurs moneter tidak boleh menggantung di neraca liabilitas.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6] flex items-center justify-between">
                        <div>
                          <strong className="text-[#0F8F7A] block text-xs">Rekomendasi AI (Keyakinan 92%):</strong>
                          <span className="text-[#52636A] text-[11px]">
                            Reklasifikasi otomatis ke <strong>WP-F.4 Pendapatan/Beban Lain-lain Bersih</strong> pada laporan laba rugi.
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-[#0F8F7A] text-white rounded-lg font-bold text-[11px] shadow-xs">
                          Terapkan WP-F.4 &check;
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'export' && (
                  <div className="space-y-4 animate-finova-in">
                    <div className="border-b border-[#DDE4E2] pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#102A32]">Arsitektur Ekspor Multi-Sheet XLSX (.xlsx)</h3>
                        <p className="text-xs text-[#52636A]">Workbook berlisensi resmi KAP dengan segel tanda tangan digital Partner.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#0F8F7A]">READ-BACK VERIFIED</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] space-y-1">
                        <div className="font-bold text-[#102A32] flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#0F8F7A]" />
                          Sheet 1: Lead Schedule
                        </div>
                        <p className="text-[11px] text-[#52636A]">
                          18 baris akun induk SAK komparatif FY 2026 vs FY 2025 berformula agregasi murni.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] space-y-1">
                        <div className="font-bold text-[#102A32] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#0F8F7A]" />
                          Sheet 2: Manifest Audit
                        </div>
                        <p className="text-[11px] text-[#52636A]">
                          Hash SHA-256 sumber, stempel waktu atestasi, dan penanda tangan Signing Partner resmi.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: 4 Pilar Integritas */}
      <section id="fitur" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#DDE4E2]">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102A32] tracking-tight">
            Empat Pilar Integritas Audit Finansial
          </h2>
          <p className="text-sm text-[#52636A]">
            Menjamin akurasi tanpa kompromi, kepatuhan hukum, dan ketertelusuran penuh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Zero-Float Math */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-[#DDE4E2] shadow-xs hover:border-[#0F8F7A] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] text-[#0F8F7A] flex items-center justify-center font-bold">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#102A32]">Kalkulasi Deterministik (Zero-Float Math)</h3>
              <p className="text-xs text-[#52636A] leading-relaxed">
                FINOVA AI secara tegas melarang LLM menghitung angka akuntansi. Seluruh aritmatika neraca dihitung dalam satuan integer Rupiah murni untuk mencegah halusinasi dan rounding error. Persamaan dasar akuntansi <strong>Aset = Liabilitas + Ekuitas</strong> terbukti seimbang hingga selisih Rp 0.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 font-mono text-xs text-[#0F8F7A]">
              <span className="px-2.5 py-1 rounded bg-[#E8F5F1] border border-[#B2DFD6] font-bold">&check; 0 Float Hallucination</span>
              <span className="px-2.5 py-1 rounded bg-[#E8F5F1] border border-[#B2DFD6] font-bold">&check; 100% Tie-Out Pass</span>
            </div>
          </div>

          {/* Card 2: Live AI Reasoning */}
          <div className="p-8 rounded-3xl bg-white border border-[#DDE4E2] shadow-xs hover:border-[#0F8F7A] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] text-[#0F8F7A] flex items-center justify-center font-bold">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#102A32]">Live AI Reasoning (Qwen 3.8)</h3>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Tersambung ke model reasoning lokal yang memahami standar akuntansi Indonesia (SAK & PSAK 10), membedah semantik akun, dan mengidentifikasi akun suspensi liar.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-[#52636A] font-semibold">&bull; 262k Context Window Support</span>
            </div>
          </div>

          {/* Card 3: Crypto Hash Vault */}
          <div className="p-8 rounded-3xl bg-white border border-[#DDE4E2] shadow-xs hover:border-[#0F8F7A] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] text-[#0F8F7A] flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#102A32]">Brankas Berkas SHA-256</h3>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Setiap file Excel klien diuji dengan Macro Guard dan disegel dengan hash SHA-256 unik saat diunggah. Bukti audit bersifat kekal (*immutable*) dan siap diinspeksi regulator.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-[#0F8F7A] font-bold">&check; Web Crypto Native Hashing</span>
            </div>
          </div>

          {/* Card 4: Official XLSX Generator */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-[#DDE4E2] shadow-xs hover:border-[#0F8F7A] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] text-[#0F8F7A] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#102A32]">Generator XLSX Berpenanda Tangan Digital Partner</h3>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Bukan sekadar ekspor tabel biasa. Sistem memproduksi format workbook resmi multi-sheet berpenanda tangan Partner, nomor izin KAP, dan lolos uji baca-ulang (*read-back verification*) sebelum diserahkan kepada klien.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 font-mono text-xs text-[#52636A]">
              <span>Format: Multi-Sheet Workbook (.xlsx)</span>
              <span>&bull;</span>
              <span className="text-[#0F8F7A] font-bold">Ready for Audit Working Paper File</span>
            </div>
          </div>
        </div>
      </section>

      {/* Standards Section */}
      <section id="standar" className="py-16 px-4 max-w-5xl mx-auto text-center border-t border-[#DDE4E2]">
        <div className="space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest text-[#52636A] uppercase block">
            Kepatuhan Regulasi & Standar Atestasi
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <span className="px-4 py-2 rounded-xl bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32] shadow-2xs">
              SAK Indonesia (PSAK)
            </span>
            <span className="px-4 py-2 rounded-xl bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32] shadow-2xs">
              SAK Entitas Privat (SAK EP)
            </span>
            <span className="px-4 py-2 rounded-xl bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32] shadow-2xs">
              SPAP SA 520 (Prosedur Analitis)
            </span>
            <span className="px-4 py-2 rounded-xl bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32] shadow-2xs">
              Standar Profesional IAPI
            </span>
            <span className="px-4 py-2 rounded-xl bg-white border border-[#DDE4E2] text-xs font-bold text-[#102A32] shadow-2xs">
              Kementerian Keuangan (KMK)
            </span>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#102A32] via-[#0C333D] to-[#0F8F7A] text-white shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10">
            Siap Merevolusi Alur Kerja Audit KAP Anda?
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed relative z-10">
            Setup profil Kantor Akuntan Publik Anda, atur Managing Partner & tim auditor, dan mulai hasilkan kertas kerja berstandar SAK dalam hitungan menit.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-[#102A32] hover:bg-[#E8F5F1] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Setup Profil KAP Sekarang</span>
              <ArrowRight className="w-4 h-4 text-[#0F8F7A]" />
            </Link>

            <Link
              href="/engagements"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
            >
              Buka Direktori Perikatan
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DDE4E2] py-8 text-center text-xs text-[#52636A] space-y-2">
        <p>&copy; 2026 FINOVA AI &bull; Sistem Operasi Kertas Kerja Finansial Indonesia</p>
        <p className="text-[11px]">
          Berlisensi untuk: <strong className="text-[#102A32]">{firmProfile.name}</strong> &bull; {firmProfile.licenseNumber}
        </p>
      </footer>
    </div>
  );
}
