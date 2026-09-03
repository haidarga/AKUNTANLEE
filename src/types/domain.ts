// FINOVA AI v3.0 Advisory Intelligence — Domain Entity Contracts
// Compliant with Section 6 & 18.1 of FINOVA PRD v3.0

export type UserRole =
  | 'firm_admin'
  | 'partner'
  | 'manager'
  | 'senior'
  | 'preparer'
  | 'tax_consultant'
  | 'client_guest'
  | 'read_only';

export interface Firm {
  id: string;
  name: string;
  taxId: string; // NPWP Firm
  country: 'ID';
  createdAt: string;
}

export interface User {
  id: string;
  firmId: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  firmId: string;
  name: string; // e.g. "PT Nusantara Sukses Makmur"
  legalType: 'PT' | 'CV' | 'BOD' | 'Perorangan';
  npwp: string; // 16-digit NPWP format
  industry: string;
  contactPerson: string;
  contactEmail: string;
  fiscalYearEndMonth: number; // 12 for December
  createdAt: string;
}

export type EngagementStatus = 'intake' | 'in_progress' | 'review' | 'completed' | 'locked';
export type EngagementType = 'audit' | 'tax_advisory' | 'accounting_review' | 'full_advisory';

export interface Engagement {
  id: string;
  firmId: string;
  clientId: string;
  title: string; // e.g. "FY 2025 Audit & Tax Advisory"
  type: EngagementType;
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  status: EngagementStatus;
  leadPartnerId: string;
  managerId: string;
  seniorId: string;
  preparerId: string;
  taxConsultantId: string;
  materialityThresholdIdr: number; // in IDR
  trivialThresholdIdr: number;
  createdAt: string;
  updatedAt: string;
}

export type PBCStatus = 'required' | 'uploaded' | 'needs_replacement' | 'accepted' | 'missing';

