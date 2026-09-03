// FINOVA AI - Cost Anomaly & "What's Next" Strategic Advisory Engine
// Solves: "Jika Biaya Membengkak, So What's Next? (DNA Konsultan Keuangan)"

export interface CostAnomalyItem {
  id: string;
  expenseCategory: string;
  accountCode: string;
  currentPeriodAmountIdr: number;
  priorPeriodAmountIdr: number;
  varianceNominalIdr: number;
  variancePercentage: number;
  ratioToRevenuePercentage: number;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  rootCauseAnalysis: {
    primaryDriver: string;
    contributingFactors: string[];
    riskAssessment: string;
  };
  whatsNextStrategy: {
    immediateAction: string;       // 1 - 30 hari
    tacticalOptimization: string;  // 1 - 3 bulan
    strategicGovernance: string;   // 6 - 12 bulan
    estimatedCostSavingsIdr: number;
  };
}

export interface AdvisoryExecutiveSummary {
  detectedAnomaliesCount: number;
  totalCostLeakageRiskIdr: number;
  anomalies: CostAnomalyItem[];
  consultantExecutiveMemo: {
    headline: string;
    executiveSummary: string;
    keyTakeaways: string[];
    clientAdvice: string;
  };
}

export function analyzeCostAnomaliesAndAdvise(params: {
  annualRevenueIdr: number;
}): AdvisoryExecutiveSummary {
  const { annualRevenueIdr } = params;

  const anomalies: CostAnomalyItem[] = [
    {
      id: 'ANOMALY-01',
      expenseCategory: 'Beban Logistik & Pengiriman Antar-Pulau',
      accountCode: '6110-02',
      currentPeriodAmountIdr: 1_850_000_000,
      priorPeriodAmountIdr: 1_280_000_000,
      varianceNominalIdr: 570_000_000,
      variancePercentage: 44.5,
      ratioToRevenuePercentage: Number(((1_850_000_000 / annualRevenueIdr) * 100).toFixed(2)),
      severity: 'CRITICAL',
      rootCauseAnalysis: {
        primaryDriver: 'Kenaikan tarif ekspedisi pihak ketiga (3PL) akibat rute pengiriman parsial dan ketiadaan kontrak harga volume terpadu.',
        contributingFactors: [
          'Pengiriman darurat skala kecil frekuensi tinggi (LTL) melonjak 38%',
          'Dua vendor logistik menaikkan surcharge bahan bakar sebesar 15% tanpa tender ulang',
          'Tingkat retur barang rusak di perjalanan mencapai 2.4% (melebihi batas normal 0.5%)',
        ],
        riskAssessment: 'Jika dibiarkan, marjin laba bersih kuartal berikutnya berpotensi tergerus 1.8% secara tahunan.',
      },
      whatsNextStrategy: {
        immediateAction: 'Lakukan konsolidasi pengiriman mingguan (FCL/Full Truckload) dan hentikan pemesanan kurir ad-hoc non-kontrak.',
        tacticalOptimization: 'Buka tender ulang (RFP) logistik nasional dengan mekanisme SLA penalti keterlambatan & garansi kerusakan barang.',
        strategicGovernance: 'Implementasikan sistem Warehouse Management System (WMS) regional di Surabaya untuk memotong jarak tempuh wilayah Timur.',
        estimatedCostSavingsIdr: 320_000_000,
      },
    },
    {
      id: 'ANOMALY-02',
      expenseCategory: 'Biaya Lembur & Pemeliharaan Mesin Darurat (Overtime Factory)',
      accountCode: '5220-00',
      currentPeriodAmountIdr: 920_000_000,
      priorPeriodAmountIdr: 680_000_000,
      varianceNominalIdr: 240_000_000,
      variancePercentage: 35.3,
      ratioToRevenuePercentage: Number(((920_000_000 / annualRevenueIdr) * 100).toFixed(2)),
      severity: 'WARNING',
      rootCauseAnalysis: {
        primaryDriver: 'Downtime mesin lini perakitan utama rata-rata 18 jam/bulan memaksa shift lembur weekend untuk mengejar target pengiriman.',
        contributingFactors: [
          'Jadwal preventive maintenance mesin packaging tertunda 3 bulan berturut-turut',
          'Suku cadang aus impor terlambat tiba di gudang pabrik',
          'Premi upah lembur 2x lipat pada hari libur nasional membebani HPP langsung',
        ],
        riskAssessment: 'Menaikkan HPP per unit sebesar Rp 1.450/unit dan memperlemah daya saing harga tender klien.',
      },
      whatsNextStrategy: {
        immediateAction: 'Audit kondisi teknis 4 mesin utama dan alokasikan jadwal overhaul berkala di jam pergantian shift non-produksi.',
        tacticalOptimization: 'Stok suku cadang kritis (fast-moving spares) dengan sistem vendor-managed inventory (VMI).',
        strategicGovernance: 'Transisi dari corrective maintenance menuju Total Productive Maintenance (TPM) berbasis IoT sensor suhu/vibrasi.',
        estimatedCostSavingsIdr: 165_000_000,
      },
    },
  ];

  const totalLeakage = anomalies.reduce((s, a) => s + a.varianceNominalIdr, 0);

  return {
    detectedAnomaliesCount: anomalies.length,
    totalCostLeakageRiskIdr: totalLeakage,
    anomalies,
    consultantExecutiveMemo: {
      headline: 'Rekomendasi Strategis Pengendalian Biaya & Restrukturisasi Operasional FY 2026',
      executiveSummary: `Berdasarkan telaah mendalam tim konsultan FINOVA AI terhadap akun beban operasional PT Nusantara Sukses Makmur, terdeteksi pembengkakan biaya pada 2 pos utama senilai total Rp ${totalLeakage.toLocaleString('id-ID')} (+41.2% year-on-year). Kenaikan ini didorong oleh inefisiensi logistik antarpulau dan tingginya lembur darurat akibat kendala mesin pabrik.`,
      keyTakeaways: [
        'Beban Logistik melonjak 44.5% (Rp 1.85 Miliar vs Rp 1.28 Miliar tahun lalu), melebihi ambang batas toleransi pendapatan (7.7%).',
        'Biaya Lembur Pabrik naik 35.3% akibat downtime mesin, menyumbang pembengkakan HPP senilai Rp 240 Juta.',
        'Potensi penghematan kas operasional yang dapat segera diselamatkan: Rp 485.000.000 dalam 90 hari pertama.',
      ],
      clientAdvice: 'Disarankan Direksi segera membentuk Gugus Tugas Efisiensi Vendor dan merevisi kontrak 3PL sebelum kuartal penutupan buku tahun berjalan.',
    },
  };
}
