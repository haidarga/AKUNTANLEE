import { NextResponse } from 'next/server';
import { generateDefaultPpnFilings } from '@/lib/tax/ppn-equalization';
import { generateEFakturPpnCsv } from '@/lib/tax/djp-exporter';

export async function GET(request: Request) {
  try {
    const filings = generateDefaultPpnFilings(52_400_000_000);
    const csvContent = generateEFakturPpnCsv(filings, '2026');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="DJP_eFaktur_PajakKeluaran_FY2026.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
