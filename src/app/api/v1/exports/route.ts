import { NextResponse } from 'next/server';
import { generateWorkpaperXlsx } from '@/lib/exporter/xlsx-builder';
import { getEngagementServerData } from '@/lib/server/engagement-data';
import {
  assertTenantAccess,
  authorizationErrorResponse,
  requireSessionActor,
} from '@/lib/auth/authorization';

function deriveClientCode(legalName?: string, fallbackCode?: string): string {
  if (fallbackCode && !['EXP', 'MNDR', 'MANDIRI', 'CKI', 'CLI-002', 'CLIENT'].includes(fallbackCode.toUpperCase())) {
    return fallbackCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  }
  if (!legalName) return 'KLN';
  const clean = legalName.replace(/^(PT|CV|UD|KAP|FA|PERUM|PERUMDA|YAYASAN)\.?\s+/i, '').trim();
  const words = clean.split(/[\s\-_]+/).filter(Boolean);
  if (words.length > 1) {
    const acronym = words.map((word) => word[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (acronym.length >= 2) return acronym.slice(0, 24);
  }
  return clean.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'KLN';
}

function blocked(message: string, status = 422) {
  return NextResponse.json(
    { code: 'EXPORT_BLOCKED', message, request_id: `req-${Date.now()}`, retryable: false },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const actor = await requireSessionActor(request, ['partner']);
    const body = await request.json();
    const engagementId = typeof body.engagementId === 'string' ? body.engagementId.trim() : '';
    if (!engagementId) return blocked('ID Perikatan wajib disertakan.', 400);

    // Never accept workpaper figures, signer identity, client code, validation
    // results, or source checksums from the browser. Official exports are built
    // exclusively from the tenant-scoped server record.
    const data = await getEngagementServerData(engagementId);
    assertTenantAccess(actor, data.engagement?.tenantId);

    if (!data.workpaper || data.lines.length === 0 || data.files.length === 0) {
      return blocked('Export diblokir: berkas sumber dan kertas kerja belum lengkap.');
    }
    if (data.workpaper.isStale) {
      return blocked('Export diblokir: versi kertas kerja sudah kedaluwarsa dan harus dihitung ulang.');
    }

    const blockingFailures = data.checks.filter(
      (check) => check.status === 'fail' && check.severity === 'blocking',
    );
    if (blockingFailures.length > 0) {
      return blocked(`Export diblokir: ${blockingFailures.map((check) => check.title).join(', ')} belum lulus.`);
    }

    const sourceChecksum = data.files[0]?.checksumSha256;
    if (!sourceChecksum || !/^[a-f0-9]{64}$/i.test(sourceChecksum)) {
      return blocked('Export diblokir: hash SHA-256 berkas sumber tidak valid.');
    }

    const periodYear = data.engagement.periodStart?.slice(0, 4) || '2026';
    const result = generateWorkpaperXlsx({
      tenantId: actor.tenantId,
      engagementId,
      clientCode: deriveClientCode(data.client?.legalName, data.client?.code),
      periodYear,
      workpaperVersion: data.workpaper,
      lines: data.lines,
      checks: data.checks,
      userId: actor.id,
      operatorName: actor.name,
      sourceFileVersionChecksum: sourceChecksum,
    });

    return NextResponse.json({
      data: result.artifact,
      contentBase64: result.buffer.toString('base64'),
      request_id: `req-${Date.now()}`,
    }, {
      status: 202,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Export error in POST /api/v1/exports:', error);
    return blocked(error?.message || 'Export gagal diproses.');
  }
}
