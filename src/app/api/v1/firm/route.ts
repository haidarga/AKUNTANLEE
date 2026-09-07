import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getFirmProfileFromSupabase, saveFirmProfileToSupabase } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSessionActor(req);
    const firmId = actor.tenantId;
    if (isSupabaseConfigured()) {
      const profile = await getFirmProfileFromSupabase(firmId);
      if (profile) {
        return NextResponse.json({ success: true, data: profile }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
      }
    } else {
      const localProfile = repo.getFirmProfile();
      if (localProfile) {
        return NextResponse.json({ success: true, data: localProfile }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
      }
    }
    return NextResponse.json({ success: false, code: 'FIRM_NOT_FOUND', error: 'Profil KAP tidak ditemukan.' }, { status: 404 });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch firm profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await requireSessionActor(req, ['partner']);
    const firmId = actor.tenantId;
    const body = await req.json();
    let updated;

    if (isSupabaseConfigured()) {
      updated = await saveFirmProfileToSupabase({ ...body, id: firmId });
      if (!updated) {
        return NextResponse.json({
          success: false,
          code: 'DATABASE_PERSISTENCE_FAILED',
          error: 'Profil KAP gagal disimpan ke database produksi. Silakan ulangi; data tidak diubah.',
        }, { status: 502 });
      }
    } else if (process.env.VERCEL) {
      return NextResponse.json({
        success: false,
        code: 'PERSISTENT_STORAGE_UNAVAILABLE',
        error: 'Database produksi belum terkonfigurasi. Profil KAP tidak disimpan ke penyimpanan sementara.',
      }, { status: 503 });
    } else {
      updated = repo.updateFirmProfile({ ...body, id: firmId });
    }

    return NextResponse.json({ success: true, message: 'Profil Kantor Akuntan Publik berhasil diperbarui.', data: updated });
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message || 'Failed to update firm profile' }, { status: 500 });
  }
}
