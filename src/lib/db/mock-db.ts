// FINOVA In-Memory / Persistent State Database
// Complete domain fixtures for KAP Tanudiredja & PT Nusantara Sukses Makmur
// In compliance with PRD Section 6, 9, 10, 11, and 18

import {
  Firm,
  User,
  Client,
  Engagement,
  PBCRequest,
  Document,
  ExtractionJob,
  Evidence,
  AccountMapping,
  WorkpaperSection,
  ValidationCheck,
  StandardReference,
  ReviewPoint,
  Finding,
  ReportDraft,
  AuditEvent,
  AdvisoryInsight,
} from '@/types/domain';
import { calculateVariance } from '@/lib/currency';
import { runFiscalReconciliation } from '@/lib/tax-engine/fiscal-reconciliation';
import { calculatePph21MonthlyTer } from '@/lib/tax-engine/pph21-ter';
import { calculatePph23 } from '@/lib/tax-engine/pph23';
import { reconcilePpn } from '@/lib/tax-engine/ppn';

export interface FinovaState {
  firms: Firm[];
  users: User[];
  clients: Client[];
  engagements: Engagement[];
  pbcRequests: PBCRequest[];
  documents: Document[];
  extractionJobs: ExtractionJob[];
  evidenceList: Evidence[];
  accountMappings: AccountMapping[];
  workpaperSections: WorkpaperSection[];
  validationChecks: ValidationCheck[];
  standardReferences: StandardReference[];
  reviewPoints: ReviewPoint[];
  findings: Finding[];
  reportDrafts: ReportDraft[];
  auditEvents: AuditEvent[];
  advisoryInsights: AdvisoryInsight[];
}

