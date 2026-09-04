'use client';

import { useParams } from 'next/navigation';
import { repo } from '@/lib/db/repo-v4';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Sparkles,
  Lightbulb,
  Factory,
  BarChart3,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Gauge,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { formatIdrNumber } from '@/lib/decimal';
import { calculateFinancialRatios } from '@/lib/advisory/ratios';
import { analyzeCostAnomaliesAndAdvise } from '@/lib/advisory/cost-anomaly-analyzer';
import { calculateManufacturingBreakdown } from '@/lib/advisory/manufacturing-breakdown';

const DEFAULT_ADVISORY_DATA = {
  ratios: calculateFinancialRatios({
    currentAssetsIdr: 18_700_000_000,
    inventoryIdr: 4_350_000_000,
    cashAndEquivalentsIdr: 4_500_000_000,
    currentLiabilitiesIdr: 6_240_000_000,
    totalLiabilitiesIdr: 12_050_000_000,
    totalEquityIdr: 22_500_000_000,
    totalAssetsIdr: 34_550_000_000,
    revenueIdr: 24_000_000_000,
    grossProfitIdr: 16_450_000_000,
    operatingProfitIdr: 4_250_000_000,
    netProfitIdr: 4_560_000_000,
  }),
  costAdvisory: analyzeCostAnomaliesAndAdvise({ annualRevenueIdr: 24_000_000_000 }),
  manufacturing: calculateManufacturingBreakdown({ targetCogsIdr: 7_550_000_000 }),
};

