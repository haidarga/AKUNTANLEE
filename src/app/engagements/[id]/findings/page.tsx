'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/mock-db';
import { ReviewQueue } from '@/components/ReviewQueue';
import { UserRole } from '@/types/domain';

export default function FindingsPage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('partner');

  useEffect(() => {
    const saved = localStorage.getItem('finova_active_role');
    if (saved) setCurrentUserRole(saved as UserRole);
  }, []);

  const handleClearPoint = (pointId: string, comment: string) => {
    const user = state.users.find((u) => u.role === currentUserRole) || state.users[0];
    db.clearReviewPoint(pointId, user, comment);
  };

  const handleApproveSection = (sectionId: string) => {
    const user = state.users.find((u) => u.role === currentUserRole) || state.users[0];
    db.approveWorkpaperSection(sectionId, user);
  };

  const handleLockSection = (sectionId: string, reason: string) => {
    const user = state.users.find((u) => u.role === currentUserRole) || state.users[0];
    db.lockWorkpaperSection(sectionId, user, reason);
  };

  const handleReopenSection = (sectionId: string, reason: string) => {
    const user = state.users.find((u) => u.role === currentUserRole) || state.users[0];
    db.reopenWorkpaperSection(sectionId, user, reason);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Review, QC, & Temuan Pemeriksaan (Findings & Clearance)
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manajemen antrean pengecualian (exception-first queue), pembersihan catatan review, dan otorisasi kunci kertas kerja berjenjang.
          </p>
        </div>
      </div>

      <ReviewQueue
        reviewPoints={state.reviewPoints}
        workpaperSections={state.workpaperSections}
        currentUserRole={currentUserRole}
        currentUserName="Bambang Hendrawan, CPA"
        onClearPoint={handleClearPoint}
        onApproveSection={handleApproveSection}
        onLockSection={handleLockSection}
        onReopenSection={handleReopenSection}
      />
    </div>
  );
}
