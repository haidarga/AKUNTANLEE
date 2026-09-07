import { NextResponse } from 'next/server';
import type { UserRoleV4, UserV4 } from '@/types/domain-v4';
import { getServerSession } from '@/lib/auth/session';

const ROLE_ALIASES: Record<string, UserRoleV4> = {
  preparer: 'preparer',
  staff: 'preparer',
  senior: 'senior',
  manager: 'manager',
  partner: 'partner',
};

export class AuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: 'UNAUTHENTICATED' | 'FIRM_SETUP_REQUIRED' | 'FORBIDDEN_ROLE' | 'FORBIDDEN_TENANT_ACCESS',
    message: string,
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireSessionActor(
  request: Request,
  allowedRoles?: UserRoleV4[],
): Promise<UserV4> {
  const session = await getServerSession(request);
  if (!session) {
    throw new AuthorizationError(401, 'UNAUTHENTICATED', 'Sesi login diperlukan.');
  }
  if (!session.firmId) {
    throw new AuthorizationError(403, 'FIRM_SETUP_REQUIRED', 'Profil KAP perlu disiapkan sebelum membuka data audit.');
  }

  const role = ROLE_ALIASES[session.role];
  if (!role || (allowedRoles && !allowedRoles.includes(role))) {
    throw new AuthorizationError(403, 'FORBIDDEN_ROLE', 'Peran pengguna tidak memiliki otorisasi untuk tindakan ini.');
  }

  return {
    id: session.userId,
    tenantId: session.firmId,
    email: session.email,
    name: session.name,
    role,
    title: session.title,
    status: 'active',
  };
}

export function assertTenantAccess(actor: UserV4, tenantId?: string | null): void {
  if (tenantId && tenantId !== actor.tenantId) {
    throw new AuthorizationError(403, 'FORBIDDEN_TENANT_ACCESS', 'Perikatan ini dimiliki oleh KAP lain.');
  }
}

export function authorizationErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthorizationError)) return null;
  return NextResponse.json({ code: error.code, message: error.message, retryable: false }, { status: error.status });
}
