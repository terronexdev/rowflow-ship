import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function accessiblePermit(permitId: string, userId: string) {
  return prisma.permit.findFirst({
    where: {
      id: permitId,
      project: {
        OR: [
          { userId },
          { members: { some: { userId } } },
          { roleAssignments: { some: { userId, isCurrent: true } } },
        ],
      },
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const permit = await accessiblePermit(id, session.user.id);
    if (!permit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const content = String(body.content || '').trim();
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });

    const note = await prisma.note.create({
      data: {
        permitId: id,
        projectId: permit.projectId,
        content,
        category: 'PERMIT',
        authorId: session.user.id,
      },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    console.error('permit note', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
