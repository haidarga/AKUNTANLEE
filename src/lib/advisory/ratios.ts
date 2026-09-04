// FINOVA AI - Financial Ratio & Health Diagnostics Engine (Consultant-Grade Analytics)

export interface FinancialRatioMetric {
  id: string;
  category: 'Likuiditas' | 'Solvabilitas' | 'Profitabilitas' | 'Efisiensi';
  name: string;
  formula: string;
  value: number;
  unit: 'x' | '%' | 'hari';
  benchmarkRange: string;
  status: 'PRIME' | 'ADEQUATE' | 'WATCHLIST';
  interpretation: string;
  recommendation: string;
}

export interface FinancialHealthScorecard {
  overallHealthScore: number; // 0 - 100
  ratingGrade: 'AAA (Sangat Prima)' | 'AA (Kuat & Stabil)' | 'BBB (Waspada Efisiensi)' | 'C (Kritis)';
  metrics: FinancialRatioMetric[];
  summaryNarrative: string;
}

export function calculateFinancialRatios(params: {
  clientName?: string;
  industry?: string;
  currentAssetsIdr: number;
  inventoryIdr: number;
  cashAndEquivalentsIdr: number;
  currentLiabilitiesIdr: number;
  totalLiabilitiesIdr: number;
  totalEquityIdr: number;
  totalAssetsIdr: number;
  revenueIdr: number;
  grossProfitIdr: number;
  operatingProfitIdr: number;
  netProfitIdr: number;
}): FinancialHealthScorecard {
  const {
    clientName = 'Entitas klien',
    industry,
    currentAssetsIdr,
    inventoryIdr,
    cashAndEquivalentsIdr,
    currentLiabilitiesIdr,
    totalLiabilitiesIdr,
    totalEquityIdr,
    totalAssetsIdr,
    revenueIdr,
    grossProfitIdr,
    operatingProfitIdr,
    netProfitIdr,
  } = params;

  // 1. Likuiditas
  const currentRatio = currentLiabilitiesIdr > 0 ? currentAssetsIdr / currentLiabilitiesIdr : 0;
  const quickRatio = currentLiabilitiesIdr > 0 ? (currentAssetsIdr - inventoryIdr) / currentLiabilitiesIdr : 0;
  const cashRatio = currentLiabilitiesIdr > 0 ? cashAndEquivalentsIdr / currentLiabilitiesIdr : 0;

  // 2. Solvabilitas
  const der = totalEquityIdr > 0 ? (totalLiabilitiesIdr / totalEquityIdr) * 100 : 0;
  const dar = totalAssetsIdr > 0 ? (totalLiabilitiesIdr / totalAssetsIdr) * 100 : 0;

  // 3. Profitabilitas
  const gpm = revenueIdr > 0 ? (grossProfitIdr / revenueIdr) * 100 : 0;
  const opm = revenueIdr > 0 ? (operatingProfitIdr / revenueIdr) * 100 : 0;
  const npm = revenueIdr > 0 ? (netProfitIdr / revenueIdr) * 100 : 0;
  const roa = totalAssetsIdr > 0 ? (netProfitIdr / totalAssetsIdr) * 100 : 0;
  const roe = totalEquityIdr > 0 ? (netProfitIdr / totalEquityIdr) * 100 : 0;

  const metrics: FinancialRatioMetric[] = [
    {
      id: 'RATIO-CR',
      category: 'Likuiditas',
      name: 'Current Ratio (Rasio Lancar)',
      formula: 'Aset Lancar / Liabilitas Lancar',
      value: Number(currentRatio.toFixed(2)),
      unit: 'x',
      benchmarkRange: '1.50x - 2.50x',
      status: currentRatio >= 1.5 ? 'PRIME' : currentRatio >= 1.0 ? 'ADEQUATE' : 'WATCHLIST',
      interpretation: currentRatio >= 1.5
        ? 'Perusahaan memiliki bantalan likuiditas kas dan piutang yang aman untuk menutup utang jatuh tempo.'
        : 'Kemampuan membayar kewajiban jangka pendek berada pada level minimum toleransi.',
      recommendation: currentRatio >= 1.5
        ? 'Pertahankan manajemen kas, surplus likuiditas dapat dioptimalkan ke instrumen pasar uang berimbal hasil tinggi.'
        : 'Percepat penagihan piutang dan evaluasi ulang termin pembayaran kepada pemasok.',
    },
    {
      id: 'RATIO-QR',
      category: 'Likuiditas',
      name: 'Quick Ratio (Rasio Cepat)',
      formula: '(Aset Lancar - Persediaan) / Liabilitas Lancar',
      value: Number(quickRatio.toFixed(2)),
      unit: 'x',
      benchmarkRange: '> 1.00x',
      status: quickRatio >= 1.0 ? 'PRIME' : quickRatio >= 0.8 ? 'ADEQUATE' : 'WATCHLIST',
      interpretation: quickRatio >= 1.0
        ? 'Aset yang paling likuid cukup untuk melunasi seluruh utang lancar tanpa bergantung pada konversi persediaan.'
        : 'Ketergantungan terhadap konversi persediaan menjadi uang tunai cukup tinggi.',
      recommendation: 'Jaga siklus konversi kas dan sesuaikan tingkat persediaan dengan kebutuhan operasional.',
    },
    {
      id: 'RATIO-DER',
      category: 'Solvabilitas',
      name: 'Debt to Equity Ratio (DER)',
      formula: 'Total Liabilitas / Total Ekuitas',
      value: Number(der.toFixed(1)),
      unit: '%',
      benchmarkRange: '< 100% (Maksimal 150%)',
      status: der <= 80 ? 'PRIME' : der <= 150 ? 'ADEQUATE' : 'WATCHLIST',
      interpretation: `Rasio leverage berada pada ${der.toFixed(1)}%. Struktur modal didominasi oleh permodalan sendiri (ekuitas), meminimalkan risiko kepailitan.`,
      recommendation: 'Evaluasi kapasitas pendanaan secara berkala dan selaraskan fasilitas kredit dengan kebutuhan ekspansi perusahaan.',
    },
    {
      id: 'RATIO-GPM',
      category: 'Profitabilitas',
      name: 'Gross Profit Margin (Margin Laba Kotor)',
      formula: '(Laba Kotor / Pendapatan) x 100%',
      value: Number(gpm.toFixed(1)),
      unit: '%',
      benchmarkRange: '25.0% - 40.0%',
      status: gpm >= 28 ? 'PRIME' : gpm >= 20 ? 'ADEQUATE' : 'WATCHLIST',
      interpretation: `Margin laba kotor sebesar ${gpm.toFixed(1)}% mencerminkan efisiensi penetapan harga jual dan pengendalian biaya langsung/HPP yang prima.`,
      recommendation: 'Tinjau harga jual dan biaya langsung secara berkala untuk melindungi margin kotor.',
    },
    {
      id: 'RATIO-NPM',
      category: 'Profitabilitas',
      name: 'Net Profit Margin (Margin Laba Bersih)',
      formula: '(Laba Bersih / Pendapatan) x 100%',
      value: Number(npm.toFixed(1)),
      unit: '%',
      benchmarkRange: '5.0% - 15.0%',
      status: npm >= 8 ? 'PRIME' : npm >= 4 ? 'ADEQUATE' : 'WATCHLIST',
      interpretation: `Margin laba bersih sebesar ${npm.toFixed(1)}% menunjukkan porsi laba yang tersisa setelah seluruh beban. Bandingkan dengan benchmark ${industry ? `industri ${industry}` : 'industri yang relevan'} sebelum mengambil keputusan strategis.`,
      recommendation: 'Teruskan program efisiensi beban operasional dan automasi pembukuan guna mempertahankan marjin dua digit.',
    },
    {
      id: 'RATIO-ROE',
      category: 'Profitabilitas',
      name: 'Return on Equity (ROE)',
      formula: '(Laba Bersih / Total Ekuitas) x 100%',
      value: Number(roe.toFixed(1)),
      unit: '%',
      benchmarkRange: '> 15.0%',
      status: roe >= 15 ? 'PRIME' : roe >= 10 ? 'ADEQUATE' : 'WATCHLIST',
      interpretation: `Tingkat pengembalian atas modal pemegang saham sebesar ${roe.toFixed(1)}% per tahun, menandakan modal dikelola dengan sangat produktif.`,
      recommendation: 'Sangat menarik bagi calon investor perbankan atau mitra strategis pemegang saham.',
    },
  ];

  const primeCount = metrics.filter((m) => m.status === 'PRIME').length;
  const adequateCount = metrics.filter((m) => m.status === 'ADEQUATE').length;
  const score = Math.round((primeCount * 100 + adequateCount * 70) / metrics.length);

  return {
    overallHealthScore: score,
    ratingGrade: score >= 85 ? 'AAA (Sangat Prima)' : score >= 70 ? 'AA (Kuat & Stabil)' : 'BBB (Waspada Efisiensi)',
    metrics,
    summaryNarrative: `Profil fundamental ${clientName} berada pada kondisi ${score >= 85 ? 'Sangat Prima (AAA)' : 'Stabil (AA)'} dengan skor kesehatan ${score}/100. Current Ratio tercatat ${currentRatio.toFixed(2)}x dan marjin laba bersih ${npm.toFixed(1)}%; keduanya perlu dibaca bersama karakteristik ${industry ? `industri ${industry}` : 'industri klien'}.`,
  };
}
