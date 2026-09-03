'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  MessageSquare,
  User,
  ArrowRight,
} from 'lucide-react';
import { ReviewPoint, WorkpaperSection, UserRole } from '@/types/domain';
import { StatusBadge } from './StatusBadge';

interface ReviewQueueProps {
  reviewPoints: ReviewPoint[];
  workpaperSections: WorkpaperSection[];
  currentUserRole: UserRole;
  currentUserName: string;
  onClearPoint: (pointId: string, comment: string) => void;
  onApproveSection: (sectionId: string) => void;
  onLockSection: (sectionId: string, reason: string) => void;
  onReopenSection: (sectionId: string, reason: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  reviewPoints: initialPoints,
  workpaperSections: initialSections,
  currentUserRole,
  currentUserName,
  onClearPoint,
  onApproveSection,
  onLockSection,
  onReopenSection,
}) => {
  const [points, setPoints] = useState<ReviewPoint[]>(initialPoints);
  const [sections, setSections] = useState<WorkpaperSection[]>(initialSections);

  // Clearance Modal
  const [clearingPoint, setClearingPoint] = useState<ReviewPoint | null>(null);
  const [clearanceComment, setClearanceComment] = useState('');

  // Lock / Reopen Modal
  const [lockingSection, setLockingSection] = useState<{ section: WorkpaperSection; action: 'lock' | 'reopen' } | null>(null);
  const [lockReason, setLockReason] = useState('');

  const canApprove = ['partner', 'manager', 'firm_admin'].includes(currentUserRole);
  const canLock = ['partner', 'firm_admin'].includes(currentUserRole);
  const canReopen = ['partner', 'manager', 'firm_admin'].includes(currentUserRole);

  const handleConfirmClear = () => {
    if (!clearingPoint || !clearanceComment.trim()) return;
    const updated = points.map((p) => {
      if (p.id === clearingPoint.id) {
        return {
          ...p,
          isCleared: true,
          clearedAt: new Date().toISOString(),
          clearanceComment,
        };
      }
      return p;
    });
    setPoints(updated);
    onClearPoint(clearingPoint.id, clearanceComment);
    setClearingPoint(null);
    setClearanceComment('');
  };

  const handleConfirmLockOrReopen = () => {
    if (!lockingSection || !lockReason.trim()) return;
    const { section, action } = lockingSection;

    if (action === 'lock') {
      const updated = sections.map((s) =>
        s.id === section.id
          ? { ...s, reviewState: 'locked' as const, lockedAt: new Date().toISOString(), lockedReason: lockReason }
          : s
      );
      setSections(updated);
      onLockSection(section.id, lockReason);
    } else {
      const updated = sections.map((s) =>
        s.id === section.id
          ? { ...s, reviewState: 'needs_review' as const, lockedAt: undefined, lockedReason: undefined }
          : s
      );
      setSections(updated);
      onReopenSection(section.id, lockReason);
    }

    setLockingSection(null);
    setLockReason('');
  };

  const handleApprove = (section: WorkpaperSection) => {
    const updated = sections.map((s) =>
      s.id === section.id ? { ...s, reviewState: 'approved' as const } : s
    );
    setSections(updated);
    onApproveSection(section.id);
  };

  return (
    <div className="space-y-6">
      {/* Review Workflow Protocol Banner */}
      <div className="bg-white p-4 rounded border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            Alur Kendali Mutu & Review Berjenjang (QC State Machine)
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            Draft Sistem &rarr; Perlu Review (Senior) &rarr; Disetujui (Manager/Partner) &rarr; Terkunci (Locked).
          </div>
        </div>
        <div className="text-[11px] bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-700">
          Akses Anda: <span className="font-semibold text-teal-800 uppercase">{currentUserRole}</span> ({currentUserName})
        </div>
      </div>

      {/* Section 1: Workpaper Clearance & Approvals */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800">
          Status Persetujuan Kertas Kerja (Workpaper Approval & Lock State)
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <th className="py-2.5 px-3 border-r border-slate-200">Kode & Judul Kertas Kerja</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Lead Schedule</th>
              <th className="py-2.5 px-3 text-center border-r border-slate-200">Status Review</th>
              <th className="py-2.5 px-3 text-right">Otorisasi & Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sections.map((sec) => (
              <tr key={sec.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{sec.code}</span>
                    <span className="font-normal text-slate-600">{sec.title}</span>
                  </div>
                  {sec.lockedReason && (
                    <div className="text-[10px] text-slate-500 mt-0.5 font-normal">
                      Alasan Kunci: "{sec.lockedReason}"
                    </div>
                  )}
                </td>

                <td className="py-2.5 px-3 font-mono text-slate-700 border-r border-slate-200">
                  {sec.leadSchedule}
                </td>

                <td className="py-2.5 px-3 text-center border-r border-slate-200">
                  <StatusBadge type="review" value={sec.reviewState} />
                </td>

                <td className="py-2.5 px-3 text-right space-x-2">
                  {sec.reviewState === 'needs_review' && canApprove && (
                    <button
                      onClick={() => handleApprove(sec)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px]"
                    >
                      Setujui Kertas Kerja
                    </button>
                  )}

                  {sec.reviewState === 'approved' && canLock && (
                    <button
                      onClick={() => setLockingSection({ section: sec, action: 'lock' })}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-[11px] inline-flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      Kunci (Lock)
                    </button>
                  )}

                  {sec.reviewState === 'locked' && canReopen && (
                    <button
                      onClick={() => setLockingSection({ section: sec, action: 'reopen' })}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px] inline-flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" />
                      Buka Kunci (Reopen)
                    </button>
                  )}

                  {!canApprove && sec.reviewState === 'needs_review' && (
                    <span className="text-[11px] text-slate-400 italic">Menunggu Approval Manager</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 2: Review Points Awaiting Clearance */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
          <span>Catatan Review Tim Audit (Review Notes & Findings Clearance)</span>
          <span className="text-[11px] font-normal text-slate-500">
            {points.filter((p) => !p.isCleared).length} Catatan Terbuka
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {points.map((pt) => (
            <div key={pt.id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-3 text-xs hover:bg-slate-50">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge type="severity" value={pt.severity} size="sm" />
                  <span className="font-bold text-slate-900">{pt.title}</span>
                  {pt.isCleared ? (
                    <span className="text-emerald-700 text-[10px] font-semibold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Dibersihkan
                    </span>
                  ) : (
                    <span className="text-amber-700 text-[10px] font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      <Clock className="w-3 h-3" /> Belum Dibersihkan
                    </span>
                  )}
                </div>

                <div className="text-slate-700 leading-relaxed">{pt.detail}</div>

                {pt.clearanceComment && (
                  <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-emerald-900 text-[11px] mt-2">
                    <span className="font-semibold">Tindak Lanjut Auditor:</span> {pt.clearanceComment}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {!pt.isCleared && (
                  <button
                    onClick={() => {
                      setClearingPoint(pt);
                      setClearanceComment('');
                    }}
                    className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded font-medium text-[11px]"
                  >
                    Bersihkan Catatan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Point Modal */}
      {clearingPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Pembersihan Catatan Review (Clearance)</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">{clearingPoint.title}</p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Uraian Tindak Lanjut / Keterangan Auditor:
              </label>
              <textarea
                rows={3}
                value={clearanceComment}
                onChange={(e) => setClearanceComment(e.target.value)}
                placeholder="Jelaskan bukti tambahan yang diperoleh atau koreksi yang telah dilakukan..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setClearingPoint(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={!clearanceComment.trim()}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded font-semibold"
              >
                Konfirmasi Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock / Reopen Modal */}
      {lockingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {lockingSection.action === 'lock' ? 'Kunci Kertas Kerja' : 'Buka Kunci Kertas Kerja'}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Kertas Kerja {lockingSection.section.code} - {lockingSection.section.title}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Alasan Formal (Tercatat Permanen dalam Audit Trail):
              </label>
              <textarea
                rows={3}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder={
                  lockingSection.action === 'lock'
                    ? 'Contoh: Prosedur substantif selesai dan telah disetujui Partner.'
                    : 'Contoh: Diperlukan penyesuaian atas bukti faktur pajak baru dari klien.'
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setLockingSection(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLockOrReopen}
                disabled={!lockReason.trim()}
                className={`px-3 py-1.5 rounded font-semibold text-white ${
                  lockingSection.action === 'lock' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
