import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/sqlite';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // 1. Cek dari SQLite jika ada (untuk demo account)
  const sqliteUser = getUserById(payload.userId);
  if (sqliteUser) {
    return NextResponse.json({
      user: {
        id: sqliteUser.id,
        email: sqliteUser.email,
        name: sqliteUser.name,
        role: sqliteUser.role,
        title: sqliteUser.title,
        firmId: payload.firmId || 'FIRM-001',
        cpaLicense: sqliteUser.cpa_license,
      },
    });
  }

  // 2. Query Supabase jika user terdaftar di Supabase
  let cpaLicense: string | null = null;
  let firmName = 'Kantor Akuntan Publik';
  if (isSupabaseConfigured() && payload.email) {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data: mem } = await admin
          .from('firm_memberships')
          .select('*, firms(*)')
          .eq('email', payload.email)
          .maybeSingle();

        if (mem) {
          cpaLicense = mem.license_number || null;
          if (mem.firms?.legal_name) {
            firmName = mem.firms.legal_name;
          }
        }
      } catch (e) {
        console.warn('Error enriching user from Supabase:', e);
      }
    }
  }

  // 3. Kembalikan data dari verified JWT payload
  return NextResponse.json({
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      title: payload.title,
      firmId: payload.firmId || 'FIRM-001',
      firmName: firmName,
      cpaLicense: cpaLicense,
    },
  });
}
