'use client';

import React from 'react';
import { X, FileText, CheckCircle2, MapPin, Hash, ExternalLink, ShieldCheck } from 'lucide-react';
import { Evidence } from '@/types/domain';
import { formatIdr } from '@/lib/currency';

interface EvidenceDrawerProps {
  evidence: Evidence | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-50 border border-teal-200 rounded text-teal-700">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Inspeksi Bukti Asal (Evidence)</h3>
                <p className="text-xs text-slate-500">ID: {evidence.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Document Info */}
            <div className="rounded border border-slate-200 p-3 bg-white space-y-2">
              <div className="text-slate-500 font-medium">Dokumen Sumber</div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                {evidence.documentName}
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <span>Tipe: <span className="font-mono text-slate-800">{evidence.fileType.toUpperCase()}</span></span>
                {evidence.sheetName && (
                  <span>Sheet: <span className="font-mono text-slate-800">{evidence.sheetName}</span></span>
                )}
              </div>
            </div>

            {/* Coordinates / Cell Reference */}
            <div className="rounded border border-slate-200 p-3 bg-white space-y-2">
              <div className="text-slate-500 font-medium">Koordinat & Lokasi Sel</div>
              <div className="flex items-center gap-2 font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{evidence.cellReference || 'Baris Ekstraksi Terverifikasi'}</span>
              </div>
            </div>

            {/* Extracted Values & Lineage */}
            <div className="rounded border border-slate-200 p-3 bg-white space-y-2">
              <div className="text-slate-500 font-medium">Nilai Terverifikasi</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <div className="text-slate-400">Nilai Mentah (Raw)</div>
                  <div className="font-mono font-medium text-slate-800">{String(evidence.sourceValue)}</div>
                </div>
                <div className="bg-teal-50/50 p-2 rounded border border-teal-100">
                  <div className="text-teal-700 font-medium">Nilai Normalisasi (IDR)</div>
                  <div className="font-mono font-bold text-teal-900">{formatIdr(evidence.normalizedValue)}</div>
                </div>
              </div>
            </div>

            {/* Snippet Context */}
            <div className="rounded border border-slate-200 p-3 bg-white space-y-2">
              <div className="text-slate-500 font-medium">Kutipan Baris Transaksi</div>
              <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {evidence.snippetText}
              </div>
            </div>

            {/* Metadata & Extraction Lineage */}
            <div className="rounded border border-slate-200 p-3 bg-white space-y-2">
              <div className="text-slate-500 font-medium">Integritas Ekstraksi</div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Metode Ekstraksi:</span>
                  <span className="font-medium text-slate-900 font-mono">{evidence.extractionMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tingkat Keyakinan (Confidence):</span>
                  <span className="font-semibold text-emerald-700">{(evidence.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Pencatatan:</span>
                  <span className="font-mono text-slate-700">{new Date(evidence.timestamp).toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Lineage terverifikasi dari dokumen asli klien
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 text-xs font-medium"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
