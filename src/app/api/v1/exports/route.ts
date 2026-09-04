import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';
import { generateWorkpaperXlsx } from '@/lib/exporter/xlsx-builder';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { engagementId, userRole, customWp, customLines, sourceChecksum, clientCode } = body;
    const user = repo.getState().users.find((u) => u.role === (userRole as UserRoleV4)) || repo.getState().users[0];

    // Authorization check
    repo.assertPermission(user.role, 'authorize_export');

    if (customWp) {
      const fv = repo.getState().fileVersions.find((f) => f.engagementId === engagementId) || repo.getState().fileVersions[0];
      const lines = customLines && customLines.length > 0 ? customLines : repo.getState().workpaperLines;
      const checks = customWp.validationChecks || repo.getState().validationChecks;

      const result = generateWorkpaperXlsx({
        tenantId: user.tenantId,
        engagementId: engagementId || 'ENG-MANDIRI-2026',
        clientCode: clientCode || 'MNDR',
        periodYear: '2026',
        workpaperVersion: { ...customWp, isStale: false },
        lines: lines,
        checks: checks,
        userId: user.id,
        operatorName: user.name,
        sourceFileVersionChecksum: sourceChecksum || fv?.checksumSha256 || '0000000000000000000000000000000000000000000000000000000000000000',
      });

      try {
        const filePath = path.join(process.cwd(), 'data', `${result.artifact.id}.xlsx`);
        fs.writeFileSync(filePath, result.buffer);
      } catch (e) {
        console.warn('Could not write export to file:', e);
      }

      repo.getState().exportArtifacts.unshift(result.artifact);
      return NextResponse.json({ data: result.artifact, request_id: `req-${Date.now()}` }, { status: 202 });
    }

    const result = repo.generateExport(engagementId || 'ENG-2026-01', user);
    return NextResponse.json({ data: result.artifact, request_id: `req-${Date.now()}` }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json(
      { code: 'EXPORT_BLOCKED', message: err.message, request_id: `req-${Date.now()}`, retryable: false },
      { status: 422 }
    );
  }
}
