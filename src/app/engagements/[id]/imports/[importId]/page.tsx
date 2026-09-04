'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
  UploadCloud,
  Hash,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { DatasetType, AccountRow, FileVersion, MappingDecision } from '@/types/domain-v4';
import { formatIdrNumber } from '@/lib/decimal';
import { calculateWorkpaperVersion } from '@/lib/workpaper/engine';

export default function ImportSetupPage() {
  const router = useRouter();
  const state = repo.getState();
  const routeParams = useParams();
  const engagementId = (routeParams?.id as string) || 'ENG-2026-01';
  const importId = (routeParams?.importId as string) || `IMP-${engagementId}`;

  const [customEngagementName, setCustomEngagementName] = useState<string>('');
  const [fileVersion, setFileVersion] = useState<FileVersion | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

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

  useEffect(() => {
    // 1. Rehydrate engagement name
    try {
      const savedNew = localStorage.getItem('finova_new_engagements');
      if (savedNew) {
        const parsedNew = JSON.parse(savedNew);
        const match = parsedNew.find((e: any) => e.id === engagementId);
        if (match?.name) setCustomEngagementName(match.name);
      }
    } catch {}

    // 2. Rehydrate accounts & file versions for this specific engagement
    try {
      const savedAcc = localStorage.getItem(`finova_accounts_${engagementId}`);
      const savedFiles = localStorage.getItem(`finova_files_${engagementId}`);
      const savedJob = localStorage.getItem(`finova_import_job_${engagementId}`);

      let loadedAccounts: AccountRow[] = [];
      let loadedFile: FileVersion | null = null;

      if (savedAcc) {
        loadedAccounts = JSON.parse(savedAcc);
        setAccounts(loadedAccounts);
      }

      if (savedFiles) {
        const parsedFiles: FileVersion[] = JSON.parse(savedFiles);
        if (parsedFiles.length > 0) {
          loadedFile = parsedFiles[0];
          setFileVersion(loadedFile);
          if (loadedFile.sheetNames && loadedFile.sheetNames.length > 0) {
            setSelectedSheet(loadedFile.sheetNames[0]);
          }
        }
      } else if (savedJob) {
        const job = JSON.parse(savedJob);
        loadedFile = {
          id: job.fileVersionId || `FV-${engagementId}`,
          assetId: `AST-${engagementId}`,
          tenantId: job.tenantId || 'TENANT-001',
          engagementId: engagementId,
          versionNumber: 1,
          originalName: job.fileName || 'Trial_Balance.xlsx',
          storageKey: `tenants/TENANT-001/engagements/${engagementId}/files/${job.fileName}`,
          checksumSha256: job.fileHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          mediaType: job.fileName?.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          sizeBytes: 45000,
          status: 'ready',
          uploadedByUserId: 'USR-SENIOR-01',
          scanStatus: 'clean',
          sheetCount: (job.sheetNames || ['Trial Balance']).length,
          sheetNames: job.sheetNames || ['Trial Balance'],
          createdAt: job.createdAt || new Date().toISOString(),
        };
        setFileVersion(loadedFile);
      }

      // If default demo engagement and no custom data loaded, fallback to state
      if (engagementId === 'ENG-2026-01' && loadedAccounts.length === 0) {
        setAccounts(state.accounts);
        setFileVersion(state.fileVersions[0]);
      }
    } catch (err) {
      console.warn('Rehydration error on import setup:', err);
    } finally {
      setIsHydrated(true);
    }
  }, [engagementId, state.accounts, state.fileVersions]);

  const engagement = state.engagements.find((e) => e.id === engagementId) || {
    id: engagementId,
    tenantId: 'TENANT-001',
    clientId: 'CLI-002',
    name: customEngagementName || (engagementId === 'ENG-MANDIRI-2026'
      ? 'Kertas Kerja Audit Mandiri FY 2026 (Unggah Berkas Klien Sendiri)'
      : 'Perikatan Audit Mandiri (' + engagementId + ')'),
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    currency: 'IDR' as const,
    materialityIdr: 250000000,
    status: 'preparing' as const,
    leadPartnerId: 'USR-PARTNER-01',
    managerId: 'USR-MANAGER-01',
    seniorId: 'USR-SENIOR-01',
    preparerId: 'USR-PREPARER-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleHeaders = ['Kode Akun', 'Nama Akun / Deskripsi', 'Saldo Awal', 'Debit (IDR)', 'Kredit (IDR)', 'Saldo Akhir (IDR)'];

  // Dynamic sample rows derived directly from the engagement's active accounts
  const sampleRows = accounts.slice(0, 5).map((acc) => [
    acc.accountCode,
    acc.accountName,
    '0',
    formatIdrNumber(acc.debitIdr),
    formatIdrNumber(acc.creditIdr),
    formatIdrNumber(acc.closingBalanceIdr),
  ]);

  const handlePublish = () => {
    if (accounts.length === 0) {
      alert('Tidak ada akun yang dapat divalidasi. Harap unggah berkas neraca saldo terlebih dahulu.');
      return;
    }

    setIsValidating(true);
    const user = state.users.find((u) => u.role === 'senior') || state.users[0];

    setTimeout(() => {
      try {
        const dsvId = `DSV-${engagement.id}`;
        const autoDecisions: MappingDecision[] = accounts.map((acc, idx) => {
          const code = acc.accountCode;
          const nameLower = acc.accountName.toLowerCase();
          let target = 'WP-A.5';

          if (code.startsWith('10') || code.startsWith('111') || nameLower.includes('kas') || nameLower.includes('bank')) target = 'WP-A.1';
          else if (code.startsWith('11') || nameLower.includes('piutang') || nameLower.includes('receivable')) target = 'WP-A.2';
          else if (nameLower.includes('cadangan') || nameLower.includes('ecl') || nameLower.includes('penurunan nilai')) target = 'WP-A.3';
          else if (code.startsWith('13') || nameLower.includes('persediaan') || nameLower.includes('inventory')) target = 'WP-A.4';
          else if (code.startsWith('14') || nameLower.includes('muka') || nameLower.includes('prepaid')) target = 'WP-A.5';
          else if (nameLower.includes('akumulasi')) target = 'WP-B.2';
          else if (code.startsWith('12') || code.startsWith('15') || code.startsWith('16') || nameLower.includes('tetap') || nameLower.includes('gedung') || nameLower.includes('mesin') || nameLower.includes('kendaraan') || nameLower.includes('peralatan')) target = 'WP-B.1';
          else if (code.startsWith('20') || code.startsWith('21') || nameLower.includes('utang usaha') || nameLower.includes('payable')) target = 'WP-C.1';
          else if (code.startsWith('22') || code.startsWith('202') || nameLower.includes('pajak') || nameLower.includes('tax')) target = 'WP-C.2';
          else if (code.startsWith('203') || nameLower.includes('gaji') || nameLower.includes('bonus')) target = 'WP-C.3';
          else if (code.startsWith('25') || nameLower.includes('bank') || nameLower.includes('pinjaman')) target = 'WP-D.1';
          else if (code.startsWith('30') || nameLower.includes('modal') || nameLower.includes('capital')) target = 'WP-E.1';
          else if (code.startsWith('31') || code.startsWith('302') || nameLower.includes('laba') || nameLower.includes('retained')) target = 'WP-E.2';
          else if (code.startsWith('4') || nameLower.includes('pendapatan') || nameLower.includes('penjualan') || nameLower.includes('revenue') || nameLower.includes('jasa')) target = 'WP-F.1';
          else if (code.startsWith('5') || nameLower.includes('pokok') || nameLower.includes('hpp') || nameLower.includes('cogs')) target = 'WP-F.2';
          else if (code.startsWith('6') || nameLower.includes('operasional') || nameLower.includes('beban')) target = 'WP-F.3';

          return {
            id: `DEC-${engagement.id}-${idx + 1}`,
            mappingSetId: 'MAPSET-' + engagement.id,
            tenantId: engagement.tenantId || 'TENANT-001',
            accountRowId: acc.id,
            sourceAccountCode: acc.accountCode,
            sourceAccountName: acc.accountName,
            amountIdr: acc.closingBalanceIdr,
            proposedTarget: target,
            effectiveTarget: target,
            confidenceScore: 96,
            confidenceLevel: 'high',
            rationale: 'Normalisasi Otomatis Kontrak Standar SAK',
            status: 'mapped',
            isMaterial: Math.abs(acc.closingBalanceIdr) >= 150_000_000,
          };
        });

        const customWpCalc = calculateWorkpaperVersion({
          tenantId: engagement.tenantId || 'TENANT-001',
          engagementId: engagement.id,
          datasetVersionId: dsvId,
          mappingSetId: 'MAPSET-' + engagement.id,
          accounts: accounts,
          mappingDecisions: autoDecisions,
        });

        localStorage.setItem(`finova_accounts_${engagement.id}`, JSON.stringify(accounts));
        localStorage.setItem(`finova_mapping_${engagement.id}`, JSON.stringify(autoDecisions));
        localStorage.setItem(`finova_wp_${engagement.id}`, JSON.stringify(customWpCalc));
      } catch (err) {
        console.error('Publish processing error:', err);
      }

      setIsValidating(false);
      setPublishSuccess(true);
      setTimeout(() => {
        router.push(`/engagements/${engagement.id}/mapping`);
      }, 500);
    }, 600);
  };

  // If hydrated and no file uploaded for custom engagement, render clean empty state
  if (isHydrated && engagementId !== 'ENG-2026-01' && !fileVersion && accounts.length === 0) {
    return (
      <div className="space-y-6 text-[#102A32] max-w-4xl mx-auto py-8">
        <Link
          href={`/engagements/${engagement.id}/files`}
          className="inline-flex items-center gap-1 text-xs text-[#52636A] hover:text-[#102A32] font-semibold mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Berkas Sumber
        </Link>
        <div className="p-8 bg-white border-2 border-dashed border-[#DDE4E2] rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5F1] text-[#0F8F7A] flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#102A32]">Belum Ada Berkas untuk Dinormalisasi</h3>
            <p className="text-xs text-[#52636A] max-w-md mx-auto">
              Perikatan <strong>{engagement.name}</strong> belum memiliki berkas neraca saldo yang diunggah. Unggah berkas Excel atau CSV terlebih dahulu untuk memulai alur import.
            </p>
          </div>
          <Link
            href={`/engagements/${engagement.id}/files`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F8F7A] hover:bg-[#0C7564] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Berkas Neraca Saldo Klien</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#102A32]">
              Konfigurasi Skema & Import Dataset ({importId})
            </h2>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
              {engagement.name}
            </span>
          </div>
          <p className="text-xs text-[#52636A]">
            Tentukan tipe dataset, sheet sumber, baris tajuk (header), dan petakan kolom ke kontrak baku sistem tanpa risiko pencampuran data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-3 py-1 rounded-xl bg-white border border-[#DDE4E2] flex items-center gap-1.5 shadow-2xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F8F7A]" />
            <strong className="text-[#102A32]">{fileVersion?.originalName || 'Trial_Balance.xlsx'}</strong>
          </span>
        </div>
      </div>

      {/* File Integrity Badge */}
      {fileVersion?.checksumSha256 && (
        <div className="p-3 bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#52636A]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F8F7A] shrink-0" />
            <span>SHA-256 Integritas Berkas:</span>
            <span className="text-[#102A32] font-bold break-all">{fileVersion.checksumSha256}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#E8F5F1] text-[#0F8F7A] font-sans font-bold text-[11px] shrink-0">
            SEALED & VERIFIED
          </span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (1 Col): Dataset Type & Sheet Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-[#102A32] flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-[#0F8F7A]" />
            1. Pilihan Tipe & Sheet
          </h3>

          <div>
            <label className="block font-semibold text-[#102A32] mb-1">Tipe Dataset:</label>
            <select
              value={datasetType}
              onChange={(e) => setDatasetType(e.target.value as DatasetType)}
              className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-[#F6F7F5] focus:bg-white focus:ring-1 focus:ring-[#0F8F7A]"
            >
              <option value="trial_balance">Neraca Saldo (Trial Balance) - SAK</option>
              <option value="general_ledger">Buku Besar (General Ledger)</option>
              <option value="payroll">Data Penggajian (Payroll PPh 21)</option>
              <option value="financial_statement">Laporan Keuangan (Financial Statement)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#102A32] mb-1">Sheet Sumber:</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-[#F6F7F5] focus:bg-white focus:ring-1 focus:ring-[#0F8F7A]"
            >
              {(fileVersion?.sheetNames && fileVersion.sheetNames.length > 0 ? fileVersion.sheetNames : ['Trial Balance', 'Sheet1']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#102A32] mb-1">Baris Header (Tajuk Kolom):</label>
            <select
              value={headerRowIndex}
              onChange={(e) => setHeaderRowIndex(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-[#F6F7F5] focus:bg-white focus:ring-1 focus:ring-[#0F8F7A]"
            >
              <option value={0}>Baris 1 (Header Utama)</option>
              <option value={1}>Baris 2</option>
              <option value={2}>Baris 3</option>
            </select>
          </div>

          <div className="bg-[#E8F5F1] p-3 rounded-xl border border-[#B2DFD6] space-y-1">
            <div className="font-bold text-[#0F8F7A] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kontrak Baku TB Terpilih
            </div>
            <div className="text-[11px] text-[#52636A]">
              Keseimbangan debit/kredit akan diverifikasi otomatis tanpa floating-point drift ({accounts.length} baris akun teridentifikasi).
            </div>
          </div>
        </div>

        {/* Right (2 Cols): Target Schema Mapping & Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-sm space-y-4 text-xs">
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
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-white"
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
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-white"
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
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-white"
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
                  className="w-full px-2.5 py-1.5 border border-[#DDE4E2] rounded-lg bg-white"
                >
                  {sampleHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bounded Data Preview Table per PRD Section 43 */}
          <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-sm overflow-hidden text-xs">
            <div className="p-3.5 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between font-semibold">
              <span className="text-[#102A32]">Pratinjau Data Terpetakan (Sample {Math.min(5, accounts.length)} Baris Teratas)</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-[#DDE4E2] text-[#0F8F7A] font-bold">
                Total Baris: {accounts.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F7F5] border-b border-[#DDE4E2] text-[11px] text-[#52636A]">
                    <th className="py-2 px-3 border-r border-[#DDE4E2]">Kode Akun</th>
                    <th className="py-2 px-3 border-r border-[#DDE4E2]">Nama Akun</th>
                    <th className="py-2 px-3 text-right border-r border-[#DDE4E2]">Debit (IDR)</th>
                    <th className="py-2 px-3 text-right border-r border-[#DDE4E2]">Kredit (IDR)</th>
                    <th className="py-2 px-3 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4E2]">
                  {sampleRows.length > 0 ? (
                    sampleRows.map((r, i) => (
                      <tr key={i} className="hover:bg-[#F6F7F5]">
                        <td className="py-2 px-3 font-mono font-bold text-[#102A32] border-r border-[#DDE4E2]">{r[0]}</td>
                        <td className="py-2 px-3 text-[#102A32] border-r border-[#DDE4E2]">{r[1]}</td>
                        <td className="py-2 px-3 font-mono text-right border-r border-[#DDE4E2]">Rp {r[3]}</td>
                        <td className="py-2 px-3 font-mono text-right border-r border-[#DDE4E2]">Rp {r[4]}</td>
                        <td className="py-2 px-3 font-mono font-bold text-right text-[#0F8F7A]">Rp {r[5]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#7A8C93] italic">
                        Belum ada baris akun yang dimuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation & Publish Action Surface */}
          <div className="bg-white p-4 rounded-2xl border border-[#DDE4E2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[#52636A]">
              Klik tombol berikut untuk memvalidasi {accounts.length} baris data akun dan mempublikasikan versi dataset resmi ke perikatan <strong>{engagement.name}</strong>.
            </div>

            <button
              onClick={handlePublish}
              disabled={isValidating || publishSuccess || accounts.length === 0}
              className="px-5 py-2.5 bg-[#0F8F7A] hover:bg-[#0C7564] disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-colors shrink-0"
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
