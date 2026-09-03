// FINOVA AI Workpaper Engine — Account Mapping & Normalization
// Complies with Section 9 of PRD: TB / GL -> normalize -> map -> review queue -> overrides

import { AccountCategory } from '@/types/domain';

export interface StandardLeadSchedule {
  code: string;
  title: string;
  category: AccountCategory;
  typicalPrefixes: string[];
  keywords: string[];
}

export const STANDARD_LEAD_SCHEDULES: StandardLeadSchedule[] = [
  {
    code: 'A.1',
    title: 'Kas & Setara Kas',
    category: 'asset',
    typicalPrefixes: ['10', '110', '111', '101', '102'],
    keywords: ['kas', 'bank', 'petty cash', 'giro', 'cash'],
  },
  {
    code: 'A.2',
    title: 'Piutang Usaha & Piutang Lainnya',
    category: 'asset',
    typicalPrefixes: ['112', '113', '120', '12'],
    keywords: ['piutang', 'receivable', 'tagihan', 'wesel tagih'],
  },
  {
    code: 'A.3',
    title: 'Persediaan (Inventory)',
    category: 'asset',
    typicalPrefixes: ['114', '115', '130', '13'],
    keywords: ['persediaan', 'inventory', 'barang jadi', 'bahan baku', 'work in process'],
  },
  {
    code: 'A.4',
    title: 'Uang Muka & Biaya Dibayar di Muka',
    category: 'asset',
    typicalPrefixes: ['116', '117', '140', '14'],
    keywords: ['dibayar di muka', 'prepaid', 'uang muka', 'pajak dibayar di muka'],
  },
  {
    code: 'B.1',
    title: 'Aset Tetap & Akumulasi Penyusutan',
    category: 'asset',
    typicalPrefixes: ['120', '150', '15', '16'],
    keywords: ['aset tetap', 'fixed asset', 'tanah', 'bangunan', 'mesin', 'kendaraan', 'akumulasi penyusutan'],
  },
  {
    code: 'C.1',
    title: 'Liabilitas Jangka Pendek & Utang Usaha',
    category: 'liability',
    typicalPrefixes: ['20', '210', '211', '21'],
    keywords: ['utang usaha', 'accounts payable', 'utang dagang', 'beban akrual', 'accrued'],
  },
  {
    code: 'C.2',
    title: 'Utang Pajak (PPh & PPN)',
    category: 'liability',
    typicalPrefixes: ['213', '220', '22'],
    keywords: ['utang pph', 'utang pajak', 'ppn keluaran', 'pph 21', 'pph 23', 'pph 25', 'pph 29'],
  },
  {
    code: 'C.3',
    title: 'Liabilitas Jangka Panjang',
    category: 'liability',
    typicalPrefixes: ['25', '26'],
    keywords: ['utang bank', 'pinjaman jangka panjang', 'imbalan pascakerja', 'liabilitas sewa'],
  },
  {
    code: 'D.1',
    title: 'Ekuitas & Saldo Laba',
    category: 'equity',
    typicalPrefixes: ['30', '31', '32'],
    keywords: ['modal saham', 'share capital', 'saldo laba', 'retained earnings', 'dividen', 'agio'],
  },
  {
    code: 'E.1',
    title: 'Pendapatan Usaha (Revenue)',
    category: 'revenue',
    typicalPrefixes: ['40', '41'],
    keywords: ['penjualan', 'pendapatan', 'revenue', 'sales', 'jasa'],
  },
  {
    code: 'E.2',
    title: 'Beban Pokok Pendapatan (COGS)',
    category: 'cogs',
    typicalPrefixes: ['50', '51'],
    keywords: ['beban pokok', 'cogs', 'cost of goods', 'hpp', 'pembelian bahan'],
  },
  {
    code: 'F.1',
    title: 'Beban Operasional & Administrasi (OPEX)',
    category: 'operating_expense',
    typicalPrefixes: ['60', '61', '62'],
    keywords: ['beban gaji', 'beban sewa', 'listrik', 'pemasaran', 'entertain', 'operasional', 'biaya'],
  },
  {
    code: 'F.2',
    title: 'Pendapatan / Beban Lain-lain',
    category: 'other_income_expense',
    typicalPrefixes: ['70', '71', '72'],
    keywords: ['bunga bank', 'selisih kurs', 'pendapatan lain', 'biaya administrasi bank'],
  },
  {
    code: 'F.3',
    title: 'Beban Pajak Penghasilan (Tax Expense)',
    category: 'tax_expense',
    typicalPrefixes: ['80', '81'],
    keywords: ['beban pph kini', 'beban pph tangguhan', 'pajak penghasilan badan'],
  },
];

export interface RawAccountInput {
  code: string;
  name: string;
  beginningBalanceIdr: number;
  debitIdr: number;
  creditIdr: number;
  endingBalanceIdr: number;
  priorYearBalanceIdr: number;
}

export interface MappingSuggestionResult {
  sourceAccountCode: string;
  sourceAccountName: string;
  standardWorkpaperSection: string;
  category: AccountCategory;
  confidenceScore: number;
  rationale: string;
  isAmbiguous: boolean;
}

export function suggestAccountMapping(account: RawAccountInput): MappingSuggestionResult {
  const cleanName = account.name.toLowerCase();
  const cleanCode = account.code.trim();

  // Check for known ambiguous / suspense keywords
  const isSuspiciousSuspense =
    cleanName.includes('suspense') ||
    cleanName.includes('penampungan') ||
    cleanName.includes('sementara') ||
    cleanName.includes('clearing') ||
    cleanName.includes('tidak dikenal') ||
    cleanName.includes('selisih pembukuan');

  if (isSuspiciousSuspense) {
    return {
      sourceAccountCode: account.code,
      sourceAccountName: account.name,
      standardWorkpaperSection: 'C.1',
      category: 'liability',
      confidenceScore: 0.35,
      rationale: 'Akun penampungan/suspense terdeteksi. Wajib diverifikasi oleh Senior Auditor.',
      isAmbiguous: true,
    };
  }

  let bestMatch: StandardLeadSchedule | null = null;
  let highestScore = 0;
  let matchRationale = '';

  for (const schedule of STANDARD_LEAD_SCHEDULES) {
    let score = 0;
    const reasons: string[] = [];

    // Prefix match
    for (const prefix of schedule.typicalPrefixes) {
      if (cleanCode.startsWith(prefix)) {
        score += 0.55;
        reasons.push(`Prefiks akun (${prefix}) cocok dengan kelompok ${schedule.title}`);
        break;
      }
    }

    // Keyword match
    for (const kw of schedule.keywords) {
      if (cleanName.includes(kw)) {
        score += 0.40;
        reasons.push(`Nama akun mengandung kata kunci "${kw}"`);
        break;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = schedule;
      matchRationale = reasons.join('; ');
    }
  }

  if (!bestMatch || highestScore < 0.50) {
    return {
      sourceAccountCode: account.code,
      sourceAccountName: account.name,
      standardWorkpaperSection: 'F.1',
      category: 'operating_expense',
      confidenceScore: Math.max(0.40, highestScore),
      rationale: matchRationale || 'Pola nama dan nomor akun tidak memiliki kemiripan kuat dengan standar COA.',
      isAmbiguous: true,
    };
  }

  return {
    sourceAccountCode: account.code,
    sourceAccountName: account.name,
    standardWorkpaperSection: bestMatch.code,
    category: bestMatch.category,
    confidenceScore: Math.min(0.98, highestScore),
    rationale: matchRationale,
    isAmbiguous: highestScore < 0.75,
  };
}
