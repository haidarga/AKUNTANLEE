'use client';

import React, { useState } from 'react';
import { TrendingUp, BarChart3, Info, Sparkles, ArrowRight } from 'lucide-react';
import { formatIdrNumber } from '@/lib/decimal';

interface WaterfallStep {
  label: string;
  sublabel: string;
  amount: number;
  type: 'start' | 'subtract' | 'subtotal' | 'total';
  startValue: number;
  endValue: number;
}

export function FinancialWaterfallChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // FY 2025 Financial Bridge Steps
  const revenue = 52_400_000_000;
  const cogs = 35_950_000_000;
  const grossProfit = revenue - cogs; // 16_450_000_000
  const opex = 12_200_000_000;
  const netIncome = grossProfit - opex; // 4_250_000_000

  const steps: WaterfallStep[] = [
    {
      label: 'Pendapatan Usaha',
      sublabel: 'WP-F.1 (Gross Revenue)',
      amount: revenue,
      type: 'start',
      startValue: 0,
      endValue: revenue,
    },
    {
      label: 'HPP / COGS',
      sublabel: 'WP-F.2 (Cost of Goods Sold)',
      amount: -cogs,
      type: 'subtract',
      startValue: revenue,
      endValue: grossProfit,
    },
    {
      label: 'Laba Kotor',
      sublabel: 'Margin 31,4%',
      amount: grossProfit,
      type: 'subtotal',
      startValue: 0,
      endValue: grossProfit,
    },
    {
      label: 'Beban Operasional',
      sublabel: 'WP-F.3 (OPEX & Admin)',
      amount: -opex,
      type: 'subtract',
      startValue: grossProfit,
      endValue: netIncome,
    },
    {
      label: 'Laba Bersih Tahun Berjalan',
      sublabel: 'Net Margin 8,1%',
      amount: netIncome,
      type: 'total',
      startValue: 0,
      endValue: netIncome,
    },
  ];

  const chartHeight = 140;
  const maxVal = revenue * 1.05;

  return (
    <div className="finova-bezel-outer">
      <div className="finova-bezel-inner p-5 sm:p-6 bg-gradient-to-br from-white via-[#F6F7F5] to-white relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE4E2]/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F8F7A]/10 text-[#0F8F7A] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#102A32] flex items-center gap-2">
                Jembatan Visual Laba Bersih (Financial Waterfall Bridge)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                  SAK Audited
                </span>
              </h3>
              <p className="text-[11px] text-[#52636A]">
                Visualisasi dekomposisi pergerakan dari Pendapatan Usaha hingga Laba Bersih Kertas Kerja FY 2025.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#52636A] block">Laba Kotor</span>
              <strong className="text-[#102A32]">{formatIdrNumber(grossProfit)}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#52636A] block">Laba Bersih</span>
              <strong className="text-[#0F8F7A]">{formatIdrNumber(netIncome)}</strong>
            </div>
          </div>
        </div>

        {/* SVG Waterfall Bars Container */}
        <div className="relative pt-4 pb-2 overflow-x-auto">
          <div className="min-w-[640px] flex items-end justify-between gap-3 h-44 px-2">
            {steps.map((step, idx) => {
              const isPositive = step.amount >= 0;
              const isSubtotal = step.type === 'subtotal' || step.type === 'total';
              const isHovered = hoveredIdx === idx;

              // Calculate bar vertical positioning
              let topPx: number;
              let heightPx: number;

              if (step.type === 'start' || step.type === 'subtotal' || step.type === 'total') {
                heightPx = Math.max(16, (step.endValue / maxVal) * chartHeight);
                topPx = chartHeight - heightPx;
              } else {
                // subtract
                const topVal = Math.max(step.startValue, step.endValue);
                const botVal = Math.min(step.startValue, step.endValue);
                topPx = chartHeight - (topVal / maxVal) * chartHeight;
                heightPx = Math.max(16, ((topVal - botVal) / maxVal) * chartHeight);
              }

              let barColor = 'bg-[#0F8F7A]';
              let badgeColor = 'text-[#0F8F7A] bg-[#E8F5F1] border-[#B2DFD6]';

              if (step.type === 'subtract') {
                barColor = 'bg-[#C83E4D]';
                badgeColor = 'text-[#C83E4D] bg-[#FDECEF] border-[#F8B4BD]';
              } else if (step.type === 'subtotal') {
                barColor = 'bg-[#102A32]';
                badgeColor = 'text-[#102A32] bg-[#F1F4F3] border-[#DDE4E2]';
              } else if (step.type === 'total') {
                barColor = 'bg-gradient-to-t from-[#0F8F7A] to-[#25B49D]';
                badgeColor = 'text-[#0F8F7A] bg-[#E8F5F1] border-[#B2DFD6] font-bold';
              }

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="flex-1 flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                >
                  {/* Amount Pill */}
                  <div
                    className={`mb-2 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border transition-all ${badgeColor} ${
                      isHovered ? 'scale-105 shadow-sm' : ''
                    }`}
                  >
                    {step.amount > 0 && step.type === 'start' ? '+' : ''}
                    {formatIdrNumber(step.amount)}
                  </div>

                  {/* Bar Frame */}
                  <div className="w-full max-w-[70px] h-[140px] relative flex flex-col justify-end bg-[#F1F4F3]/40 rounded-xl p-1 border border-[#DDE4E2]/50">
                    <div
                      style={{
                        position: 'absolute',
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: '4px',
                        right: '4px',
                      }}
                      className={`rounded-lg transition-all duration-300 shadow-xs ${barColor} ${
                        isHovered ? 'brightness-110' : ''
                      }`}
                    />
                  </div>

                  {/* Label Footnote */}
                  <div className="mt-2 text-center space-y-0.5">
                    <div className="font-bold text-[11px] text-[#102A32] leading-tight">
                      {step.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#7A8C93]">
                      {step.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight callout */}
        <div className="p-3 bg-[#E8F5F1]/50 rounded-xl border border-[#B2DFD6]/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#0F8F7A] font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              Laba Bersih Teragregasi: <strong>Rp 4.250.000.000</strong> terverifikasi tepat menyerap ke Ekuitas Kertas Kerja (WP-E.2 Retained Earnings).
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#52636A] font-bold shrink-0">
            TIE-OUT: 100% MATCH
          </span>
        </div>
      </div>
    </div>
  );
}
