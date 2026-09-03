import { NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { assertPermission } from '@/lib/security/rbac';
import { UserRole } from '@/types/domain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pointId, comment, userRole } = body;

    // Server-side authorization check
    assertPermission(userRole as UserRole, 'clear_review_point');

    const actor = db.getState().users.find((u) => u.role === userRole) || db.getState().users[0];
    const cleared = db.clearReviewPoint(pointId, actor, comment);

    return NextResponse.json({ success: true, reviewPoint: cleared });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