export default function AdvisoryAnalyticsPage() {
  const routeParams = useParams();
  const engagementId = (routeParams?.id as string) || 'ENG-2026-01';
  const state = repo.getState();
  const engagement = state.engagements.find((e: any) => e.id === engagementId);
  const client = state.clients.find((c: any) => c.id === engagement?.clientId);
  const [data, setData] = useState<any>(DEFAULT_ADVISORY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'cost' | 'ratios' | 'manufacturing' | 'whatif' | 'memo'>('cost');
  const [umrHike, setUmrHike] = useState(8);
  const [rawMatShock, setRawMatShock] = useState(10);
  const [logisticsEff, setLogisticsEff] = useState(15);
  const [simResults, setSimResults] = useState<any>(null);

  useEffect(() => {
    const loadAdvisoryData = async () => {
      try {
        const res = await fetch('/api/v1/advisory/diagnosis');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to load advisory data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdvisoryData();
  }, []);

  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const res = await fetch('/api/v1/advisory/what-if', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            umrLaborHikePercent: umrHike,
            rawMaterialShockPercent: rawMatShock,
            logisticsEfficiencyPercent: logisticsEff,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setSimResults(json.data);
        }
      } catch (e) {
        console.error('Failed to run simulation:', e);
      }
    };
    fetchSimulation();
  }, [umrHike, rawMatShock, logisticsEff]);

  // Zero loading flash: data is pre-populated synchronously
  if (!data) return null;

  const { ratios, costAdvisory, manufacturing } = data;

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#B7791F]/15 text-[#B7791F] border border-[#B7791F]/30">
              ANALISIS STRATEGIS & KONSULTASI BISNIS
            </span>
            <span className="text-[10px] text-[#52636A]">Analisis Data Finansial & Standar Industri Manufaktur</span>
          </div>
          <h2 className="text-base font-bold text-[#102A32]">
            Analisis Kinerja Keuangan & Diagnosa Konsultan (Advisory Hub)
          </h2>
          <p className="text-xs text-[#52636A] mt-0.5">
            Menjawab pertanyaan kunci direksi: <em>&quot;Jika biaya operasional membengkak, langkah nyata apa yang harus diambil manajemen?&quot;</em>, didukung evaluasi rasio keuangan dan simulasi biaya pabrikasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('memo')}
            className="finova-pill-cta bg-[#102A32] hover:bg-[#1E3A44] text-white text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lihat Memo Eksekutif Direksi</span>
          </button>
        </div>
      </div>

      {/* Advisory Navigation Tabs */}
      <div className="flex border-b border-[#DDE4E2] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cost')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cost'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>1. Diagnosa Biaya Membengkak &amp; Solusi Nyata (&quot;What&apos;s Next&quot;)</span>
        </button>

        <button
          onClick={() => setActiveTab('ratios')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ratios'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>2. Barometer Rasio Finansial ({ratios.ratingGrade})</span>
        </button>

        <button
          onClick={() => setActiveTab('manufacturing')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'manufacturing'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>3. Analisis Biaya Pokok Produksi Pabrik (HPP / COGM)</span>
        </button>

        <button
          onClick={() => setActiveTab('whatif')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whatif'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>4. Simulasi Sensitivitas Skenario Bisnis (&quot;What-If&quot;)</span>
        </button>

        <button
          onClick={() => setActiveTab('memo')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'memo'
              ? 'border-[#0F8F7A] text-[#0F8F7A]'
              : 'border-transparent text-[#52636A] hover:text-[#102A32]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>5. Memo Strategis untuk Klien</span>
        </button>
      </div>

      {/* TAB 1: BIAYA MEMBENGKAK & WHAT'S NEXT */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          {/* Top Threat Alert */}
          <div className="p-5 rounded-2xl bg-[#FFF7E8] border border-[#F6E0B5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#B7791F] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-[#B7791F] uppercase tracking-wider">
                  Deteksi Anomali Beban Operasional: {costAdvisory.detectedAnomaliesCount} Pos Biaya Melonjak Tinggi
                </h3>
                <p className="text-xs text-[#102A32] mt-0.5">
                  Total potensi pembengkakan biaya terakumulasi mencapai <strong>Rp {costAdvisory.totalCostLeakageRiskIdr.toLocaleString('id-ID')}</strong> dibanding periode lalu.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white text-[#B7791F] border border-[#F6E0B5] shrink-0">
              STATUS: MEMERLUKAN INTERVENSI KONSULTAN
            </span>
          </div>

          {/* Anomaly Cards with "What's Next" Roadmap */}
          <div className="space-y-4">
            {costAdvisory.anomalies.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden">
                <div className="p-4 bg-[#F6F7F5]/60 border-b border-[#DDE4E2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.severity} VARIANCE
                    </span>
                    <h3 className="font-bold text-xs text-[#102A32]">{item.expenseCategory}</h3>
                    <span className="text-[10px] font-mono text-[#52636A]">({item.accountCode})</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#52636A]">Nominal: <strong className="font-mono text-[#102A32]">Rp {item.currentPeriodAmountIdr.toLocaleString('id-ID')}</strong></span>
                    <span className="font-bold text-[#C83E4D] font-mono">(+{item.variancePercentage}%)</span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                  {/* Left: Root Cause Analysis */}
                  <div className="space-y-3 bg-rose-50/30 p-4 rounded-xl border border-rose-200">
                    <h4 className="font-bold text-xs text-[#C83E4D] flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4" />
                      1. Akar Masalah (Root Cause Analysis):
                    </h4>
                    <p className="font-semibold text-[#102A32]">
                      {item.rootCauseAnalysis.primaryDriver}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#52636A] text-[11px]">
                      {item.rootCauseAnalysis.contributingFactors.map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                    <div className="text-[11px] font-semibold text-rose-800 pt-2 border-t border-rose-200/60">
                      Dampak Risiko: {item.rootCauseAnalysis.riskAssessment}
                    </div>
                  </div>

                  {/* Right: What's Next Strategic Roadmap */}
                  <div className="space-y-3 bg-emerald-50/30 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-[#0F8F7A] flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4" />
                        2. Rekomendasi Solusi Konsultan (&quot;What&apos;s Next&quot;):
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Hemat: Rp {item.whatsNextStrategy.estimatedCostSavingsIdr.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-[10px] font-bold text-[#0F8F7A] uppercase tracking-wider block">
                          Tindakan Segera (1 - 30 Hari):
                        </span>
                        <p className="text-[11px] text-[#102A32] mt-0.5 font-medium">
                          {item.whatsNextStrategy.immediateAction}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-[10px] font-bold text-[#B7791F] uppercase tracking-wider block">
                          Optimalisasi Taktis (1 - 3 Bulan):
                        </span>
                        <p className="text-[11px] text-[#102A32] mt-0.5 font-medium">
                          {item.whatsNextStrategy.tacticalOptimization}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200/60">
                        <span className="text-[10px] font-bold text-[#52636A] uppercase tracking-wider block">
                          Tata Kelola Jangka Panjang (6 - 12 Bulan):
                        </span>
                        <p className="text-[11px] text-[#102A32] mt-0.5 font-medium">
                          {item.whatsNextStrategy.strategicGovernance}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RATIOS SCORECARD */}
      {activeTab === 'ratios' && (
        <div className="space-y-6">
          {/* Health Gauge Banner */}
          <div className="p-5 rounded-2xl bg-[#E8F5F1] border border-[#B2DFD6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F8F7A] block">
                SKOR KESEHATAN FUNDAMENTAL PERUSAHAAN
              </span>
              <h3 className="text-xl font-bold text-[#102A32] mt-0.5">
                Rating: {ratios.ratingGrade} ({ratios.overallHealthScore} / 100)
              </h3>
              <p className="text-xs text-[#52636A] mt-1 max-w-2xl">
                {ratios.summaryNarrative}
              </p>
            </div>

            <div className="w-20 h-20 rounded-full border-4 border-[#0F8F7A] flex items-center justify-center bg-white shadow-sm shrink-0">
              <span className="font-bold text-xl text-[#0F8F7A]">{ratios.overallHealthScore}</span>
            </div>
          </div>

          {/* Ratios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratios.metrics.map((m: any) => (
              <div key={m.id} className="bg-white p-4 rounded-xl border border-[#DDE4E2] shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#52636A] uppercase">{m.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'PRIME' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#102A32]">{m.name}</h4>
                  <span className="text-[10px] font-mono text-[#7A8C93] block">{m.formula}</span>

                  <div className="my-3">
                    <span className="font-mono text-2xl font-extrabold text-[#102A32]">
                      {m.value}{m.unit}
                    </span>
                    <span className="text-[10px] text-[#52636A] block mt-0.5">
                      Benchmark: {m.benchmarkRange}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#52636A] leading-relaxed">
                    {m.interpretation}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DDE4E2] text-[10px] text-[#0F8F7A] font-semibold">
                  Saran: {m.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MANUFACTURING COGM */}
      {activeTab === 'manufacturing' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs">
            <h3 className="text-xs font-bold text-[#102A32] uppercase tracking-wider mb-1">
              Dekomposisi 3 Unsur Biaya Manufaktur (HPP Pabrikasi / COGM Schedule)
            </h3>
            <p className="text-xs text-[#52636A]">
              Menghilangkan kerumitan akuntansi pabrik dengan mengelompokkan Bahan Baku, Tenaga Kerja Langsung, dan Overhead secara transparan.
            </p>

            {/* 3 Pillars of Manufacturing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              {/* Pillar 1 */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">UNSUR 1: BAHAN BAKU LANGSUNG</span>
                <strong className="text-lg font-mono font-bold text-[#102A32] block">
                  Rp {manufacturing.directMaterials.directMaterialsUsedIdr.toLocaleString('id-ID')}
                </strong>
                <span className="text-xs font-bold text-blue-700 block">
                  Porsi: {manufacturing.directMaterials.percentageOfTotalCost}% dari Biaya Produksi
                </span>
                <p className="text-[11px] text-[#52636A]">
                  Pembelian Rp {manufacturing.directMaterials.rawMaterialPurchasesIdr.toLocaleString('id-ID')} setelah retur dan penyesuaian persediaan gudang.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">UNSUR 2: TENAGA KERJA LANGSUNG (BTKL)</span>
                <strong className="text-lg font-mono font-bold text-[#102A32] block">
                  Rp {manufacturing.directLabor.totalDirectLaborIdr.toLocaleString('id-ID')}
                </strong>
                <span className="text-xs font-bold text-emerald-700 block">
                  Porsi: {manufacturing.directLabor.percentageOfTotalCost}% dari Biaya Produksi
                </span>
                <p className="text-[11px] text-[#52636A]">
                  Upah operator perakitan dan teknisi fabrikasi pabrik termasuk alokasi premi lembur.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">UNSUR 3: BIAYA OVERHEAD PABRIK (BOP)</span>
                <strong className="text-lg font-mono font-bold text-[#102A32] block">
                  Rp {manufacturing.manufacturingOverhead.totalManufacturingOverheadIdr.toLocaleString('id-ID')}
                </strong>
                <span className="text-xs font-bold text-amber-700 block">
                  Porsi: {manufacturing.manufacturingOverhead.percentageOfTotalCost}% dari Biaya Produksi
                </span>
                <p className="text-[11px] text-[#52636A]">
                  Depresiasi mesin pabrik (Rp 520 Jt), listrik industri (Rp 480 Jt), dan bahan penolong.
                </p>
              </div>
            </div>

            {/* COGM Flow Calculation Table */}
            <div className="bg-[#F6F7F5] p-4 rounded-xl border border-[#DDE4E2] space-y-2 text-xs">
              <div className="flex justify-between font-bold py-1">
                <span>Total Biaya Pabrikasi Ditambahkan (Bahan Baku + BTKL + BOP)</span>
                <span className="font-mono">Rp {manufacturing.totalManufacturingCostsAddedIdr.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#52636A] py-1">
                <span>(+) Persediaan Barang Dalam Proses (WIP) Awal</span>
                <span className="font-mono">+ Rp {manufacturing.workInProcess.beginningWipIdr.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#52636A] py-1">
                <span>(-) Persediaan Barang Dalam Proses (WIP) Akhir</span>
                <span className="font-mono">- Rp {manufacturing.workInProcess.endingWipIdr.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800 pt-2 border-t border-[#DDE4E2] text-sm">
                <span>Harga Pokok Produksi (Cost of Goods Manufactured / COGM)</span>
                <span className="font-mono">Rp {manufacturing.costOfGoodsManufacturedIdr.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-[#102A32] pt-2 border-t border-[#DDE4E2]">
                <span>Harga Pokok Penjualan Akhir (COGS ke Laporan Laba Rugi)</span>
                <span className="font-mono text-sm">Rp {manufacturing.finishedGoods.costOfGoodsSoldIdr.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHAT-IF SENSITIVITY SIMULATOR (Solves Blindspot 3: Simulasi UMR & Markup Harga Jual) */}
      {activeTab === 'whatif' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#DDE4E2] shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                SIMULATOR SKENARIO KEPUTUSAN DIREKSI
              </span>
              <span className="text-[10px] text-[#52636A]">Dihitung secara presisi dari model HPP Manufaktur</span>
            </div>
            <h3 className="text-base font-bold text-[#102A32]">
              Simulator Sensitivitas Dampak Biaya (&quot;What-If Scenario&quot;)
            </h3>
            <p className="text-xs text-[#52636A]">
              Menjawab pertanyaan strategis manajemen: <em>&quot;Jika UMR naik 8% dan harga bahan baku naik 10%, berapa persen harga jual yang harus dinaikkan agar laba bersih perusahaan tidak merosot?&quot;</em>
            </p>

            {/* 3 Interactive Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 p-5 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2]">
              {/* Slider 1: UMR Hike */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#102A32]">1. Perkiraan Kenaikan UMR / Upah Tenaga Kerja</span>
                  <span className="font-mono font-extrabold text-[#0F8F7A] text-sm">+{umrHike}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={umrHike}
                  onChange={(e) => setUmrHike(Number(e.target.value))}
                  className="w-full accent-[#0F8F7A] cursor-pointer"
                />
                <span className="text-[10px] text-[#7A8C93] block">Rentang simulasi: 0% s.d +25%</span>
              </div>

              {/* Slider 2: Raw Material Shock */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#102A32]">2. Perkiraan Kenaikan Harga Bahan Baku</span>
                  <span className="font-mono font-extrabold text-[#B7791F] text-sm">+{rawMatShock}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={rawMatShock}
                  onChange={(e) => setRawMatShock(Number(e.target.value))}
                  className="w-full accent-[#B7791F] cursor-pointer"
                />
                <span className="text-[10px] text-[#7A8C93] block">Rentang simulasi: 0% s.d +30%</span>
              </div>

              {/* Slider 3: Logistics Savings */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#102A32]">3. Target Penghematan Biaya Pengiriman (Logistik)</span>
                  <span className="font-mono font-extrabold text-blue-700 text-sm">-{logisticsEff}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={logisticsEff}
                  onChange={(e) => setLogisticsEff(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-[#7A8C93] block">Rentang mitigasi: 0% s.d -40%</span>
              </div>
            </div>

            {/* Real-time Dynamic Results Card */}
            {simResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Kenaikan Biaya Upah Langsung (BTKL)</span>
                    <strong className="text-base font-mono font-bold text-[#C83E4D] block">
                      + Rp {simResults.simulatedModel.laborVarianceIdr.toLocaleString('id-ID')}
                    </strong>
                    <span className="text-[11px] text-[#52636A] block">
                      Total BTKL Baru: Rp {simResults.simulatedModel.newDirectLaborIdr.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Kenaikan HPP Manufaktur (COGM)</span>
                    <strong className="text-base font-mono font-bold text-[#B7791F] block">
                      + Rp {simResults.simulatedModel.cogsVarianceIdr.toLocaleString('id-ID')}
                    </strong>
                    <span className="text-[11px] text-[#52636A] block">
                      COGM Baru: Rp {simResults.simulatedModel.newTotalCogmIdr.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
                    <span className="text-[10px] font-bold text-[#0F8F7A] uppercase block">Rekomendasi Kenaikan Harga Jual</span>
                    <strong className="text-base font-mono font-bold text-[#0F8F7A] block">
                      +{simResults.consultantRecommendations.recommendedPriceMarkupPercent}% Markup
                    </strong>
                    <span className="text-[11px] text-[#52636A] block">
                      Agar laba bersih perusahaan tetap terlindungi di Rp 4,25 Miliar
                    </span>
                  </div>
                </div>

                {/* Consultant Action Plan */}
                <div className="p-5 rounded-xl border border-[#B2DFD6] bg-[#E8F5F1] space-y-3">
                  <h4 className="font-bold text-xs text-[#0F8F7A] uppercase tracking-wider">
                    {simResults.consultantRecommendations.executiveAdviceHeadline}
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-[#102A32]">
                    {simResults.consultantRecommendations.actionSteps.map((step: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EXECUTIVE MEMO */}
      {activeTab === 'memo' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-[#DDE4E2] shadow-2xs space-y-6 font-serif">
            <div className="border-b border-[#DDE4E2] pb-4 flex items-center justify-between font-sans">
              <div>
                <span className="text-[10px] font-bold text-[#0F8F7A] uppercase tracking-wider block">MEMO EKSEKUTIF KONSULTAN FINANSIAL</span>
                <h2 className="text-lg font-bold text-[#102A32]">{client?.legalName || 'Entitas Klien'} — Dewan Direksi &amp; Komisaris</h2>
                <span className="text-xs text-[#52636A]">Diterbitkan oleh Tim Advisory FINOVA AI &bull; Periode Evaluasi FY 2026</span>
              </div>
              <button
                onClick={() => window.print()}
                className="finova-pill-cta bg-[#F6F7F5] border border-[#DDE4E2] text-[#102A32] text-xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Cetak PDF Memo
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans leading-relaxed text-[#102A32]">
              <h3 className="font-bold text-sm text-[#102A32]">{costAdvisory.consultantExecutiveMemo.headline}</h3>
              <p className="text-[#52636A]">{costAdvisory.consultantExecutiveMemo.executiveSummary}</p>

              <div className="p-4 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] space-y-2">
                <span className="text-xs font-bold text-[#102A32] block">Poin-Poin Kunci Temuan (Key Takeaways):</span>
                <ul className="list-disc list-inside space-y-1 text-[#52636A] text-[11px]">
                  {costAdvisory.consultantExecutiveMemo.keyTakeaways.map((t: string, idx: number) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#E8F5F1] border border-[#B2DFD6]">
                <span className="text-xs font-bold text-[#0F8F7A] block">Nasihat Strategis Konsultan (Actionable Advice):</span>
                <p className="text-[11px] text-[#102A32] mt-1 font-medium">
                  {costAdvisory.consultantExecutiveMemo.clientAdvice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
