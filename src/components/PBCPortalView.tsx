'use client';

import React, { useState } from 'react';
import {
  Building2,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { PBCRequest } from '@/types/domain';

interface PBCPortalViewProps {
  requests: PBCRequest[];
  clientName: string;
  firmName: string;
  onSimulateUpload: (pbcId: string, filename: string) => void;
}

export const PBCPortalView: React.FC<PBCPortalViewProps> = ({
  requests: initialRequests,
  clientName,
  firmName,
  onSimulateUpload,
}) => {
  const [requests, setRequests] = useState<PBCRequest[]>(initialRequests);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadClick = (pbcId: string) => {
    setUploadingId(pbcId);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setRequests((prevReqs) =>
              prevReqs.map((r) =>
                r.id === pbcId ? { ...r, status: 'uploaded' as const } : r
              )
            );
            onSimulateUpload(pbcId, 'Dokumen_Susulan_Klien_2026.xlsx');
            setUploadingId(null);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const getStatusPill = (status: PBCRequest['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Diterima Tim Audit
          </span>
        );
      case 'uploaded':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-300 bg-blue-50 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Sedang Diverifikasi
          </span>
        );
      case 'needs_replacement':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Perlu Penggantian Dokumen
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800">
            Terlambat / Belum Lengkap
          </span>
        );
      case 'required':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700">
            Wajib Diunggah
          </span>
        );
    }
  };

  const acceptedCount = requests.filter((r) => r.status === 'accepted').length;
  const uploadedCount = requests.filter((r) => r.status === 'uploaded').length;
  const totalCount = requests.length;
  const progressPercent = Math.round(((acceptedCount + uploadedCount) / totalCount) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Client-Facing Firm Header */}
      <header className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#0D5C75] text-white font-bold flex items-center justify-center text-sm">
              FN
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Portal Penyerahan Bukti Dokumen (PBC)</div>
              <div className="text-sm font-bold text-slate-900">{firmName}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Koneksi Terenkripsi & Terisolasi</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Card & Progress */}
        <div className="bg-white rounded border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                Wajib Pajak / Klien:
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">{clientName}</h1>
              <p className="text-xs text-slate-600 mt-1">
                Silakan lengkapi daftar permintaan data dan dokumen pemeriksaan untuk Tahun Buku 2025 di bawah ini.
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500">Kemajuan Penyerahan:</div>
              <div className="text-2xl font-bold font-mono text-teal-800">{progressPercent}%</div>
              <div className="text-[11px] text-slate-500">{acceptedCount + uploadedCount} dari {totalCount} Dokumen</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* PBC Request List */}
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
            <span>Daftar Permintaan Bukti (Prepared by Client)</span>
            <span className="text-[11px] font-normal text-slate-500">
              Akses khusus klien &bull; Kertas kerja internal tidak ditampilkan
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {requests.map((req) => (
              <div key={req.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1.5 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusPill(req.status)}
                    <span className="font-bold text-slate-900 text-sm">{req.title}</span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-xs">{req.description}</p>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px] pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Batas Waktu: <strong className="font-mono text-slate-700">{req.dueDate}</strong>
                    </span>
                    <span>Tujuan: Tim Audit KAP</span>
                  </div>

                  {/* Rejection / Replacement Note if any */}
                  {req.rejectionReason && (
                    <div className="bg-rose-50 border border-rose-200 rounded p-2.5 text-[11px] text-rose-900 mt-2 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Catatan Penggantian dari Auditor:
                      </div>
                      <p>{req.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Upload Action */}
                <div className="shrink-0 w-full sm:w-auto">
                  {uploadingId === req.id ? (
                    <div className="w-40 space-y-1 text-center">
                      <div className="text-[10px] text-slate-600 font-medium">Mengunggah... {uploadProgress}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-700 h-1.5 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUploadClick(req.id)}
                      className={`w-full sm:w-auto px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        req.status === 'needs_replacement'
                          ? 'bg-rose-700 hover:bg-rose-800 text-white'
                          : req.status === 'accepted'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-[#0D5C75] hover:bg-[#09475C] text-white'
                      }`}
                    >
                      <FileUp className="w-4 h-4" />
                      {req.status === 'needs_replacement'
                        ? 'Unggah Dokumen Pengganti'
                        : req.status === 'accepted'
                        ? 'Perbarui Dokumen'
                        : 'Unggah Berkas'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Confidentiality Notice */}
        <div className="bg-slate-100 p-4 rounded text-xs text-slate-500 space-y-1 border border-slate-200">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Jaminan Kerahasiaan Dokumen Klien (Client Data Confidentiality)
          </div>
          <p className="text-[11px] leading-relaxed">
            Dokumen yang diunggah disimpan dalam penyimpanan terenkripsi yang sesuai dengan regulasi perlindungan data pribadi dan standar kepatuhan profesi akuntan publik. Hanya tim perikatan yang berwenang yang dapat mengakses berkas ini.
          </p>
        </div>
      </main>
    </div>
  );
};