export interface PBCRequest {
  id: string;
  engagementId: string;
  title: string; // e.g. "Trial Balance Audited FY 2025"
  category: 'financial_statements' | 'tax' | 'general_ledger' | 'legal' | 'bank_reconciliation';
  description: string;
  status: PBCStatus;
  guestAccessToken: string; // Secure isolated access key
  dueDate: string;
  assignedToClientEmail: string;
  uploadedDocumentId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'trial_balance'
  | 'general_ledger'
  | 'balance_sheet'
  | 'income_statement'
  | 'faktur_pajak'
  | 'spt_tahunan'
  | 'bank_statement'
  | 'salary_slip'
  | 'other';

export type ExtractionJobStatus = 'queued' | 'processing' | 'ocr_extracted' | 'validated' | 'failed';

export interface ExtractionJob {
  id: string;
  documentId: string;
  status: ExtractionJobStatus;
  progressPercent: number;
  confidenceScore: number; // 0.0 - 1.0
  extractedFieldsCount: number;
  warnings: string[];
  durationMs: number;
  modelEngine: string; // e.g. "finova-doc-extractor-v3.0"
  startedAt: string;
  completedAt?: string;
}

export interface Evidence {
  id: string;
  engagementId: string;
  documentId: string;
  documentName: string;
  fileType: string;
  pageNumber?: number;
  sheetName?: string;
  cellReference?: string; // e.g. "Sheet1!B14:D14"
  sourceValue: string | number;
  normalizedValue: number; // Integer IDR or exact decimal
  confidence: number; // 0.0 - 1.0
  extractionMethod: 'deterministic_parse' | 'ocr_regex' | 'llm_assisted';
  snippetText: string;
  timestamp: string;
}

export interface Document {
  id: string;
  engagementId: string;
  name: string;
  fileSize: number;
  fileType: string;
  type: DocumentType;
  version: number;
  uploadedByUserId: string;
  isClientPbcUpload: boolean;
  activeExtractionJobId?: string;
  evidenceItemsCount: number;
  createdAt: string;
}

export type AccountCategory =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'cogs'
  | 'operating_expense'
  | 'other_income_expense'
  | 'tax_expense';

export type MappingStatus = 'unmapped' | 'suggested' | 'confirmed' | 'overridden';

export interface AccountMapping {
  id: string;
  engagementId: string;
  sourceAccountCode: string;
  sourceAccountName: string;
  standardWorkpaperSection: string; // e.g. "A.1 Kas & Setara Kas", "E.2 Beban Operasional"
  category: AccountCategory;
  beginningBalanceIdr: number;
  debitIdr: number;
  creditIdr: number;
  endingBalanceIdr: number;
  priorYearBalanceIdr: number;
  mappingStatus: MappingStatus;
  confidenceScore: number;
  rationale: string;
  suggestedBy: 'rule_engine' | 'historical_firm_pattern';
  confirmedByUserId?: string;
  isAmbiguous: boolean;
  evidenceId?: string;
}

export type ReviewState = 'generated' | 'needs_review' | 'edited' | 'confirmed' | 'approved' | 'locked';

export interface WorkpaperSection {
  id: string;
  engagementId: string;
  code: string; // e.g. "WP-A", "WP-B", "WP-TAX"
  title: string;
  leadSchedule: string;
  totalBeginningBalanceIdr: number;
  totalEndingBalanceIdr: number;
  totalPriorYearBalanceIdr: number;
  absoluteVarianceIdr: number;
  percentageVariance: number;
  reviewState: ReviewState;
  preparedByUserId: string;
  reviewedByUserId?: string;
  approvedByUserId?: string;
  lockedAt?: string;
  lockedReason?: string;
}

export type AnomalySeverity = 'info' | 'warning' | 'material' | 'critical';

export interface ValidationCheck {
  id: string;
  engagementId: string;
  code: string; // e.g. "TIE-001", "ANOM-004"
  title: string;
  category: 'tie_out' | 'variance' | 'gl_anomaly' | 'missing_evidence' | 'repeat_issue';
  severity: AnomalySeverity;
  description: string;
  differenceIdr?: number;
  sourceEvidenceIds: string[];
  isCleared: boolean;
  clearedByUserId?: string;
  clearanceNote?: string;
}

export type ClaimType = 'confirmed_fact' | 'likely_driver' | 'hypothesis' | 'scenario' | 'unsupported';
export type AdvisoryLevel = 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';

export interface AdvisoryInsight {
  id: string;
  engagementId: string;
  level: AdvisoryLevel;
  claimType: ClaimType;
  title: string;
  observation: string; // Fact
  likelyDriver?: string; // Diagnostic driver
  implication: string; // So what?
  hypothesis?: string; // Stated assumption
  recommendedInvestigation: string; // Actionable investigation
  recommendedAction?: string; // Proposed advisory action
  confidenceScore: number;
  evidenceIds: string[];
  standardReferenceIds: string[];
  authorEngine: string;
  reviewedByUserId?: string;
  status: 'draft' | 'reviewed' | 'included_in_report' | 'dismissed';
}

export interface StandardReference {
  id: string;
  standardCode: string; // e.g. "PSAK 1", "SA 520", "UU HPP Pasal 17", "PMK 168/2023"
  title: string;
  section: string; // e.g. "Paragraf 10 - Penyajian Wajar"
  effectiveDate: string;
  provenance: 'verified_official_corpus' | 'firm_internal_methodology';
  applicabilityNote: string;
  isConfirmedByReviewer: boolean;
}

export interface ReviewPoint {
  id: string;
  engagementId: string;
  workpaperSectionId?: string;
  title: string;
  detail: string;
  assignedToUserId: string;
  createdByUserId: string;
  severity: AnomalySeverity;
  isCleared: boolean;
  clearedAt?: string;
  clearanceComment?: string;
  createdAt: string;
}

export interface Finding {
  id: string;
  engagementId: string;
  findingNumber: string; // e.g. "F-2025-01"
  title: string;
  severity: AnomalySeverity;
  condition: string; // What happened
  criteria: string; // Standard / Rule applied
  cause: string; // Why it occurred
  effect: string; // Financial / tax impact
  recommendation: string; // Action recommended
  managementResponse?: string;
  linkedEvidenceIds: string[];
  linkedStandardIds: string[];
  reviewState: ReviewState;
  isIncludedInReportDraft: boolean;
}

export interface ReportDraft {
  id: string;
  engagementId: string;
  title: string;
  reportType: 'executive_advisory_memo' | 'audit_findings_report' | 'tax_diagnostic_summary';
  executiveSummary: string;
  status: 'draft' | 'approved' | 'published';
  findingsCount: number;
  approvedByPartnerId?: string;
  approvedAt?: string;
  lastEditedAt: string;
}

export interface AuditEvent {
  id: string;
  firmId: string;
  engagementId?: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'document_uploaded'
    | 'mapping_overridden'
    | 'tax_calculated'
    | 'review_point_cleared'
    | 'workpaper_approved'
    | 'workpaper_locked'
    | 'workpaper_reopened'
    | 'finding_created'
    | 'report_draft_approved';
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}
