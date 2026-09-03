// FINOVA AI - Indonesian Corporate Fiscal Reconciliation (Rekonsiliasi Fiskal SPT Tahunan Badan 1771)
// Jembatan Laba Bersih Komersial ke Penghasilan Kena Pajak (PKP) & Estimasi PPh Badan (Tarif 22% & Fasilitas Ps 31E)

export interface FiscalCorrectionItem {
  id: string;
  type: 'positif' | 'negatif';
  accountCode: string;
  accountName: string;
  amountIdr: number;
  taxLawBasis: string;
  rationale: string;
}

export interface CorporateTaxReconciliationReport {
  commercialNetProfitBeforeTaxIdr: number; // Laba Komersial
  positiveCorrections: FiscalCorrectionItem[];
  negativeCorrections: FiscalCorrectionItem[];
  totalPositiveCorrectionIdr: number;
  totalNegativeCorrectionIdr: number;
  fiscalTaxableIncomeIdr: number; // PKP (Penghasilan Kena Pajak)
  taxRatePercent: number; // 22%
  hasArticle31EFacility: boolean; // Fasilitas diskon 50% untuk omset s.d 50 M
  effectiveTaxAmountIdr: number;
  taxCreditsIdr: {
    pph22Idr: number;
    pph23Idr: number;
    pph25InstallmentsIdr: number;
    totalTaxCreditsIdr: number;
  };
  underpaymentArticle29Idr: number; // PPh Pasal 29 (Kurang Bayar)
  effectiveTaxRatePercent: number; // Effective Tax Rate (ETR)
}

export function calculateCorporateFiscalReconciliation(
  commercialNetProfitBeforeTaxIdr: number,
  annualTurnoverIdr: number
): CorporateTaxReconciliationReport {
  const positiveCorrections: FiscalCorrectionItem[] = [
    {
      id: 'FISC-POS-01',
      type: 'positif',
      accountCode: '6120-00',
      accountName: 'Biaya Jamuan & Representasi Tanpa Daftar Nominatif',
      amountIdr: 85_000_000,
      taxLawBasis: 'Pasal 9 ayat 1c UU PPh & PMK-02/PMK.03/2010',
      rationale: 'Pengeluaran entertainment tidak disertai bukti daftar nominatif penerima manfaat, sehingga tidak dapat menjadi pengurang penghasilan bruto.',
    },
    {
      id: 'FISC-POS-02',
      type: 'positif',
      accountCode: '6130-00',
      accountName: 'Sanksi Administrasi & Bunga Pajak (STP)',
      amountIdr: 24_500_000,
      taxLawBasis: 'Pasal 9 ayat 1k UU PPh',
      rationale: 'Sanksi administrasi berupa bunga/denda pajak merupakan non-deductible expense secara mutlak.',
    },
    {
      id: 'FISC-POS-03',
      type: 'positif',
      accountCode: '6140-00',
      accountName: 'Sumbangan Non-Regulasi Bencana Nasional',
      amountIdr: 45_000_000,
      taxLawBasis: 'PP 93 Tahun 2010',
      rationale: 'Sumbangan sosial sukarela di luar koridor Peraturan Pemerintah tidak diakui secara fiskal.',
    },
  ];

  const negativeCorrections: FiscalCorrectionItem[] = [
    {
      id: 'FISC-NEG-01',
      type: 'negatif',
      accountCode: '7110-00',
      accountName: 'Pendapatan Bunga Deposito Bank (Dikenakan PPh Final)',
      amountIdr: 65_000_000,
      taxLawBasis: 'Pasal 4 ayat 2 UU PPh & PP 131/2000',
      rationale: 'Telah dipotong PPh Final 20% oleh bank, sehingga dikeluarkan dari penghasilan kena pajak badan agar tidak terjadi pemajakan ganda.',
    },
  ];

  const totalPos = positiveCorrections.reduce((s, c) => s + c.amountIdr, 0);
  const totalNeg = negativeCorrections.reduce((s, c) => s + c.amountIdr, 0);

  const pkp = Math.max(0, commercialNetProfitBeforeTaxIdr + totalPos - totalNeg);

  // Fasilitas Pasal 31E UU PPh:
  // Wajib Pajak Badan dengan peredaran bruto s.d Rp 50 M mendapat fasilitas pengurangan tarif 50%
  // atas PKP dari bagian peredaran bruto s.d Rp 4.8 Milyar.
  let taxAmount = 0;
  const has31E = annualTurnoverIdr <= 50_000_000_000;

  if (has31E) {
    const proporsiFasilitas = Math.min(1, 4_800_000_000 / annualTurnoverIdr);
    const pkpFasilitas = Math.round(pkp * proporsiFasilitas);
    const pkpNonFasilitas = pkp - pkpFasilitas;

    const pajakFasilitas = Math.round(pkpFasilitas * 0.11); // 50% x 22% = 11%
    const pajakNonFasilitas = Math.round(pkpNonFasilitas * 0.22); // 22%
    taxAmount = pajakFasilitas + pajakNonFasilitas;
  } else {
    taxAmount = Math.round(pkp * 0.22);
  }

  // Pre-paid Taxes (Kredit Pajak)
  const pph22 = 60_000_000; // Impor / Pembelian BUMN
  const pph23 = 110_000_000; // Jasa & Sewa
  const pph25 = 480_000_000; // Angsuran PPh 25 bulanan (12 x Rp 40jt)
  const totalCredits = pph22 + pph23 + pph25;

  const underpayment = Math.max(0, taxAmount - totalCredits);
  const etr = commercialNetProfitBeforeTaxIdr > 0 ? (taxAmount / commercialNetProfitBeforeTaxIdr) * 100 : 0;

  return {
    commercialNetProfitBeforeTaxIdr,
    positiveCorrections,
    negativeCorrections,
    totalPositiveCorrectionIdr: totalPos,
    totalNegativeCorrectionIdr: totalNeg,
    fiscalTaxableIncomeIdr: pkp,
    taxRatePercent: 22,
    hasArticle31EFacility: has31E,
    effectiveTaxAmountIdr: taxAmount,
    taxCreditsIdr: {
      pph22Idr: pph22,
      pph23Idr: pph23,
      pph25InstallmentsIdr: pph25,
      totalTaxCreditsIdr: totalCredits,
    },
    underpaymentArticle29Idr: underpayment,
    effectiveTaxRatePercent: Number(etr.toFixed(2)),
  };
}
