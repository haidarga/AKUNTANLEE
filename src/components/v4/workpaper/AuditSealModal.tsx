'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Lock,
  CheckCircle2,
  FileCheck,
  QrCode,
  Building,
} from 'lucide-react';

interface SealModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  onSealed: (sealHash: string) => void;
}

export function AuditSealModal({
  isOpen,
  onClose,
  engagementId,
  onSealed,
}: SealModalProps) {
  const [partnerApNumber, setPartnerApNumber] = useState('AP.0942');
  const [partnerPin, setPartnerPin] = useState('2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/engagements/${engagementId}/seal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerApNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setCertificateData(data.data);
        onSealed(data.data.certificateHash);
      } else {
        alert(`Gagal menandatangani: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-finova-in">
      <div className="bg-white rounded-3xl border border-[#DDE4E2] shadow-2xl max-w-xl w-full overflow-hidden">
        {certificateData ? (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#ECFDF5] border-2 border-[#10B981] text-[#10B981] flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                SERTIFIKAT AUDIT DIGITAL RESMI
              </span>
              <h2 className="text-xl font-bold text-[#102A32] tracking-tight">
                Kertas Kerja Berhasil Disahkan & Disegel
              </h2>
              <p className="text-xs text-[#52636A]">
                Perikatan telah dikunci permanen (Tamper-Proof Lock) oleh Signing Partner.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F6F7F5] border border-[#DDE4E2] text-left font-mono text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#52636A]">Signing Partner:</span>
                <span className="font-bold text-[#102A32]">Haidar, CPA, CA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52636A]">Nomor Register Akuntan Publik:</span>
                <span className="font-bold text-[#102A32]">{partnerApNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52636A]">KAP Terdaftar:</span>
                <span className="font-bold text-[#102A32]">KAP Haidar & Rekan (KMK 492)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#DDE4E2]">
                <span className="text-[#52636A]">Segel Kriptografi:</span>
                <span className="font-bold text-[#0F8F7A] text-[11px] break-all">{certificateData.certificateHash}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#102A32] hover:bg-[#0F8F7A] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              Tutup & Kembali ke Kertas Kerja Tersegel
            </button>
          </div>
        ) : (
          <form onSubmit={handleSeal} className="p-6 sm:p-8 space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-[#DDE4E2] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#B7791F] text-white flex items-center justify-center shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A32]">
                    Otorisasi Partner Sign-Off & Segel Digital
                  </h3>
                  <p className="text-[11px] text-[#52636A]">
                    Tindakan ini akan mengunci seluruh kertas kerja menjadi Read-Only.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#7A8C93] hover:text-[#102A32]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#FFF7E8] border border-[#F6E0B5] rounded-2xl text-xs text-[#92400E] space-y-1 leading-relaxed">
              <span className="font-bold block">Peringatan Segel Hukum (Section 45.4):</span>
              Setelah penandatanganan partner, saldo tidak dapat dimutasi kembali tanpa protokol pembukaan segel darurat yang dicatat dalam Audit Trail.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  Nomor Izin Akuntan Publik (AP):
                </label>
                <input
                  type="text"
                  required
                  value={partnerApNumber}
                  onChange={(e) => setPartnerApNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#0F8F7A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  PIN Otorisasi Tanda Tangan Digital Partner:
                </label>
                <input
                  type="password"
                  required
                  value={partnerPin}
                  onChange={(e) => setPartnerPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E2] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#0F8F7A] focus:outline-none"
                  placeholder="Ketik PIN Otorisasi"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#DDE4E2]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-[#DDE4E2] rounded-xl text-[#52636A] font-semibold hover:bg-[#F1F4F3]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Memverifikasi & Menyegel...' : 'Sahkan & Segel Kertas Kerja'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
