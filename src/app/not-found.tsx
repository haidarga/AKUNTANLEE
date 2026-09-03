import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-[#102A32]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#DDE4E2] p-8 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF7E8] text-[#B7791F] border border-[#F6E0B5] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#F6F7F5] text-[#52636A] border border-[#DDE4E2]">
            HTTP 404 &bull; Entity Not Found
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[#102A32]">
            Perikatan Tidak Ditemukan
          </h1>
          <p className="text-xs text-[#52636A] leading-relaxed">
            ID Perikatan yang Anda minta tidak terdaftar di sistem atau berada di luar batas izin tenant Anda.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 bg-[#102A32] hover:bg-[#0F8F7A] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Daftar Perikatan</span>
          </Link>
          <Link
            href="/engagements/ENG-2026-01/overview"
            className="w-full sm:w-auto px-4 py-2.5 bg-[#E8F5F1] hover:bg-[#D3EEE7] text-[#0F8F7A] border border-[#B2DFD6] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Demo Perikatan 01</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
