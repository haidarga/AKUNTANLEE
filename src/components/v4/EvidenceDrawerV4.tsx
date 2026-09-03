'use client';

import React from 'react';
import { X, FileSpreadsheet, Hash, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { EvidenceLink } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';

interface EvidenceDrawerProps {
  evidence: EvidenceLink | null;
  onClose: () => void;
}

export const EvidenceDrawerV4: React.FC<EvidenceDrawerProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[#DDE4E2] text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#DDE4E2] flex items-center justify-between bg-[#F6F7F5]">
          <div>
            <div className="flex items-center gap-1.5 text-[#0F8F7A] font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              Jejak Bukti Sumber (Evidence Lineage)
            </div>
            <div className="text-sm font-bold text-[#102A32] mt-0.5">
              Baris Kertas Kerja: {evidence.targetLineId}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#52636A] hover:text-[#102A32] hover:bg-[#DDE4E2] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lineage Details */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Target Value Box */}
          <div className="bg-[#E8F5F1] p-3 rounded border border-[#B2DFD6] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#0F8F7A] font-medium block">Nilai Tercantum di Kertas Kerja</span>
              <span className="text-base font-bold font-mono text-[#102A32]">
                {formatIdrNumber(evidence.targetAmountIdr)}
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white text-[#0F8F7A] font-semibold border border-[#B2DFD6]">
              Verified
            </span>
          </div>

          {/* Source Location */}
          <div className="space-y-2">
            <h3 className="font-bold text-[#102A32] text-xs flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#0F8F7A]" />
              Koordinat Dokumen Sumber Asli
            </h3>
            <div className="bg-[#F6F7F5] p-3 rounded border border-[#DDE4E2] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#52636A]">Nama File:</span>
                <span className="font-semibold text-[#102A32]">{evidence.sourceFileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52636A]">Sheet:</span>
                <span className="font-semibold text-[#102A32]">{evidence.sheetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52636A]">Koordinat Sel:</span>
                <span className="font-mono font-bold text-[#0F8F7A] bg-white px-1.5 py-0.2 rounded border border-[#DDE4E2]">
                  {evidence.cellRange}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52636A]">Baris ke-:</span>
                <span className="font-mono text-[#102A32]">{evidence.sourceRowNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52636A]">Nilai Mentah (Raw):</span>
                <span className="font-mono text-[#102A32]">Rp {evidence.sourceRawValue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Source Checksum Integrity */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-[#102A32] text-xs flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#52636A]" />
              Integritas Checksum SHA-256 Sumber
            </h3>
            <div className="p-2.5 bg-[#F6F7F5] rounded border border-[#DDE4E2] font-mono text-[11px] text-[#52636A] break-all">
              {evidence.sourceChecksumSha256}
            </div>
          </div>

          {/* Transformation History */}
          <div className="space-y-2">
            <h3 className="font-bold text-[#102A32] text-xs">
              Rantai Transformasi (Transformation Chain)
            </h3>
            <div className="space-y-1.5 border-l-2 border-[#B2DFD6] pl-3">
              {evidence.transformChain.map((step, idx) => (
                <div key={idx} className="text-[11px] text-[#52636A]">
                  <span className="font-semibold text-[#102A32]">Tahap {idx + 1}:</span> {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#DDE4E2] bg-[#F6F7F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#102A32] hover:bg-[#0C7564] text-white rounded text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
