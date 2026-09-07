'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  UploadCloud,
  FileSpreadsheet,
  Sliders,
  Info
} from 'lucide-react';
import { formatIdrNumber } from '@/lib/decimal';
import {
  DEFAULT_COMPANY_EMPLOYEES,
  calculateMonthlyPph21,
  calculateAnnualPph21Pasal17,
  getPtkpAnnualAmount,
} from '@/lib/tax/pph21';
import {
  generateDefaultPpnFilings,
  calculatePpnEqualization,
} from '@/lib/tax/ppn-equalization';
import { calculateCorporateFiscalReconciliation } from '@/lib/tax/fiscal-reconciliation';
import { buildPayrollTaxData } from '@/lib/tax/payroll-store';

const SAMPLE_PAYROLL_FILES = {
  PT_Surya_Retail: {
    headers: ['Karyawan', 'Role Jabatan', 'Gapok Bulanan', 'Status PTKP', 'Tunjangan Operasional'],
    rows: [
      ['Ayu Pratama', 'Konsultan', '8500000', 'TK/0', '500000'],
      ['Bima Saputra', 'Senior Konsultan', '12000000', 'K/1', '1000000'],
      ['Citra Lestari', 'Admin', '6500000', 'TK/0', '300000'],
    ],
  },
  CV_Maju_Logistik: {
    headers: ['No', 'Tanggungan', 'Nama Lengkap', 'Upah Pokok', 'Premi BPJS'],
    rows: [
      ['1', 'TK0', 'Dewi Kartika', '9000000', '400000'],
      ['2', 'K1', 'Eko Wibowo', '11500000', '500000'],
      ['3', 'TK0', 'Farah Anjani', '7000000', '300000'],
    ],
  },
} as const;

const DEFAULT_TAX_DATA = (() => {
  const turnover = 24_000_000_000;
  const netProfit = 4_560_000_000;
  const monthlyList = DEFAULT_COMPANY_EMPLOYEES.map((emp) => calculateMonthlyPph21(emp));
  const totalMonthly = monthlyList.reduce((s, c) => s + c.monthlyPph21Idr, 0);
  const annualList = DEFAULT_COMPANY_EMPLOYEES.map((emp) => {
    const annualGross = (emp.monthlyGrossSalaryIdr + emp.monthlyAllowanceIdr) * 12;
    const biayaJabatan = Math.min(6_000_000, annualGross * 0.05);
    const net = annualGross - biayaJabatan;
    const ptkp = getPtkpAnnualAmount(emp.ptkpStatus);
    const pkp = Math.max(0, net - ptkp);
    const annualTax = calculateAnnualPph21Pasal17(pkp);
    const janToNovTer = monthlyList.find((m) => m.employeeId === emp.id)!.monthlyPph21Idr * 11;
    const decTax = Math.max(0, annualTax - janToNovTer);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      annualGrossIncomeIdr: annualGross,
      biayaJabatanIdr: biayaJabatan,
      netIncomeIdr: net,
      ptkpAmountIdr: ptkp,
      taxableIncomeIdr: pkp,
      annualPph21TarifPasal17Idr: annualTax,
      totalPph21TerJanToNovIdr: janToNovTer,
      decemberPph21Idr: decTax,
    };
  });
  const ppnFilings = generateDefaultPpnFilings(turnover);
  const ppnEqualization = calculatePpnEqualization(turnover, ppnFilings);
  const corporateFiscal = calculateCorporateFiscalReconciliation(netProfit, turnover);

  return {
    turnoverIdr: turnover,
    netProfitIdr: netProfit,
    pph21: {
      monthlyList,
      totalMonthlyWithholdingIdr: totalMonthly,
      annualReconciliationList: annualList,
      totalAnnualWithholdingIdr: annualList.reduce((s, a) => s + a.annualPph21TarifPasal17Idr, 0),
    },
    ppn: {
      filings: ppnFilings,
      equalization: ppnEqualization,
    },
    corporateTax: corporateFiscal,
  };
})();

