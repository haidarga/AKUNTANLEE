import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/db/repo-v4';
import { UserRoleV4 } from '@/types/domain-v4';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = repo.getReviewerNotes(id);
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userRole = (body.userRole as UserRoleV4) || 'senior';
    const user = repo.getState().users.find((u) => u.role === userRole) || repo.getState().users[0];

    const note = repo.addReviewerNote(
      {
        tenantId: user.tenantId,
        engagementId: id,
        targetLineId: body.targetLineId || 'WP-GENERAL',
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        content: body.content,
        status: 'open',
      },
      user
    );

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const userRole = (body.userRole as UserRoleV4) || 'partner';
    const user = repo.getState().users.find((u) => u.role === userRole) || repo.getState().users[0];

    const updated = repo.resolveReviewerNote(body.noteId, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
