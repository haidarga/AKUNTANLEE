// FINOVA Standards & Compliance Layer — Verified Indonesian Accounting & Tax Corpus
// In compliance with PRD Section 11: citations must resolve to verified source records.

export interface StandardCorpusRecord {
  id: string;
  category: 'accounting' | 'auditing' | 'tax_regulation' | 'firm_sop';
  code: string;
  title: string;
  governingBody: string;
  effectiveDate: string;
  status: 'active' | 'superseded';
  relevantParagraphs: {
    reference: string;
    summary: string;
    applicableWorkpaperType: string[];
  }[];
  officialSourceUrl?: string;
  provenance: 'verified_official_corpus' | 'firm_internal_methodology';
}

export const VERIFIED_STANDARDS_CORPUS: StandardCorpusRecord[] = [
  {
    id: 'STD-PSAK-1',
    category: 'accounting',
    code: 'PSAK 1 / SAK 1',
    title: 'Penyajian Laporan Keuangan (Presentation of Financial Statements)',
    governingBody: 'Dewan Standar Akuntansi Keuangan - Ikatan Akuntan Indonesia (DSAK IAI)',
    effectiveDate: '2015-01-01',
    status: 'active',
    provenance: 'verified_official_corpus',
    relevantParagraphs: [
      {
        reference: 'PSAK 1 Paragraf 10',
        summary: 'Komponen lengkap laporan keuangan meliputi laporan posisi keuangan, laporan laba rugi dan penghasilan komprehensif lain, laporan perubahan ekuitas, laporan arus kas, dan catatan atas laporan keuangan.',
        applicableWorkpaperType: ['balance_sheet', 'income_statement', 'trial_balance'],
      },
      {
        reference: 'PSAK 1 Paragraf 15',
        summary: 'Penyajian Wajar dan Kepatuhan terhadap SAK. Entitas membuat pernyataan eksplisit tentang kepatuhan dalam CALK.',
        applicableWorkpaperType: ['audit_opinion', 'workpaper_lead'],
      },
      {
        reference: 'PSAK 1 Paragraf 27',
        summary: 'Entitas menyusun laporan keuangan atas dasar akrual, kecuali laporan arus kas.',
        applicableWorkpaperType: ['general_ledger', 'trial_balance'],
      },
    ],
  },
  {
    id: 'STD-SA-520',
    category: 'auditing',
    code: 'SPAP SA 520',
    title: 'Prosedur Analitis (Analytical Procedures in Auditing)',
    governingBody: 'Institut Akuntan Publik Indonesia (IAPI)',
    effectiveDate: '2013-01-01',
    status: 'active',
    provenance: 'verified_official_corpus',
    relevantParagraphs: [
      {
        reference: 'SA 520 Paragraf 5',
        summary: 'Auditor harus merancang dan melaksanakan prosedur analitis substantif untuk mengevaluasi kewajaran saldo akun dan fluktuasi yang tidak biasa.',
        applicableWorkpaperType: ['variance_analysis', 'analytical_review', 'lead_schedule'],
      },
      {
        reference: 'SA 520 Paragraf 7',
        summary: 'Penyelidikan atas hasil prosedur analitis: auditor harus meminta keterangan dari manajemen dan memperoleh bukti audit yang tepat jika fluktuasi melampaui ambang batas materialitas.',
        applicableWorkpaperType: ['variance_analysis', 'audit_finding'],
      },
    ],
  },
  {
    id: 'STD-SA-315',
    category: 'auditing',
    code: 'SPAP SA 315',
    title: 'Pengidentifikasian dan Penilaian Risiko Kesalahan Penyajian Material',
    governingBody: 'Institut Akuntan Publik Indonesia (IAPI)',
    effectiveDate: '2013-01-01',
    status: 'active',
    provenance: 'verified_official_corpus',
    relevantParagraphs: [
      {
        reference: 'SA 315 Paragraf 25',
        summary: 'Auditor wajib mengidentifikasi risiko signifikan terkait estimasi akuntansi, transaksi hubungan istimewa, dan transaksi tidak biasa.',
        applicableWorkpaperType: ['risk_assessment', 'gl_anomaly', 'audit_finding'],
      },
    ],
  },
  {
    id: 'STD-UU-HPP-2021',
    category: 'tax_regulation',
    code: 'UU HPP No. 7/2021',
    title: 'Undang-Undang Harmonisasi Peraturan Perpajakan',
    governingBody: 'Kementerian Keuangan Republik Indonesia / DJP',
    effectiveDate: '2021-10-29',
    status: 'active',
    provenance: 'verified_official_corpus',
    relevantParagraphs: [
      {
        reference: 'Pasal 17 ayat (1) huruf b',
        summary: 'Tarif Pajak Penghasilan yang diterapkan atas Penghasilan Kena Pajak bagi Wajib Pajak Badan dalam negeri dan bentuk usaha tetap adalah sebesar 22%.',
        applicableWorkpaperType: ['fiscal_reconciliation', 'corporate_tax'],
      },
      {
        reference: 'Pasal 7 ayat (1) PPN',
        summary: 'Tarif Pajak Pertambahan Nilai sebesar 11% yang mulai berlaku pada tanggal 1 April 2022.',
        applicableWorkpaperType: ['faktur_pajak', 'ppn_reconciliation'],
      },
    ],
  },
  {
    id: 'STD-PMK-168-2023',
    category: 'tax_regulation',
    code: 'PMK 168/2023 & PP 58/2023',
    title: 'Tarif Efektif Rata-Rata (TER) Pemotongan PPh Pasal 21',
    governingBody: 'Kementerian Keuangan Republik Indonesia',
    effectiveDate: '2024-01-01',
    status: 'active',
    provenance: 'verified_official_corpus',
    relevantParagraphs: [
      {
        reference: 'PP 58/2023 Pasal 2 & PMK 168/2023',
        summary: 'Penerapan Tarif Efektif Bulanan (Kategori A, B, C) untuk Masa Pajak Januari sampai dengan November, serta rekonsiliasi Pasal 17 pada Masa Pajak Desember.',
        applicableWorkpaperType: ['salary_slip', 'pph21_summary'],
      },
    ],
  },
  {
    id: 'STD-PMK-66-2023',
    category: 'tax_regulation',
    code: 'PMK 66/2023',
    title: 'Perlakuan PPh atas Penggantian/Imbalan dalam Bentuk Natura dan/atau Kenikmatan',
    governingBody: 'Kementerian Keuangan Republik Indonesia',
    effectiveDate: '2023-07-01',
    status: 'active',
    provenance: 'verified_official_corpus',
    relevantParagraphs: [
      {
        reference: 'PMK 66/2023 Pasal 3 & 4',
        summary: 'Biaya natura dan kenikmatan dapat dibiayakan secara fiskal (deductible) sepanjang berhubungan dengan kegiatan 3M (Mendapatkan, Menagih, Memelihara penghasilan), kecuali yang dikecualikan dari objek pajak bagi penerima.',
        applicableWorkpaperType: ['fiscal_reconciliation', 'operating_expenses'],
      },
    ],
  },
];

export function resolveStandardReference(standardCode: string): StandardCorpusRecord | undefined {
  return VERIFIED_STANDARDS_CORPUS.find(
    (s) => s.code.toLowerCase().includes(standardCode.toLowerCase()) || s.id.toLowerCase() === standardCode.toLowerCase()
  );
}