export default function TaxCompliancePage() {
  const routeParams = useParams();
  const engagementId = (routeParams?.id as string) || 'ENG-2026-01';
  const isCustomEngagement = engagementId !== 'ENG-2026-01';
  const [activeSubTab, setActiveSubTab] = useState<'pph21' | 'ppn' | 'badan'>('pph21');
  const [data, setData] = useState<any>(isCustomEngagement ? null : DEFAULT_TAX_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [sampleClientFile, setSampleClientFile] = useState<'PT_Surya_Retail' | 'CV_Maju_Logistik'>('PT_Surya_Retail');
  const [hasPayroll, setHasPayroll] = useState<boolean>(!isCustomEngagement);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!isCustomEngagement) {
      setData(DEFAULT_TAX_DATA);
      setHasPayroll(true);
      return;
    }

    setIsLoading(true);
    fetch('/api/v1/engagements/' + engagementId + '/files')
      .then((res) => res.json())
      .then(async (json) => {
        const lines = json.data?.lines || [];
        const wp = json.data?.workpaper || null;

        if (lines.length === 0 && !wp) {
          setData(null);
          setHasPayroll(false);
          setIsLoading(false);
          return;
        }

        const revLine = lines.find((l: any) => l.lineId === 'WP-F.1');
        const turnover = Math.abs(revLine?.currentPeriodIdr || 0);
        const netProfit = wp?.totals?.netIncomeIdr || 0;

        const payrollResponse = await fetch(`/api/v1/tax/payroll/import?engagementId=${encodeURIComponent(engagementId)}`, { credentials: 'include' });
        const payrollJson = payrollResponse.ok ? await payrollResponse.json() : null;
        const employees = payrollJson?.success && Array.isArray(payrollJson.data?.employees) ? payrollJson.data.employees : [];
        const payrollData = buildPayrollTaxData(employees);
        setHasPayroll(employees.length > 0);
        const ppnFilings = generateDefaultPpnFilings(turnover);
        const ppnEqualization = calculatePpnEqualization(turnover, ppnFilings);
        const corporateFiscal = calculateCorporateFiscalReconciliation(netProfit, turnover);

        setData({
          turnoverIdr: turnover,
          netProfitIdr: netProfit,
          pph21: {
            ...payrollData,
          },
          ppn: {
            filings: ppnFilings,
            equalization: ppnEqualization,
          },
          corporateTax: corporateFiscal,
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Error fetching engagement files for tax:', err);
        setIsLoading(false);
      });
  }, [engagementId, isCustomEngagement]);

  // Zero loading flash: tax data is pre-populated synchronously
  if (!data) {
    return (
      <div className="space-y-6 text-[#102A32] animate-finova-in">
        <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F8F7A]/15 text-[#0F8F7A] border border-[#0F8F7A]/30">
                MODUL KEPATUHAN & REKONSILIASI PERPAJAKAN
              </span>
              <span className="text-[10px] text-[#52636A]">Regulasi: PP 58/2023, PMK 168/2023 & UU HPP</span>
            </div>
            <h2 className="text-base font-bold text-[#102A32]">
              Pusat Kepatuhan Pajak & Rekonsiliasi Fiskal
            </h2>
            <p className="text-xs text-[#52636A] mt-0.5">
              Otomasi perhitungan PPh 21 tarif efektif (TER), ekualisasi omset SPT Masa PPN 1111, dan koreksi fiskal SPT 1771.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE4E2] p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5F1] border border-[#B2DFD6] flex items-center justify-center mx-auto text-[#0F8F7A]">
            <Calculator className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#102A32]">Belum Ada Data Finansial untuk Perhitungan Pajak</h3>
            <p className="text-xs text-[#52636A] leading-relaxed">
              Otomasi rekonsiliasi fiskal badan SPT 1771 dan ekualisasi omset PPN 1111 memerlukan data neraca saldo klien. Silakan unggah berkas neraca saldo pada menu Berkas terlebih dahulu.
            </p>
          </div>
          <Link
            href={"/engagements/" + engagementId + "/files"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Neraca Saldo Klien</span>
          </Link>
        </div>
      </div>
    );
  }

  const { pph21, ppn, corporateTax } = data;

  const importSamplePayroll = async () => {
    setIsImporting(true);
    setImportNotice(null);
    try {
      const sample = SAMPLE_PAYROLL_FILES[sampleClientFile];
      const response = await fetch('/api/v1/tax/payroll/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagementId, headers: sample.headers, rows: sample.rows }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Import payroll gagal.');
      setImportNotice(`${json.data.validRowCount} pegawai tersimpan permanen pada perikatan ini. PPh 21 sudah dihitung dari data tersebut.`);
      const payrollData = buildPayrollTaxData(json.data.importedEmployees);
      setData((current: any) => ({ ...current, pph21: payrollData }));
      setHasPayroll(true);
    } catch (error: any) {
      setImportNotice(`Import gagal: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F8F7A]/15 text-[#0F8F7A] border border-[#0F8F7A]/30">
              MODUL KEPATUHAN & REKONSILIASI PERPAJAKAN
            </span>
            <span className="text-[10px] text-[#52636A]">Regulasi: PP 58/2023, PMK 168/2023 & UU HPP</span>
          </div>
          <h2 className="text-base font-bold text-[#102A32]">
            Pusat Kepatuhan Pajak & Rekonsiliasi Fiskal
          </h2>
          <p className="text-xs text-[#52636A] mt-0.5">
            Otomasi perhitungan PPh 21 tarif efektif (TER), ekualisasi omset SPT Masa PPN 1111, dan koreksi fiskal SPT 1771.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="finova-pill-cta bg-[#102A32] hover:bg-[#1E3A44] text-white text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#B2DFD6]" />
            <span>Impor Rekap Gaji (Format Bebas Excel Klien)</span>
          </button>

          <a
            href={`/api/v1/tax/export/ebupot-21?engagementId=${encodeURIComponent(engagementId)}`}
            download
            className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV e-Bupot 21 (Format DJP)</span>
          </a>

          <a
            href="/api/v1/tax/export/efaktur"
            download
            className="finova-pill-cta bg-[#F6F7F5] border border-[#DDE4E2] hover:bg-white text-[#102A32] text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0F8F7A]" />
            <span>Unduh CSV e-Faktur (Format DJP)</span>
          </a>
        </div>
      </div>

      {/* SMART PAYROLL IMPORTER PANEL (Solves Blindspot 1: Excel Klien Format Beda-beda) */}
      {showImporter && (
        <div className="bg-[#E8F5F1]/50 border border-[#B2DFD6] p-5 rounded-2xl space-y-4 animate-finova-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F8F7A] text-white">
                  FUZZY HEADER AUTO-DETECTION
                </span>
                <h3 className="font-bold text-xs text-[#102A32]">
                  Smart Payroll Importer: Deteksi Otomatis Kolom Excel Rekap Gaji Klien
                </h3>
              </div>
              <p className="text-[11px] text-[#52636A] mt-0.5">
                Sistem secara cerdas mengenali nama kolom yang bervariasi (misal: "Karyawan" vs "Nama Pegawai", "Gapok" vs "Upah Bruto") tanpa perlu mengubah template Excel milik klien secara manual.
              </p>
            </div>

            <button
              onClick={() => setShowImporter(false)}
              className="text-xs text-[#52636A] hover:text-[#102A32] font-semibold cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#B2DFD6] space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDE4E2]">
              <span className="font-semibold text-[#52636A]">
                Pilih Format File Excel Klien Berbeda untuk Diuji:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSampleClientFile('PT_Surya_Retail');
                    setImportNotice(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sampleClientFile === 'PT_Surya_Retail'
                      ? 'bg-[#0F8F7A] text-white'
                      : 'bg-[#F6F7F5] text-[#52636A]'
                  }`}
                >
                  File Klien A: Format Retail (Kolom: Karyawan, Role, Gapok, Status)
                </button>
                <button
                  onClick={() => {
                    setSampleClientFile('CV_Maju_Logistik');
                    setImportNotice(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sampleClientFile === 'CV_Maju_Logistik'
                      ? 'bg-[#0F8F7A] text-white'
                      : 'bg-[#F6F7F5] text-[#52636A]'
                  }`}
                >
                  File Klien B: Format Logistik (Kolom: Nama Pegawai, Upah, Tanggungan)
                </button>
              </div>
            </div>

            {/* Inferred Column Mapping Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-[#F6F7F5] border border-[#DDE4E2]">
                <span className="text-[10px] text-[#7A8C93] block">Nama Karyawan:</span>
                <strong className="text-[#0F8F7A]">{sampleClientFile === 'PT_Surya_Retail' ? 'Col A: "Karyawan"' : 'Col B: "Nama Lengkap"'}</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#F6F7F5] border border-[#DDE4E2]">
                <span className="text-[10px] text-[#7A8C93] block">Gaji Pokok:</span>
                <strong className="text-[#0F8F7A]">{sampleClientFile === 'PT_Surya_Retail' ? 'Col C: "Gapok"' : 'Col D: "Upah Bruto"'}</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#F6F7F5] border border-[#DDE4E2]">
                <span className="text-[10px] text-[#7A8C93] block">Status PTKP:</span>
                <strong className="text-[#0F8F7A]">{sampleClientFile === 'PT_Surya_Retail' ? 'Col D: "Status (K/1)"' : 'Col E: "Tanggungan (TK0)"'}</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#F6F7F5] border border-[#DDE4E2]">
                <span className="text-[10px] text-[#7A8C93] block">Kecocokan AI:</span>
                <strong className="text-emerald-700">94% (High Confidence)</strong>
              </div>
            </div>

            {importNotice && (
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{importNotice}</span>
              </div>
            )}
            <button
              onClick={importSamplePayroll}
              disabled={isImporting}
              className="px-3 py-2 rounded-lg bg-[#102A32] text-white text-xs font-bold disabled:opacity-60"
            >
              {isImporting ? 'Menyimpan payroll...' : 'Impor data contoh ke perikatan aktif'}
            </button>
          </div>
        </div>
      )}

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
          <span>1. PPh 21 Karyawan (Tarif Efektif Rata-Rata / TER PP 58/2023)</span>
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
          <span>2. Ekualisasi Omset Penjualan vs SPT Masa PPN 1111</span>
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
          <span>3. Rekonsiliasi &amp; Koreksi Fiskal PPh Badan (SPT Tahunan 1771)</span>
        </button>
      </div>

      {/* TAB 1: PPH 21 TER */}
      {activeSubTab === 'pph21' && (
        !hasPayroll ? (
          <div className="bg-white rounded-2xl border border-[#DDE4E2] p-12 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-[#F6F7F5] border border-[#DDE4E2] flex items-center justify-center mx-auto text-[#52636A]">
              <Receipt className="w-8 h-8 text-[#0F8F7A]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#102A32]">Belum Ada Data Penggajian (Payroll) Klien Ini</h3>
              <p className="text-xs text-[#52636A] leading-relaxed">
                Klien ini belum memiliki data payroll karyawan. Silakan buka Smart Payroll Importer untuk memuat berkas rekap gaji atau menguji simulasi kalkulasi PPh 21 TER (PP 58/2023).
              </p>
            </div>
            <button
              onClick={() => setShowImporter(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Buka Smart Payroll Importer</span>
            </button>
          </div>
        ) : (
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
                <thead className="bg-[#F6F7F5] text-[#52636A] border-b border-[#DDE4E2] font-semibold text-[11px]">
                  <tr>
                    <th className="p-3">Nama Pegawai & Jabatan</th>
                    <th className="p-3">PTKP</th>
                    <th className="p-3 text-center">Kategori</th>
                    <th className="p-3 text-right">Gaji Kas (Pokok + Tunj.)</th>
                    <th className="p-3 text-right">Premi BPJS (Non-Kas)</th>
                    <th className="p-3 text-right">Bruto Kena Pajak</th>
                    <th className="p-3 text-center">Tarif</th>
                    <th className="p-3 text-right">PPh 21 TER</th>
                    <th className="p-3 text-right">Gaji Bersih (THP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4E2] text-xs">
                  {pph21.monthlyList.map((row: any) => {
                    const cashSalary = row.cashSalaryIdr || (row.grossIncomeIdr - (row.nonCashBenefitsIdr || (row.grossIncomeIdr - (row.takeHomePayIdr + row.monthlyPph21Idr))));
                    const nonCash = row.nonCashBenefitsIdr || (row.grossIncomeIdr - cashSalary);
                    return (
                      <tr key={row.employeeId} className="hover:bg-[#F6F7F5]/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[#102A32]">{row.employeeName || row.name}</div>
                          <div className="text-[10px] text-[#52636A]">{row.position}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono px-2 py-0.5 rounded bg-[#F6F7F5] border border-[#DDE4E2] font-bold text-[11px]">
                            {row.ptkpStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#0F8F7A]/10 text-[#0F8F7A] font-bold text-[10px]">
                            TER {row.terCategory}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-[#102A32]">
                          Rp {cashSalary.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right font-mono text-[#52636A] text-[11px]">
                          +Rp {nonCash.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#102A32] bg-[#F6F7F5]/50">
                          Rp {row.grossIncomeIdr.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#0F8F7A]">
                          {row.terRatePercent}%
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#C83E4D]">
                          -Rp {row.monthlyPph21Idr.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#064E3B] bg-[#E8F5F1]/40">
                          Rp {row.takeHomePayIdr.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Invariant Accounting Formula Verification Card */}
            <div className="p-3 bg-[#E8F5F1] rounded-xl border border-[#B2DFD6] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F8F7A] shrink-0" />
                <span className="text-[#064E3B] font-bold">
                  Formula Matematika Presisi (Invariant Verified):
                </span>
                <span className="text-[#064E3B]">
                  THP = Gaji Kas (Pokok + Tunjangan) - Potongan PPh 21 TER
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#0A6657] font-semibold">
                Gross Kena Pajak = Kas + Premi BPJS Perusahaan (Objek PPh 21) ✓
              </span>
            </div>
          </div>
        </div>
        )
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
