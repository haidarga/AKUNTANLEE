import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/sqlite';
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/session';
import { isSupabaseConfigured, getSupabaseAnon, getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Coba Autentikasi via Supabase Auth (Produksi PostgreSQL)
    if (isSupabaseConfigured()) {
      const sbClient = getSupabaseAnon();
      const admin = getSupabaseAdmin();

      if (sbClient) {
        const { data: authData, error: authError } = await sbClient.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (!authError && authData.user) {
          const authUser = authData.user;
          let firmId = 'FIRM-001';
          let role = (authUser.user_metadata?.role as string) || 'partner';
          let name = (authUser.user_metadata?.full_name as string) || trimmedEmail.split('@')[0];
          const title = (authUser.user_metadata?.title as string) || 'Managing Engagement Partner';
          let cpaLicense = (authUser.user_metadata?.license_number as string) || null;
          let firmName = (authUser.user_metadata?.firm_name as string) || 'Kantor Akuntan Publik';

          // Ambil data firm & membership dari PostgreSQL
          if (admin) {
            try {
              const { data: membership } = await admin
                .from('firm_memberships')
                .select('*, firms(*)')
                .eq('email', trimmedEmail)
                .maybeSingle();

              if (membership) {
                firmId = membership.firm_id;
                role = membership.role || role;
                name = membership.full_name || name;
                cpaLicense = membership.license_number || cpaLicense;
                if (membership.firms?.legal_name) {
                  firmName = membership.firms.legal_name;
                }
              }
            } catch (dbErr) {
              console.warn('Error fetching membership from Supabase:', dbErr);
            }
          }

          const token = await createSessionToken({
            userId: authUser.id,
            firmId: firmId,
            email: trimmedEmail,
            role: role,
            name: name,
            title: title,
          });

          const response = NextResponse.json({
            success: true,
            user: {
              id: authUser.id,
              email: trimmedEmail,
              name: name,
              role: role,
              title: title,
              firmId: firmId,
              firmName: firmName,
              cpaLicense: cpaLicense,
            },
          });

          response.cookies.set(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 hari
          });

          response.cookies.set('finova_user_name', encodeURIComponent(name), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });

          response.cookies.set('finova_v4_role', role, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });

          response.cookies.set('finova_firm_id', firmId, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });

          return response;
        }
      }
    }

    // 2. Fallback Kredensial Demo / Evaluasi Lokal SQLite
    const user = getUserByEmail(trimmedEmail);
    if (user) {
      const isValid = await verifyPassword(password, user.password_hash);
      if (isValid) {
        const firmId = 'FIRM-001';
        const token = await createSessionToken({
          userId: user.id,
          firmId: firmId,
          email: user.email,
          role: user.role,
          name: user.name,
          title: user.title,
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            title: user.title,
            firmId: firmId,
            firmName: 'KAP Haidar & Rekan',
            cpaLicense: user.cpa_license,
          },
        });

        response.cookies.set(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        response.cookies.set('finova_user_name', encodeURIComponent(user.name), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        response.cookies.set('finova_v4_role', user.role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }
    }

    return NextResponse.json(
      {
        error: 'Email atau kata sandi tidak valid. Jika belum memiliki akun KAP, silakan klik tombol Daftar Akun Baru.',
      },
      { status: 401 }
    );
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat autentikasi.' },
      { status: 500 }
    );
  }
}
