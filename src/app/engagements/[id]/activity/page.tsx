'use client';

import React from 'react';
import { db } from '@/lib/db/mock-db';
import {
  History,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Lock,
  Edit2,
  Calculator,
  UploadCloud,
} from 'lucide-react';
import { AuditEvent } from '@/types/domain';

export default function ActivityPage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const events = state.auditEvents.filter((a) => a.engagementId === engagement.id);

  const getActionBadge = (action: AuditEvent['action']) => {
    switch (action) {
      case 'workpaper_approved':
      case 'report_draft_approved':
        return { label: 'Approval Resmi', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'workpaper_locked':
        return { label: 'Kunci (Locked)', icon: Lock, color: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'mapping_overridden':
        return { label: 'Override Manual', icon: Edit2, color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'tax_calculated':
        return { label: 'Kalkulasi Pajak', icon: Calculator, color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'document_uploaded':
        return { label: 'Unggah Dokumen', icon: UploadCloud, color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'review_point_cleared':
        return { label: 'Clearance Catatan', icon: FileCheck, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      default:
        return { label: action, icon: History, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Jejak Aktivitas & Jejak Audit Permanen (Immutable Audit Trail)
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Seluruh tindakan modifikasi pemetaan akun, eksekusi kalkulasi deterministik, pembersihan catatan review, dan otorisasi partner dicatat secara kronologis.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Audit Integrity Verified
        </span>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
          <span>Kronologi Peristiwa ({events.length} Peristiwa Tercatat)</span>
          <span className="text-[11px] font-normal text-slate-500 font-mono">
            Rentang Waktu: 18 Jan 2026 s.d. 14 Feb 2026
          </span>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {events.map((evt) => {
            const badge = getActionBadge(evt.action);
            const Icon = badge.icon;
            return (
              <div key={evt.id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-3 hover:bg-slate-50">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    <span className="font-semibold text-slate-900">{evt.actorName}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      ({evt.actorRole})
                    </span>
                  </div>

                  <div className="text-slate-700 leading-relaxed">{evt.details}</div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Entitas: {evt.entityType} ({evt.entityId}) &bull; ID Audit: {evt.id}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(evt.timestamp).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
