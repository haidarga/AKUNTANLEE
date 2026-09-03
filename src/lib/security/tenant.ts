// FINOVA Strict Multi-Tenant Isolation & Boundary Guards
// Complies with PRD Section 9: Negative-tested tenant and guest isolation

export interface TenantResource {
  firmId: string;
}

export class TenantSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantSecurityError';
  }
}

/**
 * Validates that the active user's firm matches the requested resource firm.
 * Never allows cross-tenant read, mutation, or search.
 */
export function validateTenantAccess(userFirmId: string, resource: TenantResource): void {
  if (!userFirmId || !resource.firmId) {
    throw new TenantSecurityError('Identifikasi Tenant tidak valid atau kosong.');
  }

  if (userFirmId !== resource.firmId) {
    throw new TenantSecurityError(
      `Pelanggaran Batas Tenant: Pengguna dari Kantor ${userFirmId} dilarang mengakses data Kantor ${resource.firmId}.`
    );
  }
}

/**
 * Validates that client guest token matches the designated PBC request.
 */
export function validateClientGuestToken(token: string, expectedToken: string): void {
  if (!token || token.trim() === '' || token !== expectedToken) {
    throw new TenantSecurityError('Token akses Portal Klien tidak valid atau telah kedaluwarsa.');
  }
}
