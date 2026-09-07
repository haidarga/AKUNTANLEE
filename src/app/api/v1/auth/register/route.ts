import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase/client';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/session';
import { getDatabase } from '@/lib/db/sqlite';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      firmName,
      role = 'partner',
      licenseNumber,
      phone,
    } = body;

    // 1. Validasi Input
    if (!email || !password || !fullName || !firmName) {
      return NextResponse.json(
        { error: 'Nama Lengkap, Nama KAP, Email, dan Kata Sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFullName = fullName.trim();
    const trimmedFirmName = firmName.trim();

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return NextResponse.json(
        { error: 'Format alamat email tidak valid.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi minimal terdiri dari 8 karakter.' },
        { status: 400 }
      );
    }

    // Cek duplikasi di database lokal SQLite
    try {
      const db = getDatabase();
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(trimmedEmail);
      if (existing) {
        return NextResponse.json(
          {
            code: 'EMAIL_ALREADY_EXISTS',
            error: 'Email ini sudah terdaftar di sistem. Silakan langsung masuk.',
          },
          { status: 409 }
        );
      }
    } catch (e) {}

    const assignedRole = ['partner', 'manager', 'senior', 'staff', 'reviewer'].includes(role)
      ? role
      : 'partner';

    const title =
      assignedRole === 'partner'
        ? 'Managing Engagement Partner'
        : assignedRole === 'manager'
        ? 'Engagement Manager'
        : assignedRole === 'senior'
        ? 'Senior Auditor'
        : 'Audit Associate';

    let userId = 'USR-' + crypto.randomUUID().substring(0, 8);
    let firmId = 'FIRM-' + crypto.randomUUID().substring(0, 8);

    // 2. Registrasi ke Supabase Auth & PostgreSQL (Jika Terkonfigurasi)
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        // Cek / Buat user di Supabase Auth (Auto-confirm agar langsung aktif tanpa hambatan SMTP)
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
          email: trimmedEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: trimmedFullName,
            firm_name: trimmedFirmName,
            role: assignedRole,
            title: title,
            license_number: licenseNumber || null,
          },
        });

        if (authError) {
          if (
            authError.message?.toLowerCase().includes('already') ||
            authError.code === 'email_exists'
          ) {
            return NextResponse.json(
              {
                code: 'EMAIL_ALREADY_EXISTS',
                error: 'Email ini sudah terdaftar di sistem. Silakan langsung masuk.',
              },
              { status: 409 }
            );
          }

          return NextResponse.json(
            {
              code: 'AUTH_CREATION_FAILED',
              error: authError.message || 'Gagal mendaftarkan user ke Supabase Auth.',
            },
            { status: 400 }
          );
        }

        if (authData?.user) {
          userId = authData.user.id;
        }

        // Simpan / Buat KAP baru di tabel firms
        const shortName = trimmedFirmName
          .replace(/^(KAP|Kantor Akuntan Publik)\s+/i, '')
          .trim();

        const { error: firmError } = await admin.from('firms').insert({
          id: firmId,
          legal_name: trimmedFirmName,
          short_name: shortName || 'KAP',
          license_number: licenseNumber || null,
          email: trimmedEmail,
          phone: phone || null,
          status: 'active',
          settings: {
            lead_partner_name: trimmedFullName,
            default_currency: 'IDR',
            accounting_standard: 'SAK_INDONESIA',
          },
        });

        if (firmError) {
          console.error('Error inserting firm into Supabase:', firmError);
        }

        // Hubungkan user ke firm via firm_memberships
        const { error: memError } = await admin.from('firm_memberships').insert({
          id: 'MEM-' + crypto.randomUUID().substring(0, 8),
          firm_id: firmId,
          email: trimmedEmail,
          full_name: trimmedFullName,
          role: assignedRole,
          license_number: licenseNumber || null,
          status: 'active',
        });

        if (memError) {
          console.error('Error inserting firm membership into Supabase:', memError);
        }
      }
    }

    // 3. Simpan / Sinkronisasi ke SQLite Lokal (untuk hybrid offline support)
    try {
      const db = getDatabase();
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(trimmedEmail);
      if (!existing) {
        const passwordHash = bcrypt.hashSync(password, 10);
        db.prepare(`
          INSERT INTO users (id, email, password_hash, name, role, title, cpa_license, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          trimmedEmail,
          passwordHash,
          trimmedFullName,
          assignedRole,
          title,
          licenseNumber || null,
          new Date().toISOString()
        );
      }
    } catch (sqliteErr) {
      console.warn('SQLite mirror save ignored:', sqliteErr);
    }

    // 4. Terbitkan JWT Session Token Resmi
    const token = await createSessionToken({
      userId: userId,
      firmId: firmId,
      email: trimmedEmail,
      role: assignedRole,
      name: trimmedFullName,
      title: title,
    });

    // 5. Konstruksi HTTP Response & Set Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Pendaftaran KAP & Akun Auditor berhasil.',
      user: {
        id: userId,
        email: trimmedEmail,
        name: trimmedFullName,
        role: assignedRole,
        title: title,
        firmId: firmId,
        firmName: trimmedFirmName,
        cpaLicense: licenseNumber || null,
      },
      firm: {
        id: firmId,
        name: trimmedFirmName,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    response.cookies.set('finova_user_name', encodeURIComponent(trimmedFullName), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('finova_v4_role', assignedRole, {
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
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat memproses registrasi.' },
      { status: 500 }
    );
  }
}
