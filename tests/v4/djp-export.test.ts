import { describe, it, expect } from 'vitest';
import { generateEBupot21Csv, generateEFakturPpnCsv } from '../../src/lib/tax/djp-exporter';
import { DEFAULT_COMPANY_EMPLOYEES } from '../../src/lib/tax/pph21';
import { generateDefaultPpnFilings } from '../../src/lib/tax/ppn-equalization';

describe('Official DJP CSV Exporters (e-Bupot 21 & e-Faktur Pajak)', () => {
  it('generates semicolon-delimited e-Bupot 21/26 CSV matching PER-2/PJ/2024 specifications', () => {
    const csv = generateEBupot21Csv(DEFAULT_COMPANY_EMPLOYEES, '2025', '12');
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(DEFAULT_COMPANY_EMPLOYEES.length + 1); // Header + data
    const headerCols = lines[0].split(';');
    expect(headerCols[0]).toBe('Masa_Pajak');
    expect(headerCols[3]).toBe('NPWP_Pemotong');
    expect(headerCols[6]).toBe('Kode_Objek_Pajak');

    const firstDataCols = lines[1].split(';');
    expect(firstDataCols[0]).toBe('12'); // Masa 12
    expect(firstDataCols[1]).toBe('2025');
    expect(firstDataCols[6]).toBe('21-100-01'); // Kode Objek Pajak Pegawai Tetap
    expect(Number(firstDataCols[7])).toBeGreaterThan(0); // Bruto
    expect(Number(firstDataCols[9])).toBeGreaterThan(0); // PPh dipotong
  });

  it('generates semicolon-delimited e-Faktur FK CSV matching DJP import standards', () => {
    const filings = generateDefaultPpnFilings(24_000_000_000);
    const csv = generateEFakturPpnCsv(filings, '2025');
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(filings.length + 1);
    const headerCols = lines[0].split(';');
    expect(headerCols[0]).toBe('FK');
    expect(headerCols[3]).toBe('NOMOR_FAKTUR');
    expect(headerCols[10]).toBe('JUMLAH_DPP');
    expect(headerCols[11]).toBe('JUMLAH_PPN');

    const firstRow = lines[1].split(';');
    expect(firstRow[0]).toBe('FK');
    expect(firstRow[1]).toBe('01'); // Kode Jenis Transaksi
    expect(Number(firstRow[10])).toBeGreaterThan(0); // DPP
    expect(Number(firstRow[11])).toBeGreaterThan(0); // PPN
  });
});
