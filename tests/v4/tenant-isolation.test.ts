import { describe, it, expect } from 'vitest';
import { repo } from '@/lib/db/repo-v4';

describe('R01 / PRD §41, §46: Tenant Isolation & RBAC Protection', () => {
  it('strictly blocks cross-tenant access with 403 authorization violation', () => {
    const externalUserTenant = 'TENANT-002'; // Firm B
    const internalTenant = 'TENANT-001'; // Firm A

    expect(() => {
      repo.assertTenantAccess(externalUserTenant, internalTenant);
    }).toThrow('Pelanggaran Batas Tenant');
  });

  it('permits same-tenant access without error', () => {
    expect(() => {
      repo.assertTenantAccess('TENANT-001', 'TENANT-001');
    }).not.toThrow();
  });

  it('enforces RBAC matrix: junior preparer cannot authorize export or approve batches', () => {
    expect(() => {
      repo.assertPermission('preparer', 'authorize_export');
    }).toThrow('Akses Ditolak');

    expect(() => {
      repo.assertPermission('preparer', 'approve_mapping_batch');
    }).toThrow('Akses Ditolak');
  });

  it('permits authorized partner to execute export', () => {
    expect(() => {
      repo.assertPermission('partner', 'authorize_export');
    }).not.toThrow();
  });
});
