import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { assertPermission } from '@/lib/security/rbac';
import { UserRole } from '@/types/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mappingId, newSection, reason, userRole } = body;

    // Server-side authorization check
    assertPermission(userRole as UserRole, 'edit_account_mapping');

    const actor = db.getState().users.find((u) => u.role === userRole) || db.getState().users[0];
    const updated = db.overrideMapping(mappingId, newSection, actor, reason);

    return NextResponse.json({ success: true, mapping: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
