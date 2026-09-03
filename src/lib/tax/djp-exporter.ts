// FINOVA AI - Official DJP Tax Exporter (e-Bupot 21/26 & e-Faktur Pajak)
// Standards: Peraturan Direktur Jenderal Pajak PER-2/PJ/2024 & e-Faktur 4.0 (Delimiter Semicolon ';')

import { EmployeePayrollProfile, calculateMonthlyPph21 } from './pph21';
import { PpnMonthlyFiling } from './ppn-equalization';

export function generateEBupot21Csv(
  employees: EmployeePayrollProfile[],
  periodYear: string = '2025',
  masaPajak: string = '12' // 01 to 12
): string {
  // Official e-Bupot 21/26 Import Specification Header (DJP PER-2/PJ/2024)
  const headers = [
    'Masa_Pajak',
    'Tahun_Pajak',
    'Pembetulan',
    'NPWP_Pemotong',
    'NIK_Penerima',
    'Nama_Penerima',
    'Kode_Objek_Pajak',
    'Penghasilan_Bruto',
    'Tarif_Persen',
    'PPh_Dipotong',
    'Status_PTKP',
    'Metode_Pemotongan'
  ];

  const rows: string[] = [headers.join(';')];
  const npwpPemotong = '01.234.567.8-012.000'; // PT Nusantara Sukses Makmur

  employees.forEach((emp, idx) => {
    const calc = calculateMonthlyPph21(emp);
    const nik = `320104198${String(1000000 + idx)}`;
    const rowData = [
      masaPajak,
      periodYear,
      '0', // Pembetulan ke-0
      npwpPemotong,
      nik,
      emp.name.replace(/;/g, ' '), // sanitize delimiter
      '21-100-01', // Kode Objek Pajak Pegawai Tetap
      String(calc.grossIncomeIdr),
      String(calc.terRatePercent),
      String(calc.monthlyPph21Idr),
      emp.ptkpStatus,
      'TER_BULANAN'
    ];
    rows.push(rowData.join(';'));
  });

  return rows.join('\r\n');
}

export function generateEFakturPpnCsv(
  filings: PpnMonthlyFiling[],
  periodYear: string = '2025'
): string {
  // Official e-Faktur DJP 3.0 / 4.0 Specification Header (Pajak Keluaran / FK)
  const headers = [
    'FK',
    'KD_JENIS_TRANSAKSI',
    'FG_PENGGANTI',
    'NOMOR_FAKTUR',
    'MASA_PAJAK',
    'TAHUN_PAJAK',
    'TANGGAL_FAKTUR',
    'NPWP',
    'NAMA',
    'ALAMAT_LENGKAP',
    'JUMLAH_DPP',
    'JUMLAH_PPN',
    'JUMLAH_PPNBM',
    'ID_KETERANGAN_TAMBAHAN',
    'FG_UANG_MUKA',
    'UANG_MUKA_DPP',
    'UANG_MUKA_PPN',
    'REFERENSI'
  ];

  const rows: string[] = [headers.join(';')];

  filings.forEach((f, idx) => {
    const noFaktur = `010.001-${periodYear.slice(-2)}.${String(78290000 + idx).padStart(8, '0')}`;
    const tanggal = `28/${String(f.periodMonth).padStart(2, '0')}/${periodYear}`;
    const npwpLawan = `02.456.789.0-${String(100 + idx)}.000`;
    const namaLawan = `Mitra Distribusi Nusantara Sektor ${f.monthName}`;

    const rowData = [
      'FK',
      '01', // Penyerahan Dalam Negeri
      '0',  // Normal
      noFaktur,
      String(f.periodMonth),
      periodYear,
      tanggal,
      npwpLawan,
      namaLawan,
      'Jl. Industri Jababeka Blok B No. 42 Cikarang',
      String(f.dppPenyerahanDalamNegeriIdr),
      String(f.ppnKeluaranIdr),
      '0', // PPNBM
      '0',
      '0',
      '0',
      '0',
      `Penjualan Batch ${f.monthName}`
    ];
    rows.push(rowData.join(';'));
  });

  return rows.join('\r\n');
}
