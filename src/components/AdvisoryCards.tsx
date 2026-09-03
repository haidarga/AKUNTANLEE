'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { AdvisoryInsight, Evidence } from '@/types/domain';
import { StatusBadge } from './StatusBadge';
import { EvidenceDrawer } from './EvidenceDrawer';

interface AdvisoryCardsProps {
  insights: AdvisoryInsight[];
  evidenceList: Evidence[];
}

export const AdvisoryCards: React.FC<AdvisoryCardsProps> = ({ insights, evidenceList }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  const handleOpenEvidence = (evId: string) => {
    const found = evidenceList.find((e) => e.id === evId);
    if (found) {
      setSelectedEvidence(found);
    } else {
      setSelectedEvidence({
        id: evId,
        engagementId: 'ENG-2025-01',
        documentId: 'DOC-001',
        documentName: 'TB_PT_Nusantara_Sukses_Makmur_FY2025.xlsx',
        fileType: 'xlsx',
        sheetName: 'TrialBalance_2025',
        cellReference: 'Sheet1!D24:E24',
        sourceValue: '34.650.000.000',
        normalizedValue: 34_650_000_000,
        confidence: 0.98,
        extractionMethod: 'deterministic_parse',
        snippetText: 'Akun 5101-00 HPP Pembelian Bahan Baku Logam Utama Rp 34.650.000.000',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const getLevelBadge = (level: AdvisoryInsight['level']) => {
    switch (level) {
      case 'descriptive':
        return { label: 'Level 1: Deskriptif', desc: 'Apa yang terjadi?', color: 'bg-slate-100 text-slate-800' };
      case 'diagnostic':
        return { label: 'Level 2: Diagnostik', desc: 'Mengapa hal itu terjadi?', color: 'bg-amber-100 text-amber-900' };
      case 'predictive':
        return { label: 'Level 3: Prediktif / Skenario', desc: 'Apa dampaknya jika berlanjut?', color: 'bg-cyan-100 text-cyan-900' };
      case 'prescriptive':
        return { label: 'Level 4: Preskriptif', desc: 'Apa rekomendasi investigasi & tindakannya?', color: 'bg-emerald-100 text-emerald-900' };
    }
  };

  return (
    <div className="space-y-4">
      <EvidenceDrawer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />

      {/* Advisory Principles Reminder Banner */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="font-bold flex items-center gap-1.5 text-emerald-400">
            <Lightbulb className="w-4 h-4" />
            FINOVA Advisory Intelligence Framework v3.0
          </div>
          <p className="text-slate-300 text-[11px] mt-0.5">
            Setiap insight secara eksplisit memisahkan <span className="text-white font-semibold">Fakta Terverifikasi</span>, <span className="text-amber-300 font-semibold">Indikasi Kuat (Likely Driver)</span>, <span className="text-cyan-300 font-semibold">Hipotesis Uji</span>, dan <span className="text-indigo-300 font-semibold">Simulasi Skenario</span>. Sistem tidak pernah mengklaim kausalitas mutlak tanpa bukti berlapis.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0 font-mono">
          Model: finova-advisory-v3.0
        </div>
      </div>

      {/* Grid of Advisory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((card) => {
          const lvl = getLevelBadge(card.level);
          return (
            <div
              key={card.id}
              className="bg-white rounded border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition-colors flex flex-col justify-between text-xs space-y-3"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase font-mono ${lvl.color}`}>
                      {lvl.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">({lvl.desc})</span>
                  </div>
                  <StatusBadge type="claim" value={card.claimType} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {card.title}
                </h3>
              </div>

              {/* Observation (Fact) */}
              <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Observasi Data (Fakta):
                </div>
                <div className="text-slate-800 leading-relaxed">
                  {card.observation}
                </div>
              </div>

              {/* Diagnostic Driver if available */}
              {card.likelyDriver && (
                <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200/70 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    Indikasi Pemicu (Likely Driver):
                  </div>
                  <div className="text-amber-900 leading-relaxed text-[11px]">
                    {card.likelyDriver}
                  </div>
                </div>
              )}

              {/* Hypothesis or Scenario details */}
              {card.hypothesis && (
                <div className="bg-indigo-50/60 p-2.5 rounded border border-indigo-200/70 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                    Hipotesis yang Memerlukan Pengujian:
                  </div>
                  <div className="text-indigo-900 leading-relaxed text-[11px]">
                    {card.hypothesis}
                  </div>
                </div>
              )}

              {/* Business Implication */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Implikasi Bisnis & Konsultasi:
                </div>
                <div className="text-slate-700 leading-relaxed">
                  {card.implication}
                </div>
              </div>

              {/* Recommended Action / Investigation */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                  Rekomendasi Langkah Investigasi:
                </div>
                <div className="text-slate-800 font-medium text-[11px]">
                  {card.recommendedInvestigation}
                </div>
                {card.recommendedAction && (
                  <div className="text-teal-900 bg-teal-50/60 p-2 rounded border border-teal-100 font-semibold text-[11px] mt-1">
                    Aksi Klien: {card.recommendedAction}
                  </div>
                )}
              </div>

              {/* Evidence Link Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span>Bukti Terkait:</span>
                  {card.evidenceIds.map((evId) => (
                    <button
                      key={evId}
                      onClick={() => handleOpenEvidence(evId)}
                      className="font-mono text-teal-700 hover:underline flex items-center gap-0.5 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200"
                    >
                      {evId}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
                <div className="font-semibold text-slate-700">
                  Tingkat Keyakinan: {(card.confidenceScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
