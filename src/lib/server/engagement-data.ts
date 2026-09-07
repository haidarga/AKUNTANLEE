import { repo } from '@/lib/db/repo-v4';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchEngagementByIdFromSupabase,
  fetchFileSourcesFromSupabase,
  fetchAccountsFromSupabase,
  fetchWorkpaperFromSupabase,
} from '@/lib/supabase/service';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';
import { FileVersion, MappingDecision, AccountRow, WorkpaperVersion, WorkpaperLineItem, ValidationCheckResult } from '@/types/domain-v4';
import { inferLeadScheduleTarget } from '@/lib/workpaper/infer-target';
import { getPersistentAdjustments } from '@/lib/audit/adjustment-store';

export interface EngagementServerData {
  engagement: any;
  client: any;
  files: FileVersion[];
  accounts: AccountRow[];
  decisions: MappingDecision[];
  workpaper: WorkpaperVersion | null;
  lines: WorkpaperLineItem[];
  checks: ValidationCheckResult[];
}

export async function getEngagementServerData(engagementId: string): Promise<EngagementServerData> {
  const state = repo.getState();

  // 1. Resolve Engagement & Client
  let engagement = state.engagements.find((e) => e.id === engagementId);
  let client = engagement ? state.clients.find((c) => c.id === engagement?.clientId) : null;

  if ((!engagement || !client) && isSupabaseConfigured()) {
    try {
      const sbRecord = await fetchEngagementByIdFromSupabase(engagementId);
      if (sbRecord) {
        engagement = sbRecord.engagement;
        client = sbRecord.client;
      }
    } catch (e) {
      console.warn('Error fetching engagement from Supabase:', e);
    }
  }

  if (!engagement) {
    engagement = {
      id: engagementId,
      tenantId: 'TENANT-001',
      clientId: 'CLI-002',
      name: engagementId === 'ENG-MANDIRI-2026'
        ? 'Kertas Kerja Audit Mandiri FY 2026'
        : 'Perikatan Audit ' + engagementId,
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
      currency: 'IDR' as const,
      materialityIdr: 250000000,
      status: 'preparing' as const,
      accountingStandard: 'SAK_INDONESIA' as const,
      leadPartnerId: 'USR-PARTNER-01',
      managerId: 'USR-MANAGER-01',
      seniorId: 'USR-SENIOR-01',
      preparerId: 'USR-PREPARER-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (!client) {
    client = state.clients.find((c) => c.id === engagement.clientId) || {
      id: engagement.clientId || 'CLI-002',
      tenantId: 'TENANT-001',
      legalName: 'PT Klien Audit ' + engagementId,
      code: 'KLN',
      industry: 'Manufaktur & Fabrikasi',
      taxIdNpwp: '01.234.567.8-012.000',
      address: 'Indonesia',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }

  // 2. Resolve Files
  let files: FileVersion[] = [];
  if (isSupabaseConfigured()) {
    try {
      const rawFiles = await fetchFileSourcesFromSupabase(engagementId);
      if (Array.isArray(rawFiles) && rawFiles.length > 0) {
        files = rawFiles.map((f: any) => ({
          id: f.id,
          assetId: `FA-${f.id}`,
          tenantId: f.firm_id || 'FIRM-001',
          engagementId: f.engagement_id,
          versionNumber: 1,
          originalName: f.original_name || 'trial_balance.xlsx',
          storageKey: f.storage_path,
          checksumSha256: f.sha256_checksum || '',
          mediaType: f.mime_type || (f.original_name?.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
          sizeBytes: Number(f.file_size) || 0,
          status: 'ready' as const,
          uploadedByUserId: f.uploaded_by || 'Auditor',
          scanStatus: (f.scan_status as any) || 'clean',
          sheetCount: 1,
          sheetNames: ['Sheet1'],
          createdAt: f.created_at,
        }));
      }
    } catch (e) {
      console.warn('Error fetching files from Supabase:', e);
    }
  }

  if (files.length === 0) {
    files = state.fileVersions.filter((f) => f.engagementId === engagementId);
  }

  // 3. Resolve Accounts
  let accounts: AccountRow[] = [];
  if (isSupabaseConfigured()) {
    try {
      const sbAccounts = await fetchAccountsFromSupabase(engagementId);
      if (Array.isArray(sbAccounts) && sbAccounts.length > 0) {
        accounts = sbAccounts;
      }
    } catch (e) {
      console.warn('Error fetching accounts from Supabase:', e);
    }
  }

  if (accounts.length === 0) {
    accounts = state.accounts.filter(
      (a: any) => (a as any).engagementId === engagementId || a.datasetVersionId === `DSV-${engagementId}`
    );
  }

  // 4. Resolve Decisions
  let decisions: MappingDecision[] = [];
  if (accounts.length > 0) {
    decisions = accounts.map((acc: any, idx: number) => {
      const code = String(acc.accountCode || '');
      const target = inferLeadScheduleTarget(code, acc.accountName);

      const amount = Number(acc.closingBalanceIdr) || Number(acc.balanceIdr) || (Number(acc.debitIdr || 0) - Number(acc.creditIdr || 0)) || 0;

      return {
        id: `DEC-${idx + 1}`,
        tenantId: 'TENANT-001',
        mappingSetId: `MAPSET-${engagementId}`,
        accountRowId: acc.id || `ACC-${idx + 1}`,
        sourceAccountCode: code,
        sourceAccountName: acc.accountName,
        amountIdr: amount,
        proposedTarget: target,
        effectiveTarget: target,
        confidenceScore: 96,
        confidenceLevel: 'high' as const,
        rationale: 'Pemetaan Otomatis SAK Standard Pattern',
        status: 'mapped' as const,
        isMaterial: false,
      };
    });
  } else if (engagementId === 'ENG-2026-01') {
    decisions = state.mappingDecisions.filter(
      (d) => d.mappingSetId === 'MAPSET-001'
    );
  }

  // 5. Resolve Workpaper, Lines, Checks
  let workpaper: WorkpaperVersion | null = null;
  let lines: WorkpaperLineItem[] = [];
  let checks: ValidationCheckResult[] = [];

  if (accounts.length > 0 && decisions.length > 0) {
    const firmId = engagement.tenantId || 'TENANT-001';
    const adjustments = isSupabaseConfigured()
      ? (await getPersistentAdjustments(engagementId, firmId)) || []
      : repo.getAdjustments(engagementId);
    const wpCalc = calculateWorkpaperVersion({
      tenantId: 'TENANT-001',
      engagementId,
      datasetVersionId: `DSV-${engagementId}`,
      mappingSetId: `MAPSET-${engagementId}`,
      accounts,
      mappingDecisions: decisions,
      adjustments,
      template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
    });
    workpaper = wpCalc.workpaperVersion;
    lines = wpCalc.lines;
    checks = wpCalc.checks;
  } else {
    workpaper = state.workpaperVersions.find((w) => w.engagementId === engagementId) || (engagementId === 'ENG-2026-01' ? state.workpaperVersions[0] : null);
    lines = engagementId === 'ENG-2026-01' ? state.workpaperLines : [];
    checks = engagementId === 'ENG-2026-01' ? state.validationChecks : [];
  }

  return {
    engagement,
    client,
    files,
    accounts,
    decisions,
    workpaper,
    lines,
    checks,
  };
}
