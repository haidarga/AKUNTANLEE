import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { getServerSession } from '@/lib/auth/session';
import { authorizationErrorResponse, requireSessionActor } from '@/lib/auth/authorization';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getFirmProfileFromSupabase, saveFirmProfileToSupabase } from '@/lib/supabase/service';

const DEFAULT_FIRM_ID = 'FIRM-001';

function profileFromCookie(req: NextRequest) {
  try {
    const raw = req.cookies.get('finova_firm_profile')?.value;
    return raw ? JSON.parse(decodeURIComponent(raw)) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const firmId = session?.firmId || DEFAULT_FIRM_ID;
    if (isSupabaseConfigured()) {
      const profile = await getFirmProfileFromSupabase(firmId);
      if (profile) {
        return NextResponse.json({ success: true, data: profile }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
      }
    }

    const cookieProfile = profileFromCookie(req);
    if (cookieProfile?.name) {
      return NextResponse.json({ success: true, data: cookieProfile }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }
    return NextResponse.json({ success: true, data: repo.getFirmProfile() }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err: any) {
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

    const res = NextResponse.json({ success: true, message: 'Profil Kantor Akuntan Publik berhasil diperbarui.', data: updated });
    res.cookies.set('finova_firm_profile', encodeURIComponent(JSON.stringify(updated)), {
      path: '/', maxAge: 31536000, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (err: any) {
    const authResponse = authorizationErrorResponse(err);
    if (authResponse) return authResponse;
    return NextResponse.json({ success: false, error: err.message || 'Failed to update firm profile' }, { status: 500 });
  }
}
