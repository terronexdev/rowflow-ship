import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users?q=emailOrName
 * Returns users the current owner can assign:
 * - self
 * - anyone already assigned on their projects
 * - exact email match when q looks like an email (invite-by-email)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    const ownerId = session.user.id;

    const assigned = await prisma.roleAssignment.findMany({
      where: { project: { userId: ownerId } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const ids = new Set<string>([ownerId, ...assigned.map((a) => a.userId)]);

    if (q.includes('@')) {
      const byEmail = await prisma.user.findUnique({
        where: { email: q.toLowerCase() },
        select: { id: true, name: true, email: true },
      });
      if (byEmail) ids.add(byEmail.id);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(ids) },
        ...(q && !q.includes('@')
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true },
      orderBy: { email: 'asc' },
      take: 50,
    });

    // If exact email search missed case, try again
    if (q.includes('@') && !users.some((u) => u.email.toLowerCase() === q.toLowerCase())) {
      const exact = await prisma.user.findFirst({
        where: { email: { equals: q, mode: 'insensitive' } },
        select: { id: true, name: true, email: true },
      });
      if (exact) users.unshift(exact);
    }

    return NextResponse.json({ users });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}
