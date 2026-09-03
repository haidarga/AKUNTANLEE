import { NextResponse } from 'next/server';
import { DEFAULT_COMPANY_EMPLOYEES } from '@/lib/tax/pph21';
import { generateEBupot21Csv } from '@/lib/tax/djp-exporter';

export async function GET(request: Request) {
  try {
    const csvContent = generateEBupot21Csv(DEFAULT_COMPANY_EMPLOYEES, '2026', '12');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="DJP_eBupot_PPh21_Masa_FY2026.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
