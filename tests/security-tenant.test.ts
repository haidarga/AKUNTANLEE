import { describe, it, expect } from 'vitest';
import { validateTenantAccess, validateClientGuestToken, TenantSecurityError } from '@/lib/security/tenant';
import { canUserPerformAction, assertPermission } from '@/lib/security/rbac';

describe('Multi-Tenant Boundary Security', () => {
  it('permits user from Firm 1 to access Firm 1 resources', () => {
    expect(() => {
      validateTenantAccess('FIRM-001', { firmId: 'FIRM-001' });
    }).not.toThrow();
  });

  it('strictly blocks user from Firm 2 attempting to access Firm 1 resources (Negative Test)', () => {
    expect(() => {
      validateTenantAccess('FIRM-002', { firmId: 'FIRM-001' });
    }).toThrow(TenantSecurityError);
  });

  it('validates client guest token matches exact assigned PBC token', () => {
    expect(() => {
      validateClientGuestToken('token-nsm-tb2025-secure', 'token-nsm-tb2025-secure');
    }).not.toThrow();

    expect(() => {
      validateClientGuestToken('invalid-forged-token', 'token-nsm-tb2025-secure');
    }).toThrow(TenantSecurityError);
  });
});

describe('RBAC Server-Side Authorization', () => {
  it('allows partners to approve and lock workpapers', () => {
    expect(canUserPerformAction('partner', 'approve_workpaper')).toBe(true);
    expect(canUserPerformAction('partner', 'lock_workpaper')).toBe(true);
    expect(canUserPerformAction('partner', 'approve_report')).toBe(true);
  });

  it('denies preparers and junior associates from approving or locking workpapers', () => {
    expect(canUserPerformAction('preparer', 'approve_workpaper')).toBe(false);
    expect(canUserPerformAction('preparer', 'lock_workpaper')).toBe(false);
    expect(() => {
      assertPermission('preparer', 'approve_workpaper');
    }).toThrow(/Akses Ditolak/);
  });

  it('restricts client guest strictly to guest upload actions', () => {
    expect(canUserPerformAction('client_guest', 'upload_pbc_guest')).toBe(true);
    expect(canUserPerformAction('client_guest', 'view_engagement')).toBe(false);
    expect(canUserPerformAction('client_guest', 'clear_review_point')).toBe(false);
  });
});
