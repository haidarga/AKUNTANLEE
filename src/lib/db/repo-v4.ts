
// Server-only dynamic filesystem resolution for Next.js client bundling
function getFsModules() {
  if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.versions?.node) {
    return { fs: null, path: null };
  }
  try {
    const req = eval('require');
    return { fs: req('fs'), path: req('path') };
  } catch (e) {
    return { fs: null, path: null };
  }
}
// FINOVA AI v4.0 — In-Memory & Persistent State Repository
// Strict Multi-Tenant Enforcement & Release 0.1 Domain Models
// Authoritative Source: Sections 40, 41, 46 of FINOVA PRD v4.0

import {
  AuditAdjustmentEntry,
  ReviewerNote,
  EvidenceAttachment,
  Tenant,
  FirmProfile,
  TeamMemberProfile,
  UserV4,
  UserRoleV4,
  ClientV4,
  EngagementV4,
  FileVersion,
  ImportJob,
  DatasetVersion,
  AccountRow,
  MappingSet,
  MappingDecision,
  WorkpaperVersion,
  WorkpaperLineItem,
  EvidenceLink,
  ValidationCheckResult,
  WorkpaperComment,
  ExportArtifact,
  AuditEventV4,
  ReusableMapping,
} from '@/types/domain-v4';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';
import { generateWorkpaperXlsx } from '@/lib/exporter/xlsx-builder';

export interface FinovaV4State {
  tenants: Tenant[];
  users: UserV4[];
  clients: ClientV4[];
  engagements: EngagementV4[];
  fileVersions: FileVersion[];
  importJobs: ImportJob[];
  datasetVersions: DatasetVersion[];
  accounts: AccountRow[];
  mappingSets: MappingSet[];
  mappingDecisions: MappingDecision[];
  workpaperVersions: WorkpaperVersion[];
  workpaperLines: WorkpaperLineItem[];
  evidenceLinks: EvidenceLink[];
  validationChecks: ValidationCheckResult[];
  comments: WorkpaperComment[];
  exportArtifacts: ExportArtifact[];
  auditEvents: AuditEventV4[];
  reusableMappings: ReusableMapping[];
  firmProfile: FirmProfile;
  adjustments: AuditAdjustmentEntry[];
  reviewerNotes: ReviewerNote[];
  evidenceAttachments: EvidenceAttachment[];
}

