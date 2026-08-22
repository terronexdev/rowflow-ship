import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectAccessWhere } from '@/lib/projectAccess';
import type { AuditAction, Prisma } from '@prisma/client';

/**
 * GET /api/activity
 * Manager-style activity feed — filterable.
 *
 * Query: projectId, action, userId, parcelId, entityType, q,
 *        from, to (ISO), unread=1, order=desc|asc,
 *        limit (default 50, max 200), cursor
 *        includeActors=1 → distinct recent actors for filter UI
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const projectId = sp.get('projectId') || undefined;
    const action = sp.get('action') as AuditAction | null;
    const userId = sp.get('userId') || undefined;
    const parcelId = sp.get('parcelId') || undefined;
    const entityType = sp.get('entityType')?.trim() || undefined;
    const statusField = sp.get('statusField')?.trim() || undefined;
    const q = sp.get('q')?.trim();
    const from = sp.get('from');
    const to = sp.get('to');
    const unread = sp.get('unread') === '1' || sp.get('unread') === 'true';
    const order = sp.get('order') === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '50', 10) || 50));
    const cursor = sp.get('cursor') || undefined;
    const includeActors = sp.get('includeActors') === '1' || sp.get('includeActors') === 'true';

    const accessible = await prisma.project.findMany({
      where: projectAccessWhere(session.user.id),
      select: { id: true },
    });
    const accessIds = new Set(accessible.map((p) => p.id));

    let projectFilter: string[] = [...accessIds];
    if (projectId) {
      if (!accessIds.has(projectId)) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      projectFilter = [projectId];
    }

    if (projectFilter.length === 0) {
      return NextResponse.json({
        events: [],
        nextCursor: null,
        lastSeenActivityAt: null,
        actors: [],
      });
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastSeenActivityAt: true },
    });

    const createdAtFilter: Prisma.DateTimeFilter = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
      ...(unread && me?.lastSeenActivityAt ? { gt: me.lastSeenActivityAt } : {}),
    };

    const where: Prisma.AuditLogWhereInput = {
      projectId: { in: projectFilter },
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
      ...(parcelId ? { parcelId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(statusField
        ? {
            action: 'STATUS_CHANGE',
            summary: { contains: `${statusField}:`, mode: 'insensitive' },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { summary: { contains: q, mode: 'insensitive' } },
              { entityType: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
    };

    const rows = await prisma.auditLog.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: order }, { id: order }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
    });

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const next = rows.pop()!;
      nextCursor = next.id;
    }

    const parcelIds = [...new Set(rows.map((r) => r.parcelId).filter(Boolean))] as string[];
    const parcels =
      parcelIds.length === 0
        ? []
        : await prisma.parcel.findMany({
            where: { id: { in: parcelIds } },
            select: {
              id: true,
              parcelNumber: true,
              pin: true,
              owner: true,
              easementNumber: true,
            },
          });
    const parcelMap = Object.fromEntries(parcels.map((p) => [p.id, p]));

    const events = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      summary: r.summary,
      changes: r.changes,
      projectId: r.projectId,
      parcelId: r.parcelId,
      user: r.user,
      project: r.project,
      parcel: r.parcelId ? parcelMap[r.parcelId] || null : null,
    }));

    let actors: { id: string; name: string | null; email: string }[] = [];
    if (includeActors) {
      const actorRows = await prisma.auditLog.findMany({
        where: {
          projectId: { in: projectFilter },
          userId: { not: null },
        },
        distinct: ['userId'],
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      actors = actorRows
        .map((r) => r.user)
        .filter((u): u is { id: string; name: string | null; email: string } => Boolean(u))
        .sort((a, b) =>
          (a.name || a.email).localeCompare(b.name || b.email, undefined, { sensitivity: 'base' })
        );
    }

    return NextResponse.json({
      events,
      nextCursor,
      lastSeenActivityAt: me?.lastSeenActivityAt || null,
      ...(includeActors ? { actors } : {}),
    });
  } catch (e) {
    console.error('activity GET', e);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
}

/** POST /api/activity — mark activity feed as read */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const at = body.at ? new Date(body.at) : new Date();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenActivityAt: at },
    });
    return NextResponse.json({ ok: true, lastSeenActivityAt: at });
  } catch (e) {
    console.error('activity seen', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
