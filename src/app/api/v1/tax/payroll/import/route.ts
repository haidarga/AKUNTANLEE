import { NextResponse } from 'next/server';
import { parseAndImportPayrollRows } from '@/lib/tax/smart-payroll-importer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { headers, rows, customMapping } = body;

    if (!headers || !rows) {
      return NextResponse.json(
        { success: false, error: 'Headers and rows are required' },
        { status: 400 }
      );
    }

    const result = parseAndImportPayrollRows(headers, rows, customMapping);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
