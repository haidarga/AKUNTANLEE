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
  const artifact = state.exportArtifacts.find((a) => a.id === resolvedParams.id);

  if (!artifact) {
    return NextResponse.json(
      { code: 'EXPORT_NOT_FOUND', message: 'Berkas ekspor tidak ditemukan.' },
      { status: 404 },
    );
  }

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

  return NextResponse.json(
    {
      code: 'EXPORT_BYTES_UNAVAILABLE',
      message: 'Berkas ekspor tidak tersedia di penyimpanan. Silakan generate ulang dari halaman ekspor.',
    },
    { status: 410 },
  );
}
