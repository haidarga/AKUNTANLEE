import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabase, getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/engagements';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=supabase_not_configured', req.url));
  }

  try {
    const supabase = getSupabase();
    const admin = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.redirect(new URL('/login?error=supabase_unavailable', req.url));
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error('OAuth exchange error:', error);
      return NextResponse.redirect(new URL('/login?error=oauth_exchange_failed', req.url));
    }

    const authUser = data.user;
    const email = authUser.email || '';
    const fullName =
      (authUser.user_metadata?.full_name as string) ||
      (authUser.user_metadata?.name as string) ||
      email.split('@')[0];

    let firmId = 'FIRM-001';
    let role = 'partner';
    let title = 'Managing Engagement Partner';

    // Cek apakah user sudah terikat dengan firm di PostgreSQL
    if (admin && email) {
      try {
        const { data: membership } = await admin
          .from('firm_memberships')
          .select('*, firms(*)')
          .eq('email', email)
          .maybeSingle();

        if (membership) {
          firmId = membership.firm_id;
          role = membership.role || 'partner';
        } else {
          // Buat firm baru untuk user Google OAuth baru
          firmId = 'FIRM-' + crypto.randomUUID().substring(0, 8);
          const firmName = 'KAP ' + fullName;

          await admin.from('firms').insert({
            id: firmId,
            legal_name: firmName,
            short_name: 'KAP',
            email: email,
            status: 'active',
            settings: {
              lead_partner_name: fullName,
              default_currency: 'IDR',
              accounting_standard: 'SAK_INDONESIA',
            },
          });

          await admin.from('firm_memberships').insert({
            id: 'MEM-' + crypto.randomUUID().substring(0, 8),
            firm_id: firmId,
            email: email,
            full_name: fullName,
            role: 'partner',
            status: 'active',
          });
        }
      } catch (dbErr) {
        console.warn('Error syncing OAuth membership with Supabase:', dbErr);
      }
    }

    // Terbitkan Session JWT
    const token = await createSessionToken({
      userId: authUser.id,
      firmId: firmId,
      email: email,
      role: role,
      name: fullName,
      title: title,
    });

    const response = NextResponse.redirect(new URL(next, req.url));

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('finova_user_name', encodeURIComponent(fullName), {
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
  } catch (err) {
    console.error('Callback handler exception:', err);
    return NextResponse.redirect(new URL('/login?error=callback_internal_error', req.url));
  }
}
