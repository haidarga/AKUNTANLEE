import { getSupabase, isSupabaseConfigured } from './client';
import {
  ClientV4,
  EngagementV4,
  FileVersion,
  DatasetVersion,
  AccountRow,
  WorkpaperVersion,
  AuditAdjustmentEntry,
  ReviewerNote,
  AuditEventV4,
  FirmProfile,
} from '@/types/domain-v4';

// -----------------------------------------------------------------------------
// FIRM PROFILE
// -----------------------------------------------------------------------------
export async function getFirmProfileFromSupabase(firmId?: string): Promise<FirmProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let query = supabase.from('firms').select('*');
    if (firmId) query = query.eq('id', firmId);
    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.legal_name || 'Kantor Akuntan Publik',
      shortName: data.short_name || 'KAP',
      licenseNumber: data.license_number || '',
      managingPartnerName: data.settings?.lead_partner_name || '',
      managingPartnerApNumber: '',
      address: data.address || '',
      city: 'Jakarta',
      phone: data.phone || '',
      email: data.email || '',
      defaultAccountingStandard: data.settings?.accounting_standard || 'SAK_INDONESIA',
      defaultMaterialityIdr: 150_000_000,
      teamMembers: [],
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('Error in getFirmProfileFromSupabase:', err);
    return null;
  }
}

