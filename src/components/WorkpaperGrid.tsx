'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Edit2,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { AccountMapping, Evidence } from '@/types/domain';
import { formatIdr, formatPercent, calculateVariance } from '@/lib/currency';
import { StatusBadge } from './StatusBadge';
import { EvidenceDrawer } from './EvidenceDrawer';

interface WorkpaperGridProps {
  mappings: AccountMapping[];
  materialityThresholdIdr: number;
  onOverrideMapping?: (mappingId: string, newSection: string, reason: string) => void;
  isReadOnly?: boolean;
}

export const WorkpaperGrid: React.FC<WorkpaperGridProps> = ({
  mappings: initialMappings,
  materialityThresholdIdr,
  onOverrideMapping,
  isReadOnly = false,
}) => {
  const [mappings, setMappings] = useState<AccountMapping[]>(initialMappings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  // Override Modal State
  const [overrideItem, setOverrideItem] = useState<AccountMapping | null>(null);
  const [newSection, setNewSection] = useState('F.1');
  const [overrideReason, setOverrideReason] = useState('');

  const filtered = mappings.filter((m) => {
    const matchesSearch =
      m.sourceAccountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sourceAccountName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection =
      selectedSectionFilter === 'ALL' || m.standardWorkpaperSection === selectedSectionFilter;
    return matchesSearch && matchesSection;
  });

  const handleOpenOverride = (item: AccountMapping) => {
    if (isReadOnly) return;
    setOverrideItem(item);
    setNewSection(item.standardWorkpaperSection);
    setOverrideReason('');
  };

  const handleConfirmOverride = () => {
    if (!overrideItem) return;
    const updated = mappings.map((m) => {
      if (m.id === overrideItem.id) {
        return {
          ...m,
          standardWorkpaperSection: newSection,
          mappingStatus: 'overridden' as const,
          isAmbiguous: false,
          rationale: `Override manual oleh Senior: ${overrideReason || 'Penyesuaian klasifikasi akun fiskal/komersial'}`,
        };
      }
      return m;
    });
    setMappings(updated);
    if (onOverrideMapping) {
      onOverrideMapping(overrideItem.id, newSection, overrideReason);
    }
    setOverrideItem(null);
  };

  const handleOpenEvidence = (m: AccountMapping) => {
    setSelectedEvidence({
      id: m.evidenceId || 'EVD-WP-DEFAULT',
      engagementId: m.engagementId,
      documentId: 'DOC-001',
      documentName: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
      fileType: 'xlsx',
      sheetName: 'TrialBalance_2025',
      cellReference: `Sheet1!C${m.sourceAccountCode.split('-')[0]}:E${m.sourceAccountCode.split('-')[0]}`,
      sourceValue: m.endingBalanceIdr.toLocaleString('id-ID'),
      normalizedValue: m.endingBalanceIdr,
      confidence: m.confidenceScore,
      extractionMethod: 'deterministic_parse',
      snippetText: `${m.sourceAccountCode} ${m.sourceAccountName} | Saldo Akhir: Rp ${m.endingBalanceIdr.toLocaleString('id-ID')}`,
      timestamp: new Date().toISOString(),
    });
  };

  // Ambiguous count
  const ambiguousCount = mappings.filter((m) => m.isAmbiguous).length;

  return (
    <div className="space-y-4">
      {/* Evidence Drawer */}
      <EvidenceDrawer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />

      {/* Ambiguous Mapping Alert Banner */}
      {ambiguousCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Antrean Review Pemetaan Akun ({ambiguousCount} Akun Ambigu)</div>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Ditemukan akun dengan nama atau sifat penampungan (suspense) yang memiliki tingkat keyakinan rendah (&lt;70%). 
                Sesuai prinsip FINOVA, sistem tidak menebak secara serampangan—wajib dikonfirmasi oleh auditor senior.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const amb = mappings.find((m) => m.isAmbiguous);
              if (amb) handleOpenOverride(amb);
            }}
            disabled={isReadOnly}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded text-[11px] shrink-0"
          >
            Review Akun Ambigu
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode akun atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Seksi Kertas Kerja:</span>
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="ALL">Semua Seksi (COA Lengkap)</option>
            <option value="A.1">A.1 Kas & Setara Kas</option>
            <option value="A.2">A.2 Piutang Usaha</option>
            <option value="A.3">A.3 Persediaan</option>
            <option value="B.1">B.1 Aset Tetap</option>
            <option value="C.1">C.1 Liabilitas Jangka Pendek</option>
            <option value="C.2">C.2 Utang Pajak</option>
            <option value="D.1">D.1 Ekuitas & Saldo Laba</option>
            <option value="E.1">E.1 Pendapatan Usaha</option>
            <option value="E.2">E.2 Beban Pokok (COGS)</option>
            <option value="F.1">F.1 Beban Operasional</option>
            <option value="F.2">F.2 Beban/Pendapatan Lain-lain</option>
          </select>
        </div>
      </div>

      {/* Dense Financial Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-3 border-r border-slate-200">Kode Akun</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Nama Akun (TB Klien)</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Seksi WP</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Saldo 2024 (PY)</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Saldo 2025 (CY)</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Varians (IDR)</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">%</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200">Status Pemetaan</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => {
                const { absoluteVariance, percentageVariance } = calculateVariance(
                  item.endingBalanceIdr,
                  item.priorYearBalanceIdr
                );
                const isMaterial = Math.abs(absoluteVariance) >= materialityThresholdIdr;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.isAmbiguous ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Account Code */}
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800 border-r border-slate-200">
                      {item.sourceAccountCode}
                    </td>

                    {/* Account Name & Rationale */}
                    <td className="py-2 px-3 border-r border-slate-200 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">{item.sourceAccountName}</div>
                      <div className="text-[10px] text-slate-500 truncate" title={item.rationale}>
                        {item.rationale}
                      </div>
                    </td>

                    {/* Standard Workpaper Section */}
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className="font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {item.standardWorkpaperSection}
                      </span>
                    </td>

                    {/* Prior Year Balance */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600 border-r border-slate-200">
                      {formatIdr(item.priorYearBalanceIdr)}
                    </td>

                    {/* Current Year Ending Balance */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 border-r border-slate-200">
                      {formatIdr(item.endingBalanceIdr)}
                    </td>

                    {/* Absolute Variance */}
                    <td
                      className={`py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 ${
                        isMaterial ? 'font-bold text-amber-900 bg-amber-50/30' : 'text-slate-700'
                      }`}
                    >
                      {formatIdr(absoluteVariance)}
                      {isMaterial && (
                        <span className="ml-1 text-[9px] px-1 rounded bg-amber-200 text-amber-800 font-sans uppercase">
                          Material
                        </span>
                      )}
                    </td>

                    {/* Percentage Variance */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-slate-200 text-slate-700">
                      {formatPercent(percentageVariance)}
                    </td>

                    {/* Mapping Status */}
                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      {item.isAmbiguous ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          <AlertCircle className="w-3 h-3" />
                          Ambigu ({(item.confidenceScore * 100).toFixed(0)}%)
                        </span>
                      ) : item.mappingStatus === 'overridden' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Override Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terpetakan ({(item.confidenceScore * 100).toFixed(0)}%)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEvidence(item)}
                          className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded"
                          title="Lihat Bukti Koordinat Asal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleOpenOverride(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Sesuaikan Pemetaan Akun"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Mapping Modal */}
      {overrideItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Penyesuaian Pemetaan Akun Kertas Kerja</h3>
              <p className="text-slate-500 text-[11px]">
                Mengubah seksi lead schedule akun {overrideItem.sourceAccountCode} - {overrideItem.sourceAccountName}.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Pilih Seksi Kertas Kerja Tujuan:</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-600"
                >
                  <option value="A.1">A.1 Kas & Setara Kas</option>
                  <option value="A.2">A.2 Piutang Usaha</option>
                  <option value="A.3">A.3 Persediaan (Inventory)</option>
                  <option value="A.4">A.4 Uang Muka & Biaya Dibayar di Muka</option>
                  <option value="B.1">B.1 Aset Tetap & Akumulasi Penyusutan</option>
                  <option value="C.1">C.1 Liabilitas Jangka Pendek & Utang Usaha</option>
                  <option value="C.2">C.2 Utang Pajak (PPh & PPN)</option>
                  <option value="C.3">C.3 Liabilitas Jangka Panjang</option>
                  <option value="D.1">D.1 Ekuitas & Saldo Laba</option>
                  <option value="E.1">E.1 Pendapatan Usaha</option>
                  <option value="E.2">E.2 Beban Pokok Pendapatan (COGS)</option>
                  <option value="F.1">F.1 Beban Operasional & Administrasi</option>
                  <option value="F.2">F.2 Pendapatan/Beban Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Alasan Penyesuaian Auditor (Audit Trail):</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Contoh: Akun ini merupakan selisih kurs realisasi dari transaksi operasional, dialokasikan ke F.2."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setOverrideItem(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOverride}
                className="px-3 py-1.5 bg-[#0D5C75] hover:bg-[#09475C] text-white rounded text-xs font-semibold"
              >
                Simpan Penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
