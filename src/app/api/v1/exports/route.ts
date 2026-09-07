import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';
import { generateWorkpaperXlsx } from '@/lib/exporter/xlsx-builder';
import { getServerSession } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchEngagementByIdFromSupabase, fetchAccountsFromSupabase, fetchFileSourcesFromSupabase } from '@/lib/supabase/service';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';
import fs from 'fs';
import path from 'path';

function deriveClientCode(legalName?: string, fallbackCode?: string): string {
  if (fallbackCode && !['EXP', 'MNDR', 'MANDIRI', 'CKI', 'CLI-002', 'CLIENT'].includes(fallbackCode.toUpperCase())) {
    return fallbackCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  }
  if (!legalName) return 'KLN';
  const clean = legalName.replace(/^(PT|CV|UD|KAP|FA|PERUM|PERUMDA|YAYASAN)\.?\s+/i, '').trim();
  const words = clean.split(/[\s\-_]+/).filter(Boolean);
  if (words.length > 1) {
    const acronym = words.map((w) => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (acronym.length >= 2) return acronym.slice(0, 24);
  }
  return clean.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'KLN';
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    const body = await request.json();
    const {
      engagementId,
      userRole,
      operatorName,
      customWp,
      customLines,
      sourceChecksum,
      clientCode,
    } = body;

    const state = repo.getState();
    const user = state.users.find((u) => u.role === (userRole as UserRoleV4)) || state.users[0];

    // Authorization check
    repo.assertPermission(user.role, 'authorize_export');

    if (!engagementId) {
      return NextResponse.json(
        { code: 'EXPORT_BLOCKED', message: 'ID Perikatan wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Resolve Engagement & Client dynamically
    let engagement = state.engagements.find((e) => e.id === engagementId);
    let client = engagement ? state.clients.find((c) => c.id === engagement?.clientId) : null;

    if ((!engagement || !client) && isSupabaseConfigured()) {
      try {
        const sb = await fetchEngagementByIdFromSupabase(engagementId);
        if (sb) {
          engagement = sb.engagement;
          client = sb.client;
        }
      } catch (e) {
        console.warn('Error querying Supabase for engagement export:', e);
      }
    }

    const effectiveClientCode = deriveClientCode(client?.legalName || engagement?.name, clientCode || client?.code);
    const effectiveOperatorName =
      typeof operatorName === 'string' && operatorName.trim()
        ? operatorName.trim()
        : session?.name || user.name || 'Auditor Penanggung Jawab';

    const periodYear =
      engagement?.periodStart?.slice(0, 4) ||
      engagement?.name?.match(/20\d{2}/)?.[0] ||
      '2026';

    // 2. Resolve Workpaper, Lines, and Checks
    let finalWp = customWp;
    let finalLines = customLines && customLines.length > 0 ? customLines : null;
    let finalChecks = customWp?.validationChecks || [];
    let finalSourceChecksum = sourceChecksum;

    if (!finalLines && engagementId === 'ENG-2026-01') {
      finalWp = state.workpaperVersions[0];
      finalLines = state.workpaperLines;
      finalChecks = state.validationChecks;
      finalSourceChecksum = state.fileVersions[0]?.checksumSha256;
    } else if (!finalLines) {
      // Fetch accounts from Supabase dynamically for this engagement
      let accounts: any[] = [];
      if (isSupabaseConfigured()) {
        try {
          accounts = await fetchAccountsFromSupabase(engagementId);
          const rawFiles = await fetchFileSourcesFromSupabase(engagementId);
          if (rawFiles && rawFiles.length > 0) {
            finalSourceChecksum = rawFiles[0].sha256_checksum;
          }
        } catch (sbAccErr) {
          console.warn('Supabase accounts lookup error:', sbAccErr);
        }
      }

      if (accounts.length === 0) {
        accounts = state.accounts.filter(
          (a: any) => (a as any).engagementId === engagementId || a.datasetVersionId === `DSV-${engagementId}`
        );
      }

      if (accounts.length === 0) {
        // FAIL-CLOSED: strictly block export if client has no accounts!
        return NextResponse.json(
          {
            code: 'EXPORT_BLOCKED',
            message: 'Export diblokir: Belum ada berkas neraca saldo atau baris kertas kerja untuk perikatan ini. Unggah neraca saldo terlebih dahulu.',
            request_id: `req-${Date.now()}`,
            retryable: false,
          },
          { status: 422 }
        );
      }

      // Compute workpaper lines dynamically
      const decisions = accounts.map((acc: any, idx: number) => {
        let target = 'WP-A.1';
        const nameLower = (acc.accountName || '').toLowerCase();
        const code = String(acc.accountCode || '');
        if (code.startsWith('10') || code.startsWith('11') || nameLower.includes('kas') || nameLower.includes('bank')) target = 'WP-A.1';
        else if (code.startsWith('12') || nameLower.includes('piutang')) target = 'WP-A.2';
        else if (code.startsWith('13') || nameLower.includes('persediaan') || nameLower.includes('inventory')) target = 'WP-A.4';
        else if (code.startsWith('14') || nameLower.includes('muka') || nameLower.includes('prepaid')) target = 'WP-A.5';
        else if (nameLower.includes('akumulasi')) target = 'WP-B.2';
        else if (code.startsWith('15') || code.startsWith('16') || nameLower.includes('tetap') || nameLower.includes('gedung') || nameLower.includes('mesin') || nameLower.includes('kendaraan')) target = 'WP-B.1';
        else if (code.startsWith('20') || code.startsWith('21') || nameLower.includes('utang usaha') || nameLower.includes('payable')) target = 'WP-C.1';
        else if (code.startsWith('22') || nameLower.includes('pajak') || nameLower.includes('tax')) target = 'WP-C.2';
        else if (code.startsWith('25') || nameLower.includes('bank') || nameLower.includes('pinjaman')) target = 'WP-D.1';
        else if (code.startsWith('30') || nameLower.includes('modal') || nameLower.includes('capital')) target = 'WP-E.1';
        else if (code.startsWith('31') || nameLower.includes('laba') || nameLower.includes('retained')) target = 'WP-E.2';
        else if (code.startsWith('4') || nameLower.includes('pendapatan') || nameLower.includes('penjualan') || nameLower.includes('revenue')) target = 'WP-F.1';
        else if (code.startsWith('5') || nameLower.includes('pokok') || nameLower.includes('hpp') || nameLower.includes('cogs')) target = 'WP-F.2';
        else target = 'WP-F.3';

        const amount = Number(acc.closingBalanceIdr) || Number(acc.balanceIdr) || (Number(acc.debitIdr || 0) - Number(acc.creditIdr || 0)) || 0;
        return {
          id: `DEC-${idx + 1}`,
          tenantId: engagement?.tenantId || 'FIRM-001',
          mappingSetId: `MAPSET-${engagementId}`,
          accountRowId: acc.id || `ACC-${idx + 1}`,
          sourceAccountCode: acc.accountCode,
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

      const wpCalc = calculateWorkpaperVersion({
        tenantId: engagement?.tenantId || 'FIRM-001',
        engagementId,
        datasetVersionId: `DSV-${engagementId}`,
        mappingSetId: `MAPSET-${engagementId}`,
        accounts,
        mappingDecisions: decisions,
        template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
      });

      finalWp = wpCalc.workpaperVersion;
      finalLines = wpCalc.lines;
      finalChecks = wpCalc.checks || [];
    }

    const fv = state.fileVersions.find((f) => f.engagementId === engagementId) || state.fileVersions[0];

    const result = generateWorkpaperXlsx({
      tenantId: user.tenantId,
      engagementId,
      clientCode: effectiveClientCode,
      periodYear,
      workpaperVersion: { ...finalWp, isStale: false },
      lines: finalLines,
      checks: finalChecks,
      userId: user.id,
      operatorName: effectiveOperatorName,
      sourceFileVersionChecksum:
        finalSourceChecksum ||
        fv?.checksumSha256 ||
        '0000000000000000000000000000000000000000000000000000000000000000',
    });

    try {
      const filePath = path.join(process.cwd(), 'data', `${result.artifact.id}.xlsx`);
      fs.writeFileSync(filePath, result.buffer);
    } catch (e) {
      console.warn('Could not write export to file:', e);
    }

    state.exportArtifacts.unshift(result.artifact);

    return NextResponse.json(
      {
        data: result.artifact,
        contentBase64: result.buffer.toString('base64'),
        request_id: `req-${Date.now()}`,
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error('Export error in POST /api/v1/exports:', err);
    return NextResponse.json(
      { code: 'EXPORT_BLOCKED', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
