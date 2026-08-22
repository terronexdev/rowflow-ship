import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectAccessWhere } from '@/lib/projectAccess';

/** GET /api/activity/unread — count of events after lastSeenActivityAt */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastSeenActivityAt: true },
    });

    const accessible = await prisma.project.findMany({
      where: projectAccessWhere(session.user.id),
      select: { id: true },
    });
    const ids = accessible.map((p) => p.id);

    const since = me?.lastSeenActivityAt || new Date(0);
    const count = await prisma.auditLog.count({
      where: {
        projectId: { in: ids },
        createdAt: { gt: since },
      },
    });

    return NextResponse.json({
      count,
      lastSeenActivityAt: me?.lastSeenActivityAt || null,
    });
  } catch (e) {
    console.error('unread', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
