import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Lock, Clock, Sparkles } from 'lucide-react';
import { ClaimType, ReviewState, AnomalySeverity } from '@/types/domain';

interface StatusBadgeProps {
  type?: 'claim' | 'review' | 'severity';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'claim', value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  // Claim types
  if (type === 'claim') {
    switch (value as ClaimType) {
      case 'confirmed_fact':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 ${sizeClasses}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Fakta Terverifikasi
          </span>
        );
      case 'likely_driver':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-amber-200 bg-amber-50 text-amber-800 ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Indikasi Kuat (Likely Driver)
          </span>
        );
      case 'hypothesis':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-indigo-200 bg-indigo-50 text-indigo-800 ${sizeClasses}`}>
            <HelpCircle className="w-3 h-3 text-indigo-600" />
            Hipotesis Uji
          </span>
        );
      case 'scenario':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-cyan-200 bg-cyan-50 text-cyan-800 ${sizeClasses}`}>
            <Sparkles className="w-3 h-3 text-cyan-600" />
            Simulasi Skenario
          </span>
        );
      case 'unsupported':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-rose-200 bg-rose-50 text-rose-800 ${sizeClasses}`}>
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Tanpa Bukti (Blocked)
          </span>
        );
    }
  }

  // Review states
  if (type === 'review') {
    switch (value as ReviewState) {
      case 'approved':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 ${sizeClasses}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui (Approved)
          </span>
        );
      case 'locked':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-slate-300 bg-slate-100 text-slate-800 ${sizeClasses}`}>
            <Lock className="w-3 h-3 text-slate-600" />
            Terkunci (Locked)
          </span>
        );
      case 'needs_review':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-amber-200 bg-amber-50 text-amber-800 ${sizeClasses}`}>
            <Clock className="w-3 h-3 text-amber-600" />
            Perlu Review
          </span>
        );
      case 'confirmed':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-blue-200 bg-blue-50 text-blue-800 ${sizeClasses}`}>
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Dikonfirmasi
          </span>
        );
      case 'generated':
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-slate-200 bg-slate-50 text-slate-600 ${sizeClasses}`}>
            Draft Sistem
          </span>
        );
    }
  }

  // Anomaly severity
  if (type === 'severity') {
    switch (value as AnomalySeverity) {
      case 'critical':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded border border-rose-300 bg-rose-50 text-rose-800 ${sizeClasses}`}>
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Kritis
          </span>
        );
      case 'material':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-amber-300 bg-amber-50 text-amber-800 ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Material
          </span>
        );
      case 'warning':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-yellow-200 bg-yellow-50 text-yellow-800 ${sizeClasses}`}>
            Perhatian
          </span>
        );
      case 'info':
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded border border-slate-200 bg-slate-50 text-slate-600 ${sizeClasses}`}>
            Info
          </span>
        );
    }
  }

  return <span className={`inline-flex rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-700`}>{value}</span>;
};
