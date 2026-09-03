'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/mock-db';
import { ReportComposer } from '@/components/ReportComposer';
import { UserRole } from '@/types/domain';

export default function ReportPage() {
  const state = db.getState();
  const draft = state.reportDrafts[0];
  const findings = state.findings;
  const standards = state.standardReferences;
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('partner');

  useEffect(() => {
    const saved = localStorage.getItem('finova_active_role');
    if (saved) setCurrentUserRole(saved as UserRole);
  }, []);

  const handleApprove = () => {
    const partner = state.users.find((u) => u.role === 'partner') || state.users[0];
    db.approveReportDraft(draft.id, partner);
  };

  return (
    <div className="space-y-6">
      <ReportComposer
        draft={draft}
        findings={findings}
        standards={standards}
        currentUserRole={currentUserRole}
        currentUserName="Bambang Hendrawan, CPA"
        onApproveDraft={handleApprove}
      />
    </div>
  );
}
