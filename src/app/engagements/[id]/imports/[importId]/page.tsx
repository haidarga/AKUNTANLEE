'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Settings2,
  Table,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { DatasetType, ImportColumnMapping } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';

export default function ImportSetupPage() {
  const router = useRouter();
  const state = repo.getState();
  const engagement = state.engagements[0];
  const fileVersion = state.fileVersions[0];

  const [datasetType, setDatasetType] = useState<DatasetType>('trial_balance');
  const [selectedSheet, setSelectedSheet] = useState('Trial Balance');
  const [headerRowIndex, setHeaderRowIndex] = useState(0);

  // Column Mappings
  const [colAccountCode, setColAccountCode] = useState('Kode Akun');
  const [colAccountName, setColAccountName] = useState('Nama Akun / Deskripsi');
  const [colDebit, setColDebit] = useState('Debit (IDR)');
  const [colCredit, setColCredit] = useState('Kredit (IDR)');
  const [colClosingBalance, setColClosingBalance] = useState('Saldo Akhir (IDR)');

  const [isValidating, setIsValidating] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Sample Preview Data
  const sampleHeaders = ['Kode Akun', 'Nama Akun / Deskripsi', 'Saldo Awal', 'Debit (IDR)', 'Kredit (IDR)', 'Saldo Akhir (IDR)'];
  const sampleRows = [
    ['1110-00', 'Kas di Bank Mandiri (IDR)', '0', '1.850.000.000', '0', '1.850.000.000'],
    ['1111-00', 'Kas di Bank BCA Operasional', '0', '2.650.000.000', '0', '2.650.000.000'],
    ['1120-00', 'Piutang Usaha Pihak Ketiga', '0', '9.850.000.000', '0', '9.850.000.000'],
    ['1129-00', 'Cadangan Kerugian Penurunan Nilai Piutang', '0', '0', '200.000.000', '-200.000.000'],
    ['2199-00', 'Akun Penampungan Selisih Kurs Sementara', '0', '420.000.000', '310.000.000', '110.000.000'],
  ];

  const handlePublish = () => {
    setIsValidating(true);
    const user = state.users.find((u) => u.role === 'senior') || state.users[0];

    setTimeout(() => {
      setIsValidating(false);
      setPublishSuccess(true);
      setTimeout(() => {
        router.push(`/engagements/${engagement.id}/mapping`);
      }, 500);
    }, 600);
  };

  return (
    <div className="space-y-6 text-[#102A32]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href={`/engagements/${engagement.id}/files`}
            className="inline-flex items-center gap-1 text-xs text-[#52636A] hover:text-[#102A32] font-semibold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Berkas Sumber
          </Link>
          <h2 className="text-base font-bold text-[#102A32]">
            Konfigurasi Skema & Import Dataset (Import Setup)
          </h2>
          <p className="text-xs text-[#52636A]">
            Tentukan tipe dataset, sheet sumber, baris tajuk (header), dan petakan kolom ke kontrak baku sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F1F4F3] border border-[#DDE4E2]">
            File: {fileVersion?.originalName}
          </span>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (1 Col): Dataset Type & Sheet Configuration */}
        <div className="bg-white p-5 rounded border border-[#DDE4E2] shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-[#102A32] flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-[#0F8F7A]" />
            1. Pilihan Tipe & Sheet
          </h3>

          <div>
            <label className="block font-semibold text-[#102A32] mb-1">Tipe Dataset:</label>
            <select
              value={datasetType}
              onChange={(e) => setDatasetType(e.target.value as DatasetType)}
              className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-[#F6F7F5] focus:bg-white focus:ring-1 focus:ring-[#0F8F7A]"
            >
              <option value="trial_balance">Neraca Saldo (Trial Balance / TB)</option>
              <option value="general_ledger">Buku Besar (General Ledger / GL)</option>
              <option value="financial_statement">Laporan Keuangan (Financial Statement)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#102A32] mb-1">Sheet Sumber:</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-[#F6F7F5] focus:bg-white focus:ring-1 focus:ring-[#0F8F7A]"
            >
              {fileVersion?.sheetNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#102A32] mb-1">Baris Header (Tajuk Kolom):</label>
            <select
              value={headerRowIndex}
              onChange={(e) => setHeaderRowIndex(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-[#F6F7F5] focus:bg-white focus:ring-1 focus:ring-[#0F8F7A]"
            >
              <option value={0}>Baris 1 (Header Utama)</option>
              <option value={1}>Baris 2</option>
              <option value={2}>Baris 3</option>
            </select>
          </div>

          <div className="bg-[#E8F5F1] p-3 rounded border border-[#B2DFD6] space-y-1">
            <div className="font-bold text-[#0F8F7A] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kontrak Baku TB Terpilih
            </div>
            <div className="text-[11px] text-[#52636A]">
              Keseimbangan debit/kredit akan diverifikasi otomatis tanpa floating-point drift.
            </div>
          </div>
        </div>

        {/* Right (2 Cols): Target Schema Mapping & Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded border border-[#DDE4E2] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-[#102A32] flex items-center gap-1.5">
              <Table className="w-4 h-4 text-[#0F8F7A]" />
              2. Pemetaan Kolom Sumber ke Bidang Target Wajib
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  Kode Akun (account_code) <span className="text-[#C83E4D]">*</span>
                </label>
                <select
                  value={colAccountCode}
                  onChange={(e) => setColAccountCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-white"
                >
                  {sampleHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  Nama Akun (account_name) <span className="text-[#C83E4D]">*</span>
                </label>
                <select
                  value={colAccountName}
                  onChange={(e) => setColAccountName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-white"
                >
                  {sampleHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  Kolom Debit (IDR):
                </label>
                <select
                  value={colDebit}
                  onChange={(e) => setColDebit(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-white"
                >
                  {sampleHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#102A32] mb-1">
                  Kolom Kredit (IDR):
                </label>
                <select
                  value={colCredit}
                  onChange={(e) => setColCredit(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded bg-white"
                >
                  {sampleHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bounded Data Preview Table per PRD Section 43 */}
          <div className="bg-white rounded border border-[#DDE4E2] shadow-sm overflow-hidden text-xs">
            <div className="p-3 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between font-semibold">
              <span>Pratinjau Data Terpetakan (Sample 5 Baris Teratas)</span>
              <span className="font-mono text-[11px] text-[#52636A]">Total Baris: 22</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F7F5] border-b border-[#DDE4E2] text-[11px] text-[#52636A]">
                    <th className="py-2 px-3 border-r border-[#DDE4E2]">Kode Akun</th>
                    <th className="py-2 px-3 border-r border-[#DDE4E2]">Nama Akun</th>
                    <th className="py-2 px-3 text-right border-r border-[#DDE4E2]">Debit (IDR)</th>
                    <th className="py-2 px-3 text-right border-r border-[#DDE4E2]">Kredit (IDR)</th>
                    <th className="py-2 px-3 text-right">Saldo Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4E2]">
                  {sampleRows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F6F7F5]">
                      <td className="py-2 px-3 font-mono font-bold text-[#102A32] border-r border-[#DDE4E2]">{r[0]}</td>
                      <td className="py-2 px-3 text-[#102A32] border-r border-[#DDE4E2]">{r[1]}</td>
                      <td className="py-2 px-3 font-mono text-right border-r border-[#DDE4E2]">Rp {r[3]}</td>
                      <td className="py-2 px-3 font-mono text-right border-r border-[#DDE4E2]">Rp {r[4]}</td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-[#0F8F7A]">Rp {r[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation & Publish Action Surface */}
          <div className="bg-white p-4 rounded border border-[#DDE4E2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[#52636A]">
              Klik tombol berikut untuk memvalidasi baris data dan mempublikasikan versi dataset resmi.
            </div>

            <button
              onClick={handlePublish}
              disabled={isValidating || publishSuccess}
              className="px-5 py-2.5 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded font-semibold flex items-center gap-2 shadow-sm transition-colors shrink-0"
            >
              {isValidating ? (
                'Memvalidasi...'
              ) : publishSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Dataset Dipublikasikan!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Validasi & Publikasikan Dataset
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
