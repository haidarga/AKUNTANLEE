// FINOVA AI - Indonesian PPN Equalization Engine (Ekualisasi Omset SPT Masa 1111 vs Laba Rugi)
// Standar Kertas Kerja Pemeriksaan Pajak (Tax Audit / AR Equalization Workpaper)

export interface PpnMonthlyFiling {
  periodMonth: number; // 1 to 12
  monthName: string;
  dppPenyerahanDalamNegeriIdr: number;
  dppEksporIdr: number;
  dppTidakTerutangPpnIdr: number;
  totalDppPpnIdr: number;
  ppnKeluaranIdr: number; // 11%
  ppnMasukanDapatDikreditkanIdr: number;
  ppnKurangBayarIdr: number;
  statusSpt: 'Dilaporkan' | 'Siap Lapor';
}

export interface PpnEqualizationBridgeItem {
  id: string;
  category: 'tambah' | 'kurang';
  description: string;
  amountIdr: number;
  notes: string;
  regulationReference: string;
}

export interface PpnEqualizationReport {
  accountingRevenueIdr: number; // Peredaran Usaha di Laba Rugi Akun WP-F.1
  totalDppSptPpnIdr: number;    // Total DPP di 12 Masa SPT 1111
  rawDifferenceIdr: number;
  bridgeItems: PpnEqualizationBridgeItem[];
  explainedDifferenceIdr: number;
  unexplainedDifferenceIdr: number;
  isBalanced: boolean;
  taxAuditRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  auditRemarks: string;
}

// Generate default 12-month PPN filing for PT Nusantara Sukses Makmur
export function generateDefaultPpnFilings(annualAccountingTurnoverIdr: number): PpnMonthlyFiling[] {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Target total DPP = Accounting Revenue + 310,000,000 (net bridge items)
  const targetTotalDpp = annualAccountingTurnoverIdr + 310_000_000;
  const weights = [
    0.070, 0.075, 0.080, 0.080, 0.085, 0.085,
    0.085, 0.085, 0.090, 0.095, 0.110, 0.140
  ]; // Sums exactly to 1.000

  let accumulatedDpp = 0;

  return months.map((monthName, idx) => {
    let monthlyDpp = 0;
    if (idx === 11) {
      monthlyDpp = targetTotalDpp - accumulatedDpp;
    } else {
      monthlyDpp = Math.round(targetTotalDpp * weights[idx]);
      accumulatedDpp += monthlyDpp;
    }

    const dppDalamNegeri = Math.round(monthlyDpp * 0.96);
    const dppEkspor = monthlyDpp - dppDalamNegeri;
    const ppnKeluaran = Math.round(dppDalamNegeri * 0.11);
    const ppnMasukan = Math.round(ppnKeluaran * 0.65);
    const ppnKurangBayar = Math.max(0, ppnKeluaran - ppnMasukan);

    return {
      periodMonth: idx + 1,
      monthName,
      dppPenyerahanDalamNegeriIdr: dppDalamNegeri,
      dppEksporIdr: dppEkspor,
      dppTidakTerutangPpnIdr: 0,
      totalDppPpnIdr: monthlyDpp,
      ppnKeluaranIdr: ppnKeluaran,
      ppnMasukanDapatDikreditkanIdr: ppnMasukan,
      ppnKurangBayarIdr: ppnKurangBayar,
      statusSpt: 'Dilaporkan',
    };
  });
}

export function calculatePpnEqualization(
  accountingRevenueIdr: number,
  filings: PpnMonthlyFiling[],
  customBridgeItems?: PpnEqualizationBridgeItem[]
): PpnEqualizationReport {
  const totalDpp = filings.reduce((sum, f) => sum + f.totalDppPpnIdr, 0);
  const rawDiff = totalDpp - accountingRevenueIdr;

  const defaultBridge: PpnEqualizationBridgeItem[] = customBridgeItems || [
    {
      id: 'BRG-01',
      category: 'tambah',
      description: 'Uang Muka Penjualan dari Pelanggan (DP Terutang PPN)',
      amountIdr: 350_000_000,
      notes: 'Faktur Pajak terbit saat terima DP, namun revenue belum diakui secara akuntansi (akrual).',
      regulationReference: 'Pasal 13 ayat 1a UU PPN',
    },
    {
      id: 'BRG-02',
      category: 'kurang',
      description: 'Retur Penjualan Barang yang Belum Dibuatkan Nota Retur Pajak',
      amountIdr: -120_000_000,
      notes: 'Komersial sudah mengurangi pendapatan, namun administrasi nota retur terlambat di SPT.',
      regulationReference: 'PMK 65/PMK.03/2010',
    },
    {
      id: 'BRG-03',
      category: 'tambah',
      description: 'Pemberian Cuma-Cuma Barang Contoh untuk Promosi',
      amountIdr: 80_000_000,
      notes: 'Terutang PPN dengan DPP Nilai Lain (HPP), dicatat sebagai beban promosi di laba rugi.',
      regulationReference: 'Pasal 1A ayat 1d UU PPN',
    },
  ];

  const totalBridgeAddition = defaultBridge
    .filter((b) => b.category === 'tambah')
    .reduce((s, b) => s + b.amountIdr, 0);

  const totalBridgeDeduction = defaultBridge
    .filter((b) => b.category === 'kurang')
    .reduce((s, b) => s + b.amountIdr, 0);

  const netBridge = totalBridgeAddition + totalBridgeDeduction;
  const unexplainedDiff = Math.abs(rawDiff - netBridge);
  const isBalanced = unexplainedDiff === 0;

  return {
    accountingRevenueIdr,
    totalDppSptPpnIdr: totalDpp,
    rawDifferenceIdr: rawDiff,
    bridgeItems: defaultBridge,
    explainedDifferenceIdr: netBridge,
    unexplainedDifferenceIdr: unexplainedDiff,
    isBalanced,
    taxAuditRiskLevel: isBalanced ? 'LOW' : unexplainedDiff > 100_000_000 ? 'HIGH' : 'MEDIUM',
    auditRemarks: isBalanced
      ? 'Ekualisasi 100% Klop: Selisih antara Omset Laba Rugi dan DPP SPT Masa 1111 dapat dijelaskan sepenuhnya oleh beda waktu pengakuan dan penyerahan kena pajak.'
      : `Terdapat selisih tidak terdokumentasi sebesar Rp ${unexplainedDiff.toLocaleString('id-ID')}. Berpotensi memicu Surat Permintaan Penjelasan atas Data dan/atau Keterangan (SP2DK) dari KPP.`,
  };
}