// Initial State Generator
function createInitialState(): FinovaV4State {
  const firmProfile: FirmProfile = {
    id: 'FIRM-001',
    name: 'KAP Haidar & Rekan',
    shortName: 'KAP Haidar',
    licenseNumber: 'KMK No. 492/KM.1/2024',
    managingPartnerName: 'Haidar, CPA, CA',
    managingPartnerApNumber: 'AP.0942',
    address: 'Menara Finansial Indonesia Lt. 18, Jl. Jend. Sudirman Kav. 52-53',
    city: 'Jakarta Selatan',
    email: 'contact@kaphaidar.co.id',
    phone: '+62 21 5299 8800',
    defaultAccountingStandard: 'SAK_INDONESIA',
    defaultMaterialityIdr: 250000000,
    teamMembers: [
      {
        id: 'usr-1',
        name: 'Haidar, CPA, CA',
        title: 'Audit Partner (Signing Partner)',
        email: 'haidar@kaphaidar.co.id',
        role: 'partner',
        cpaLicense: 'AP.0942',
      },
      {
        id: 'usr-2',
        name: 'Siti Rahmawati, CA',
        title: 'Engagement Manager',
        email: 'siti.r@kaphaidar.co.id',
        role: 'manager',
        cpaLicense: 'CA.18471',
      },
      {
        id: 'usr-3',
        name: 'Ahmad Pratama, S.Ak',
        title: 'Senior In-Charge (Field Senior)',
        email: 'ahmad.p@kaphaidar.co.id',
        role: 'senior',
      },
      {
        id: 'usr-4',
        name: 'Budi Santoso, S.Ak',
        title: 'Preparer (Junior Associate)',
        email: 'budi.s@kaphaidar.co.id',
        role: 'preparer',
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  const tenant1: Tenant = {
    id: 'TENANT-001',
    name: firmProfile.name,
    region: 'id-jkt',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const tenant2: Tenant = {
    id: 'TENANT-002',
    name: 'KAP Siddharta Widjaja & Rekan',
    region: 'id-jkt',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const users: UserV4[] = [
    {
      id: 'USR-PARTNER-01',
      tenantId: 'TENANT-001',
      name: 'Bambang Hendrawan, CPA',
      email: 'bambang.hendrawan@tanudiredja.id',
      role: 'partner',
      title: 'Audit & Advisory Partner',
      status: 'active',
    },
    {
      id: 'USR-MANAGER-01',
      tenantId: 'TENANT-001',
      name: 'Siti Rahmawati, CPA',
      email: 'siti.rahmawati@tanudiredja.id',
      role: 'manager',
      title: 'Engagement Manager',
      status: 'active',
    },
    {
      id: 'USR-SENIOR-01',
      tenantId: 'TENANT-001',
      name: 'Ahmad Pratama, S.Ak',
      email: 'ahmad.pratama@tanudiredja.id',
      role: 'senior',
      title: 'Senior Field In-Charge',
      status: 'active',
    },
    {
      id: 'USR-PREPARER-01',
      tenantId: 'TENANT-001',
      name: 'Dewi Lestari, S.Ak',
      email: 'dewi.lestari@tanudiredja.id',
      role: 'preparer',
      title: 'Junior Audit Associate',
      status: 'active',
    },
    // User from Tenant 2 for cross-tenant testing
    {
      id: 'USR-EXT-01',
      tenantId: 'TENANT-002',
      name: 'Hendrik Susanto, CPA',
      email: 'hendrik.susanto@siddharta.id',
      role: 'partner',
      title: 'Lead Partner',
      status: 'active',
    },
  ];

  const client1: ClientV4 = {
    id: 'CLI-001',
    tenantId: 'TENANT-001',
    legalName: 'PT Nusantara Sukses Makmur',
    code: 'NSM',
    industry: 'Manufaktur Komponen Presisi & Otomotif',
    status: 'active',
    createdAt: '2024-06-01T00:00:00Z',
  };

  const engagement1: EngagementV4 = {
    id: 'ENG-2026-01',
    tenantId: 'TENANT-001',
    clientId: 'CLI-001',
    name: 'Financial Review & Lead Schedule FY 2026',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    currency: 'IDR',
    materialityIdr: 250_000_000,
    status: 'preparing',
    leadPartnerId: 'USR-PARTNER-01',
    managerId: 'USR-MANAGER-01',
    seniorId: 'USR-SENIOR-01',
    preparerId: 'USR-PREPARER-01',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-14T10:00:00Z',
  };

  const file1: FileVersion = {
    id: 'FV-001',
    assetId: 'FA-TB-2026-NSM',
    tenantId: 'TENANT-001',
    engagementId: 'ENG-2026-01',
    versionNumber: 1,
    originalName: 'TB_PT_Nusantara_Sukses_Makmur_FY2026.xlsx',
    storageKey: 'engagements/ENG-2026-01/sources/9f83a48e_TB_PT_Nusantara_Sukses_Makmur_FY2026.xlsx',
    checksumSha256: '9f83a48e71c9b204683bc48b3017fa489110756e4c7717bc2d043444fb9a7b92',
    mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 684200,
    status: 'ready',
    uploadedByUserId: 'USR-SENIOR-01',
    scanStatus: 'clean',
    sheetCount: 3,
    sheetNames: ['Trial Balance', 'General Ledger Sample', 'Notes'],
    createdAt: '2026-01-18T09:30:00Z',
  };

  const dsv1: DatasetVersion = {
    id: 'DSV-001',
    tenantId: 'TENANT-001',
    engagementId: 'ENG-2026-01',
    importJobId: 'IMP-001',
    fileVersionId: 'FV-001',
    datasetType: 'trial_balance',
    rowCount: 22,
    totals: {
      totalDebitIdr: 52_400_000_000,
      totalCreditIdr: 52_400_000_000,
      netBalanceIdr: 0,
    },
    publishedAt: '2026-01-18T09:40:00Z',
  };

  // 22 Raw Accounts
  const rawAccountsData = [
    { code: '1110-00', name: 'Kas di Bank Mandiri (IDR)', d: 1_850_000_000, c: 0, target: 'WP-A.1', conf: 0.96, level: 'high' as const, rat: 'Pola standar Kas & Bank (1110)' },
    { code: '1111-00', name: 'Kas di Bank BCA Operasional', d: 2_650_000_000, c: 0, target: 'WP-A.1', conf: 0.97, level: 'high' as const, rat: 'Pola standar Kas & Bank (1111)' },
    { code: '1120-00', name: 'Piutang Usaha Pihak Ketiga', d: 9_850_000_000, c: 0, target: 'WP-A.2', conf: 0.95, level: 'high' as const, rat: 'Pola standar Piutang Dagang (1120)' },
    { code: '1129-00', name: 'Cadangan Kerugian Penurunan Nilai Piutang (CKPN)', d: 0, c: 200_000_000, target: 'WP-A.3', conf: 0.92, level: 'high' as const, rat: 'Kontra aset piutang (1129)' },
    { code: '1130-00', name: 'Persediaan Bahan Baku & Pembantu', d: 4_350_000_000, c: 0, target: 'WP-A.4', conf: 0.94, level: 'high' as const, rat: 'Pola persediaan manufaktur (1130)' },
    { code: '1131-00', name: 'Persediaan Barang Jadi (Finished Goods)', d: 4_100_000_000, c: 0, target: 'WP-A.4', conf: 0.93, level: 'high' as const, rat: 'Persediaan barang jadi (1131)' },
    { code: '1140-00', name: 'Uang Muka Pembelian & Sewa Dibayar Dimuka', d: 450_000_000, c: 0, target: 'WP-A.5', conf: 0.91, level: 'high' as const, rat: 'Beban dibayar dimuka (1140)' },
    { code: '1210-00', name: 'Aset Tetap Mesin & Peralatan Pabrik', d: 11_200_000_000, c: 0, target: 'WP-B.1', conf: 0.95, level: 'high' as const, rat: 'Aset tetap pabrik (1210)' },
    { code: '1220-00', name: 'Aset Tetap Kendaraan & Logistik', d: 4_300_000_000, c: 0, target: 'WP-B.1', conf: 0.94, level: 'high' as const, rat: 'Aset tetap kendaraan (1220)' },
    { code: '1290-00', name: 'Akumulasi Penyusutan Mesin & Kendaraan', d: 0, c: 4_650_000_000, target: 'WP-B.2', conf: 0.92, level: 'high' as const, rat: 'Kontra aset tetap (1290)' },
    { code: '1300-00', name: 'Aset Hak Guna & Jaminan Utilitas', d: 650_000_000, c: 0, target: 'WP-B.3', conf: 0.88, level: 'high' as const, rat: 'Aset tidak lancar lainnya (1300)' },
    { code: '2110-00', name: 'Utang Usaha Supplier Logam & Komponen', d: 0, c: 4_850_000_000, target: 'WP-C.1', conf: 0.95, level: 'high' as const, rat: 'Utang dagang pihak ketiga (2110)' },
    { code: '2120-00', name: 'Utang PPN & PPh 21/23', d: 0, c: 380_000_000, target: 'WP-C.2', conf: 0.91, level: 'high' as const, rat: 'Kewajiban perpajakan lancar (2120)' },
    { code: '2130-00', name: 'Beban Akrual Gaji & Bonus Karyawan', d: 0, c: 540_000_000, target: 'WP-C.3', conf: 0.90, level: 'high' as const, rat: 'Biaya masih harus dibayar (2130)' },
    // AMBIGUOUS ACCOUNT
    { code: '2199-00', name: 'Akun Penampungan Selisih Kurs Sementara', d: 0, c: 310_000_000, target: 'WP-C.1', conf: 0.38, level: 'low' as const, rat: 'Akun antara/suspense dengan saldo penampungan kurs' },
    { code: '2210-00', name: 'Utang Bank Mandiri Jangka Panjang', d: 0, c: 5_500_000_000, target: 'WP-D.1', conf: 0.96, level: 'high' as const, rat: 'Pinjaman bank jangka panjang (2210)' },
    { code: '2220-00', name: 'Kewajiban Imbalan Pasca Kerja (PSAK 24)', d: 0, c: 780_000_000, target: 'WP-D.2', conf: 0.89, level: 'high' as const, rat: 'Kewajiban imbalan kerja (2220)' },
    { code: '3100-00', name: 'Modal Saham Ditempatkan dan Disetor Penuh', d: 0, c: 8_000_000_000, target: 'WP-E.1', conf: 0.98, level: 'high' as const, rat: 'Modal saham terdaftar (3100)' },
    { code: '3200-00', name: 'Saldo Laba Ditahan s.d. Tahun Lalu', d: 0, c: 9_940_000_000, target: 'WP-E.2', conf: 0.96, level: 'high' as const, rat: 'Retained earnings awal (3200)' },
    { code: '4100-00', name: 'Pendapatan Usaha Penjualan Komponen', d: 0, c: 52_400_000_000, target: 'WP-F.1', conf: 0.98, level: 'high' as const, rat: 'Omset pendapatan operasional (4100)' },
    { code: '5100-00', name: 'Beban Pokok Penjualan (HPP)', d: 35_950_000_000, c: 0, target: 'WP-F.2', conf: 0.97, level: 'high' as const, rat: 'Biaya bahan baku dan pabrikasi (5100)' },
    { code: '6100-00', name: 'Beban Operasional, Gaji & Umum', d: 12_200_000_000, c: 0, target: 'WP-F.3', conf: 0.95, level: 'high' as const, rat: 'Beban operasional OPEX (6100)' },
  ];

  const accounts: AccountRow[] = [];
  const decisions: MappingDecision[] = [];

  rawAccountsData.forEach((row, i) => {
    const rowNum = i + 2;
    const closing = row.d > 0 ? row.d : -row.c;

    accounts.push({
      id: `ACC-${row.code}`,
      datasetVersionId: 'DSV-001',
      accountCode: row.code,
      accountName: row.name,
      openingBalanceIdr: 0,
      debitIdr: row.d,
      creditIdr: row.c,
      closingBalanceIdr: closing,
      periodEnd: '2026-12-31',
      currency: 'IDR',
      sourceLocator: {
        fileVersionId: 'FV-001',
        sheetName: 'Trial Balance',
        rowNumber: rowNum,
        cellRange: `Trial Balance!A${rowNum}:F${rowNum}`,
      },
    });

    const isAmbiguous = row.conf < 0.60;

    decisions.push({
      id: `MAPDEC-${row.code}`,
      mappingSetId: 'MAPSET-001',
      tenantId: 'TENANT-001',
      accountRowId: `ACC-${row.code}`,
      sourceAccountCode: row.code,
      sourceAccountName: row.name,
      amountIdr: closing,
      proposedTarget: row.target,
      effectiveTarget: isAmbiguous ? undefined : row.target,
      confidenceScore: row.conf,
      confidenceLevel: row.level,
      rationale: row.rat,
      status: isAmbiguous ? 'needs_review' : 'mapped',
      isMaterial: Math.abs(closing) >= 250_000_000,
      decidedByUserId: isAmbiguous ? undefined : 'USR-SENIOR-01',
      decidedAt: isAmbiguous ? undefined : '2026-01-18T10:00:00Z',
    });
  });

  const mapSet1: MappingSet = {
    id: 'MAPSET-001',
    tenantId: 'TENANT-001',
    engagementId: 'ENG-2026-01',
    datasetVersionId: 'DSV-001',
    versionNumber: 1,
    status: 'draft',
    createdAt: '2026-01-18T09:45:00Z',
  };

  const initialAdjustments: AuditAdjustmentEntry[] = [
    {
      id: 'AJE-001',
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      entryNumber: 1,
      type: 'reclassification',
      referenceWp: 'WP-C.1 / WP-F.4',
      description: 'Reklasifikasi saldo penampungan selisih kurs menggantung di liabilitas ke Pendapatan Lain-lain (Keuntungan Selisih Kurs) sesuai PSAK 10',
      standardReference: 'PSAK 10 & SAK Indonesia',
      debitLineId: 'WP-C.1',
      debitAmountIdr: 310_000_000,
      creditLineId: 'WP-F.4',
      creditAmountIdr: 310_000_000,
      preparedByUserId: 'USR-SENIOR-01',
      preparedByName: 'Ahmad Pratama, S.Ak',
      approvedByUserId: 'USR-PARTNER-01',
      status: 'approved',
      createdAt: '2026-01-20T14:30:00Z',
    }
  ];

  // Initial Workpaper Calculation (Audited Final after Approved AJE-001)
  const wpCalc = calculateWorkpaperVersion({
    tenantId: 'TENANT-001',
    engagementId: 'ENG-2026-01',
    datasetVersionId: 'DSV-001',
    mappingSetId: 'MAPSET-001',
    accounts,
    mappingDecisions: decisions,
    template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
    versionNumber: 1,
    adjustments: initialAdjustments,
  });

  const reusableMappings: ReusableMapping[] = [
    {
      id: 'RM-01',
      tenantId: 'TENANT-001',
      sourceAccountPattern: '1110-*',
      targetSection: 'WP-A.1',
      confidence: 0.98,
      approvedByUserId: 'USR-MANAGER-01',
      approvedAt: '2026-12-01T00:00:00Z',
      timesReused: 14,
      status: 'active',
    },
    {
      id: 'RM-02',
      tenantId: 'TENANT-001',
      sourceAccountPattern: '1120-*',
      targetSection: 'WP-A.2',
      confidence: 0.95,
      approvedByUserId: 'USR-MANAGER-01',
      approvedAt: '2026-12-01T00:00:00Z',
      timesReused: 12,
      status: 'active',
    },
    {
      id: 'RM-03',
      tenantId: 'TENANT-001',
      sourceAccountPattern: '2110-*',
      targetSection: 'WP-C.1',
      confidence: 0.96,
      approvedByUserId: 'USR-MANAGER-01',
      approvedAt: '2026-12-01T00:00:00Z',
      timesReused: 18,
      status: 'active',
    },
    {
      id: 'RM-04',
      tenantId: 'TENANT-001',
      sourceAccountPattern: '4100-*',
      targetSection: 'WP-F.1',
      confidence: 0.99,
      approvedByUserId: 'USR-PARTNER-01',
      approvedAt: '2026-11-15T00:00:00Z',
      timesReused: 24,
      status: 'active',
    },
  ];

  const auditEvents: AuditEventV4[] = [
    {
      id: 'EVT-001',
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      actorId: 'USR-PARTNER-01',
      actorName: 'Bambang Hendrawan, CPA',
      actorRole: 'partner',
      action: 'engagement_created',
      resourceType: 'Engagement',
      resourceId: 'ENG-2026-01',
      timestamp: '2026-01-15T08:00:00Z',
      requestId: 'req-init-001',
    },
    {
      id: 'EVT-002',
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      actorId: 'USR-SENIOR-01',
      actorName: 'Ahmad Pratama, S.Ak',
      actorRole: 'senior',
      action: 'file_uploaded',
      resourceType: 'FileVersion',
      resourceId: 'FV-001',
      timestamp: '2026-01-18T09:30:00Z',
      requestId: 'req-up-002',
      metadata: { filename: 'TB_PT_Nusantara_Sukses_Makmur_FY2026.xlsx', size: 684200 },
    },
    {
      id: 'EVT-003',
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      actorId: 'USR-SENIOR-01',
      actorName: 'Ahmad Pratama, S.Ak',
      actorRole: 'senior',
      action: 'dataset_published',
      resourceType: 'DatasetVersion',
      resourceId: 'DSV-001',
      timestamp: '2026-01-18T09:40:00Z',
      requestId: 'req-dsv-003',
      metadata: { rowCount: 22, totalDebitIdr: 52400000000 },
    },
    {
      id: 'EVT-004',
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2026-01',
      actorId: 'USR-MANAGER-01',
      actorName: 'Siti Rahmawati, CPA',
      actorRole: 'manager',
      action: 'workpaper_calculated',
      resourceType: 'WorkpaperVersion',
      resourceId: wpCalc.workpaperVersion.id,
      timestamp: '2026-01-18T10:15:00Z',
      requestId: 'req-wp-004',
    },
  ];

  return {
    tenants: [tenant1, tenant2],
    users,
    clients: [
      client1,
      {
        id: 'CLI-002',
        tenantId: 'TENANT-001',
        legalName: 'PT Surya Retail Indonesia',
        code: 'SRI',
        industry: 'Perdagangan Eceran & Distribusi',
        status: 'active',
        createdAt: '2026-01-15T08:00:00Z',
      },
      {
        id: 'CLI-003',
        tenantId: 'TENANT-001',
        legalName: 'CV Maju Logistik Nusantara',
        code: 'MLN',
        industry: 'Transportasi & Ekspedisi',
        status: 'active',
        createdAt: '2026-01-16T09:00:00Z',
      },
    ],
    engagements: [engagement1],
    fileVersions: [file1],
    importJobs: [],
    datasetVersions: [dsv1],
    accounts,
    mappingSets: [mapSet1],
    mappingDecisions: decisions,
    workpaperVersions: [wpCalc.workpaperVersion],
    workpaperLines: wpCalc.lines,
    evidenceLinks: wpCalc.evidenceLinks,
    validationChecks: wpCalc.checks,
    comments: [
      {
        id: 'COM-01',
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        targetLineId: 'WP-A.2',
        authorId: 'USR-MANAGER-01',
        authorName: 'Siti Rahmawati, CPA',
        authorRole: 'manager',
        body: 'Kenaikan saldo piutang sebesar 43.8% YoY melampaui ambang materialitas Rp 250 Jt. Mohon pastikan konfirmasi 10 debitur terbesar telah dikirimkan.',
        createdAt: '2026-01-18T11:00:00Z',
      },
    ],
    exportArtifacts: [
      {
        id: 'EXP-2026-01-V1',
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        workpaperVersionId: 'WPV-001',
        format: 'xlsx',
        filename: 'Kertas_Kerja_Induk_NSM_FY2026_Final.xlsx',
        checksumSha256: 'f47e61558439e88e005c1298b97a7795e98dfdce64d777c8383fdeafa51ca775',
        status: 'complete',
        createdByUserId: 'USR-PARTNER-01',
        readbackVerified: true,
        fileSizeBytes: 21652,
        createdAt: new Date().toISOString(),
      },
    ],
    auditEvents,
    reusableMappings,
    firmProfile,
    adjustments: initialAdjustments,
    reviewerNotes: [
      {
        id: 'NOTE-001',
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        targetLineId: 'WP-A.2',
        authorId: 'USR-MANAGER-01',
        authorName: 'Siti Rahmawati, CA',
        authorRole: 'manager',
        content: 'Konfirmasi saldo piutang material PT Mitra Abadi (Rp 9,85 M) telah terkonfirmasi 100% klop dengan lembar konfirmasi bank tertanggal 15 Jan 2026.',
        status: 'resolved',
        resolvedByUserId: 'USR-PARTNER-01',
        resolvedAt: '2026-01-21T10:00:00Z',
        createdAt: '2026-01-20T09:15:00Z',
      },
      {
        id: 'NOTE-002',
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        targetLineId: 'WP-F.4',
        authorId: 'USR-PARTNER-01',
        authorName: 'Haidar, CPA, CA',
        authorRole: 'partner',
        content: 'Periksa reklasifikasi akun 2199-00 ke WP-F.4 dan pastikan tidak ada dampak penambahan beban pajak non-deductible.',
        status: 'addressed',
        createdAt: '2026-01-20T11:00:00Z',
      }
    ],
    evidenceAttachments: [
      {
        id: 'ATT-001',
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        targetLineId: 'WP-A.1',
        fileName: 'Rekening_Koran_Mandiri_Des2026_Sealed.pdf',
        fileSizeBytes: 2457600,
        mediaType: 'application/pdf',
        checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploadedByUserId: 'USR-SENIOR-01',
        uploadedByName: 'Ahmad Pratama, S.Ak',
        createdAt: '2026-01-19T10:20:00Z',
      }
    ],
  };
}




class FinovaV4Repository {
  private state: FinovaV4State;

  constructor() {
    if (typeof window !== 'undefined') {
      let clientState: FinovaV4State | null = null;
      try {
        const el = document.getElementById('__FINOVA_INITIAL_STATE__');
        if (el && el.textContent) {
          clientState = JSON.parse(el.textContent);
        }
      } catch (e) {
        console.warn('Fallback to initial state in browser:', e);
      }
      this.state = clientState || createInitialState();
      return;
    }

    const disk = this.loadFromDisk();
    this.state = disk || createInitialState();
    if (!this.state.firmProfile) {
      this.state.firmProfile = createInitialState().firmProfile;
      this.persist();
    }
    if (!disk) {
      this.persist();
    }
  }

  private loadFromDisk(): FinovaV4State | null {
    if (typeof window !== 'undefined' || process.env.VITEST) return null;
    try {
      // Load directly from ACID SQLite engine
      const { loadStateFromDb } = require('./sqlite');
      const dbState = loadStateFromDb();
      if (dbState) return dbState;
    } catch (e) {
      console.error('Failed to load from SQLite, falling back to disk JSON:', e);
    }

    const { fs, path: pathMod } = getFsModules();
    if (!fs || !pathMod) return null;
    try {
      const storePath = pathMod.join(process.cwd(), 'data', 'finova_store.json');
      if (fs.existsSync(storePath)) {
        const raw = fs.readFileSync(storePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load store JSON:', e);
    }
    return null;
  }

  private persist(): void {
    if (typeof window !== 'undefined' || process.env.VITEST) return;
    try {
      // Save atomically to SQLite with Write-Ahead Logging & transactions
      const { saveStateToDb } = require('./sqlite');
      saveStateToDb(this.state);
    } catch (e) {
      console.error('Failed to persist to SQLite:', e);
      const { fs, path: pathMod } = getFsModules();
      if (!fs || !pathMod) return;
      try {
        const dataDir = pathMod.join(process.cwd(), 'data');
        const storePath = pathMod.join(dataDir, 'finova_store.json');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(storePath, JSON.stringify(this.state, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to persist store fallback:', err);
      }
    }
  }

  // Security Invariants (Section 40.3 & 46)
  assertTenantAccess(userTenantId: string, resourceTenantId: string): void {
    if (userTenantId !== resourceTenantId) {
      throw new Error(
        `Pelanggaran Batas Tenant: Pengguna dari Tenant ${userTenantId} tidak diizinkan mengakses data Tenant ${resourceTenantId}.`
      );
    }
  }

  assertPermission(role: UserRoleV4, action: string): void {
    const roleRank: Record<UserRoleV4, number> = {
      preparer: 1,
      senior: 2,
      manager: 3,
      partner: 4,
    };

    const actionMinRank: Record<string, number> = {
      view: 1,
      upload_file: 1,
      configure_import: 1,
      edit_mapping: 1,
      approve_mapping_batch: 2,
      recalculate_workpaper: 2,
      add_comment: 1,
      approve_workpaper: 3,
      reopen_workpaper: 3,
      manage_mapping_memory: 3,
      authorize_export: 4,
    };

    const min = actionMinRank[action] || 1;
    if (roleRank[role] < min) {
      throw new Error(`Akses Ditolak: Peran "${role}" tidak memiliki otorisasi untuk tindakan "${action}".`);
    }
  }


  getFirmProfile(): FirmProfile {
    if (!this.state.firmProfile) {
      this.state.firmProfile = createInitialState().firmProfile;
      this.persist();
    }
    return this.state.firmProfile;
  }

  updateFirmProfile(data: Partial<FirmProfile>): FirmProfile {
    const current = this.getFirmProfile();
    const updated: FirmProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.state.firmProfile = updated;
    if (this.state.tenants && this.state.tenants[0]) {
      this.state.tenants[0].name = updated.name;
    }
    this.persist();
    return updated;
  }

  addTeamMember(member: Omit<TeamMemberProfile, 'id'>): TeamMemberProfile {
    const current = this.getFirmProfile();
    const newMember: TeamMemberProfile = {
      ...member,
      id: 'usr-' + Date.now(),
    };
    const updatedMembers = [...(current.teamMembers || []), newMember];
    this.updateFirmProfile({ teamMembers: updatedMembers });
    return newMember;
  }

  removeTeamMember(memberId: string): void {
    const current = this.getFirmProfile();
    const updatedMembers = (current.teamMembers || []).filter((m: TeamMemberProfile) => m.id !== memberId);
    this.updateFirmProfile({ teamMembers: updatedMembers });
  }


  // P1: Audit Adjusting & Reclassification Entries
  getAdjustments(engagementId: string): AuditAdjustmentEntry[] {
    return (this.state.adjustments || []).filter((a) => a.engagementId === engagementId);
  }

  createAdjustmentEntry(entry: Omit<AuditAdjustmentEntry, 'id' | 'createdAt'>, actor: UserV4): AuditAdjustmentEntry {
    this.assertTenantAccess(actor.tenantId, entry.tenantId);
    if (!this.state.adjustments) this.state.adjustments = [];
    const newEntry: AuditAdjustmentEntry = {
      ...entry,
      id: `AJE-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.adjustments.push(newEntry);

    // Recalculate workpaper with adjustments
    this.recalculateCurrentWorkpaper(entry.engagementId, actor);
    this.persist();
    return newEntry;
  }

  // P1: Reviewer Notes & Resolution
  getReviewerNotes(engagementId: string): ReviewerNote[] {
    return (this.state.reviewerNotes || []).filter((n) => n.engagementId === engagementId);
  }

  addReviewerNote(note: Omit<ReviewerNote, 'id' | 'createdAt'>, actor: UserV4): ReviewerNote {
    this.assertTenantAccess(actor.tenantId, note.tenantId);
    if (!this.state.reviewerNotes) this.state.reviewerNotes = [];
    const newNote: ReviewerNote = {
      ...note,
      id: `NOTE-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.reviewerNotes.unshift(newNote);
    this.persist();
    return newNote;
  }

  resolveReviewerNote(noteId: string, actor: UserV4): ReviewerNote {
    if (!this.state.reviewerNotes) this.state.reviewerNotes = [];
    const note = this.state.reviewerNotes.find((n) => n.id === noteId);
    if (!note) throw new Error(`Review note ${noteId} tidak ditemukan.`);
    this.assertTenantAccess(actor.tenantId, note.tenantId);
    note.status = 'resolved';
    note.resolvedByUserId = actor.id;
    note.resolvedAt = new Date().toISOString();
    this.persist();
    return note;
  }

  // P1: Maker-Checker Partner Seal & Digital Audit Certificate
  sealEngagementWithPartnerCertificate(engagementId: string, partnerApNumber: string, actor: UserV4): { engagement: EngagementV4; certificateHash: string } {
    this.assertTenantAccess(actor.tenantId, actor.tenantId);
    this.assertPermission(actor.role, 'authorize_export'); // Must be Partner
    const eng = this.state.engagements.find((e) => e.id === engagementId);
    if (!eng) throw new Error(`Perikatan ${engagementId} tidak ditemukan.`);

    const sealHash = `FINOVA-SEAL-${Date.now().toString(16).toUpperCase()}-AP0942`;
    eng.status = 'partner_sealed';
    (eng as any).sealedAt = new Date().toISOString();
    (eng as any).sealedByApNumber = partnerApNumber || 'AP.0942';
    (eng as any).sealHash = sealHash;

    this.state.auditEvents.unshift({
      id: `AUD-SEAL-${Date.now().toString(36).toUpperCase()}`,
      tenantId: eng.tenantId,
      engagementId: eng.id,
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      action: 'partner_sign_off_seal',
      resourceType: 'Engagement',
      resourceId: eng.id,
      timestamp: new Date().toISOString(),
      requestId: `req-seal-${Date.now()}`,
      metadata: { apNumber: partnerApNumber, sealHash },
    });

    this.persist();
    return { engagement: eng, certificateHash: sealHash };
  }

  // Helper to recalculate active workpaper with adjustments
  private recalculateCurrentWorkpaper(engagementId: string, actor: UserV4) {
    const eng = this.state.engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const dsv = this.state.datasetVersions.find((d) => d.engagementId === engagementId) || this.state.datasetVersions[0];
    const mapSet = this.state.mappingSets.find((m) => m.engagementId === engagementId) || this.state.mappingSets[0];
    const adjs = (this.state.adjustments || []).filter((a) => a.engagementId === engagementId);

    const calc = calculateWorkpaperVersion({
      tenantId: eng.tenantId,
      engagementId: eng.id,
      datasetVersionId: dsv?.id || 'DSV-001',
      mappingSetId: mapSet?.id || 'MAPSET-001',
      accounts: this.state.accounts,
      mappingDecisions: this.state.mappingDecisions,
      adjustments: adjs,
      template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
      versionNumber: this.state.workpaperVersions.length + 1,
    });

    this.state.workpaperVersions.unshift(calc.workpaperVersion);
    this.state.workpaperLines = calc.lines;
    this.state.validationChecks = calc.checks;
  }

  getState(): FinovaV4State {
    const disk = this.loadFromDisk();
    if (disk) {
      this.state = disk;
    }
    return this.state;
  }

  getEngagement(id: string, userTenantId: string): EngagementV4 | undefined {
    const eng = this.state.engagements.find((e) => e.id === id);
    if (eng) {
      this.assertTenantAccess(userTenantId, eng.tenantId);
    }
    this.persist();
    return eng;
  }

  createClient(client: {
    legalName: string;
    code: string;
    industry: string;
    tenantId?: string;
  }): ClientV4 {
    const newClient: ClientV4 = {
      id: 'CLI-' + Date.now().toString(36).toUpperCase(),
      tenantId: client.tenantId || 'TENANT-001',
      legalName: client.legalName,
      code: client.code.toUpperCase(),
      industry: client.industry,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.state.clients.push(newClient);
    this.persist();
    return newClient;
  }

  createEngagement(data: Omit<EngagementV4, 'id' | 'createdAt' | 'updatedAt'>, actor: UserV4): EngagementV4 {
    this.assertPermission(actor.role, 'manage_mapping_memory');
    const newEng: EngagementV4 = {
      ...data,
      id: `ENG-${new Date().getFullYear()}-${String(this.state.engagements.length + 1).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.engagements.push(newEng);
    this.recordAudit({
      tenantId: actor.tenantId,
      engagementId: newEng.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'engagement_created',
      resourceType: 'Engagement',
      resourceId: newEng.id,
      requestId: `req-${Date.now()}`,
    });
    return newEng;
  }

  addFileVersion(fv: FileVersion, actor: UserV4): FileVersion {
    this.assertTenantAccess(actor.tenantId, fv.tenantId);
    this.assertPermission(actor.role, 'upload_file');
    this.state.fileVersions.unshift(fv);

    this.recordAudit({
      tenantId: fv.tenantId,
      engagementId: fv.engagementId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'file_uploaded',
      resourceType: 'FileVersion',
      resourceId: fv.id,
      requestId: `req-up-${Date.now()}`,
      metadata: { filename: fv.originalName, checksum: fv.checksumSha256 },
    });

    this.persist();
    return fv;
  }

  publishImportDataset(
    importJob: ImportJob,
    dsv: DatasetVersion,
    accounts: AccountRow[],
    actor: UserV4
  ): DatasetVersion {
    this.assertTenantAccess(actor.tenantId, dsv.tenantId);
    this.state.datasetVersions.unshift(dsv);
    this.state.accounts.push(...accounts);

    // Create new MappingSet
    const mapSetId = `MAPSET-${Date.now().toString(36).toUpperCase()}`;
    const newMapSet: MappingSet = {
      id: mapSetId,
      tenantId: dsv.tenantId,
      engagementId: dsv.engagementId,
      datasetVersionId: dsv.id,
      versionNumber: this.state.mappingSets.length + 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    this.state.mappingSets.unshift(newMapSet);

    // Generate initial suggestions
    for (const acc of accounts) {
      let proposed = 'WP-A.5'; // default
      let conf = 0.75;
      let level: 'high' | 'medium' | 'low' = 'medium';
      let rat = 'Pemetaan berdasar nama akun';

      if (acc.accountCode.startsWith('111')) {
        proposed = 'WP-A.1'; conf = 0.96; level = 'high'; rat = 'Prefiks Kas & Setara Kas (111x)';
      } else if (acc.accountCode.startsWith('112')) {
        proposed = 'WP-A.2'; conf = 0.95; level = 'high'; rat = 'Prefiks Piutang Usaha (112x)';
      } else if (acc.accountCode.startsWith('113')) {
        proposed = 'WP-A.4'; conf = 0.94; level = 'high'; rat = 'Prefiks Persediaan (113x)';
      } else if (acc.accountCode.startsWith('121') || acc.accountCode.startsWith('122')) {
        proposed = 'WP-B.1'; conf = 0.95; level = 'high'; rat = 'Prefiks Aset Tetap Bruto (121x/122x)';
      } else if (acc.accountCode.startsWith('129')) {
        proposed = 'WP-B.2'; conf = 0.93; level = 'high'; rat = 'Prefiks Akumulasi Penyusutan (129x)';
      } else if (acc.accountCode.startsWith('211')) {
        proposed = 'WP-C.1'; conf = 0.95; level = 'high'; rat = 'Prefiks Utang Usaha (211x)';
      } else if (acc.accountCode.startsWith('2199')) {
        proposed = 'WP-C.1'; conf = 0.38; level = 'low'; rat = 'Akun penampungan/suspense sementara';
      } else if (acc.accountCode.startsWith('410')) {
        proposed = 'WP-F.1'; conf = 0.98; level = 'high'; rat = 'Prefiks Pendapatan Usaha (410x)';
      } else if (acc.accountCode.startsWith('510')) {
        proposed = 'WP-F.2'; conf = 0.97; level = 'high'; rat = 'Prefiks Beban Pokok Penjualan (510x)';
      }

      this.state.mappingDecisions.push({
        id: `MAPDEC-${acc.accountCode}-${dsv.id.slice(-4)}`,
        mappingSetId: mapSetId,
        tenantId: dsv.tenantId,
        accountRowId: acc.id,
        sourceAccountCode: acc.accountCode,
        sourceAccountName: acc.accountName,
        amountIdr: acc.closingBalanceIdr,
        proposedTarget: proposed,
        effectiveTarget: conf >= 0.60 ? proposed : undefined,
        confidenceScore: conf,
        confidenceLevel: level,
        rationale: rat,
        status: conf >= 0.60 ? 'mapped' : 'needs_review',
        isMaterial: Math.abs(acc.closingBalanceIdr) >= 250_000_000,
        decidedByUserId: conf >= 0.60 ? actor.id : undefined,
        decidedAt: conf >= 0.60 ? new Date().toISOString() : undefined,
      });
    }

    // Mark active workpaper as stale due to new dataset
    this.markWorkpaperStale('Terdapat dataset sumber baru yang diunggah.');

    this.recordAudit({
      tenantId: dsv.tenantId,
      engagementId: dsv.engagementId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'dataset_published',
      resourceType: 'DatasetVersion',
      resourceId: dsv.id,
      requestId: `req-dsv-${Date.now()}`,
      metadata: { rowCount: dsv.rowCount },
    });

    return dsv;
  }

  updateMappingDecision(params: {
    decisionId: string;
    action: 'approve' | 'override' | 'exclude' | 'needs_review';
    targetLineId?: string;
    reason?: string;
    actor: UserV4;
  }): MappingDecision {
    const dec = this.state.mappingDecisions.find((d) => d.id === params.decisionId);
    if (!dec) {
      throw new Error(`MappingDecision ${params.decisionId} tidak ditemukan.`);
    }
    this.assertTenantAccess(params.actor.tenantId, dec.tenantId);
    this.assertPermission(params.actor.role, 'edit_mapping');

    if (params.action === 'override') {
      if (!params.targetLineId) {
        throw new Error('Target baris kertas kerja wajib ditentukan untuk override.');
      }
      dec.effectiveTarget = params.targetLineId;
      dec.status = 'mapped';
      dec.overrideReason = params.reason;
      dec.decidedByUserId = params.actor.id;
      dec.decidedAt = new Date().toISOString();
    } else if (params.action === 'approve') {
      dec.effectiveTarget = dec.proposedTarget;
      dec.status = 'mapped';
      dec.decidedByUserId = params.actor.id;
      dec.decidedAt = new Date().toISOString();
    } else if (params.action === 'exclude') {
      if (dec.isMaterial && !params.reason) {
        throw new Error('Alasan eksklusi wajib diisi untuk akun yang material (>= Rp 250 Juta).');
      }
      dec.effectiveTarget = undefined;
      dec.status = 'excluded';
      dec.exclusionReason = params.reason || 'Eksklusi manual oleh user';
      dec.decidedByUserId = params.actor.id;
      dec.decidedAt = new Date().toISOString();
    } else if (params.action === 'needs_review') {
      dec.effectiveTarget = undefined;
      dec.status = 'needs_review';
      dec.decidedByUserId = undefined;
      dec.decidedAt = undefined;
    }

    // Upstream mapping modification marks workpaper stale
    this.markWorkpaperStale(`Perubahan pemetaan akun ${dec.sourceAccountCode} oleh ${params.actor.name}.`);

    this.recordAudit({
      tenantId: dec.tenantId,
      actorId: params.actor.id,
      actorName: params.actor.name,
      actorRole: params.actor.role,
      action: `mapping_${params.action}`,
      resourceType: 'MappingDecision',
      resourceId: dec.id,
      requestId: `req-map-${Date.now()}`,
      metadata: { target: dec.effectiveTarget, reason: params.reason },
    });

    return dec;
  }

  bulkApproveMappings(decisionIds: string[], actor: UserV4): number {
    this.assertPermission(actor.role, 'approve_mapping_batch');
    let count = 0;
    for (const id of decisionIds) {
      const dec = this.state.mappingDecisions.find((d) => d.id === id);
      if (dec && dec.status !== 'mapped') {
        this.assertTenantAccess(actor.tenantId, dec.tenantId);
        dec.effectiveTarget = dec.proposedTarget;
        dec.status = 'mapped';
        dec.decidedByUserId = actor.id;
        dec.decidedAt = new Date().toISOString();
        count++;
      }
    }
    if (count > 0) {
      this.markWorkpaperStale(`Persetujuan batch ${count} akun oleh ${actor.name}.`);
      this.recordAudit({
        tenantId: actor.tenantId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'mapping_bulk_approved',
        resourceType: 'MappingSet',
        resourceId: 'MAPSET-001',
        requestId: `req-bulk-${Date.now()}`,
        metadata: { approvedCount: count },
      });
    }
    return count;
  }

  markWorkpaperStale(reason: string): void {
    for (const wp of this.state.workpaperVersions) {
      wp.isStale = true;
      wp.staleReason = reason;
    }
    this.persist();
  }

  recalculateWorkpaper(engagementId: string, actor: UserV4): WorkpaperVersion {
    const eng = this.state.engagements.find((e) => e.id === engagementId);
    if (!eng) throw new Error('Engagement tidak ditemukan');
    this.assertTenantAccess(actor.tenantId, eng.tenantId);
    this.assertPermission(actor.role, 'recalculate_workpaper');

    const dsv = this.state.datasetVersions[0];
    const mapSet = this.state.mappingSets[0];

    const calc = calculateWorkpaperVersion({
      tenantId: eng.tenantId,
      engagementId: eng.id,
      datasetVersionId: dsv?.id || 'DSV-001',
      mappingSetId: mapSet?.id || 'MAPSET-001',
      accounts: this.state.accounts,
      mappingDecisions: this.state.mappingDecisions,
      template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
      versionNumber: this.state.workpaperVersions.length + 1,
    });

    this.state.workpaperVersions.unshift(calc.workpaperVersion);
    this.state.workpaperLines = calc.lines;
    this.state.evidenceLinks = calc.evidenceLinks;
    this.state.validationChecks = calc.checks;

    this.recordAudit({
      tenantId: eng.tenantId,
      engagementId: eng.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'workpaper_recalculated',
      resourceType: 'WorkpaperVersion',
      resourceId: calc.workpaperVersion.id,
      requestId: `req-wpcalc-${Date.now()}`,
      metadata: { newVersionNumber: calc.workpaperVersion.versionNumber },
    });

    this.persist();
    return calc.workpaperVersion;
  }

  addComment(engagementId: string, targetLineId: string, body: string, actor: UserV4): WorkpaperComment {
    const eng = this.state.engagements.find((e) => e.id === engagementId);
    if (!eng) throw new Error('Engagement not found');
    this.assertTenantAccess(actor.tenantId, eng.tenantId);

    const comment: WorkpaperComment = {
      id: `COM-${Date.now().toString(36).toUpperCase()}`,
      tenantId: actor.tenantId,
      engagementId,
      targetLineId,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      body,
      createdAt: new Date().toISOString(),
    };

    this.state.comments.unshift(comment);

    // Update commentCount on target line
    const line = this.state.workpaperLines.find((l) => l.lineId === targetLineId);
    if (line) {
      line.commentCount += 1;
    }

    this.persist();
    return comment;
  }

  generateExport(engagementId: string, actor: UserV4): { buffer: Buffer; artifact: ExportArtifact } {
    const eng = this.state.engagements.find((e) => e.id === engagementId);
    if (!eng) throw new Error('Engagement tidak ditemukan');
    this.assertTenantAccess(actor.tenantId, eng.tenantId);
    this.assertPermission(actor.role, 'authorize_export');

    const wp = this.state.workpaperVersions[0];
    if (!wp) throw new Error('Kertas kerja belum dihitung.');

    const fv = this.state.fileVersions[0];

    const result = generateWorkpaperXlsx({
      tenantId: eng.tenantId,
      engagementId: eng.id,
      clientCode: 'NSM',
      periodYear: '2026',
      workpaperVersion: wp,
      lines: this.state.workpaperLines,
      checks: this.state.validationChecks,
      userId: actor.id,
      operatorName: actor.name,
      sourceFileVersionChecksum: fv?.checksumSha256 || '9f83a48e71c9b204683bc48b3017fa489110756e4c7717bc2d043444fb9a7b92',
    });

    this.state.exportArtifacts.unshift(result.artifact);

    this.recordAudit({
      tenantId: eng.tenantId,
      engagementId: eng.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'export_generated',
      resourceType: 'ExportArtifact',
      resourceId: result.artifact.id,
      requestId: `req-exp-${Date.now()}`,
      metadata: { filename: result.artifact.filename, checksum: result.artifact.checksumSha256 },
    });

    try {
      const { fs: fsMod, path: pathMod } = getFsModules();
      const exportDir = pathMod ? pathMod.join(process.cwd(), 'data') : '';
      if (fsMod && !fsMod.existsSync(exportDir)) fsMod.mkdirSync(exportDir, { recursive: true });
      if (fsMod && pathMod) fsMod.writeFileSync(pathMod.join(exportDir, `${result.artifact.id}.xlsx`), result.buffer);
    } catch (e) {
      // Ignore in read-only environments
    }
    this.persist();
    return { buffer: result.buffer, artifact: result.artifact };
  }

  recordAudit(event: Omit<AuditEventV4, 'id' | 'timestamp'>): void {
    const auditEvent: AuditEventV4 = {
      ...event,
      id: `EVT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditEvents.unshift(auditEvent);
  }
}

// Global Singleton
export const repo = new FinovaV4Repository();
