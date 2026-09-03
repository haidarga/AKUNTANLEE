'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, FileSpreadsheet, ArrowRight, CheckCircle2, Lock, Sparkles, Database, Layers } from 'lucide-react';

// 1. Files / Ingestion Scanner Illustration
export function FileScannerIllustration() {
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gradient-to-br from-[#102A32] to-[#0A1D23] p-4 text-white flex items-center justify-between border border-[#1C3E49] shadow-inner">
      {/* Ambient background mesh */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#0F8F7A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#B7791F]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Left side: Animated document node */}
      <div className="relative z-10 space-y-2 max-w-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F8F7A]/20 border border-[#0F8F7A]/40 text-[#4ECEA8] text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SHA-256 Cryptographic Vault</span>
        </div>
        <h4 className="text-sm font-bold text-white tracking-wide">
          Pemindaian & Immutabilitas Berkas Finansial
        </h4>
        <p className="text-[11px] text-[#A2B7BF] leading-relaxed">
          Setiap file XLSX/CSV dihitung hash SHA-256 unik saat pertama tiba, menjamin integritas bukti kerja tanpa modifikasi.
        </p>
      </div>

      {/* Right side: Interactive Visual Graphic */}
      <div className="relative z-10 hidden sm:flex items-center gap-3">
        {/* Source File Card */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 bg-[#1A3843]/80 border border-[#2D5866] rounded-lg p-3 backdrop-blur-md shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <FileSpreadsheet className="w-5 h-5 text-[#4ECEA8]" />
            <span className="text-[9px] font-mono text-[#7A9EA8]">.XLSX</span>
          </div>
          <div className="text-[10px] font-bold text-white truncate">TB_Nusantara.xlsx</div>
          <div className="text-[8px] font-mono text-[#4ECEA8] mt-1 truncate">sha256:9f83a48e...</div>
        </motion.div>

        {/* Animated Laser Connector */}
        <div className="relative flex items-center">
          <div className="w-8 h-0.5 bg-gradient-to-r from-[#4ECEA8] to-[#0F8F7A]" />
          <motion.div
            animate={{ x: [0, 24, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#4ECEA8]"
          />
        </div>

        {/* Normalized Vault Card */}
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="w-32 bg-[#0F8F7A]/20 border border-[#0F8F7A]/50 rounded-lg p-3 backdrop-blur-md shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Lock className="w-4 h-4 text-[#4ECEA8]" />
            <span className="text-[9px] font-bold text-[#4ECEA8] px-1 py-0.2 bg-[#0F8F7A]/30 rounded">SEALED</span>
          </div>
          <div className="text-[10px] font-bold text-white">Dataset Snapshot</div>
          <div className="text-[8px] text-[#A2B7BF] mt-1">22 Akun Tervalidasi</div>
        </motion.div>
      </div>
    </div>
  );
}

// 2. Mapping Sankey / Flow Illustration
export function MappingFlowIllustration() {
  return (
    <div className="w-full rounded-xl bg-gradient-to-r from-[#F6F7F5] via-white to-[#F6F7F5] border border-[#DDE4E2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F8F7A]/10 border border-[#0F8F7A]/30 text-[#0F8F7A] flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-[#102A32]">Aliran Pemetaan Akun Sumber ke Kertas Kerja</div>
          <div className="text-[11px] text-[#52636A]">
            Setiap saldo debit/kredit dialokasikan ke Lead Schedule dengan pertimbangan keyakinan & jejak audit.
          </div>
        </div>
      </div>

      {/* Visual Flow Mini-Graph */}
      <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
        <div className="px-2 py-1 bg-white border border-[#DDE4E2] rounded text-[#102A32] shadow-xs">
          Kode TB (22)
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[#0F8F7A]" />
        <div className="px-2 py-1 bg-[#FFF7E8] border border-[#F6E0B5] rounded text-[#B7791F] font-bold shadow-xs">
          1 Review
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[#0F8F7A]" />
        <div className="px-2 py-1 bg-[#E8F5F1] border border-[#B2DFD6] rounded text-[#0F8F7A] font-bold shadow-xs">
          21 Terpetakan
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[#0F8F7A]" />
        <div className="px-2 py-1 bg-[#102A32] text-white rounded font-bold shadow-xs">
          Lead Schedule
        </div>
      </div>
    </div>
  );
}

// 3. Balance Sheet Equation Balance Gauge Illustration
export function BalanceScaleIllustration({ isBalanced = true, diff = 0 }: { isBalanced?: boolean; diff?: number }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#DDE4E2] shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
            isBalanced
              ? 'bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]'
              : 'bg-[#FDECEF] text-[#C83E4D] border border-[#F8B4BD]'
          }`}
        >
          {isBalanced ? '=' : '≠'}
        </div>
        <div>
          <div className="font-bold text-xs text-[#102A32]">
            Persamaan Fundamental Akuntansi (Accounting Balance Equation)
          </div>
          <div className="text-[11px] text-[#52636A] font-mono">
            Aset (Rp 34.550.000.000) = Liabilitas (Rp 12.360.000.000) + Ekuitas (Rp 22.190.000.000)
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            isBalanced
              ? 'bg-[#E8F5F1] text-[#0F8F7A] border-[#B2DFD6]'
              : 'bg-[#FDECEF] text-[#C83E4D] border-[#F8B4BD]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-[#0F8F7A] animate-pulse' : 'bg-[#C83E4D]'}`} />
          {isBalanced ? 'SEIMBANG SEMPURNA (PASS)' : `SELISIH: Rp ${diff.toLocaleString('id-ID')}`}
        </span>
      </div>
    </div>
  );
}
