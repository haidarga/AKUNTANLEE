import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth/session';

export interface AccessKeyConfig {
  key: string;
  name: string;
  email: string;
  role: 'partner' | 'manager' | 'senior' | 'preparer';
  title: string;
  cpaLicense: string | null;
  variant: 'variant_b_advisory' | 'variant_a_compliance' | 'variant_master';
  targetPath: string;
  description: string;
}

export const VALID_ACCESS_KEYS: Record<string, AccessKeyConfig> = {
  'FINOVA-RINA-CFO': {
    key: 'FINOVA-RINA-CFO',
    name: 'Ibu Rina Asmara, Ak.',
    email: 'rina.asmara@advisory-partner.id',
    role: 'partner',
    title: 'Senior Financial Advisory Partner & Former Corporate CFO',
    cpaLicense: 'AK.7821-CFO',
    variant: 'variant_b_advisory',
    targetPath: '/engagements/ENG-2026-01/advisory',
    description: 'A/B Variant B: Fokus Strategic Advisory, Diagnosa Biaya Membengkak, HPP Manufaktur & Simulasi What-If',
  },
  'RINA-CFO': {
    key: 'RINA-CFO',
    name: 'Ibu Rina Asmara, Ak.',
    email: 'rina.asmara@advisory-partner.id',
    role: 'partner',
    title: 'Senior Financial Advisory Partner & Former Corporate CFO',
    cpaLicense: 'AK.7821-CFO',
    variant: 'variant_b_advisory',
    targetPath: '/engagements/ENG-2026-01/advisory',
    description: 'A/B Variant B: Fokus Strategic Advisory, Diagnosa Biaya Membengkak, HPP Manufaktur & Simulasi What-If',
  },
  'FINOVA-BUNDA-TAX': {
    key: 'FINOVA-BUNDA-TAX',
    name: 'Bunda',
    email: 'bunda@pajak-kap.co.id',
    role: 'partner',
    title: 'Partner Kepatuhan Pajak & Audit Operasional',
    cpaLicense: 'BKP.9921',
    variant: 'variant_a_compliance',
    targetPath: '/engagements/ENG-2026-01/tax',
    description: 'A/B Variant A: Fokus Kepatuhan Pajak PPh 21 TER, Ekualisasi PPN 1111, dan Smart Payroll Importer',
  },
  'BUNDA-TAX': {
    key: 'BUNDA-TAX',
    name: 'Bunda',
    email: 'bunda@pajak-kap.co.id',
    role: 'partner',
    title: 'Partner Kepatuhan Pajak & Audit Operasional',
    cpaLicense: 'BKP.9921',
    variant: 'variant_a_compliance',
    targetPath: '/engagements/ENG-2026-01/tax',
    description: 'A/B Variant A: Fokus Kepatuhan Pajak PPh 21 TER, Ekualisasi PPN 1111, dan Smart Payroll Importer',
  },
  'FINOVA-MASTER-2026': {
    key: 'FINOVA-MASTER-2026',
    name: 'Haidar, CPA, CA',
    email: 'haidar@kaphaidar.co.id',
    role: 'partner',
    title: 'Managing Engagement Partner & Lead Auditor',
    cpaLicense: 'AP.0942',
    variant: 'variant_master',
    targetPath: '/engagements/ENG-2026-01/overview',
    description: 'A/B Master Mode: Akses Penuh ke Semua Modul dengan Live Switcher A/B Testing di Header',
  },
  'VIP-AUDIT': {
    key: 'VIP-AUDIT',
    name: 'Haidar, CPA, CA',
    email: 'haidar@kaphaidar.co.id',
    role: 'partner',
    title: 'Managing Engagement Partner & Lead Auditor',
    cpaLicense: 'AP.0942',
    variant: 'variant_master',
    targetPath: '/engagements/ENG-2026-01/overview',
    description: 'A/B Master Mode: Akses Penuh ke Semua Modul dengan Live Switcher A/B Testing di Header',
  },
};

export async function POST(req: NextRequest) {
  if (process.env.FINOVA_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const rawKey = (body.key || '').trim().toUpperCase();

    if (!rawKey) {
      return NextResponse.json(
        { error: 'Access Key wajib dimasukkan.' },
        { status: 400 }
      );
    }

    const config = VALID_ACCESS_KEYS[rawKey];

    if (!config) {
      return NextResponse.json({ error: 'Access Key tidak valid.' }, { status: 401 });
    }

    // Generate JWT token
    const token = await createSessionToken({
      userId: `USR-${config.role.toUpperCase()}-${config.key}`,
      email: config.email,
      role: config.role,
      name: config.name,
      title: config.title,
    });

    const res = NextResponse.json({
      success: true,
      accessKey: config.key,
      variant: config.variant,
      targetPath: config.targetPath,
      user: {
        name: config.name,
        email: config.email,
        role: config.role,
        title: config.title,
        cpaLicense: config.cpaLicense,
      },
    });

    // Set secure HttpOnly cookie
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days for test convenience
    });

    // Also set client readable cookie for active A/B variant
    res.cookies.set('finova_ab_variant', config.variant, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('finova_user_name', encodeURIComponent(config.name), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    console.error('Access key login error:', e);
    return NextResponse.json(
      { error: 'Terjadi kegagalan memproses Access Key.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (process.env.FINOVA_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  return NextResponse.json({
    keys: Object.values(VALID_ACCESS_KEYS).map((k) => ({
      key: k.key,
      name: k.name,
      variant: k.variant,
      targetPath: k.targetPath,
      description: k.description,
    })),
  });
}
