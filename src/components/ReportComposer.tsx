'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  Lock,
  Download,
  ShieldCheck,
  Edit3,
  Bookmark,
} from 'lucide-react';
import { Finding, ReportDraft, StandardReference, UserRole } from '@/types/domain';
import { StatusBadge } from './StatusBadge';

interface ReportComposerProps {
  draft: ReportDraft;
  findings: Finding[];
  standards: StandardReference[];
  currentUserRole: UserRole;
  currentUserName: string;
  onApproveDraft: () => void;
}

export const ReportComposer: React.FC<ReportComposerProps> = ({
  draft: initialDraft,
  findings,
  standards,
  currentUserRole,
  currentUserName,
  onApproveDraft,
}) => {
  const [draft, setDraft] = useState<ReportDraft>(initialDraft);
  const [isEditing, setIsEditing] = useState(false);
  const [summaryText, setSummaryText] = useState(draft.executiveSummary);

  const canApproveReport = ['partner', 'firm_admin'].includes(currentUserRole);

  const handleSaveSummary = () => {
    setDraft({ ...draft, executiveSummary: summaryText, lastEditedAt: new Date().toISOString() });
    setIsEditing(false);
  };

  const handleApprove = () => {
    setDraft({
      ...draft,
      status: 'approved',
      approvedByPartnerId: 'USR-PARTNER-01',
      approvedAt: new Date().toISOString(),
    });
    onApproveDraft();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="bg-white p-4 rounded border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{draft.title}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
              draft.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {draft.status === 'approved' ? 'Disetujui Partner' : 'Draft Peninjauan'}
            </span>
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            Disusun dari data keterlibatan terverifikasi &bull; Terakhir disunting: {new Date(draft.lastEditedAt).toLocaleDateString('id-ID')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {draft.status !== 'approved' && canApproveReport && (
            <button
              onClick={handleApprove}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Otorisasi & Sahkan Laporan
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Surface */}
      <div className="bg-white rounded border border-slate-300 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-8 text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
        {/* Document Header / Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              KAP Tanudiredja, Wibisana, Rintis & Rekan
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Kantor Akuntan Publik & Konsultan Pajak Terdaftar di Kementerian Keuangan RI
            </div>
            <div className="text-xs text-slate-500">
              Menara Sentraya Lt. 28, Jl. Iskandarsyah Raya No. 1A, Jakarta Selatan 12160
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-300">
              STRICTLY CONFIDENTIAL
            </span>
            <div className="text-xs text-slate-500 mt-2 font-mono">Ref: MEMO/2026/02/NSM-01</div>
          </div>
        </div>

        {/* Memo Metadata Block */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded border border-slate-200">
          <div>
            <span className="text-slate-500 font-semibold block">Kepada Yth:</span>
            <span className="font-bold text-slate-900">Dewan Direksi & Komisaris PT Nusantara Sukses Makmur</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Dari:</span>
            <span className="font-bold text-slate-900">Bambang Hendrawan, SE, Ak, CA, CPA (Engagement Partner)</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Perihal:</span>
            <span className="font-bold text-slate-900">Executive Advisory Memo & Ringkasan Temuan Audit Tahun Buku 2025</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Tanggal Pengesahan:</span>
            <span className="font-bold text-slate-900 font-mono">14 Februari 2026</span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              1. Ringkasan Eksekutif (Executive Summary)
            </h2>
            {!isEditing && draft.status !== 'approved' && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 print:hidden"
              >
                <Edit3 className="w-3 h-3" /> Sunting
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 border border-slate-300 rounded text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveSummary}
                  className="px-2.5 py-1 bg-teal-700 text-white rounded text-xs font-semibold"
                >
                  Simpan Ringkasan
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-800 leading-relaxed text-justify">
              {draft.executiveSummary}
            </p>
          )}
        </div>

        {/* Section 2: Financial Health & Advisory Highlights */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. Analisis Diagnostik & Rekomendasi Finansial (Advisory Insights)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-slate-200 p-3 rounded bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">Penurunan Gross Margin (38.2% &rarr; 31.4%)</div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Kenaikan HPP pembelian bahan baku impor (+21.4%) serta diskon penjualan akhir tahun tanpa otorisasi formal menggerus margin kotor sebesar 6.8%.
              </p>
              <div className="text-[10px] text-teal-800 font-semibold mt-1">
                Rekomendasi: Tambahkan klausul eskalasi harga dan terapkan batas diskon otomatis di ERP.
              </div>
            </div>

            <div className="border border-slate-200 p-3 rounded bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900">Pembengkakan Piutang (DSO +15 Hari)</div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Days Sales Outstanding meningkat dari 53 hari menjadi 68 hari. Modal kerja terikat tambahan sebesar Rp 3 Miliar.
              </p>
              <div className="text-[10px] text-teal-800 font-semibold mt-1">
                Rekomendasi: Tinjau limit kredit 3 distributor utama dan hitung cadangan penurunan nilai sesuai PSAK 71.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Detailed Audit Findings in CCCER Format */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            3. Temuan Audit & Matriks Tindak Lanjut (CCCER Format)
          </h2>

          <div className="space-y-4">
            {findings.map((f, idx) => (
              <div key={f.id} className="border border-slate-200 rounded p-4 text-xs space-y-2.5 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-teal-800 font-semibold">{f.findingNumber}</span>
                    <span>{f.title}</span>
                  </div>
                  <StatusBadge type="severity" value={f.severity} size="sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-700 block">Kondisi (Condition):</span>
                    <p className="text-slate-600 mt-0.5">{f.condition}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Kriteria (Criteria):</span>
                    <p className="text-slate-600 mt-0.5 font-mono">{f.criteria}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Penyebab (Cause):</span>
                    <p className="text-slate-600 mt-0.5">{f.cause}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Akibat / Dampak (Effect):</span>
                    <p className="text-slate-600 mt-0.5 font-semibold text-amber-900">{f.effect}</p>
                  </div>
                </div>

                <div className="bg-teal-50/60 p-2.5 rounded border border-teal-100 text-[11px]">
                  <span className="font-bold text-teal-900 block">Rekomendasi Auditor:</span>
                  <p className="text-teal-800 mt-0.5">{f.recommendation}</p>
                </div>

                {f.managementResponse && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800 block">Tanggapan Manajemen:</span>
                    <p className="text-slate-700 mt-0.5">{f.managementResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Sign-off & Audit Partner Approval */}
        <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between text-xs">
          <div>
            <div className="text-slate-500">Ditandatangani untuk dan atas nama:</div>
            <div className="font-bold text-slate-900 mt-1">KAP Tanudiredja, Wibisana, Rintis & Rekan</div>
            <div className="mt-8">
              <div className="font-bold text-slate-900 underline">Bambang Hendrawan, SE, Ak, CA, CPA</div>
              <div className="text-slate-600">Pemimpin Rekan (Managing Partner)</div>
              <div className="text-slate-500 font-mono text-[10px]">Ijin Akuntan Publik No. AP.0824</div>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              OTORISASI SAH DIVERIFIKASI
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Checksum: 9a7f-4c12-88ef-2026-v3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
