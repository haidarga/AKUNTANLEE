'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Receipt,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Building,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { formatIdrNumber } from '@/lib/decimal';

export default function TaxCompliancePage() {
  const [activeSubTab, setActiveSubTab] = useState<'pph21' | 'ppn' | 'badan'>('pph21');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTaxData = async () => {
      try {
        const res = await fetch('/api/v1/tax/calculate');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to load tax data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTaxData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-[#52636A] animate-pulse">
        <Calculator className="w-8 h-8 text-[#0F8F7A] mx-auto mb-2 animate-spin" />
        <p className="text-xs font-semibold">Memuat Engine Pajak Terintegrasi (PPh 21, PPN & SPT 1771)...</p>
      </div>
    );
  }

  const { pph21, ppn, corporateTax } = data;

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F8F7A]/15 text-[#0F8F7A] border border-[#0F8F7A]/30">
              MODUL PAJAK TERINTEGRASI
            </span>
            <span className="text-[10px] text-[#52636A]">Regulasi: PP 58/2023, PMK 168/2023 & UU HPP</span>
          </div>
          <h2 className="text-base font-bold text-[#102A32]">
            Pusat Rekonsiliasi & Kepatuhan Pajak (Tax Intelligence Hub)
          </h2>
          <p className="text-xs text-[#52636A] mt-0.5">
            Otomasi perhitungan PPh 21 tarif efektif (TER), ekualisasi omset SPT Masa PPN 1111, dan koreksi fiskal SPT 1771.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => alert('Laporan Pajak Siap Diekspor ke Format DJP / e-Faktur & e-Bupot.')}
            className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Kertas Kerja Pajak</span>
          </button>
        </div>
      </div>

      {/* Tax Sub-Tabs */}
      <div className="flex border-b border-[#DDE4E2] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('pph21')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'pph21'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>1. PPh 21 Pegawai (TER PP 58/2023)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ppn')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'ppn'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>2. Ekualisasi Omset SPT Masa PPN 1111</span>
        </button>

        <button
          onClick={() => setActiveSubTab('badan')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'badan'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>3. Rekonsiliasi Fiskal PPh Badan (SPT 1771)</span>
        </button>
      </div>

      {/* TAB 1: PPH 21 TER */}
      {activeSubTab === 'pph21' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs">
              <span className="text-[11px] text-[#52636A] block">Total Potongan PPh 21 Bulanan (Masa)</span>
              <strong className="text-lg font-mono font-bold text-[#102A32] block mt-1">
                Rp {pph21.totalMonthlyWithholdingIdr.toLocaleString('id-ID')}
              </strong>
              <span className="text-[10px] text-[#0F8F7A] font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Metode TER Kategori A, B & C
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs">
              <span className="text-[11px] text-[#52636A] block">Estimasi PPh 21 Tahunan (Pasal 17 UU HPP)</span>
              <strong className="text-lg font-mono font-bold text-[#102A32] block mt-1">
                Rp {pph21.totalAnnualWithholdingIdr.toLocaleString('id-ID')}
              </strong>
              <span className="text-[10px] text-[#52636A] block mt-1">Dihitung dari PKP tahunan setelah PTKP</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs">
              <span className="text-[11px] text-[#52636A] block">Jumlah Pegawai Tetap Terdaftar</span>
              <strong className="text-lg font-mono font-bold text-[#0F8F7A] block mt-1">
                {pph21.monthlyList.length} Personil
              </strong>
              <span className="text-[10px] text-[#52636A] block mt-1">Staf Direksi hingga Operator Pabrik</span>
            </div>
          </div>

          {/* Table: Monthly TER Withholding */}
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#DDE4E2] bg-[#F6F7F5]/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#102A32]">
                  Daftar Perhitungan Pemotongan PPh 21 Masa Bulanan (Januari - November)
                </h3>
                <p className="text-[11px] text-[#52636A]">
                  Menggunakan tabel Tarif Efektif Rata-Rata (TER) PP 58/2023 berdasarkan status PTKP.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                SIAP BUKTI POTONG
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F6F7F5] text-[#52636A] border-b border-[#DDE4E2] font-semibold">
                  <tr>
                    <th className="p-3">Nama Pegawai & Jabatan</th>
                    <th className="p-3">Status PTKP</th>
                    <th className="p-3">Kategori TER</th>
                    <th className="p-3 text-right">Penghasilan Bruto</th>
                    <th className="p-3 text-center">Tarif TER</th>
                    <th className="p-3 text-right">PPh 21 Terpotong</th>
                    <th className="p-3 text-right">Take Home Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4E2]">
                  {pph21.monthlyList.map((row: any) => (
                    <tr key={row.employeeId} className="hover:bg-[#F6F7F5]/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-[#102A32]">{row.employeeName}</div>
                        <div className="text-[10px] text-[#52636A]">{row.position}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono px-2 py-0.5 rounded bg-[#F6F7F5] border border-[#DDE4E2] font-bold">
                          {row.ptkpStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#0F8F7A]/10 text-[#0F8F7A] font-bold">
                          TER {row.terCategory}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        Rp {row.grossIncomeIdr.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#0F8F7A]">
                        {row.terRatePercent}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#C83E4D]">
                        Rp {row.monthlyPph21Idr.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#102A32]">
                        Rp {row.takeHomePayIdr.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PPN EQUALIZATION */}
      {activeSubTab === 'ppn' && (
        <div className="space-y-6">
          {/* Status Box */}
          <div className="p-5 rounded-2xl bg-[#E8F5F1] border border-[#B2DFD6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-[#0F8F7A] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-[#0F8F7A] uppercase tracking-wider">
                  Status Ekualisasi PPN: {ppn.equalization.isBalanced ? 'SEIMBANG 100% (AUDIT PROOF)' : 'SELISIH DETEKSI'}
                </h3>
                <p className="text-xs text-[#102A32] mt-0.5">
                  {ppn.equalization.auditRemarks}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-[#52636A] block">Tingkat Risiko Pemeriksaan (SP2DK)</span>
              <span className="font-bold text-xs px-2.5 py-1 rounded-full bg-white text-[#0F8F7A] border border-[#B2DFD6]">
                RISIKO: {ppn.equalization.taxAuditRiskLevel}
              </span>
            </div>
          </div>

          {/* Equalization Bridge Table */}
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#DDE4E2] bg-[#F6F7F5]/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#102A32]">
                  Jembatan Rekonsiliasi Omset Laba Rugi Komersial vs DPP SPT Masa PPN 1111
                </h3>
                <p className="text-[11px] text-[#52636A]">
                  Kertas kerja baku yang biasa diminta oleh Account Representative (AR) Kantor Pajak saat pemeriksaan.
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[#DDE4E2]">
                <span className="font-bold text-[#102A32]">Peredaran Usaha Komersial (Akun WP-F.1 Laba Rugi)</span>
                <span className="font-mono font-bold text-sm text-[#102A32]">
                  Rp {ppn.equalization.accountingRevenueIdr.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[#DDE4E2]">
                <span className="font-bold text-[#102A32]">Total DPP Dilaporkan di 12 SPT Masa PPN 1111</span>
                <span className="font-mono font-bold text-sm text-[#0F8F7A]">
                  Rp {ppn.equalization.totalDppSptPpnIdr.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[#DDE4E2] bg-[#F6F7F5]/60 px-2 rounded-lg">
                <span className="font-semibold text-[#52636A]">Selisih Kotor (Raw Variance)</span>
                <span className="font-mono font-bold text-[#B7791F]">
                  Rp {ppn.equalization.rawDifferenceIdr.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Bridge Items */}
              <div className="pt-2">
                <h4 className="font-bold text-[11px] text-[#52636A] uppercase tracking-wider mb-2">
                  Penjelasan Selisih Objek Pajak (Bridge Items):
                </h4>
                <div className="space-y-2">
                  {ppn.equalization.bridgeItems.map((item: any) => (
                    <div key={item.id} className="p-3 rounded-xl border border-[#DDE4E2] bg-[#F6F7F5]/30 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.category === 'tambah' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.category === 'tambah' ? '(+) Menambah DPP' : '(-) Mengurangi DPP'}
                          </span>
                          <span className="font-bold text-[#102A32]">{item.description}</span>
                        </div>
                        <p className="text-[11px] text-[#52636A] mt-1">{item.notes}</p>
                        <span className="text-[10px] font-mono text-[#0F8F7A] mt-0.5 block">
                          Dasar Hukum: {item.regulationReference}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs shrink-0">
                        {item.amountIdr >= 0 ? '+' : ''} Rp {item.amountIdr.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Balance */}
              <div className="flex justify-between items-center py-3 bg-[#E8F5F1] px-4 rounded-xl border border-[#B2DFD6] font-bold mt-4">
                <span className="text-[#0F8F7A]">Selisih Belum Dijelaskan (Unexplained Discrepancy)</span>
                <span className="font-mono text-sm text-[#0F8F7A]">
                  Rp {ppn.equalization.unexplainedDifferenceIdr.toLocaleString('id-ID')} (NIHIL)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CORPORATE FISCAL RECONCILIATION */}
      {activeSubTab === 'badan' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs">
              <span className="text-[11px] text-[#52636A] block">Laba Komersial Sebelum Pajak</span>
              <strong className="text-lg font-mono font-bold text-[#102A32] block mt-1">
                Rp {corporateTax.commercialNetProfitBeforeTaxIdr.toLocaleString('id-ID')}
              </strong>
              <span className="text-[10px] text-[#52636A] block mt-1">Kertas Kerja Akun WP-E.2</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs">
              <span className="text-[11px] text-[#52636A] block">Penghasilan Kena Pajak (PKP Fiskal)</span>
              <strong className="text-lg font-mono font-bold text-[#0F8F7A] block mt-1">
                Rp {corporateTax.fiscalTaxableIncomeIdr.toLocaleString('id-ID')}
              </strong>
              <span className="text-[10px] text-[#0F8F7A] font-semibold block mt-1">
                Setelah Koreksi Positif & Negatif
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs">
              <span className="text-[11px] text-[#52636A] block">PPh Pasal 29 (Kurang Bayar Tahunan)</span>
              <strong className="text-lg font-mono font-bold text-[#C83E4D] block mt-1">
                Rp {corporateTax.underpaymentArticle29Idr.toLocaleString('id-ID')}
              </strong>
              <span className="text-[10px] text-[#52636A] block mt-1">
                Setelah dipotong Kredit Pajak (PPh 22, 23, 25)
              </span>
            </div>
          </div>

          {/* Detailed Fiscal Adjustments */}
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#DDE4E2] bg-[#F6F7F5]/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#102A32]">
                  Rincian Koreksi Fiskal Positif & Negatif (Lampiran I SPT 1771)
                </h3>
                <p className="text-[11px] text-[#52636A]">
                  Penyesuaian beda tetap sesuai Undang-Undang Pajak Penghasilan (UU PPh No. 7/2021).
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                FASILITAS PASAL 31E: AKTIF
              </span>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Positive Corrections */}
              <div>
                <h4 className="font-bold text-xs text-[#C83E4D] flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Koreksi Fiskal Positif (Menambah Penghasilan Kena Pajak):
                </h4>
                <div className="space-y-2">
                  {corporateTax.positiveCorrections.map((pos: any) => (
                    <div key={pos.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-[#102A32]">{pos.accountName}</div>
                        <p className="text-[11px] text-[#52636A] mt-0.5">{pos.rationale}</p>
                        <span className="text-[10px] font-mono text-[#C83E4D] font-semibold mt-1 block">
                          Dasar Hukum: {pos.taxLawBasis}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#C83E4D] shrink-0">
                        + Rp {pos.amountIdr.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Corrections */}
              <div>
                <h4 className="font-bold text-xs text-[#0F8F7A] flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Koreksi Fiskal Negatif (Mengurangi Penghasilan Kena Pajak):
                </h4>
                <div className="space-y-2">
                  {corporateTax.negativeCorrections.map((neg: any) => (
                    <div key={neg.id} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-[#102A32]">{neg.accountName}</div>
                        <p className="text-[11px] text-[#52636A] mt-0.5">{neg.rationale}</p>
                        <span className="text-[10px] font-mono text-[#0F8F7A] font-semibold mt-1 block">
                          Dasar Hukum: {neg.taxLawBasis}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#0F8F7A] shrink-0">
                        - Rp {neg.amountIdr.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax Calculation Breakdown */}
              <div className="pt-3 border-t border-[#DDE4E2] space-y-2 bg-[#F6F7F5] p-4 rounded-xl">
                <div className="flex justify-between items-center font-bold">
                  <span>Penghasilan Kena Pajak (PKP) Final</span>
                  <span className="font-mono text-sm">Rp {corporateTax.fiscalTaxableIncomeIdr.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[#52636A]">
                  <span>PPh Terutang Badan (Tarif Efektif dengan Fasilitas Ps 31E)</span>
                  <span className="font-mono font-bold text-[#102A32]">Rp {corporateTax.effectiveTaxAmountIdr.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-[#52636A]">
                  <span>Total Kredit Pajak (PPh 22, PPh 23 & Angsuran PPh 25)</span>
                  <span className="font-mono font-bold text-[#0F8F7A]">- Rp {corporateTax.taxCreditsIdr.totalTaxCreditsIdr.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-[#C83E4D] border-t border-[#DDE4E2] pt-2">
                  <span>PPh Pasal 29 yang Wajib Disetor (Kurang Bayar)</span>
                  <span className="font-mono text-sm">Rp {corporateTax.underpaymentArticle29Idr.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