export async function saveFirmProfileToSupabase(firm: Partial<FirmProfile>): Promise<FirmProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const payload: any = {
      legal_name: firm.name || 'Kantor Akuntan Publik',
      short_name: firm.shortName || 'KAP',
      license_number: firm.licenseNumber,
      address: firm.address,
      phone: firm.phone,
      email: firm.email,
      status: 'active',
      settings: {
        lead_partner_name: firm.managingPartnerName || '',
        accounting_standard: firm.defaultAccountingStandard || 'SAK_INDONESIA',
        default_currency: 'IDR',
      },
      updated_at: new Date().toISOString(),
    };

    if (firm.id) {
      payload.id = firm.id;
    }

    const { data, error } = await supabase.from('firms').upsert(payload).select().single();
    if (error || !data) {
      console.error('saveFirmProfileToSupabase error:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.legal_name,
      shortName: data.short_name || 'KAP',
      licenseNumber: data.license_number || '',
      managingPartnerName: data.settings?.lead_partner_name || '',
      managingPartnerApNumber: '',
      address: data.address || '',
      city: 'Jakarta',
      phone: data.phone || '',
      email: data.email || '',
      defaultAccountingStandard: data.settings?.accounting_standard || 'SAK_INDONESIA',
      defaultMaterialityIdr: 150_000_000,
      teamMembers: [],
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('Error in saveFirmProfileToSupabase:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// CLIENTS
// -----------------------------------------------------------------------------
export async function fetchClientsFromSupabase(firmId?: string): Promise<ClientV4[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (firmId) query = query.eq('firm_id', firmId);
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      tenantId: row.firm_id,
      legalName: row.legal_name,
      code: row.code,
      industry: row.industry || 'Jasa & Perdagangan',
      taxIdNpwp: row.tax_id_npwp || '00.000.000.0-000.000',
      address: row.address || '',
      status: row.status || 'active',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Error in fetchClientsFromSupabase:', err);
    return [];
  }
}

export async function saveClientToSupabase(client: ClientV4, firmId: string = 'FIRM-001'): Promise<ClientV4 | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('clients')
      .upsert({
        id: client.id,
        firm_id: firmId,
        legal_name: client.legalName,
        code: client.code,
        industry: client.industry,
        tax_id_npwp: client.taxIdNpwp,
        address: client.address || '',
        status: client.status || 'active',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error('saveClientToSupabase error:', error);
      return null;
    }

    return {
      id: data.id,
      tenantId: data.firm_id,
      legalName: data.legal_name,
      code: data.code,
      industry: data.industry,
      taxIdNpwp: data.tax_id_npwp,
      address: data.address,
      status: data.status,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error in saveClientToSupabase:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// ENGAGEMENTS
// -----------------------------------------------------------------------------
export async function fetchEngagementsFromSupabase(
  firmId?: string
): Promise<{ engagements: EngagementV4[]; clients: ClientV4[] } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let query = supabase.from('engagements').select('*, clients(*)').order('created_at', { ascending: false });
    if (firmId) query = query.eq('firm_id', firmId);
    const { data: engRows, error: engErr } = await query;

    if (engErr || !engRows) {
      console.warn('Supabase fetch engagements warning:', engErr);
      return null;
    }

    const engagements: EngagementV4[] = [];
    const clients: ClientV4[] = [];
    const clientMap = new Map<string, ClientV4>();

    for (const row of engRows) {
      const eng: EngagementV4 = {
        id: row.id,
        tenantId: row.firm_id,
        clientId: row.client_id,
        name: row.name,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        currency: (row.currency as 'IDR') || 'IDR',
        materialityIdr: Number(row.materiality_idr),
        accountingStandard: row.accounting_standard || 'SAK_INDONESIA',
        status: row.status,
        leadPartnerId: row.lead_partner_id || 'USR-PARTNER-01',
        managerId: row.manager_id || 'USR-MANAGER-01',
        seniorId: row.senior_id || 'USR-SENIOR-01',
        preparerId: row.preparer_id || 'USR-PREPARER-01',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      engagements.push(eng);

      if (row.clients && !clientMap.has(row.clients.id)) {
        const cl: ClientV4 = {
          id: row.clients.id,
          tenantId: row.clients.firm_id,
          legalName: row.clients.legal_name,
          code: row.clients.code,
          industry: row.clients.industry || 'Jasa & Perdagangan',
          taxIdNpwp: row.clients.tax_id_npwp || '00.000.000.0-000.000',
          address: row.clients.address || '',
          status: row.clients.status || 'active',
          createdAt: row.clients.created_at,
        };
        clientMap.set(cl.id, cl);
        clients.push(cl);
      }
    }

    return { engagements, clients };
  } catch (err) {
    console.error('Error in fetchEngagementsFromSupabase:', err);
    return null;
  }
}

export async function fetchEngagementByIdFromSupabase(
  id: string
): Promise<{ engagement: EngagementV4; client: ClientV4 } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: row, error } = await supabase
      .from('engagements')
      .select('*, clients(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !row) return null;

    const engagement: EngagementV4 = {
      id: row.id,
      tenantId: row.firm_id,
      clientId: row.client_id,
      name: row.name,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      currency: (row.currency as 'IDR') || 'IDR',
      materialityIdr: Number(row.materiality_idr),
      accountingStandard: row.accounting_standard || 'SAK_INDONESIA',
      status: row.status,
      leadPartnerId: row.lead_partner_id || 'USR-PARTNER-01',
      managerId: row.manager_id || 'USR-MANAGER-01',
      seniorId: row.senior_id || 'USR-SENIOR-01',
      preparerId: row.preparer_id || 'USR-PREPARER-01',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const client: ClientV4 = {
      id: row.clients?.id || row.client_id,
      tenantId: row.clients?.firm_id || row.firm_id,
      legalName: row.clients?.legal_name || 'PT Klien Audit',
      code: row.clients?.code || 'KLN',
      industry: row.clients?.industry || 'Jasa & Perdagangan',
      taxIdNpwp: row.clients?.tax_id_npwp || '00.000.000.0-000.000',
      address: row.clients?.address || '',
      status: row.clients?.status || 'active',
      createdAt: row.clients?.created_at || row.created_at,
    };

    return { engagement, client };
  } catch (err) {
    console.error('Error in fetchEngagementByIdFromSupabase:', err);
    return null;
  }
}

export async function saveEngagementToSupabase(
  engagement: EngagementV4,
  client: ClientV4,
  firmId: string = 'FIRM-001'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // 1. Ensure firm exists
    await supabase.from('firms').upsert({
      id: firmId,
      legal_name: 'Kantor Akuntan Publik',
      status: 'active',
      updated_at: new Date().toISOString(),
    });

    // 2. Upsert client
    const { error: clientErr } = await supabase.from('clients').upsert({
      id: client.id,
      firm_id: firmId,
      legal_name: client.legalName,
      code: client.code,
      industry: client.industry || 'Jasa & Perdagangan',
      tax_id_npwp: client.taxIdNpwp || '00.000.000.0-000.000',
      address: client.address || '',
      status: client.status || 'active',
      updated_at: new Date().toISOString(),
    });

    if (clientErr) {
      console.error('Supabase client upsert error:', clientErr);
      return false;
    }

    // 3. Upsert engagement
    const { error: engErr } = await supabase.from('engagements').upsert({
      id: engagement.id,
      firm_id: firmId,
      client_id: engagement.clientId,
      name: engagement.name,
      period_start: engagement.periodStart || '2026-01-01',
      period_end: engagement.periodEnd || '2026-12-31',
      currency: engagement.currency || 'IDR',
      materiality_idr: engagement.materialityIdr || 150000000,
      accounting_standard: engagement.accountingStandard || 'SAK_INDONESIA',
      status: engagement.status || 'preparing',
      lead_partner_id: engagement.leadPartnerId || 'USR-PARTNER-01',
      manager_id: engagement.managerId || 'USR-MANAGER-01',
      senior_id: engagement.seniorId || 'USR-SENIOR-01',
      preparer_id: engagement.preparerId || 'USR-PREPARER-01',
      updated_at: new Date().toISOString(),
    });

    if (engErr) {
      console.error('Supabase engagement upsert error:', engErr);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in saveEngagementToSupabase:', err);
    return false;
  }
}

export async function updateEngagementInSupabase(
  id: string,
  engagementUpdates: Partial<EngagementV4>,
  clientUpdates?: Partial<ClientV4>
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const engPayload: any = { updated_at: new Date().toISOString() };
    if (engagementUpdates.name) engPayload.name = engagementUpdates.name;
    if (engagementUpdates.materialityIdr !== undefined) engPayload.materiality_idr = engagementUpdates.materialityIdr;
    if (engagementUpdates.accountingStandard) engPayload.accounting_standard = engagementUpdates.accountingStandard;
    if (engagementUpdates.periodStart) engPayload.period_start = engagementUpdates.periodStart;
    if (engagementUpdates.periodEnd) engPayload.period_end = engagementUpdates.periodEnd;
    if (engagementUpdates.status) engPayload.status = engagementUpdates.status;

    const { data: engData, error: engErr } = await supabase
      .from('engagements')
      .update(engPayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (engErr) {
      console.error('Supabase engagement update error:', engErr);
    }

    if (clientUpdates && engData?.client_id) {
      const clientPayload: any = { updated_at: new Date().toISOString() };
      if (clientUpdates.legalName) clientPayload.legal_name = clientUpdates.legalName;
      if (clientUpdates.code) clientPayload.code = clientUpdates.code;
      if (clientUpdates.industry) clientPayload.industry = clientUpdates.industry;
      if (clientUpdates.taxIdNpwp) clientPayload.tax_id_npwp = clientUpdates.taxIdNpwp;

      const { error: clErr } = await supabase
        .from('clients')
        .update(clientPayload)
        .eq('id', engData.client_id);

      if (clErr) {
        console.error('Supabase client update error:', clErr);
      }
    }

    return true;
  } catch (err) {
    console.error('Error in updateEngagementInSupabase:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// FILE STORAGE & FILE SOURCES
// -----------------------------------------------------------------------------
export async function uploadFileToSupabaseStorage(
  file: File | Blob,
  path: string,
  bucket: 'audit-vault' | 'demo-vault' = 'audit-vault'
): Promise<{ publicUrl: string | null; path: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    });

    if (error || !data) {
      console.error('uploadFileToSupabaseStorage error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return {
      publicUrl: urlData?.publicUrl || null,
      path: data.path,
    };
  } catch (err) {
    console.error('Error in uploadFileToSupabaseStorage:', err);
    return null;
  }
}

export async function saveFileSourceToSupabase(
  fileSource: {
    id: string;
    firmId: string;
    engagementId: string;
    originalName: string;
    storageBucket: 'audit-vault' | 'demo-vault';
    storagePath: string;
    fileSize: number;
    sha256Checksum: string;
    mimeType?: string;
    uploadedBy?: string;
  }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('file_sources').upsert({
      id: fileSource.id,
      firm_id: fileSource.firmId,
      engagement_id: fileSource.engagementId,
      original_name: fileSource.originalName,
      storage_bucket: fileSource.storageBucket,
      storage_path: fileSource.storagePath,
      file_size: fileSource.fileSize,
      sha256_checksum: fileSource.sha256Checksum,
      mime_type: fileSource.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      scan_status: 'clean',
      uploaded_by: fileSource.uploadedBy || 'Auditor',
    });

    if (error) {
      console.error('saveFileSourceToSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in saveFileSourceToSupabase:', err);
    return false;
  }
}

export async function fetchFileSourcesFromSupabase(engagementId: string): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('file_sources')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('Error in fetchFileSourcesFromSupabase:', err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// TRIAL BALANCE ACCOUNTS & DATASET
// -----------------------------------------------------------------------------
export async function saveDatasetAndAccountsToSupabase(
  dataset: {
    id: string;
    firmId: string;
    engagementId: string;
    fileSourceId?: string;
    rowCount: number;
    totalDebit: number;
    totalCredit: number;
    checksum: string;
  },
  accounts: AccountRow[]
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error: dsErr } = await supabase.from('dataset_versions').upsert({
      id: dataset.id,
      firm_id: dataset.firmId,
      engagement_id: dataset.engagementId,
      file_source_id: dataset.fileSourceId,
      row_count: dataset.rowCount,
      total_debit: dataset.totalDebit,
      total_credit: dataset.totalCredit,
      checksum: dataset.checksum,
      is_balanced: Math.abs(dataset.totalDebit - dataset.totalCredit) < 1,
      status: 'published',
    });

    if (dsErr) {
      console.error('saveDataset error:', dsErr);
      return false;
    }

    const accountRows = accounts.map((acc) => ({
      id: acc.id || ('ACC-' + Math.random().toString(36).substring(2, 9)),
      firm_id: dataset.firmId,
      engagement_id: dataset.engagementId,
      dataset_version_id: dataset.id,
      account_code: acc.accountCode,
      account_name: acc.accountName,
      debit: acc.debitIdr || 0,
      credit: acc.creditIdr || 0,
      net_balance: (acc.closingBalanceIdr !== undefined ? acc.closingBalanceIdr : (acc.debitIdr - acc.creditIdr)) || 0,
      fs_group: (acc as any).fsGroup || (acc as any).targetWp || null,
      mapping_status: (acc as any).mappingStatus || 'unmapped',
      confidence_score: (acc as any).confidenceScore || 95,
    }));

    const { error: accErr } = await supabase.from('trial_balance_accounts').upsert(accountRows);
    if (accErr) {
      console.error('saveAccounts error:', accErr);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in saveDatasetAndAccountsToSupabase:', err);
    return false;
  }
}

export async function fetchAccountsFromSupabase(engagementId: string): Promise<AccountRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('trial_balance_accounts')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('account_code', { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      datasetVersionId: row.dataset_version_id,
      accountCode: row.account_code,
      accountName: row.account_name,
      openingBalanceIdr: 0,
      debitIdr: Number(row.debit),
      creditIdr: Number(row.credit),
      closingBalanceIdr: Number(row.net_balance),
      periodEnd: '2026-12-31',
      currency: 'IDR',
      sourceLocator: {
        fileVersionId: 'FV-001',
        sheetName: 'Sheet1',
        rowNumber: 1,
        cellRange: 'A1:E1',
      },
    }));
  } catch (err) {
    console.error('Error in fetchAccountsFromSupabase:', err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// WORKPAPER & LEAD SCHEDULES
// -----------------------------------------------------------------------------
export async function saveWorkpaperToSupabase(
  wp: WorkpaperVersion,
  firmId: string = 'FIRM-001'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('workpaper_versions').upsert({
      id: wp.id,
      firm_id: firmId,
      engagement_id: wp.engagementId,
      dataset_version_id: wp.datasetVersionIds?.[0] || null,
      version_number: wp.versionNumber || 1,
      status: wp.status || 'draft',
      is_stale: wp.isStale || false,
      summary: wp.totals || {},
      generated_at: wp.calculatedAt || new Date().toISOString(),
      generated_by: 'Auditor',
    });

    if (error) {
      console.error('saveWorkpaperToSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in saveWorkpaperToSupabase:', err);
    return false;
  }
}

export async function fetchWorkpaperFromSupabase(engagementId: string): Promise<WorkpaperVersion | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('workpaper_versions')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      tenantId: data.firm_id,
      engagementId: data.engagement_id,
      datasetVersionIds: data.dataset_version_id ? [data.dataset_version_id] : [],
      mappingSetId: 'MAPSET-' + data.engagement_id,
      templateVersion: 'FINOVA-LEAD-v1.0',
      versionNumber: data.version_number,
      status: data.status,
      totals: data.summary || {
        totalAssetsIdr: 0,
        totalLiabilitiesIdr: 0,
        totalEquityIdr: 0,
        netIncomeIdr: 0,
        tbDebitCreditDiffIdr: 0,
        balanceSheetDiffIdr: 0,
      },
      isStale: data.is_stale,
      calculatedAt: data.generated_at,
    };
  } catch (err) {
    console.error('Error in fetchWorkpaperFromSupabase:', err);
    return null;
  }
}
