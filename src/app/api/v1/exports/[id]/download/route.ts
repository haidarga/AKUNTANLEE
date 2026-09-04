import { NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const state = repo.getState();
  const artifact = state.exportArtifacts.find((a) => a.id === resolvedParams.id) || state.exportArtifacts[0];

  // If a physical file matching this artifact exists, serve that exact binary buffer
  const filePath = path.join(process.cwd(), 'data', `${artifact.id}.xlsx`);
  if (fs.existsSync(filePath)) {
    const fileBuf = fs.readFileSync(filePath);
    return new NextResponse(fileBuf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${artifact.filename}"`,
      },
    });
  }

  // Fallback: generate and serve
  const user = state.users.find((u) => u.role === 'partner') || state.users[0];
  const generated = repo.generateExport('ENG-2026-01', user);

  return new NextResponse(new Uint8Array(generated.buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${artifact ? artifact.filename : generated.artifact.filename}"`,
    },
  });
}
