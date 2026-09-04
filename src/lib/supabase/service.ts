import { getSupabase, isSupabaseConfigured } from './client';
import { ClientV4, EngagementV4 } from '@/types/domain-v4';

export async function fetchEngagementsFromSupabase(
  tenantId: string = 'TENANT-001'
): Promise<{ engagements: EngagementV4[]; clients: ClientV4[] } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: engRows, error: engErr } = await supabase
      .from('engagements')
      .select('*, clients(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

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
        tenantId: row.tenant_id,
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
          tenantId: row.clients.tenant_id,
          legalName: row.clients.legal_name,
          code: row.clients.code,
          industry: row.clients.industry || 'Manufaktur & Fabrikasi',
          taxIdNpwp: row.clients.tax_id_npwp || '01.234.567.8-012.000',
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
      .single();

    if (error || !row) {
      return null;
    }

    const engagement: EngagementV4 = {
      id: row.id,
      tenantId: row.tenant_id,
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
      tenantId: row.clients?.tenant_id || row.tenant_id,
      legalName: row.clients?.legal_name || 'PT Klien Audit',
      code: row.clients?.code || 'KLN',
      industry: row.clients?.industry || 'Manufaktur & Fabrikasi',
      taxIdNpwp: row.clients?.tax_id_npwp || '01.234.567.8-012.000',
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
  client: ClientV4
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // Upsert client
    const { error: clientErr } = await supabase.from('clients').upsert({
      id: client.id,
      tenant_id: client.tenantId || 'TENANT-001',
      legal_name: client.legalName,
      code: client.code,
      industry: client.industry || 'Manufaktur & Fabrikasi',
      tax_id_npwp: client.taxIdNpwp || '01.234.567.8-012.000',
      address: client.address || '',
      status: client.status || 'active',
      updated_at: new Date().toISOString(),
    });

    if (clientErr) {
      console.error('Supabase client upsert error:', clientErr);
      return false;
    }

    // Upsert engagement
    const { error: engErr } = await supabase.from('engagements').upsert({
      id: engagement.id,
      tenant_id: engagement.tenantId || 'TENANT-001',
      client_id: engagement.clientId,
      name: engagement.name,
      period_start: engagement.periodStart || '2026-01-01',
      period_end: engagement.periodEnd || '2026-12-31',
      currency: engagement.currency || 'IDR',
      materiality_idr: engagement.materialityIdr || 250000000,
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
    // 1. Update engagement
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
      .single();

    if (engErr) {
      console.error('Supabase engagement update error:', engErr);
    }

    // 2. Update client if provided
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
