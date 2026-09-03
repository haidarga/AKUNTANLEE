'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Table,
  Calculator,
  LineChart,
  FileCheck2,
  FileText,
  History,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface EngagementNavProps {
  engagementId: string;
  clientName: string;
  fiscalYear: number;
  materialityIdr: number;
}

export const EngagementNav: React.FC<EngagementNavProps> = ({
  engagementId,
  clientName,
  fiscalYear,
  materialityIdr,
}) => {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: `/engagements/${engagementId}`, icon: LayoutDashboard },
    { label: 'Documents & Hub', href: `/engagements/${engagementId}/documents`, icon: FolderOpen },
    { label: 'Workpapers', href: `/engagements/${engagementId}/workpapers`, icon: Table },
    { label: 'Tax Engine', href: `/engagements/${engagementId}/tax`, icon: Calculator },
    { label: 'Analysis & Advisory', href: `/engagements/${engagementId}/analysis`, icon: LineChart },
    { label: 'Review & Findings', href: `/engagements/${engagementId}/findings`, icon: FileCheck2 },
    { label: 'Report Composer', href: `/engagements/${engagementId}/report`, icon: FileText },
    { label: 'Activity & Audit', href: `/engagements/${engagementId}/activity`, icon: History },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Context Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Keterlibatan Aktif
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {engagementId}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            {clientName}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              FY {fiscalYear}
            </span>
          </h1>
        </div>

        {/* Operational Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <div className="text-slate-500 font-medium">Ambang Materialitas</div>
            <div className="font-mono font-bold text-slate-900">Rp {materialityIdr.toLocaleString('id-ID')}</div>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <div className="text-slate-500 font-medium">Status Kertas Kerja</div>
            <div className="font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tie-Out Balanced
            </div>
          </div>
          <Link
            href="/portal/pbc/token-nsm-tb2025-secure"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium shadow-sm transition-colors"
            title="Buka Portal PBC Tamu Klien (Terisolasi)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Client Guest Portal
          </Link>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isExact = pathname === tab.href;
            const isChild = tab.href !== `/engagements/${engagementId}` && pathname.startsWith(tab.href);
            const isActive = isExact || isChild;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#0D5C75] text-[#0D5C75] font-semibold bg-teal-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0D5C75]' : 'text-slate-400'}`} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
