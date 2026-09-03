'use client';

import React from 'react';
import { FileSpreadsheet, ShieldCheck, Hash, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export function IsometricWorkbookPreview() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#102A32] via-[#163842] to-[#0D2228] border border-[#204754] p-6 text-white shadow-md relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-[#0F8F7A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#B7791F]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F8F7A]/20 border border-[#0F8F7A]/40 text-[#25B49D] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Struktur Buku Kerja Berlisensi Resmi KAP</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Pratinjau Arsitektur Workbook XLSX (.xlsx)
          </h2>
          <p className="text-xs text-[#A1B8C0] leading-relaxed">
            Workbook yang dihasilkan mematuhi standar atestasi KAP Tanudiredja. Setiap berkas memuat struktur multi-sheet berpenanda tangan digital yang lolos uji baca ulang kriptografi (*read-back verification*).
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[#A1B8C0] text-[10px] block font-mono">Sheet 1</span>
              <strong className="text-white flex items-center gap-1.5 mt-0.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F8F7A]" />
                Lead Schedule
              </strong>
              <span className="text-[10px] text-[#7A8C93] block mt-0.5">
                18 Baris Akun Induk & Formula Agregasi
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[#A1B8C0] text-[10px] block font-mono">Sheet 2</span>
              <strong className="text-white flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#25B49D]" />
                Manifest Audit
              </strong>
              <span className="text-[10px] text-[#7A8C93] block mt-0.5">
                SHA-256 Hash, Tim Penandatangan & Timestamp
              </span>
            </div>
          </div>
        </div>

        {/* Isometric Visual Card Stack */}
        <div className="relative w-72 h-52 shrink-0 perspective-[1000px] flex items-center justify-center">
          {/* Sheet 2: Manifest (Back Layer) */}
          <div className="absolute w-64 h-36 rounded-xl bg-[#1B343D] border border-[#0F8F7A]/40 p-3 shadow-2xl transform rotate-x-12 rotate-y-[-10deg] translate-y-[-12px] translate-x-3 opacity-90 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#A1B8C0] border-b border-white/10 pb-1">
              <span className="font-bold text-white">Sheet 2: Manifest</span>
              <span className="text-[#0F8F7A] font-bold">READ-ONLY</span>
            </div>
            <div className="text-[9px] font-mono text-[#D1E0E5] space-y-0.5">
              <div>Signer: Bambang Hendrawan, CPA</div>
              <div>Hash: 9f83a48e71c9b204...</div>
              <div className="text-[#0F8F7A] font-bold">Tie-Out: 100% BALANCED (PASS)</div>
            </div>
          </div>

          {/* Sheet 1: Lead Schedule (Front Layer) */}
          <div className="absolute w-64 h-38 rounded-xl bg-white text-[#102A32] border-2 border-[#0F8F7A] p-3 shadow-2xl transform rotate-x-12 rotate-y-[-10deg] translate-y-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#DDE4E2] pb-1">
              <span className="font-bold text-[#0F8F7A] flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                Lead Schedule
              </span>
              <span className="text-[9px] bg-[#E8F5F1] text-[#0F8F7A] px-1.5 rounded font-bold border border-[#B2DFD6]">XLSX</span>
            </div>
            <div className="text-[9px] font-mono space-y-0.5 text-[#52636A]">
              <div className="flex justify-between font-bold text-[#102A32]">
                <span>WP-A.1 Kas & Bank</span>
                <span>Rp 4.500.000.000</span>
              </div>
              <div className="flex justify-between">
                <span>WP-A.2 Piutang Usaha</span>
                <span>Rp 9.850.000.000</span>
              </div>
              <div className="flex justify-between font-bold text-[#0F8F7A] border-t border-[#DDE4E2] pt-0.5">
                <span>Total Aset (A = L + E)</span>
                <span>Rp 34.550.000.000</span>
              </div>
            </div>
          </div>

          {/* Floating Verified Seal */}
          <div className="absolute -bottom-2 -right-2 bg-[#0F8F7A] text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 border border-white/20 z-20">
            <CheckCircle2 className="w-3 h-3" />
            <span>VERIFIED XLSX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
