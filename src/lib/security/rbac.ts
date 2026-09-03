// FINOVA Server-Side RBAC & Authorization Layer
// Complies with PRD Section 4 & Section 9: Least-privilege server-side authorization

import { UserRole } from '@/types/domain';

export type ActionType =
  | 'view_engagement'
  | 'upload_document'
  | 'upload_pbc_guest'
  | 'manage_pbc'
  | 'edit_account_mapping'
  | 'run_tax_calculations'
  | 'create_review_point'
  | 'clear_review_point'
  | 'approve_workpaper'
  | 'lock_workpaper'
  | 'reopen_locked_workpaper'
  | 'edit_findings'
  | 'approve_report'
  | 'export_report';

const ROLE_PERMISSIONS: Record<UserRole, ActionType[]> = {
  firm_admin: [
    'view_engagement',
    'upload_document',
    'manage_pbc',
    'edit_account_mapping',
    'run_tax_calculations',
    'create_review_point',
    'clear_review_point',
    'approve_workpaper',
    'lock_workpaper',
    'reopen_locked_workpaper',
    'edit_findings',
    'approve_report',
    'export_report',
  ],
  partner: [
    'view_engagement',
    'upload_document',
    'manage_pbc',
    'edit_account_mapping',
    'run_tax_calculations',
    'create_review_point',
    'clear_review_point',
    'approve_workpaper',
    'lock_workpaper',
    'reopen_locked_workpaper',
    'edit_findings',
    'approve_report',
    'export_report',
  ],
  manager: [
    'view_engagement',
    'upload_document',
    'manage_pbc',
    'edit_account_mapping',
    'run_tax_calculations',
    'create_review_point',
    'clear_review_point',
    'approve_workpaper',
    'lock_workpaper',
    'reopen_locked_workpaper', // Manager can reopen with required reason
    'edit_findings',
    'export_report',
  ],
  senior: [
    'view_engagement',
    'upload_document',
    'manage_pbc',
    'edit_account_mapping',
    'run_tax_calculations',
    'create_review_point',
    'clear_review_point',
    'edit_findings',
  ],
  preparer: [
    'view_engagement',
    'upload_document',
    'edit_account_mapping',
    'run_tax_calculations',
  ],
  tax_consultant: [
    'view_engagement',
    'upload_document',
    'run_tax_calculations',
    'create_review_point',
    'edit_findings',
  ],
  client_guest: [
    'upload_pbc_guest', // Strictly isolated to guest upload portal
  ],
  read_only: [
    'view_engagement',
  ],
};

export function canUserPerformAction(role: UserRole, action: ActionType): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(action);
}

export function assertPermission(role: UserRole, action: ActionType): void {
  if (!canUserPerformAction(role, action)) {
    throw new Error(`Akses Ditolak: Peran "${role}" tidak memiliki izin untuk aksi "${action}".`);
  }
}
