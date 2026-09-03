// FINOVA AI Workpaper Engine — Tie-Out & Anomaly Engine
// Complies with Section 9.3 of PRD: TB vs FS vs WP tie-outs, variances, and GL flags

import { ValidationCheck } from '@/types/domain';
import { isSuspiciousRoundNumber } from '@/lib/currency';

export interface TieOutInputs {
  engagementId: string;
  materialityThresholdIdr: number;
  trialBalance: {
    totalDebitIdr: number;
    totalCreditIdr: number;
  };
  balanceSheet: {
    totalAssetsIdr: number;
    totalLiabilitiesIdr: number;
    totalEquityIdr: number;
  };
  incomeStatement: {
    netIncomeBeforeTaxIdr: number;
    taxExpenseIdr: number;
    netIncomeAfterTaxIdr: number;
  };
  retainedEarnings: {
    beginningIdr: number;
    dividendsPaidIdr: number;
    endingIdr: number;
  };
  journalEntries?: {
    id: string;
    journalNumber: string;
    date: string; // ISO date string
    description: string;
    amountIdr: number;
    createdBy: string;
  }[];
}

export function runTieOutAndValidationChecks(inputs: TieOutInputs): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Check 1: TB Debit == Credit
  const tbDiff = Math.abs(inputs.trialBalance.totalDebitIdr - inputs.trialBalance.totalCreditIdr);
  checks.push({
    id: 'CHK-TB-BALANCE',
    engagementId: inputs.engagementId,
    code: 'TIE-001',
    title: 'Keseimbangan Neraca Saldo (Trial Balance Debit vs Credit)',
    category: 'tie_out',
    severity: tbDiff === 0 ? 'info' : 'critical',
    description:
      tbDiff === 0
        ? 'Neraca Saldo seimbang secara sempurna (Total Debit = Total Kredit).'
        : `Ditemukan selisih pada Neraca Saldo sebesar Rp ${tbDiff.toLocaleString('id-ID')}. Total Debit tidak sama dengan Total Kredit.`,
    differenceIdr: tbDiff,
    sourceEvidenceIds: ['EVD-TB-SUM'],
    isCleared: tbDiff === 0,
  });

  // Check 2: Balance Sheet: Assets == Liabilities + Equity
  const totalLiabEquity = inputs.balanceSheet.totalLiabilitiesIdr + inputs.balanceSheet.totalEquityIdr;
  const bsDiff = Math.abs(inputs.balanceSheet.totalAssetsIdr - totalLiabEquity);
  checks.push({
    id: 'CHK-BS-BALANCE',
    engagementId: inputs.engagementId,
    code: 'TIE-002',
    title: 'Persamaan Akuntansi Neraca (Aset = Liabilitas + Ekuitas)',
    category: 'tie_out',
    severity: bsDiff === 0 ? 'info' : 'critical',
    description:
      bsDiff === 0
        ? 'Laporan Posisi Keuangan (Neraca) seimbang (Total Aset = Total Liabilitas + Ekuitas).'
        : `Ditemukan ketidakseimbangan Neraca sebesar Rp ${bsDiff.toLocaleString('id-ID')}.`,
    differenceIdr: bsDiff,
    sourceEvidenceIds: ['EVD-BS-SUM'],
    isCleared: bsDiff === 0,
  });

  // Check 3: Net Income Retained Earnings Roll-Forward
  const expectedEndingRE =
    inputs.retainedEarnings.beginningIdr +
    inputs.incomeStatement.netIncomeAfterTaxIdr -
    inputs.retainedEarnings.dividendsPaidIdr;
  const reDiff = Math.abs(inputs.retainedEarnings.endingIdr - expectedEndingRE);
  checks.push({
    id: 'CHK-RE-TIE',
    engagementId: inputs.engagementId,
    code: 'TIE-003',
    title: 'Rekonsiliasi Laba Bersih ke Saldo Laba (Retained Earnings Roll-forward)',
    category: 'tie_out',
    severity: reDiff === 0 ? 'info' : 'material',
    description:
      reDiff === 0
        ? 'Roll-forward Saldo Laba konsisten dengan Laba Bersih Tahun Berjalan dikurangi Dividen.'
        : `Selisih Saldo Laba sebesar Rp ${reDiff.toLocaleString('id-ID')} terhadap laba bersih setelah pajak.`,
    differenceIdr: reDiff,
    sourceEvidenceIds: ['EVD-RE-CALC'],
    isCleared: reDiff === 0,
  });

  // Check 4: GL Anomalies (Weekend journals & suspicious round numbers)
  if (inputs.journalEntries && inputs.journalEntries.length > 0) {
    for (const j of inputs.journalEntries) {
      // Check weekend entry
      const dateObj = new Date(j.date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        checks.push({
          id: `CHK-GL-WEEKEND-${j.id}`,
          engagementId: inputs.engagementId,
          code: 'ANOM-001',
          title: `Jurnal Buku Besar pada Hari Libur/Akhir Pekan (${j.journalNumber})`,
          category: 'gl_anomaly',
          severity: 'warning',
          description: `Jurnal nomor ${j.journalNumber} senilai Rp ${j.amountIdr.toLocaleString('id-ID')} dicatat pada hari Sabtu/Minggu (${j.date}) oleh user ${j.createdBy}. Keterangan: "${j.description}".`,
          differenceIdr: j.amountIdr,
          sourceEvidenceIds: [`EVD-GL-${j.id}`],
          isCleared: false,
        });
      }

      // Check suspicious round number >= 50M
      if (isSuspiciousRoundNumber(j.amountIdr) && j.amountIdr >= 50_000_000) {
        checks.push({
          id: `CHK-GL-ROUND-${j.id}`,
          engagementId: inputs.engagementId,
          code: 'ANOM-002',
          title: `Jurnal Nilai Bulat Signifikan (${j.journalNumber})`,
          category: 'gl_anomaly',
          severity: j.amountIdr >= inputs.materialityThresholdIdr ? 'material' : 'warning',
          description: `Jurnal dengan nominal bulat Rp ${j.amountIdr.toLocaleString('id-ID')} terdeteksi. Keterangan: "${j.description}". Perlu verifikasi memo pendukung.`,
          differenceIdr: j.amountIdr,
          sourceEvidenceIds: [`EVD-GL-${j.id}`],
          isCleared: false,
        });
      }
    }
  }

  return checks;
}
