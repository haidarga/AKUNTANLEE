// FINOVA Deterministic Tax Engine — PPN (Pajak Pertambahan Nilai) Reconciliation
// Regulation: UU HPP No. 7 Tahun 2021 Pasal 7 ayat 1
// Effective Date: 2022-04-01 (11% statutory VAT rate)

export interface FakturPajakItem {
  fakturNumber: string;
  transactionDate: string;
  counterpartyName: string;
  counterpartyNpwp: string;
  dppAmountIdr: number;
  ppnReportedIdr: number;
  type: 'keluaran' | 'masukan';
  isCreditable: boolean; // For Pajak Masukan (Pasal 9 ayat 8)
  discrepancyNote?: string;
}

export interface PpnReconciliationResult {
  totalDppKeluaranIdr: number;
  totalPpnKeluaranIdr: number;
  totalDppMasukanIdr: number;
  totalPpnMasukanCreditableIdr: number;
  totalPpnMasukanNonCreditableIdr: number;
  netPpnPositionIdr: number; // positive = Kurang Bayar (payable), negative = Lebih Bayar (restitution/compensation)
  positionType: 'kurang_bayar' | 'lebih_bayar' | 'nihil';
  anomaliesDetected: {
    fakturNumber: string;
    issue: string;
    expectedPpnIdr: number;
    differenceIdr: number;
  }[];
  ruleId: string;
  sourceRegulation: string;
  effectiveDate: string;
}

export function reconcilePpn(fakturs: FakturPajakItem[]): PpnReconciliationResult {
  let totalDppKeluaranIdr = 0;
  let totalPpnKeluaranIdr = 0;
  let totalDppMasukanIdr = 0;
  let totalPpnMasukanCreditableIdr = 0;
  let totalPpnMasukanNonCreditableIdr = 0;

  const anomalies: PpnReconciliationResult['anomaliesDetected'] = [];

  for (const fp of fakturs) {
    const expectedPpn = Math.round(fp.dppAmountIdr * 0.11);
    const diff = Math.abs(fp.ppnReportedIdr - expectedPpn);
    if (diff > 100) { // Discrepancy beyond rounding tolerance
      anomalies.push({
        fakturNumber: fp.fakturNumber,
        issue: `Ketidaksesuaian perhitungan tarif PPN 11% (Dihitung: Rp ${fp.ppnReportedIdr.toLocaleString('id-ID')}, Seharusnya: Rp ${expectedPpn.toLocaleString('id-ID')})`,
        expectedPpnIdr: expectedPpn,
        differenceIdr: diff,
      });
    }

    if (fp.type === 'keluaran') {
      totalDppKeluaranIdr += fp.dppAmountIdr;
      totalPpnKeluaranIdr += fp.ppnReportedIdr;
    } else {
      totalDppMasukanIdr += fp.dppAmountIdr;
      if (fp.isCreditable) {
        totalPpnMasukanCreditableIdr += fp.ppnReportedIdr;
      } else {
        totalPpnMasukanNonCreditableIdr += fp.ppnReportedIdr;
      }
    }
  }

  const netPpnPositionIdr = totalPpnKeluaranIdr - totalPpnMasukanCreditableIdr;
  let positionType: PpnReconciliationResult['positionType'] = 'nihil';
  if (netPpnPositionIdr > 0) positionType = 'kurang_bayar';
  else if (netPpnPositionIdr < 0) positionType = 'lebih_bayar';

  return {
    totalDppKeluaranIdr,
    totalPpnKeluaranIdr,
    totalDppMasukanIdr,
    totalPpnMasukanCreditableIdr,
    totalPpnMasukanNonCreditableIdr,
    netPpnPositionIdr,
    positionType,
    anomaliesDetected: anomalies,
    ruleId: 'RULE-PPN-RECON-11PCT-2022',
    sourceRegulation: 'UU No. 7 Tahun 2021 (Harmonisasi Peraturan Perpajakan) Bab VI Pasal 7 ayat 1',
    effectiveDate: '2022-04-01',
  };
}
