import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';

export async function GET() {
  try {
    const profile = repo.getFirmProfile();
    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch firm profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = repo.updateFirmProfile(body);
    return NextResponse.json({
      success: true,
      message: 'Profil Kantor Akuntan Publik berhasil diperbarui.',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update firm profile' },
      { status: 500 }
    );
  }
}
