'use client';
import { createPortal } from 'react-dom';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AuditAdjustmentEntry } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  adjustments: AuditAdjustmentEntry[];
  onAdjustmentCreated: (entry: AuditAdjustmentEntry) => void;
}

export function AuditAdjustmentsModal({
  isOpen,
  onClose,
  engagementId,
  adjustments,
  onAdjustmentCreated,
}: ModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [standardRef, setStandardRef] = useState('PSAK 10');
  const [type, setType] = useState<'reclassification' | 'adjustment'>('reclassification');
  const [debitLine, setDebitLine] = useState('WP-F.4');
  const [debitAmount, setDebitAmount] = useState('310000000');
  const [creditLine, setCreditLine] = useState('WP-C.1');
  const [creditAmount, setCreditAmount] = useState('310000000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalDebit = adjustments.reduce((s, a) => s + a.debitAmountIdr, 0);
  const totalCredit = adjustments.reduce((s, a) => s + a.creditAmountIdr, 0);
  const isBalanced = totalDebit === totalCredit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/engagements/${engagementId}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          standardReference: standardRef,
          debitLineId: debitLine,
          debitAmountIdr: parseInt(debitAmount, 10),
          creditLineId: creditLine,
          creditAmountIdr: parseInt(creditAmount, 10),
          userRole: 'senior',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onAdjustmentCreated(data.data);
        setShowAddForm(false);
        setDescription('');
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof window === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-finova-in">
      <div className="bg-white rounded-3xl border border-[#DDE4E2] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#102A32] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 text-[#0F8F7A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102A32]">
                Jurnal Penyesuaian & Reklasifikasi Audit (AJE / RJE)
              </h2>
              <p className="text-xs text-[#52636A]">
                Pencatatan koreksi audit berstandar Big-4 tanpa memodifikasi buku besar mentah klien.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A8C93] hover:text-[#102A32] hover:bg-[#E2E8E6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className={`p-4 px-6 text-xs flex items-center justify-between border-b ${
          isBalanced ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
        }`}>
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            )}
            <span className="font-semibold">
              {isBalanced ? 'Keseimbangan Jurnal Sempurna: Total Debit = Total Kredit' : 'Perhatian: Total Jurnal Tidak Seimbang'}
            </span>
          </div>
          <div className="font-mono font-bold text-[11px] flex items-center gap-3">
            <span>Debit: Rp {totalDebit.toLocaleString('id-ID')}</span>
            <span>&bull;</span>
            <span>Kredit: Rp {totalCredit.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* List of Adjustments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#102A32] uppercase tracking-wider text-[11px]">
                Daftar Jurnal Aktif ({adjustments.length})
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Jurnal Koreksi</span>
                </button>
              )}
            </div>

            {adjustments.length === 0 ? (
              <div className="p-6 text-center bg-[#F6F7F5] rounded-2xl border border-[#DDE4E2] text-[#52636A]">
                Belum ada jurnal penyesuaian yang dicatat untuk perikatan ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {adjustments.map((a) => (
                  <div key={a.id} className="p-4 rounded-2xl border border-[#DDE4E2] bg-white space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F1F4F3] border border-[#DDE4E2]">
                          #{a.entryNumber} {a.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0F8F7A]/10 text-[#0F8F7A]">
                          {a.type === 'reclassification' ? 'Reklasifikasi (RJE)' : 'Penyesuaian (AJE)'}
                        </span>
                        <span className="text-[11px] text-[#52636A] font-medium">
                          Ref Standar: <strong>{a.standardReference}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7A8C93]">
                        Diajukan oleh: {a.preparedByName}
                      </span>
                    </div>

                    <p className="text-xs text-[#102A32] font-medium leading-relaxed">
                      {a.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F1F4F3] font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-[#E8F5F1] text-[#064E3B] flex justify-between">
                        <span>(Dr) {a.debitLineId}</span>
                        <span className="font-bold">Rp {a.debitAmountIdr.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] flex justify-between">
                        <span>(Cr) {a.creditLineId}</span>
                        <span className="font-bold">Rp {a.creditAmountIdr.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Adjustment Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-5 rounded-2xl border-2 border-[#0F8F7A]/30 bg-[#F6F7F5] space-y-4 animate-finova-in">
              <div className="font-bold text-[#102A32] flex items-center justify-between">
                <span>Form Input Jurnal Penyesuaian / Reklasifikasi Baru</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[#52636A] hover:text-[#102A32]"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#102A32] mb-1">
                  Deskripsi Alasan Koreksi / Reklasifikasi:
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Reklasifikasi akun suspense 2199-00 ke WP-F.4 sesuai PSAK 10"
                  className="w-full px-3 py-2 bg-white border border-[#DDE4E2] rounded-xl focus:ring-1 focus:ring-[#0F8F7A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#102A32] mb-1">
                    Jenis Jurnal:
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDE4E2] rounded-xl"
                  >
                    <option value="reclassification">Reklasifikasi Pos Kertas Kerja (RJE)</option>
                    <option value="adjustment">Penyesuaian Nilai Saldo (AJE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#102A32] mb-1">
                    Dasar Standar Akuntansi:
                  </label>
                  <input
                    type="text"
                    value={standardRef}
                    onChange={(e) => setStandardRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDE4E2] rounded-xl"
                    placeholder="Contoh: PSAK 10, PSAK 1, PSAK 71"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DDE4E2]">
                <div className="space-y-2">
                  <span className="font-bold text-[11px] text-[#0F8F7A] block">Sisi Debit (Dr):</span>
                  <input
                    type="text"
                    value={debitLine}
                    onChange={(e) => setDebitLine(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#DDE4E2] rounded-xl font-mono text-xs"
                    placeholder="Kode Garis (mis: WP-F.4)"
                  />
                  <input
                    type="number"
                    value={debitAmount}
                    onChange={(e) => setDebitAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#DDE4E2] rounded-xl font-mono text-xs"
                    placeholder="Nominal Debit"
                  />
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-[11px] text-[#52636A] block">Sisi Kredit (Cr):</span>
                  <input
                    type="text"
                    value={creditLine}
                    onChange={(e) => setCreditLine(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#DDE4E2] rounded-xl font-mono text-xs"
                    placeholder="Kode Garis (mis: WP-C.1)"
                  />
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#DDE4E2] rounded-xl font-mono text-xs"
                    placeholder="Nominal Kredit"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#102A32] hover:bg-[#0F8F7A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Posting Jurnal & Rekalkulasi Kertas Kerja'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#F6F7F5] border-t border-[#DDE4E2] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#102A32] text-white rounded-xl text-xs font-bold hover:bg-[#0F8F7A] transition-colors cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
