'use client';

import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatIdr, formatPercent } from '@/lib/currency';
import { runFiscalReconciliation, FiscalAdjustmentItem } from '@/lib/tax-engine/fiscal-reconciliation';
import { calculatePph21MonthlyTer, PtkpStatus } from '@/lib/tax-engine/pph21-ter';
import { calculatePph23, Pph23Category } from '@/lib/tax-engine/pph23';
import { reconcilePpn } from '@/lib/tax-engine/ppn';

export const TaxEngineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fiscal' | 'pph21' | 'pph23' | 'ppn'>('fiscal');

  // --- Fiscal Reconciliation State ---
  const [commercialProfit, setCommercialProfit] = useState(4_250_000_000);
  const [grossRevenue, setGrossRevenue] = useState(52_400_000_000);
  const [adjustments, setAdjustments] = useState<FiscalAdjustmentItem[]>([
    {
      id: 'ADJ-1',
      accountCode: '6105-00',
      accountName: 'Beban Jamuan Tamu & Entertainment',
      category: 'entertainment_tanpa_daftar_nominatif',
      adjustmentType: 'positif',
      nature: 'beda_tetap',
      commercialAmountIdr: 215_000_000,
      fiscalAllowedAmountIdr: 65_000_000,
      adjustmentAmountIdr: 150_000_000,
      statutoryBasis: 'SE-27/PJ.22/1986 & PMK 02/PMK.03/2010',
      description: 'Biaya representasi tidak didukung Daftar Nominatif lengkap dengan nama/NPWP pihak ketiga.',
    },
    {
      id: 'ADJ-2',
      accountCode: '6108-00',
      accountName: 'Beban Pengobatan & Fasilitas Natura',
      category: 'biaya_natura_non_deductible',
      adjustmentType: 'positif',
      nature: 'beda_tetap',
      commercialAmountIdr: 145_000_000,
      fiscalAllowedAmountIdr: 60_000_000,
      adjustmentAmountIdr: 85_000_000,
      statutoryBasis: 'PMK 66/2023 Pasal 3 & 4',
      description: 'Fasilitas natura non-3M (bukan perlengkapan keselamatan kerja/area tertentu).',
    },
    {
      id: 'ADJ-3',
      accountCode: '6120-00',
      accountName: 'Beban Sanksi Administrasi Bunga/Denda Pajak STP',
      category: 'sanksi_administrasi_pajak',
      adjustmentType: 'positif',
      nature: 'beda_tetap',
      commercialAmountIdr: 50_000_000,
      fiscalAllowedAmountIdr: 0,
      adjustmentAmountIdr: 50_000_000,
      statutoryBasis: 'UU PPh Pasal 9 ayat 1 huruf k stdd UU HPP',
      description: 'Sanksi denda keterlambatan pembayaran dan pelaporan STP PPh.',
    },
    {
      id: 'ADJ-4',
      accountCode: '7101-00',
      accountName: 'Pendapatan Bunga Deposito Bank Mandiri',
      category: 'penghasilan_final_bunga_deposito',
      adjustmentType: 'negatif',
      nature: 'beda_tetap',
      commercialAmountIdr: 80_000_000,
      fiscalAllowedAmountIdr: 0,
      adjustmentAmountIdr: 80_000_000,
      statutoryBasis: 'PP 131 Tahun 2000 & Pasal 4 ayat 2 UU PPh',
      description: 'Penghasilan telah dikenakan PPh Final 20% oleh bank pemotong.',
    },
  ]);

  const [taxCredits, setTaxCredits] = useState({
    pph22Idr: 50_000_000,
    pph23Idr: 70_000_000,
    pph25Idr: 700_000_000,
  });

  const fiscalResult = runFiscalReconciliation({
    commercialProfitBeforeTaxIdr: commercialProfit,
    grossRevenueIdr: grossRevenue,
    adjustments,
    taxCreditsIdr: taxCredits,
  });

  // --- PPh 21 TER Employees Sample ---
  const pph21Employees: { name: string; ptkp: PtkpStatus; gross: number }[] = [
    { name: 'Budi Hartono (Direktur Keuangan)', ptkp: 'K/3', gross: 45_000_000 },
    { name: 'Suryanto (Plant Manager)', ptkp: 'K/2', gross: 25_000_000 },
    { name: 'Rina Wijaya (Accounting Supervisor)', ptkp: 'K/1', gross: 14_000_000 },
    { name: 'Fajar Nugraha (Sales Executive)', ptkp: 'TK/1', gross: 8_500_000 },
    { name: 'Dewi Anggraini (Staff Administrasi)', ptkp: 'TK/0', gross: 5_200_000 },
  ];

  // --- PPh 23 Vendors Sample ---
  const pph23Transactions: { id: string; vendor: string; npwp?: string; hasNpwp: boolean; cat: Pph23Category; desc: string; dpp: number }[] = [
    { id: 'TX-01', vendor: 'PT Konsultan Tata Kelola', npwp: '01.234.567.8-011.000', hasNpwp: true, cat: 'jasa_teknik_manajemen_konsultasi', desc: 'Jasa Konsultasi SOP ERP', dpp: 75_000_000 },
    { id: 'TX-02', vendor: 'CV Solusi Mesin Mandiri', npwp: '02.345.678.9-022.000', hasNpwp: true, cat: 'jasa_teknik_manajemen_konsultasi', desc: 'Jasa Maintenance Mesin CNC', dpp: 30_000_000 },
    { id: 'TX-03', vendor: 'Rental Crane Nusantara', hasNpwp: false, cat: 'sewa_harta', desc: 'Sewa Alat Angkut Berat Gudang', dpp: 20_000_000 },
    { id: 'TX-04', vendor: 'Dr. Ir. Bambang Soedibyo (Independen)', hasNpwp: false, cat: 'jasa_teknik_manajemen_konsultasi', desc: 'Jasa Desain Cetakan Logam Presisi', dpp: 15_000_000 },
  ];

  // --- PPN Invoices Sample ---
  const ppnFakturs = [
    { fakturNumber: '010.000-25.00000101', transactionDate: '2025-11-05', counterpartyName: 'PT Astra Otoparts Tbk', counterpartyNpwp: '01.000.111.2-051.000', dppAmountIdr: 1_200_000_000, ppnReportedIdr: 132_000_000, type: 'keluaran' as const, isCreditable: true },
    { fakturNumber: '010.000-25.00000102', transactionDate: '2025-11-12', counterpartyName: 'PT Gajah Tunggal Tbk', counterpartyNpwp: '01.000.222.3-052.000', dppAmountIdr: 850_000_000, ppnReportedIdr: 93_500_000, type: 'keluaran' as const, isCreditable: true },
    { fakturNumber: '010.000-25.00000201', transactionDate: '2025-11-02', counterpartyName: 'PT Krakatau Steel Tbk', counterpartyNpwp: '01.000.333.4-053.000', dppAmountIdr: 1_500_000_000, ppnReportedIdr: 165_000_000, type: 'masukan' as const, isCreditable: true },
    { fakturNumber: '010.000-25.00000202', transactionDate: '2025-11-20', counterpartyName: 'CV Supplier Logam Lama', counterpartyNpwp: '02.111.444.5-054.000', dppAmountIdr: 200_000_000, ppnReportedIdr: 20_000_000, type: 'masukan' as const, isCreditable: true }, // Anomaly: 10% instead of 11%
  ];

  const ppnResult = reconcilePpn(ppnFakturs);

  return (
    <div className="space-y-4">
      {/* Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t text-xs">
        <button
          onClick={() => setActiveTab('fiscal')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'fiscal'
              ? 'border-[#0D5C75] text-[#0D5C75] bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Rekonsiliasi Fiskal PPh Badan (22%)
        </button>
        <button
          onClick={() => setActiveTab('pph21')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'pph21'
              ? 'border-[#0D5C75] text-[#0D5C75] bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          PPh Pasal 21 TER (PP 58/2023)
        </button>
        <button
          onClick={() => setActiveTab('pph23')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'pph23'
              ? 'border-[#0D5C75] text-[#0D5C75] bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          PPh Pasal 23 (Potput Jasa 2%)
        </button>
        <button
          onClick={() => setActiveTab('ppn')}
          className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ppn'
              ? 'border-[#0D5C75] text-[#0D5C75] bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          PPN Rekonsiliasi (11% UU HPP)
        </button>
      </div>

      {/* Tab 1: Fiscal Reconciliation */}
      {activeTab === 'fiscal' && (
        <div className="space-y-4">
          {/* Statutory Rule Banner */}
          <div className="bg-white p-4 rounded border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono text-[11px]">
                  RULE-REKON-FISKAL-UU-HPP-2022
                </span>
                <span className="text-slate-500">Versi 1.0.0 &bull; Berlaku Efektif: 2022-01-01</span>
              </div>
              <p className="text-slate-700 text-xs mt-1">
                Dasar Hukum: <span className="font-semibold">UU PPh stdd UU Harmonisasi Peraturan Perpajakan (HPP) No. 7 Tahun 2021</span>. Tarif umum PPh Badan 22%.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Kalkulasi Deterministik Terverifikasi
              </span>
            </div>
          </div>

          {/* Core Calculation Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-slate-500 font-medium">Laba Komersial Sebelum Pajak</div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatIdr(fiscalResult.commercialProfitBeforeTaxIdr)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dari Laporan Laba Rugi</div>
            </div>

            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-slate-500 font-medium">Total Koreksi Fiskal Positif</div>
              <div className="text-base font-bold font-mono text-amber-700 mt-1">
                + {formatIdr(fiscalResult.totalPositiveAdjustmentsIdr)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">3 Akun Penyesuaian</div>
            </div>

            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-slate-500 font-medium">Penghasilan Kena Pajak (PKP)</div>
              <div className="text-base font-bold font-mono text-teal-800 mt-1">
                {formatIdr(fiscalResult.taxableIncomePkpIdr)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dibulatkan ke bawah ribuan</div>
            </div>

            <div className="bg-teal-50/70 p-3 rounded border border-teal-200">
              <div className="text-teal-800 font-medium">PPh Kurang Bayar (Pasal 29)</div>
              <div className="text-base font-bold font-mono text-teal-900 mt-1">
                {formatIdr(fiscalResult.netTaxDueIdr)}
              </div>
              <div className="text-[10px] text-teal-700 mt-0.5">Setelah Kredit Pajak Rp 820 Jt</div>
            </div>
          </div>

          {/* Adjustments Detail Table */}
          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
              <span>Daftar Rincian Koreksi Fiskal Positif & Negatif (Beda Tetap & Waktu)</span>
              <span className="text-[11px] font-normal text-slate-500">
                Omzet Bruto: {formatIdr(grossRevenue)} (Non-Fasilitas Pasal 31E &gt; 50 M)
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2 px-3 border-r border-slate-200">Akun Komersial</th>
                  <th className="py-2 px-3 border-r border-slate-200">Kategori Koreksi</th>
                  <th className="py-2 px-3 border-r border-slate-200">Sifat</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200">Komersial</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200">Diakui Fiskal</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200">Nilai Koreksi</th>
                  <th className="py-2 px-3">Dasar Peraturan Perpajakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono border-r border-slate-200">
                      <div className="font-semibold text-slate-800">{adj.accountCode}</div>
                      <div className="text-[10px] text-slate-500">{adj.accountName}</div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        adj.adjustmentType === 'positif' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Koreksi {adj.adjustmentType.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 capitalize text-slate-600 text-[11px]">
                      {adj.nature.replace('_', ' ')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600 border-r border-slate-200">
                      {formatIdr(adj.commercialAmountIdr)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600 border-r border-slate-200">
                      {formatIdr(adj.fiscalAllowedAmountIdr)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold border-r border-slate-200 text-slate-900">
                      {formatIdr(adj.adjustmentAmountIdr)}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                      {adj.statutoryBasis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation Lineage Box */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Formula Rekonsiliasi & Jejak Audit (Lineage)
            </div>
            <div className="text-slate-600 leading-relaxed">
              {fiscalResult.explanation}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PPh 21 TER */}
      {activeTab === 'pph21' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono text-[11px]">
                RULE-PPH21-TER-2024
              </span>
              <span className="text-slate-500">PP Nomor 58 Tahun 2023 & PMK 168/2023</span>
            </div>
            <p className="text-slate-700 text-xs mt-1">
              Pemotongan PPh 21 bulanan menggunakan Tarif Efektif Rata-Rata (TER) Kategori A, B, atau C berdasarkan status PTKP.
            </p>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800">
              Kalkulasi Payroll Karyawan Tetap (Simulasi Bulan Desember 2025)
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2 px-3 border-r border-slate-200">Nama Karyawan</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Status PTKP</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Kategori TER</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200">Penghasilan Bruto (IDR)</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Tarif TER</th>
                  <th className="py-2 px-3 text-right">PPh 21 Dipotong (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pph21Employees.map((emp, i) => {
                  const res = calculatePph21MonthlyTer(emp.name, emp.ptkp, emp.gross);
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900 border-r border-slate-200">
                        {emp.name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {emp.ptkp}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <span className="font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {res.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 border-r border-slate-200">
                        {formatIdr(emp.gross)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">
                        {(res.terRate * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-teal-900">
                        {formatIdr(res.terTaxWithheldIdr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: PPh 23 */}
      {activeTab === 'pph23' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono text-[11px]">
                RULE-PPH23-SERVICES-2021
              </span>
              <span className="text-slate-500">Pasal 23 UU PPh & PMK 141/PMK.03/2015</span>
            </div>
            <p className="text-slate-700 text-xs mt-1">
              Tarif 2% atas jasa manajemen/konsultasi/teknik. Bagi wajib pajak yang tidak memiliki NPWP, dikenakan tarif 100% lebih tinggi (4%).
            </p>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2 px-3 border-r border-slate-200">Nama Vendor / Penerima</th>
                  <th className="py-2 px-3 border-r border-slate-200">Keterangan Jasa</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">NPWP Tervalidasi</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200">DPP Bruto</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Tarif Efektif</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200">PPh 23 Dipotong</th>
                  <th className="py-2 px-3 text-right">Net Dibayarkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pph23Transactions.map((tx) => {
                  const res = calculatePph23({
                    transactionId: tx.id,
                    vendorName: tx.vendor,
                    vendorNpwp: tx.npwp,
                    hasValidNpwp: tx.hasNpwp,
                    category: tx.cat,
                    description: tx.desc,
                    dppAmountIdr: tx.dpp,
                  });
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                        {tx.vendor}
                      </td>
                      <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                        {tx.desc}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        {tx.hasNpwp ? (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Valid ({tx.npwp})
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Tanpa NPWP (+100%)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800 border-r border-slate-200">
                        {formatIdr(tx.dpp)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                        {(res.effectiveRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-amber-800 border-r border-slate-200">
                        {formatIdr(res.withholdingTaxIdr)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatIdr(res.netPayableIdr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: PPN Reconciliation */}
      {activeTab === 'ppn' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono text-[11px]">
                RULE-PPN-11PCT-2022
              </span>
              <span className="text-slate-500">UU HPP Pasal 7 ayat 1 (Tarif PPN 11%)</span>
            </div>
            <p className="text-slate-700 text-xs mt-1">
              Rekonsiliasi Faktur Pajak Masukan yang dapat dikreditkan terhadap Faktur Pajak Keluaran masa pajak.
            </p>
          </div>

          {/* Anomaly Callout */}
          {ppnResult.anomaliesDetected.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold">Anomali Perhitungan Tarif PPN Terdeteksi!</div>
                <div className="text-[11px] mt-0.5">
                  Faktur {ppnResult.anomaliesDetected[0].fakturNumber} memiliki nilai PPN Rp 20.000.000 atas DPP Rp 200.000.000 (10%). 
                  Sejak 1 April 2022, tarif resmi adalah 11% (Rp 22.000.000). Selisih Rp 2.000.000 berisiko ditolak DJP.
                </div>
              </div>
            </div>
          )}

          {/* PPN Position Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-slate-500 font-medium">Total PPN Keluaran (Penjualan)</div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatIdr(ppnResult.totalPpnKeluaranIdr)}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="text-slate-500 font-medium">Total PPN Masukan Dapat Dikreditkan</div>
              <div className="text-base font-bold font-mono text-emerald-800 mt-1">
                {formatIdr(ppnResult.totalPpnMasukanCreditableIdr)}
              </div>
            </div>
            <div className="bg-teal-50/70 p-3 rounded border border-teal-200">
              <div className="text-teal-800 font-medium">Posisi Net PPN (Kurang Bayar)</div>
              <div className="text-base font-bold font-mono text-teal-900 mt-1">
                {formatIdr(ppnResult.netPpnPositionIdr)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