function initializeState(): FinovaState {
  const firm1: Firm = {
    id: 'FIRM-001',
    name: 'KAP Tanudiredja, Wibisana, Rintis & Rekan',
    taxId: '01.555.777.8-054.000',
    country: 'ID',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const firm2: Firm = {
    id: 'FIRM-002',
    name: 'KAP Siddharta Widjaja & Rekan',
    taxId: '01.999.888.1-011.000',
    country: 'ID',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const users: User[] = [
    {
      id: 'USR-PARTNER-01',
      firmId: 'FIRM-001',
      name: 'Bambang Hendrawan, SE, Ak, CA, CPA',
      email: 'bambang.h@tanudiredja.id',
      role: 'partner',
      title: 'Audit & Advisory Partner',
    },
    {
      id: 'USR-MANAGER-01',
      firmId: 'FIRM-001',
      name: 'Siti Rahmawati, M.Ak, CPA',
      email: 'siti.r@tanudiredja.id',
      role: 'manager',
      title: 'Senior Engagement Manager',
    },
    {
      id: 'USR-SENIOR-01',
      firmId: 'FIRM-001',
      name: 'Ahmad Pratama, S.Ak',
      email: 'ahmad.p@tanudiredja.id',
      role: 'senior',
      title: 'Senior Field Auditor',
    },
    {
      id: 'USR-PREPARER-01',
      firmId: 'FIRM-001',
      name: 'Dewi Lestari, S.Ak',
      email: 'dewi.l@tanudiredja.id',
      role: 'preparer',
      title: 'Junior Audit Associate',
    },
    {
      id: 'USR-TAX-01',
      firmId: 'FIRM-001',
      name: 'Rizky Ramadhan, BKP',
      email: 'rizky.r@tanudiredja.id',
      role: 'tax_consultant',
      title: 'Senior Tax Advisory Specialist',
    },
    {
      id: 'USR-GUEST-01',
      firmId: 'FIRM-001',
      name: 'Budi Hartono (Finance Director)',
      email: 'budi.h@nusantarasukses.co.id',
      role: 'client_guest',
      title: 'Client Financial Controller',
    },
    {
      id: 'USR-FIRM2-01',
      firmId: 'FIRM-002',
      name: 'Hendra Gunawan, CPA',
      email: 'hendra.g@siddharta.id',
      role: 'partner',
      title: 'Partner (Firm B)',
    },
  ];

  const clients: Client[] = [
    {
      id: 'CLI-001',
      firmId: 'FIRM-001',
      name: 'PT Nusantara Sukses Makmur',
      legalType: 'PT',
      npwp: '01.234.567.8-012.000',
      industry: 'Manufaktur Komponen Otomotif & Distribusi',
      contactPerson: 'Budi Hartono',
      contactEmail: 'budi.h@nusantarasukses.co.id',
      fiscalYearEndMonth: 12,
      createdAt: '2024-03-15T08:00:00Z',
    },
    {
      id: 'CLI-002',
      firmId: 'FIRM-001',
      name: 'PT Andalas Energi Sejahtera',
      legalType: 'PT',
      npwp: '02.456.789.0-034.000',
      industry: 'Penyedia Jasa Logistik Pertambangan',
      contactPerson: 'Dewi Suryani',
      contactEmail: 'dewi.suryani@andalas-energi.co.id',
      fiscalYearEndMonth: 12,
      createdAt: '2024-05-10T10:00:00Z',
    },
  ];

  const engagements: Engagement[] = [
    {
      id: 'ENG-2025-01',
      firmId: 'FIRM-001',
      clientId: 'CLI-001',
      title: 'Audit Laporan Keuangan & Tax Advisory FY 2025',
      type: 'full_advisory',
      fiscalYear: 2025,
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
      status: 'in_progress',
      leadPartnerId: 'USR-PARTNER-01',
      managerId: 'USR-MANAGER-01',
      seniorId: 'USR-SENIOR-01',
      preparerId: 'USR-PREPARER-01',
      taxConsultantId: 'USR-TAX-01',
      materialityThresholdIdr: 250_000_000, // 250 Million IDR
      trivialThresholdIdr: 12_500_000,
      createdAt: '2025-10-01T09:00:00Z',
      updatedAt: '2026-02-15T14:30:00Z',
    },
  ];

  const pbcRequests: PBCRequest[] = [
    {
      id: 'PBC-001',
      engagementId: 'ENG-2025-01',
      title: 'Trial Balance Audited 31 Des 2025 (Format Excel / CSV)',
      category: 'financial_statements',
      description: 'Neraca Saldo 12 bulan komparatif beserta rincian akun sebelum penyesuaian audit.',
      status: 'uploaded',
      guestAccessToken: 'token-nsm-tb2025-secure',
      dueDate: '2026-01-20',
      assignedToClientEmail: 'budi.h@nusantarasukses.co.id',
      uploadedDocumentId: 'DOC-001',
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-01-18T10:15:00Z',
    },
    {
      id: 'PBC-002',
      engagementId: 'ENG-2025-01',
      title: 'Rekapitulasi Faktur Pajak PPN (e-Faktur CSV Jan-Des 2025)',
      category: 'tax',
      description: 'Daftar Pajak Keluaran dan Pajak Masukan lengkap dengan nomor seri dan status approval DJP.',
      status: 'uploaded',
      guestAccessToken: 'token-nsm-ppn2025-secure',
      dueDate: '2026-01-25',
      assignedToClientEmail: 'budi.h@nusantarasukses.co.id',
      uploadedDocumentId: 'DOC-002',
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-01-22T11:20:00Z',
    },
    {
      id: 'PBC-003',
      engagementId: 'ENG-2025-01',
      title: 'Daftar Nominatif Biaya Entertainment & Promosi 2025',
      category: 'tax',
      description: 'Sesuai PMK 02/PMK.03/2010 dan SE-27/PJ.22/1986 sebagai syarat deduktibilitas fiskal.',
      status: 'needs_replacement',
      guestAccessToken: 'token-nsm-nominatif-secure',
      dueDate: '2026-01-30',
      assignedToClientEmail: 'budi.h@nusantarasukses.co.id',
      rejectionReason: 'Format daftar belum mencantumkan nama penerima, NPWP, dan tujuan bisnis spesifik.',
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-02-02T09:45:00Z',
    },
    {
      id: 'PBC-004',
      engagementId: 'ENG-2025-01',
      title: 'Rekening Koran & Rekonsiliasi Bank 31 Des 2025 (Bank Mandiri & BCA)',
      category: 'bank_reconciliation',
      description: 'Konfirmasi saldo kas dan mutasi rekening koran akhir tahun.',
      status: 'accepted',
      guestAccessToken: 'token-nsm-bank-secure',
      dueDate: '2026-01-15',
      assignedToClientEmail: 'budi.h@nusantarasukses.co.id',
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-01-14T16:00:00Z',
    },
    {
      id: 'PBC-005',
      engagementId: 'ENG-2025-01',
      title: 'Rekap Gaji dan Form 1721-A1 PPh 21 Masa Desember 2025',
      category: 'tax',
      description: 'Daftar penghasilan bruto dan perhitungan TER PPh 21 karyawan tetap.',
      status: 'uploaded',
      guestAccessToken: 'token-nsm-salary-secure',
      dueDate: '2026-01-28',
      assignedToClientEmail: 'budi.h@nusantarasukses.co.id',
      uploadedDocumentId: 'DOC-003',
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-01-26T14:10:00Z',
    },
  ];

  const documents: Document[] = [
    {
      id: 'DOC-001',
      engagementId: 'ENG-2025-01',
      name: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
      fileSize: 485200,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      type: 'trial_balance',
      version: 1,
      uploadedByUserId: 'USR-GUEST-01',
      isClientPbcUpload: true,
      activeExtractionJobId: 'JOB-001',
      evidenceItemsCount: 35,
      createdAt: '2026-01-18T10:15:00Z',
    },
    {
      id: 'DOC-002',
      engagementId: 'ENG-2025-01',
      name: 'Faktur_Pajak_PPN_Rekap_2025.csv',
      fileSize: 198400,
      fileType: 'text/csv',
      type: 'faktur_pajak',
      version: 1,
      uploadedByUserId: 'USR-GUEST-01',
      isClientPbcUpload: true,
      activeExtractionJobId: 'JOB-002',
      evidenceItemsCount: 18,
      createdAt: '2026-01-22T11:20:00Z',
    },
    {
      id: 'DOC-003',
      engagementId: 'ENG-2025-01',
      name: 'Payroll_PPh21_TER_Desember2025.xlsx',
      fileSize: 312000,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      type: 'salary_slip',
      version: 1,
      uploadedByUserId: 'USR-GUEST-01',
      isClientPbcUpload: true,
      activeExtractionJobId: 'JOB-003',
      evidenceItemsCount: 12,
      createdAt: '2026-01-26T14:10:00Z',
    },
  ];

  const extractionJobs: ExtractionJob[] = [
    {
      id: 'JOB-001',
      documentId: 'DOC-001',
      status: 'validated',
      progressPercent: 100,
      confidenceScore: 0.98,
      extractedFieldsCount: 35,
      warnings: ['Akun 2199-00 ("Penampungan Selisih Kurs") memerlukan klasifikasi manual.'],
      durationMs: 780,
      modelEngine: 'finova-deterministic-extractor-v3.0',
      startedAt: '2026-01-18T10:15:05Z',
      completedAt: '2026-01-18T10:15:06Z',
    },
    {
      id: 'JOB-002',
      documentId: 'DOC-002',
      status: 'validated',
      progressPercent: 100,
      confidenceScore: 0.95,
      extractedFieldsCount: 18,
      warnings: ['1 Faktur Pajak Masukan terdeteksi menggunakan tarif lama 10%.'],
      durationMs: 640,
      modelEngine: 'finova-deterministic-extractor-v3.0',
      startedAt: '2026-01-22T11:20:05Z',
      completedAt: '2026-01-22T11:20:06Z',
    },
    {
      id: 'JOB-003',
      documentId: 'DOC-003',
      status: 'validated',
      progressPercent: 100,
      confidenceScore: 0.99,
      extractedFieldsCount: 12,
      warnings: [],
      durationMs: 510,
      modelEngine: 'finova-deterministic-extractor-v3.0',
      startedAt: '2026-01-26T14:10:05Z',
      completedAt: '2026-01-26T14:10:06Z',
    },
  ];

  const evidenceList: Evidence[] = [
    {
      id: 'EVD-TB-COGS',
      engagementId: 'ENG-2025-01',
      documentId: 'DOC-001',
      documentName: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
      fileType: 'xlsx',
      sheetName: 'TrialBalance_2025',
      cellReference: 'Sheet1!D24:E24',
      sourceValue: '34.650.000.000',
      normalizedValue: 34_650_000_000,
      confidence: 0.99,
      extractionMethod: 'deterministic_parse',
      snippetText: '5101-00 Pembelian Bahan Baku Utama (Baja & Aluminium) Rp 34.650.000.000',
      timestamp: '2026-01-18T10:15:06Z',
    },
    {
      id: 'EVD-TB-REV',
      engagementId: 'ENG-2025-01',
      documentId: 'DOC-001',
      documentName: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
      fileType: 'xlsx',
      sheetName: 'TrialBalance_2025',
      cellReference: 'Sheet1!D20:E20',
      sourceValue: '52.400.000.000',
      normalizedValue: 52_400_000_000,
      confidence: 0.99,
      extractionMethod: 'deterministic_parse',
      snippetText: '4101-00 Penjualan Komponen Otomotif OEM Rp 52.400.000.000',
      timestamp: '2026-01-18T10:15:06Z',
    },
    {
      id: 'EVD-TB-AR',
      engagementId: 'ENG-2025-01',
      documentId: 'DOC-001',
      documentName: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
      fileType: 'xlsx',
      sheetName: 'TrialBalance_2025',
      cellReference: 'Sheet1!D6:E6',
      sourceValue: '9.850.000.000',
      normalizedValue: 9_850_000_000,
      confidence: 0.98,
      extractionMethod: 'deterministic_parse',
      snippetText: '1120-00 Piutang Usaha Pihak Ketiga Rp 9.850.000.000',
      timestamp: '2026-01-18T10:15:06Z',
    },
    {
      id: 'EVD-GL-ROUND',
      engagementId: 'ENG-2025-01',
      documentId: 'DOC-001',
      documentName: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
      fileType: 'xlsx',
      sheetName: 'JurnalPenyesuaian',
      cellReference: 'Sheet1!B82:E82',
      sourceValue: '500.000.000',
      normalizedValue: 500_000_000,
      confidence: 0.95,
      extractionMethod: 'deterministic_parse',
      snippetText: 'JV-2025-12-310: Penyesuaian Biaya Konsultasi Manajemen Rp 500.000.000 (Oleh: User ADMIN)',
      timestamp: '2026-01-18T10:15:06Z',
    },
  ];

  // 16 Realistic Indonesian Accounts
  const rawAccounts = [
    { code: '1110-00', name: 'Kas Kecil (Petty Cash)', beg: 25_000_000, deb: 120_000_000, cred: 115_000_000, end: 30_000_000, py: 25_000_000, sec: 'A.1', cat: 'asset' as const },
    { code: '1112-00', name: 'Bank Mandiri Rek Giro Rupiah', beg: 1_250_000_000, deb: 55_400_000_000, cred: 54_150_000_000, end: 2_500_000_000, py: 1_250_000_000, sec: 'A.1', cat: 'asset' as const },
    { code: '1113-00', name: 'Bank Central Asia Rek Giro Rupiah', beg: 890_000_000, deb: 32_100_000_000, cred: 31_850_000_000, end: 1_140_000_000, py: 890_000_000, sec: 'A.1', cat: 'asset' as const },
    { code: '1120-00', name: 'Piutang Usaha - Pihak Ketiga', beg: 6_800_000_000, deb: 52_400_000_000, cred: 49_350_000_000, end: 9_850_000_000, py: 6_800_000_000, sec: 'A.2', cat: 'asset' as const },
    { code: '1129-00', name: 'Cadangan Kerugian Penurunan Nilai Piutang', beg: -150_000_000, deb: 0, cred: 50_000_000, end: -200_000_000, py: -150_000_000, sec: 'A.2', cat: 'asset' as const },
    { code: '1130-00', name: 'Persediaan Barang Jadi (Finished Goods)', beg: 4_200_000_000, deb: 36_000_000_000, cred: 35_100_000_000, end: 5_100_000_000, py: 4_200_000_000, sec: 'A.3', cat: 'asset' as const },
    { code: '1131-00', name: 'Persediaan Bahan Baku (Raw Material)', beg: 2_100_000_000, deb: 34_650_000_000, cred: 33_950_000_000, end: 2_800_000_000, py: 2_100_000_000, sec: 'A.3', cat: 'asset' as const },
    { code: '1501-00', name: 'Aset Tetap - Mesin & Peralatan Pabrik', beg: 18_500_000_000, deb: 2_400_000_000, cred: 0, end: 20_900_000_000, py: 18_500_000_000, sec: 'B.1', cat: 'asset' as const },
    { code: '1591-00', name: 'Akumulasi Penyusutan Mesin', beg: -5_200_000_000, deb: 0, cred: 1_850_000_000, end: -7_050_000_000, py: -5_200_000_000, sec: 'B.1', cat: 'asset' as const },
    { code: '2101-00', name: 'Utang Usaha - Vendor Pemasok', beg: 4_100_000_000, deb: 32_500_000_000, cred: 34_150_000_000, end: 5_750_000_000, py: 4_100_000_000, sec: 'C.1', cat: 'liability' as const },
    { code: '2130-00', name: 'Utang Pajak - PPh Pasal 21', beg: 85_000_000, deb: 1_020_000_000, cred: 1_065_000_000, end: 130_000_000, py: 85_000_000, sec: 'C.2', cat: 'liability' as const },
    { code: '2131-00', name: 'Utang Pajak - PPN Keluaran', beg: 110_000_000, deb: 5_150_000_000, cred: 5_220_000_000, end: 180_000_000, py: 110_000_000, sec: 'C.2', cat: 'liability' as const },
    { code: '2199-00', name: 'Akun Penampungan Selisih Kurs Sementara', beg: 0, deb: 420_000_000, cred: 310_000_000, end: 110_000_000, py: 0, sec: 'C.1', cat: 'liability' as const }, // Ambiguous!
    { code: '3101-00', name: 'Modal Saham Disetor', beg: 10_000_000_000, deb: 0, cred: 0, end: 10_000_000_000, py: 10_000_000_000, sec: 'D.1', cat: 'equity' as const },
    { code: '3201-00', name: 'Saldo Laba Tahun Lalu (Retained Earnings)', beg: 14_340_000_000, deb: 1_000_000_000, cred: 0, end: 13_340_000_000, py: 14_340_000_000, sec: 'D.1', cat: 'equity' as const },
    { code: '4101-00', name: 'Penjualan Komponen Otomotif OEM', beg: 0, deb: 0, cred: 52_400_000_000, end: 52_400_000_000, py: 46_800_000_000, sec: 'E.1', cat: 'revenue' as const },
    { code: '5101-00', name: 'Beban Pokok Pendapatan (COGS Material)', beg: 0, deb: 35_950_000_000, cred: 0, end: 35_950_000_000, py: 28_900_000_000, sec: 'E.2', cat: 'cogs' as const },
    { code: '6101-00', name: 'Beban Gaji, Tunjangan & Bonus Pegawai', beg: 0, deb: 6_200_000_000, cred: 0, end: 6_200_000_000, py: 5_800_000_000, sec: 'F.1', cat: 'operating_expense' as const },
    { code: '6105-00', name: 'Beban Jamuan & Entertainment', beg: 0, deb: 215_000_000, cred: 0, end: 215_000_000, py: 120_000_000, sec: 'F.1', cat: 'operating_expense' as const },
    { code: '6108-00', name: 'Beban Pengobatan & Fasilitas Natura', beg: 0, deb: 145_000_000, cred: 0, end: 145_000_000, py: 95_000_000, sec: 'F.1', cat: 'operating_expense' as const },
    { code: '6120-00', name: 'Beban Sanksi Bunga/Denda Pajak STP', beg: 0, deb: 50_000_000, cred: 0, end: 50_000_000, py: 15_000_000, sec: 'F.1', cat: 'operating_expense' as const },
    { code: '7101-00', name: 'Pendapatan Bunga Deposito (PPh Final)', beg: 0, deb: 0, cred: 80_000_000, end: 80_000_000, py: 65_000_000, sec: 'F.2', cat: 'other_income_expense' as const },
  ];

  const accountMappings: AccountMapping[] = rawAccounts.map((acc, idx) => {
    const isAmbiguous = acc.code === '2199-00';
    return {
      id: `MAP-${idx + 1}`,
      engagementId: 'ENG-2025-01',
      sourceAccountCode: acc.code,
      sourceAccountName: acc.name,
      standardWorkpaperSection: acc.sec,
      category: acc.cat,
      beginningBalanceIdr: acc.beg,
      debitIdr: acc.deb,
      creditIdr: acc.cred,
      endingBalanceIdr: acc.end,
      priorYearBalanceIdr: acc.py,
      mappingStatus: isAmbiguous ? 'suggested' : 'confirmed',
      confidenceScore: isAmbiguous ? 0.38 : 0.98,
      rationale: isAmbiguous
        ? 'Akun penampungan sementara terdeteksi. Memerlukan verifikasi alokasi fiskal/komersial.'
        : `Dipetakan ke ${acc.sec} berdasarkan pola nomor akun dan SAK Indonesia.`,
      suggestedBy: 'rule_engine',
      isAmbiguous,
      evidenceId: 'EVD-TB-COGS',
    };
  });

  const workpaperSections: WorkpaperSection[] = [
    {
      id: 'WP-A',
      engagementId: 'ENG-2025-01',
      code: 'WP-A',
      title: 'Kas dan Setara Kas',
      leadSchedule: 'A.1',
      totalBeginningBalanceIdr: 2_165_000_000,
      totalEndingBalanceIdr: 3_670_000_000,
      totalPriorYearBalanceIdr: 2_165_000_000,
      absoluteVarianceIdr: 1_505_000_000,
      percentageVariance: 0.695,
      reviewState: 'approved',
      preparedByUserId: 'USR-PREPARER-01',
      reviewedByUserId: 'USR-SENIOR-01',
      approvedByUserId: 'USR-MANAGER-01',
    },
    {
      id: 'WP-B',
      engagementId: 'ENG-2025-01',
      code: 'WP-B',
      title: 'Piutang Usaha & Piutang Lain-lain',
      leadSchedule: 'A.2',
      totalBeginningBalanceIdr: 6_650_000_000,
      totalEndingBalanceIdr: 9_650_000_000,
      totalPriorYearBalanceIdr: 6_650_000_000,
      absoluteVarianceIdr: 3_000_000_000,
      percentageVariance: 0.451,
      reviewState: 'needs_review',
      preparedByUserId: 'USR-PREPARER-01',
      reviewedByUserId: 'USR-SENIOR-01',
    },
    {
      id: 'WP-C',
      engagementId: 'ENG-2025-01',
      code: 'WP-C',
      title: 'Persediaan (Inventory)',
      leadSchedule: 'A.3',
      totalBeginningBalanceIdr: 6_300_000_000,
      totalEndingBalanceIdr: 7_900_000_000,
      totalPriorYearBalanceIdr: 6_300_000_000,
      absoluteVarianceIdr: 1_600_000_000,
      percentageVariance: 0.254,
      reviewState: 'needs_review',
      preparedByUserId: 'USR-PREPARER-01',
    },
    {
      id: 'WP-TAX',
      engagementId: 'ENG-2025-01',
      code: 'WP-TAX',
      title: 'Kewajiban Perpajakan & Rekonsiliasi Fiskal PPh Badan',
      leadSchedule: 'C.2 & F.3',
      totalBeginningBalanceIdr: 195_000_000,
      totalEndingBalanceIdr: 310_000_000,
      totalPriorYearBalanceIdr: 195_000_000,
      absoluteVarianceIdr: 115_000_000,
      percentageVariance: 0.589,
      reviewState: 'generated',
      preparedByUserId: 'USR-TAX-01',
    },
  ];

  const validationChecks: ValidationCheck[] = [
    {
      id: 'CHK-001',
      engagementId: 'ENG-2025-01',
      code: 'TIE-001',
      title: 'Keseimbangan Neraca Saldo (Trial Balance)',
      category: 'tie_out',
      severity: 'info',
      description: 'Neraca saldo 31 Desember 2025 seimbang: Total Debit = Total Kredit.',
      differenceIdr: 0,
      sourceEvidenceIds: ['EVD-TB-COGS'],
      isCleared: true,
      clearedByUserId: 'USR-SENIOR-01',
    },
    {
      id: 'CHK-002',
      engagementId: 'ENG-2025-01',
      code: 'VAR-001',
      title: 'Fluktuasi Material Piutang Usaha (+45.1% YoY)',
      category: 'variance',
      severity: 'material',
      description: 'Pertumbuhan piutang usaha melampaui ambang batas materialitas Rp 250.000.000 (Selisih Rp 3.000.000.000).',
      differenceIdr: 3_000_000_000,
      sourceEvidenceIds: ['EVD-TB-AR'],
      isCleared: false,
    },
    {
      id: 'CHK-003',
      engagementId: 'ENG-2025-01',
      code: 'ANOM-001',
      title: 'Jurnal Angka Bulat Signifikan Rp 500.000.000',
      category: 'gl_anomaly',
      severity: 'warning',
      description: 'Jurnal nomor JV-2025-12-310 pada tanggal 31 Des 2025 memiliki nominal bulat Rp 500.000.000 atas biaya konsultasi.',
      differenceIdr: 500_000_000,
      sourceEvidenceIds: ['EVD-GL-ROUND'],
      isCleared: false,
    },
  ];

  const standardReferences: StandardReference[] = [
    {
      id: 'STD-001',
      standardCode: 'PSAK 1 Paragraf 10 & 27',
      title: 'Penyajian Laporan Keuangan Berdasarkan Prinsip Akrual',
      section: 'Komponen Lengkap Laporan Keuangan',
      effectiveDate: '2015-01-01',
      provenance: 'verified_official_corpus',
      applicabilityNote: 'Berlaku untuk seluruh entitas pelapor dengan akuntabilitas publik signifikan.',
      isConfirmedByReviewer: true,
    },
    {
      id: 'STD-002',
      standardCode: 'SPAP SA 520 Paragraf 5',
      title: 'Prosedur Analitis Substantif',
      section: 'Penyelidikan Fluktuasi Tidak Biasa & Uji Materialitas',
      effectiveDate: '2013-01-01',
      provenance: 'verified_official_corpus',
      applicabilityNote: 'Diterapkan pada pengujian analitis varians Piutang dan Margin Kotor FY2025.',
      isConfirmedByReviewer: true,
    },
    {
      id: 'STD-003',
      standardCode: 'UU HPP No. 7/2021 Pasal 17 ayat 1b',
      title: 'Tarif Pajak Penghasilan Wajib Pajak Badan (22%)',
      section: 'Ketentuan Perhitungan PPh Terutang',
      effectiveDate: '2022-01-01',
      provenance: 'verified_official_corpus',
      applicabilityNote: 'Diterapkan pada perhitungan Surat Pemberitahuan (SPT) Tahunan PPh Badan.',
      isConfirmedByReviewer: true,
    },
    {
      id: 'STD-004',
      standardCode: 'PMK 168/2023 & PP 58/2023',
      title: 'Tarif Efektif Rata-Rata (TER) PPh Pasal 21',
      section: 'Pemotongan Pajak Bulanan Kategori A, B, C',
      effectiveDate: '2024-01-01',
      provenance: 'verified_official_corpus',
      applicabilityNote: 'Diterapkan pada payroll karyawan tetap Januari s.d. Desember 2025.',
      isConfirmedByReviewer: true,
    },
  ];

  const reviewPoints: ReviewPoint[] = [
    {
      id: 'REV-001',
      engagementId: 'ENG-2025-01',
      workpaperSectionId: 'WP-B',
      title: 'Verifikasi Cadangan Kerugian Penurunan Nilai (CKPN) Piutang',
      detail: 'Saldo piutang usaha melonjak 45.1% namun CKPN hanya naik Rp 50.000.000. Mohon minta matrix aging piutang dan kalkulasi ECL sesuai PSAK 71.',
      assignedToUserId: 'USR-SENIOR-01',
      createdByUserId: 'USR-MANAGER-01',
      severity: 'material',
      isCleared: false,
      createdAt: '2026-02-05T11:00:00Z',
    },
    {
      id: 'REV-002',
      engagementId: 'ENG-2025-01',
      workpaperSectionId: 'WP-TAX',
      title: 'Daftar Nominatif Biaya Entertainment Tidak Lengkap',
      detail: 'Biaya entertainment sebesar Rp 150.000.000 tidak didukung daftar nominatif sesuai SE-27/PJ.22/1986, wajib dikoreksi fiskal positif.',
      assignedToUserId: 'USR-TAX-01',
      createdByUserId: 'USR-MANAGER-01',
      severity: 'material',
      isCleared: true,
      clearedAt: '2026-02-10T14:20:00Z',
      clearanceComment: 'Sudah dimasukkan ke daftar Koreksi Fiskal Positif pada perhitungan PPh Badan.',
      createdAt: '2026-02-06T15:30:00Z',
    },
  ];

  const findings: Finding[] = [
    {
      id: 'FND-001',
      engagementId: 'ENG-2025-01',
      findingNumber: 'F-2025-01',
      title: 'Kelemahan Kontrol Otorisasi Diskon dan Pengakuan Piutang Usaha',
      severity: 'material',
      condition: 'Days Sales Outstanding (DSO) meningkat dari 53 hari menjadi 68 hari, dan diskon penjualan akhir tahun melonjak sebesar 3.8% tanpa persetujuan Direksi.',
      criteria: 'Kebijakan internal kredit PT Nusantara Sukses Makmur SOP-FIN-04 dan SA 520 tentang Evaluasi Fluktuasi Material.',
      cause: 'Staf penjualan memberikan perpanjangan termin jatuh tempo 60 hari kepada 3 distributor tanpa analisis profil risiko kredit.',
      effect: 'Modal kerja terikat tambahan sebesar Rp 3.000.000.000 dan potensi risiko piutang tak tertagih meningkat.',
      recommendation: 'Manajemen harus menerapkan approval matrix kredit berjenjang di ERP dan melakukan konfirmasi saldo piutang.',
      managementResponse: 'Manajemen menerima rekomendasi dan sedang menyusun SOP otorisasi kredit baru efektif 1 April 2026.',
      linkedEvidenceIds: ['EVD-TB-AR'],
      linkedStandardIds: ['STD-002'],
      reviewState: 'approved',
      isIncludedInReportDraft: true,
    },
    {
      id: 'FND-002',
      engagementId: 'ENG-2025-01',
      findingNumber: 'F-2025-02',
      title: 'Koreksi Fiskal Positif Biaya Entertainment & Natura Tanpa Bukti Pendukung Memadai',
      severity: 'warning',
      condition: 'Biaya jamuan representasi senilai Rp 150.000.000 tidak memiliki Daftar Nominatif resmi.',
      criteria: 'Pasal 9 ayat 1 huruf k UU PPh stdd UU HPP dan SE-27/PJ.22/1986.',
      cause: 'Karyawan operasional tidak melampirkan daftar tamu dan rincian hubungan bisnis pada formulir klaim reimbursement.',
      effect: 'Kewajiban koreksi fiskal positif menambah beban pajak PPh Badan terutang sebesar Rp 33.000.000 (22% x Rp 150M).',
      recommendation: 'Lakukan sosialisasi kewajiban lampiran Daftar Nominatif pada setiap pengajuan biaya representasi/entertainment.',
      managementResponse: 'Bagian Keuangan telah merevisi formulir reimbursement dan memvalidasi daftar nominatif sebelum pembayaran.',
      linkedEvidenceIds: ['EVD-TB-COGS'],
      linkedStandardIds: ['STD-003'],
      reviewState: 'approved',
      isIncludedInReportDraft: true,
    },
  ];

  const reportDrafts: ReportDraft[] = [
    {
      id: 'REP-001',
      engagementId: 'ENG-2025-01',
      title: 'Executive Advisory Memo & Ringkasan Temuan Audit FY 2025',
      reportType: 'executive_advisory_memo',
      executiveSummary: 'Laporan ini merangkum hasil pemeriksaan atas Laporan Keuangan PT Nusantara Sukses Makmur untuk tahun buku yang berakhir 31 Desember 2025 serta analisis diagnostik advisory atas pergerakan margin dan strategi fiskal.',
      status: 'approved',
      findingsCount: 2,
      approvedByPartnerId: 'USR-PARTNER-01',
      approvedAt: '2026-02-14T16:00:00Z',
      lastEditedAt: '2026-02-14T15:45:00Z',
    },
  ];

  const auditEvents: AuditEvent[] = [
    {
      id: 'AUD-001',
      firmId: 'FIRM-001',
      engagementId: 'ENG-2025-01',
      actorUserId: 'USR-GUEST-01',
      actorName: 'Budi Hartono',
      actorRole: 'client_guest',
      action: 'document_uploaded',
      entityType: 'Document',
      entityId: 'DOC-001',
      details: 'Klien mengunggah dokumen Trial Balance FY 2025 melalui Client Portal PBC.',
      timestamp: '2026-01-18T10:15:00Z',
    },
    {
      id: 'AUD-002',
      firmId: 'FIRM-001',
      engagementId: 'ENG-2025-01',
      actorUserId: 'USR-TAX-01',
      actorName: 'Rizky Ramadhan, BKP',
      actorRole: 'tax_consultant',
      action: 'tax_calculated',
      entityType: 'TaxCalculation',
      entityId: 'TAX-CALC-001',
      details: 'Menjalankan kalkulasi Rekonsiliasi Fiskal PPh Badan & TER PPh 21 dengan UU HPP 22%.',
      timestamp: '2026-02-08T09:30:00Z',
    },
    {
      id: 'AUD-003',
      firmId: 'FIRM-001',
      engagementId: 'ENG-2025-01',
      actorUserId: 'USR-SENIOR-01',
      actorName: 'Ahmad Pratama, S.Ak',
      actorRole: 'senior',
      action: 'review_point_cleared',
      entityType: 'ReviewPoint',
      entityId: 'REV-002',
      details: 'Membersihkan review point biaya entertainment setelah dikonfirmasi sebagai Koreksi Fiskal Positif.',
      timestamp: '2026-02-10T14:20:00Z',
    },
    {
      id: 'AUD-004',
      firmId: 'FIRM-001',
      engagementId: 'ENG-2025-01',
      actorUserId: 'USR-MANAGER-01',
      actorName: 'Siti Rahmawati, M.Ak, CPA',
      actorRole: 'manager',
      action: 'workpaper_approved',
      entityType: 'WorkpaperSection',
      entityId: 'WP-A',
      details: 'Menyetujui Kertas Kerja Kas & Setara Kas (WP-A).',
      timestamp: '2026-02-12T11:15:00Z',
    },
    {
      id: 'AUD-005',
      firmId: 'FIRM-001',
      engagementId: 'ENG-2025-01',
      actorUserId: 'USR-PARTNER-01',
      actorName: 'Bambang Hendrawan, SE, Ak, CA, CPA',
      actorRole: 'partner',
      action: 'report_draft_approved',
      entityType: 'ReportDraft',
      entityId: 'REP-001',
      details: 'Otorisasi dan persetujuan final Executive Advisory Memo FY 2025.',
      timestamp: '2026-02-14T16:00:00Z',
    },
  ];

  // Generate 4-Level Advisory Insights
  const advisoryInsights: AdvisoryInsight[] = [
    {
      id: 'ADV-001',
      engagementId: 'ENG-2025-01',
      level: 'descriptive',
      claimType: 'confirmed_fact',
      title: 'Kontraksi Gross Margin Laba Kotor 6.8% YoY',
      observation: 'Gross margin laba kotor menurun dari 38.2% pada FY 2024 menjadi 31.4% pada FY 2025. Pertumbuhan HPP Bahan Baku (+24.4%) melampaui pertumbuhan penjualan (+11.9%).',
      implication: 'Penurunan profitabilitas operasional inti dan penipisan ruang kas untuk menutupi beban bunga dan belanja modal.',
      recommendedInvestigation: 'Analisis rincian HPP berdasarkan fluktuasi harga kontrak baja global dan depresiasi kurs Rupiah.',
      confidenceScore: 0.99,
      evidenceIds: ['EVD-TB-COGS', 'EVD-TB-REV'],
      standardReferenceIds: ['STD-001', 'STD-002'],
      authorEngine: 'finova-advisory-v3.0',
      status: 'included_in_report',
    },
    {
      id: 'ADV-002',
      engagementId: 'ENG-2025-01',
      level: 'diagnostic',
      claimType: 'likely_driver',
      title: 'Driver Utama: Kenaikan Biaya Bahan Baku Impor & Kebocoran Diskon',
      observation: 'Sebesar 74% dari kenaikan HPP berasal dari komponen baja impor, bertepatan dengan rata-rata kenaikan harga supplier 18% dan diskon volume 3.8% tanpa approval Direksi.',
      likelyDriver: 'Kombinasi depresiasi kurs valas impor dan kebijakan diskon kuartal IV yang agresif.',
      implication: 'Erosi margin akan menjadi permanen bila tidak segera dilakukan renegosiasi kontrak harga jual OEM.',
      hypothesis: 'Terdapat indikasi pemberian diskon tidak resmi pada 3 distributor besar yang menyebabkan selisih penerimaan.',
      recommendedInvestigation: 'Lakukan sampling konfirmasi penjualan pada 20 nota debit dengan potongan di atas 5%.',
      confidenceScore: 0.89,
      evidenceIds: ['EVD-TB-COGS'],
      standardReferenceIds: ['STD-002'],
      authorEngine: 'finova-advisory-v3.0',
      status: 'included_in_report',
    },
    {
      id: 'ADV-003',
      engagementId: 'ENG-2025-01',
      level: 'predictive',
      claimType: 'scenario',
      title: 'Skenario Proyeksi: Dampak Terhadap EBITDA FY 2026',
      observation: 'Jika struktur biaya run-rate Q4 berlanjut tanpa penyesuaian harga jual.',
      implication: 'EBITDA FY 2026 diproyeksikan tertekan sebesar Rp 2.450.000.000, berisiko melanggar kovenan rasio utang bank (DSCR < 1.25x).',
      hypothesis: 'Asumsi skenario: Biaya logistik naik 4.0% dan suku bunga BI 6.0%.',
      recommendedInvestigation: 'Simulasikan kenaikan harga jual bertahap sebesar 3.5% pada katalog produk OEM unggulan.',
      confidenceScore: 0.82,
      evidenceIds: ['EVD-TB-REV'],
      standardReferenceIds: [],
      authorEngine: 'finova-advisory-v3.0',
      status: 'included_in_report',
    },
    {
      id: 'ADV-004',
      engagementId: 'ENG-2025-01',
      level: 'prescriptive',
      claimType: 'likely_driver',
      title: 'Tindakan Strategis: Penerapan Price Escalation Clause & Limit Diskon',
      observation: 'Kontrak pelanggan saat ini bertipe fixed-price tanpa mekanisme penyesuaian fluktuasi bahan baku.',
      implication: 'Kompensasi margin hingga 2.5% dapat dicapai dalam 6 bulan pasca amandemen kontrak.',
      recommendedInvestigation: 'Tinjau klausul kontrak jangka panjang 5 pelanggan terbesar yang menyumbang 65% pendapatan.',
      recommendedAction: '1) Tambahkan klausul eskalasi harga berbasis indeks baja; 2) Kunci sistem ERP agar diskon > 3% mewajibkan approval Finance Director.',
      confidenceScore: 0.91,
      evidenceIds: ['EVD-TB-REV', 'EVD-TB-COGS'],
      standardReferenceIds: ['STD-002'],
      authorEngine: 'finova-advisory-v3.0',
      status: 'included_in_report',
    },
  ];

  return {
    firms: [firm1, firm2],
    users,
    clients,
    engagements,
    pbcRequests,
    documents,
    extractionJobs,
    evidenceList,
    accountMappings,
    workpaperSections,
    validationChecks,
    standardReferences,
    reviewPoints,
    findings,
    reportDrafts,
    auditEvents,
    advisoryInsights,
  };
}

// Global persistent in-memory repository singleton
class FinovaRepository {
  private state: FinovaState;

  constructor() {
    this.state = initializeState();
  }

  public getState(): FinovaState {
    return this.state;
  }

  public resetState(): void {
    this.state = initializeState();
  }

  // --- Firm & Tenant Isolation ---
  public getFirm(firmId: string): Firm | undefined {
    return this.state.firms.find((f) => f.id === firmId);
  }

  public getEngagementsByFirm(firmId: string): Engagement[] {
    return this.state.engagements.filter((e) => e.firmId === firmId);
  }

  public getEngagement(engagementId: string, firmId?: string): Engagement | undefined {
    const eng = this.state.engagements.find((e) => e.id === engagementId);
    if (!eng) return undefined;
    if (firmId && eng.firmId !== firmId) {
      throw new Error(`Akses Ditolak: Keterlibatan ${engagementId} bukan milik kantor ${firmId}.`);
    }
    return eng;
  }

  // --- PBC Requests & Client Portal ---
  public getPbcRequests(engagementId: string): PBCRequest[] {
    return this.state.pbcRequests.filter((p) => p.engagementId === engagementId);
  }

  public getPbcByGuestToken(token: string): PBCRequest | undefined {
    return this.state.pbcRequests.find((p) => p.guestAccessToken === token);
  }

  public updatePbcStatus(id: string, status: PBCRequest['status'], actor: User): PBCRequest {
    const pbc = this.state.pbcRequests.find((p) => p.id === id);
    if (!pbc) throw new Error(`PBC Request ${id} not found`);
    pbc.status = status;
    pbc.updatedAt = new Date().toISOString();

    this.addAuditEvent({
      firmId: actor.firmId,
      engagementId: pbc.engagementId,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'document_uploaded',
      entityType: 'PBCRequest',
      entityId: pbc.id,
      details: `Status PBC diperbarui menjadi "${status}" oleh ${actor.name}.`,
    });

    return pbc;
  }

  // --- Documents & Extractions ---
  public getDocuments(engagementId: string): Document[] {
    return this.state.documents.filter((d) => d.engagementId === engagementId);
  }

  public getExtractionJob(jobId: string): ExtractionJob | undefined {
    return this.state.extractionJobs.find((j) => j.id === jobId);
  }

  public getEvidence(engagementId: string): Evidence[] {
    return this.state.evidenceList.filter((e) => e.engagementId === engagementId);
  }

  // --- Workpaper Mapping ---
  public getAccountMappings(engagementId: string): AccountMapping[] {
    return this.state.accountMappings.filter((m) => m.engagementId === engagementId);
  }

  public overrideMapping(
    mappingId: string,
    newSection: string,
    actor: User,
    rationale: string
  ): AccountMapping {
    const mapping = this.state.accountMappings.find((m) => m.id === mappingId);
    if (!mapping) throw new Error(`Mapping ${mappingId} not found`);

    const oldSection = mapping.standardWorkpaperSection;
    mapping.standardWorkpaperSection = newSection;
    mapping.mappingStatus = 'overridden';
    mapping.confirmedByUserId = actor.id;
    mapping.isAmbiguous = false;
    mapping.rationale = `Disesuaikan manual oleh ${actor.name}: ${rationale} (Sebelumnya: ${oldSection})`;

    this.addAuditEvent({
      firmId: actor.firmId,
      engagementId: mapping.engagementId,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'mapping_overridden',
      entityType: 'AccountMapping',
      entityId: mapping.id,
      details: `Pemetaan akun ${mapping.sourceAccountCode} diubah dari ${oldSection} ke ${newSection}.`,
    });

    return mapping;
  }

  // --- Workpaper Sections & Reviews ---
  public getWorkpaperSections(engagementId: string): WorkpaperSection[] {
    return this.state.workpaperSections.filter((w) => w.engagementId === engagementId);
  }

  public approveWorkpaperSection(sectionId: string, actor: User): WorkpaperSection {
    const sec = this.state.workpaperSections.find((w) => w.id === sectionId);
    if (!sec) throw new Error(`Workpaper section ${sectionId} not found`);

    sec.reviewState = 'approved';
    sec.approvedByUserId = actor.id;

    this.addAuditEvent({
      firmId: actor.firmId,
      engagementId: sec.engagementId,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'workpaper_approved',
      entityType: 'WorkpaperSection',
      entityId: sec.id,
      details: `Kertas kerja ${sec.code} (${sec.title}) disetujui oleh ${actor.name}.`,
    });

    return sec;
  }

  public lockWorkpaperSection(sectionId: string, actor: User, reason: string): WorkpaperSection {
    const sec = this.state.workpaperSections.find((w) => w.id === sectionId);
    if (!sec) throw new Error(`Workpaper section ${sectionId} not found`);

    sec.reviewState = 'locked';
    sec.lockedAt = new Date().toISOString();
    sec.lockedReason = reason;

    this.addAuditEvent({
      firmId: actor.firmId,
      engagementId: sec.engagementId,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'workpaper_locked',
      entityType: 'WorkpaperSection',
      entityId: sec.id,
      details: `Kertas kerja ${sec.code} dikunci (Locked): "${reason}".`,
    });

    return sec;
  }

  public reopenWorkpaperSection(sectionId: string, actor: User, reason: string): WorkpaperSection {
    const sec = this.state.workpaperSections.find((w) => w.id === sectionId);
    if (!sec) throw new Error(`Workpaper section ${sectionId} not found`);

    sec.reviewState = 'needs_review';
    sec.lockedAt = undefined;
    sec.lockedReason = undefined;

    this.addAuditEvent({
      firmId: actor.firmId,
      engagementId: sec.engagementId,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'workpaper_reopened',
      entityType: 'WorkpaperSection',
      entityId: sec.id,
      details: `Kertas kerja ${sec.code} dibuka kembali (Reopened) oleh ${actor.name}: "${reason}".`,
    });

    return sec;
  }

  // --- Review Points ---
  public getReviewPoints(engagementId: string): ReviewPoint[] {
    return this.state.reviewPoints.filter((r) => r.engagementId === engagementId);
  }

  public clearReviewPoint(pointId: string, actor: User, comment: string): ReviewPoint {
    const pt = this.state.reviewPoints.find((r) => r.id === pointId);
    if (!pt) throw new Error(`Review point ${pointId} not found`);

    pt.isCleared = true;
    pt.clearedAt = new Date().toISOString();
    pt.clearanceComment = comment;

    this.addAuditEvent({
      firmId: actor.firmId,
      engagementId: pt.engagementId,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'review_point_cleared',
      entityType: 'ReviewPoint',
      entityId: pt.id,
      details: `Catatan review "${pt.title}" dibersihkan oleh ${actor.name}: "${comment}".`,
    });

    return pt;
  }

  // --- Findings & Reports ---
  public getFindings(engagementId: string): Finding[] {
    return this.state.findings.filter((f) => f.engagementId === engagementId);
  }

  public getReportDrafts(engagementId: string): ReportDraft[] {
    return this.state.reportDrafts.filter((r) => r.engagementId === engagementId);
  }

  public approveReportDraft(draftId: string, partnerUser: User): ReportDraft {
    const draft = this.state.reportDrafts.find((r) => r.id === draftId);
    if (!draft) throw new Error(`Report draft ${draftId} not found`);

    draft.status = 'approved';
    draft.approvedByPartnerId = partnerUser.id;
    draft.approvedAt = new Date().toISOString();

    this.addAuditEvent({
      firmId: partnerUser.firmId,
      engagementId: draft.engagementId,
      actorUserId: partnerUser.id,
      actorName: partnerUser.name,
      actorRole: partnerUser.role,
      action: 'report_draft_approved',
      entityType: 'ReportDraft',
      entityId: draft.id,
      details: `Laporan/Memo ${draft.title} disahkan dan disetujui oleh Partner ${partnerUser.name}.`,
    });

    return draft;
  }

  // --- Audit Events ---
  public getAuditEvents(engagementId?: string): AuditEvent[] {
    if (engagementId) {
      return this.state.auditEvents.filter((a) => a.engagementId === engagementId);
    }
    return this.state.auditEvents;
  }

  public addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditEvents.unshift(fullEvent);
    return fullEvent;
  }
}

// Global Singleton for API and Server Components
export const db = new FinovaRepository();
