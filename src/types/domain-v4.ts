// FINOVA AI v4.0 Release 0.1 Domain Entity & Contract Specifications
// Authoritative Source: Sections 36–52 of FINOVA AI PRD v4.0 Build-Ready Edition

export type UserRoleV4 = 'preparer' | 'senior' | 'manager' | 'partner';


export interface TeamMemberProfile {
  id: string;
  name: string;
  title: string;
  email: string;
  role: UserRoleV4;
  cpaLicense?: string;
  phone?: string;
}

export interface FirmProfile {
  id: string;
  name: string;
  shortName: string;
  licenseNumber: string;
  managingPartnerName: string;
  managingPartnerApNumber: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  defaultAccountingStandard: 'SAK_INDONESIA' | 'SAK_EP' | 'PSAK_IFRS';
  defaultMaterialityIdr: number;
  teamMembers: TeamMemberProfile[];
  updatedAt?: string;
}

export interface Tenant {
  id: string; // e.g. "TENANT-001"
  name: string;
  region: string; // "id-jkt"
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface UserV4 {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRoleV4;
  title: string;
  status: 'active' | 'inactive';
}

export interface ClientV4 {
  id: string;
  tenantId: string;
  legalName: string; // "PT Nusantara Sukses Makmur"
  code: string; // "NSM"
  industry: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type EngagementStatusV4 = 'draft' | 'preparing' | 'ready_for_review' | 'approved' | 'archived';

export interface EngagementV4 {
  id: string; // e.g. "ENG-2025-01"
  tenantId: string;
  clientId: string;
  name: string; // "Financial Review & Lead Schedule FY 2025"
  periodStart: string; // "2025-01-01"
  periodEnd: string; // "2025-12-31"
  currency: 'IDR';
  materialityIdr: number; // 250_000_000
  status: EngagementStatusV4;
  leadPartnerId: string;
  managerId: string;
  seniorId: string;
  preparerId: string;
  createdAt: string;
  updatedAt: string;
}

export type FileVersionStatus = 'uploaded' | 'scanning' | 'ready' | 'rejected' | 'failed';

export interface FileAsset {
  id: string;
  tenantId: string;
  engagementId: string;
  originalName: string;
  mediaType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface FileVersion {
  id: string; // e.g. "FV-001"
  assetId: string;
  tenantId: string;
  engagementId: string;
  versionNumber: number;
  originalName: string;
  storageKey: string;
  checksumSha256: string;
  mediaType: string;
  sizeBytes: number;
  status: FileVersionStatus;
  uploadedByUserId: string;
  scanStatus: 'clean' | 'threat_detected' | 'pending';
  scanNotes?: string;
  sheetCount: number;
  sheetNames: string[];
  createdAt: string;
}

export type DatasetType = 'trial_balance' | 'general_ledger' | 'financial_statement';

export type ImportJobStage =
  | 'receive'
  | 'persist'
  | 'safety'
  | 'preview'
  | 'configure'
  | 'validate'
  | 'normalize'
  | 'publish';

export type ImportJobStatus =
  | 'queued'
  | 'previewing'
  | 'mapping_required'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImportColumnMapping {
  targetField: string;
  sourceColumn: string;
  isRequired: boolean;
}

export interface ImportErrorDetail {
  sheet: string;
  row: number;
  column: string;
  reason: string;
  acceptedFormat: string;
}

export interface ImportJob {
  id: string; // e.g. "IMP-001"
  tenantId: string;
  engagementId: string;
  fileVersionId: string;
  datasetType: DatasetType;
  selectedSheet: string;
  headerRowIndex: number;
  columnMappings: ImportColumnMapping[];
  stage: ImportJobStage;
  status: ImportJobStatus;
  idempotencyKey: string;
  totalRows: number;
  validRows: number;
  errors: ImportErrorDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface DatasetVersion {
  id: string; // e.g. "DSV-001"
  tenantId: string;
  engagementId: string;
  importJobId: string;
  fileVersionId: string;
  datasetType: DatasetType;
  rowCount: number;
  totals: {
    totalDebitIdr: number;
    totalCreditIdr: number;
    netBalanceIdr: number;
  };
  publishedAt: string;
}

export interface AccountRow {
  id: string;
  datasetVersionId: string;
  accountCode: string;
  accountName: string;
  openingBalanceIdr: number;
  debitIdr: number;
  creditIdr: number;
  closingBalanceIdr: number;
  periodEnd: string;
  currency: string;
  sourceLocator: {
    fileVersionId: string;
    sheetName: string;
    rowNumber: number;
    cellRange: string;
  };
}

export type MappingConfidenceLevel = 'high' | 'medium' | 'low';
export type MappingStatus = 'proposed' | 'mapped' | 'excluded' | 'needs_review' | 'superseded';

export interface MappingDecision {
  id: string;
  mappingSetId: string;
  tenantId: string;
  accountRowId: string;
  sourceAccountCode: string;
  sourceAccountName: string;
  amountIdr: number;
  proposedTarget: string;
  effectiveTarget?: string;
  confidenceScore: number;
  confidenceLevel: MappingConfidenceLevel;
  rationale: string;
  status: MappingStatus;
  decidedByUserId?: string;
  exclusionReason?: string;
  overrideReason?: string;
  isMaterial: boolean;
  decidedAt?: string;
}

export interface MappingSet {
  id: string;
  tenantId: string;
  engagementId: string;
  datasetVersionId: string;
  versionNumber: number;
  status: 'draft' | 'resolved' | 'approved' | 'superseded';
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface WorkpaperSectionDef {
  sectionId: string; // e.g. "SEC-A"
  label: string; // "Aset Lancar (Current Assets)"
  order: number;
}

export interface WorkpaperLineDef {
  lineId: string; // e.g. "WP-A.1"
  sectionId: string;
  label: string; // "Kas & Setara Kas"
  accountCriteria: string[]; // ["1110-00", "1120-00"]
  signPolicy: 'debit_positive' | 'credit_positive';
}

export interface WorkpaperLineItem {
  lineId: string;
  sectionId: string;
  label: string;
  accountCodes: string[];
  currentPeriodIdr: number;
  comparativePeriodIdr?: number;
  varianceAmountIdr?: number;
  variancePercent?: number;
  validationState: 'valid' | 'exception' | 'unmapped';
  commentCount: number;
  primaryEvidenceLinkId?: string;
}

export interface WorkpaperVersion {
  id: string; // e.g. "WPV-001"
  tenantId: string;
  engagementId: string;
  datasetVersionIds: string[];
  mappingSetId: string;
  templateVersion: string; // "FINOVA-LEAD-v1.0"
  versionNumber: number;
  status: 'draft' | 'calculated' | 'review_ready' | 'exported' | 'superseded';
  totals: {
    totalAssetsIdr: number;
    totalLiabilitiesIdr: number;
    totalEquityIdr: number;
    netIncomeIdr: number;
    tbDebitCreditDiffIdr: number;
    balanceSheetDiffIdr: number;
  };
  isStale: boolean;
  staleReason?: string;
  calculatedAt: string;
}

export interface EvidenceLink {
  id: string; // e.g. "EVL-001"
  tenantId: string;
  engagementId: string;
  workpaperVersionId: string;
  targetLineId: string;
  targetAmountIdr: number;
  sourceFileVersionId: string;
  sourceFileName: string;
  sourceChecksumSha256: string;
  sheetName: string;
  cellRange: string; // "Sheet1!D24:E24"
  sourceRowNumber: number;
  sourceRawValue: string | number;
  normalizedValueIdr: number;
  transformChain: string[];
  ruleVersion: string;
}

export interface ValidationCheckResult {
  id: string;
  ruleId: string;
  ruleVersion: string;
  title: string;
  severity: 'blocking' | 'warning' | 'info';
  status: 'pass' | 'fail';
  inputs: Record<string, any>;
  expected: string | number;
  actual: string | number;
  difference: number;
  affectedArea: string;
  explanation: string;
}

export interface WorkpaperComment {
  id: string;
  tenantId: string;
  engagementId: string;
  targetLineId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRoleV4;
  body: string;
  createdAt: string;
}

export interface ExportArtifact {
  id: string;
  tenantId: string;
  engagementId: string;
  workpaperVersionId: string;
  format: 'xlsx';
  filename: string;
  checksumSha256: string;
  status: 'generating' | 'complete' | 'failed';
  createdByUserId: string;
  readbackVerified: boolean;
  fileSizeBytes: number;
  createdAt: string;
}

export interface AuditEventV4 {
  id: string;
  tenantId: string;
  engagementId?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRoleV4;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  requestId: string;
  metadata?: Record<string, any>;
}

export interface ReusableMapping {
  id: string;
  tenantId: string;
  sourceAccountPattern: string; // e.g. "Kas & Bank" or "1110-*"
  targetSection: string; // "WP-A.1"
  confidence: number;
  approvedByUserId: string;
  approvedAt: string;
  timesReused: number;
  status: 'active' | 'revoked';
}
