import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { saveStateToDb } from '@/lib/db/sqlite';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const state = repo.getState();
  const engagement = state.engagements.find((e) => e.id === id);
  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
  }
  const client = state.clients.find((c) => c.id === engagement.clientId);
  return NextResponse.json({ data: { engagement, client } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const {
      clientName,
      clientCode,
      taxIdNpwp,
      industry,
      name,
      materialityIdr,
      accountingStandard,
      periodYear,
      periodStart,
      periodEnd,
    } = body;

    const state = repo.getState();
    let engagement = state.engagements.find((e) => e.id === id);

    // If engagement doesn't exist yet, synthesize or create it
    if (!engagement) {
      const clientId = 'CLI-' + Date.now().toString(36).toUpperCase();
      const newClient = {
        id: clientId,
        tenantId: 'TENANT-001',
        legalName: clientName || 'PT Klien Baru',
        code: (clientCode || 'KLN').toUpperCase(),
        industry: industry || 'Manufaktur & Fabrikasi',
        taxIdNpwp: taxIdNpwp || '01.234.567.8-012.000',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      };
      state.clients.push(newClient);

      engagement = {
        id,
        tenantId: 'TENANT-001',
        clientId: newClient.id,
        name: name || (id === 'ENG-MANDIRI-2026' ? 'Kertas Kerja Audit Mandiri FY 2026' : 'Perikatan Audit Mandiri ' + id),
        periodStart: periodStart || '2026-01-01',
        periodEnd: periodEnd || '2026-12-31',
        currency: 'IDR' as const,
        materialityIdr: materialityIdr ? Number(materialityIdr) : 250000000,
        accountingStandard: accountingStandard || 'SAK_INDONESIA',
        status: 'preparing' as const,
        leadPartnerId: 'USR-PARTNER-01',
        managerId: 'USR-MANAGER-01',
        seniorId: 'USR-SENIOR-01',
        preparerId: 'USR-PREPARER-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.engagements.push(engagement);
    } else {
      // Update existing engagement fields
      if (name) engagement.name = name;
      if (materialityIdr !== undefined) engagement.materialityIdr = Number(materialityIdr);
      if (accountingStandard) engagement.accountingStandard = accountingStandard;
      if (periodStart) engagement.periodStart = periodStart;
      if (periodEnd) engagement.periodEnd = periodEnd;
      engagement.updatedAt = new Date().toISOString();

      // Update associated client
      let client = state.clients.find((c) => c.id === engagement?.clientId);
      if (!client) {
        client = {
          id: engagement.clientId || 'CLI-' + Date.now().toString(36).toUpperCase(),
          tenantId: engagement.tenantId,
          legalName: clientName || 'PT Klien Baru',
          code: (clientCode || 'KLN').toUpperCase(),
          industry: industry || 'Manufaktur & Fabrikasi',
          taxIdNpwp: taxIdNpwp || '01.234.567.8-012.000',
          status: 'active' as const,
          createdAt: new Date().toISOString(),
        };
        state.clients.push(client);
        engagement.clientId = client.id;
      } else {
        if (clientName) client.legalName = clientName;
        if (clientCode) client.code = clientCode.toUpperCase();
        if (industry) client.industry = industry;
        if (taxIdNpwp) client.taxIdNpwp = taxIdNpwp;
      }
    }

    const client = state.clients.find((c) => c.id === engagement.clientId);

    // Persist changes to SQLite and JSON store
    try {
      saveStateToDb(state);
    } catch (dbErr) {
      console.error('Failed to save state to SQLite:', dbErr);
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const storePath = path.join(process.cwd(), 'data', 'finova_store.json');
      fs.writeFileSync(storePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (fsErr) {
      console.error('Failed to save state to JSON store:', fsErr);
    }

    return NextResponse.json({
      success: true,
      data: { engagement, client },
      message: 'Data PT & Perikatan berhasil diperbarui.',
      request_id: 'req-' + Date.now(),
    });
  } catch (err: any) {
    console.error('Error updating engagement:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
