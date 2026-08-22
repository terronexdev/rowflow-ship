import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ensureMemberAndRole,
  getAccessibleProject,
  getOwnedProject,
  removeRoleAssignment,
} from '@/lib/projectAccess';
import { z } from 'zod';
import type { AssignmentRole } from '@prisma/client';
import { assignmentRoleEnum } from '@/lib/validations';
import { ASSIGNMENT_ROLE_VALUES } from '@/lib/constants';

/**
 * Unified People roster for a project.
 * GET: owner + members + pending invites + multi-role assignments + rates + suggestions
 * PATCH: add or remove an operational role (owner-only); multi-role safe
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const project = await getAccessibleProject(id, session.user.id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = project.userId === session.user.id;
    const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

    const [owner, members, invites, assignments, rates] = await Promise.all([
      prisma.user.findUnique({
        where: { id: project.userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.projectMember.findMany({
        where: { projectId: id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.projectInvite.findMany({
        where: { projectId: id, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.roleAssignment.findMany({
        where: { projectId: id, isCurrent: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.roleRate.findMany({
        where: { projectId: id, isCurrent: true },
      }),
    ]);

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://rowflow-alpha.vercel.app';

    const collabMemberships = await prisma.projectMember.findMany({
      where: {
        OR: [{ userId: session.user.id }, { project: { userId: session.user.id } }],
      },
      select: { projectId: true, userId: true },
      take: 500,
    });
    const myProjectIds = new Set<string>();
    const ownedProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true },
      take: 200,
    });
    ownedProjects.forEach((p) => myProjectIds.add(p.id));
    collabMemberships.forEach((m) => {
      if (m.userId === session.user.id) myProjectIds.add(m.projectId);
    });

    const collabUsers = await prisma.projectMember.findMany({
      where: {
        projectId: { in: Array.from(myProjectIds) },
        userId: { not: session.user.id },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 300,
    });

    const onThisProject = new Set<string>([project.userId, ...members.map((m) => m.userId)]);

    const suggestionMap = new Map<
      string,
      { id: string; name: string | null; email: string; reason: string }
    >();
    for (const m of collabUsers) {
      if (!m.user?.email || onThisProject.has(m.userId)) continue;
      if (q) {
        const hay = `${m.user.name || ''} ${m.user.email}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (!suggestionMap.has(m.userId)) {
        suggestionMap.set(m.userId, {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          reason: 'shared_project',
        });
      }
    }

    for (const a of assignments) {
      if (!a.user || onThisProject.has(a.userId)) continue;
      if (!suggestionMap.has(a.userId)) {
        suggestionMap.set(a.userId, {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email || '',
          reason: 'role_assignment',
        });
      }
    }

    // Multi-role: userId → role[]
    const rolesByUser: Record<string, string[]> = {};
    for (const a of assignments) {
      if (!rolesByUser[a.userId]) rolesByUser[a.userId] = [];
      if (!rolesByUser[a.userId].includes(a.role)) {
        rolesByUser[a.userId].push(a.role);
      }
    }

    // Legacy shape: role → first assignee (compat for old consumers)
    const byRole: Record<string, { userId: string; name?: string | null; email?: string | null }> =
      {};
    for (const a of assignments) {
      if (!byRole[a.role]) {
        byRole[a.role] = {
          userId: a.userId,
          name: a.user?.name,
          email: a.user?.email,
        };
      }
    }

    const ratesOut: Record<string, string> = {};
    for (const role of ASSIGNMENT_ROLE_VALUES) {
      ratesOut[role] = '';
    }
    for (const r of rates) {
      ratesOut[r.role] = String(Number(r.hourlyRate));
    }

    return NextResponse.json({
      owner,
      isOwner,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        roles: rolesByUser[m.userId] || (m.role ? [m.role] : []),
        name: m.user?.name,
        email: m.user?.email,
        createdAt: m.createdAt,
      })),
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
        inviteUrl: isOwner
          ? `${appUrl}/register?invite=${i.token}&email=${encodeURIComponent(i.email)}`
          : undefined,
      })),
      rolesByUser,
      assignments: byRole,
      assignmentList: assignments.map((a) => ({
        userId: a.userId,
        role: a.role,
        name: a.user?.name,
        email: a.user?.email,
      })),
      rates: ratesOut,
      suggestions: Array.from(suggestionMap.values()).slice(0, 20),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    );
  }
}

const patchSchema = z.object({
  userId: z.string().min(1),
  role: assignmentRoleEnum,
  action: z.enum(['add', 'remove']).default('add'),
});

/** Add or remove an operational role (owner only). Multi-role safe. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const owner = await getOwnedProject(id, session.user.id);
    if (!owner) {
      return NextResponse.json({ error: 'Only the owner can change roles' }, { status: 403 });
    }

    const body = patchSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const role = body.role as AssignmentRole;
    const label = role.replaceAll('_', ' ');

    if (body.action === 'remove') {
      await removeRoleAssignment(id, user.id, role);
      return NextResponse.json({
        ok: true,
        message: `Removed ${label} from ${user.name || user.email}`,
      });
    }

    // add
    if (user.id === owner.userId) {
      const existing = await prisma.roleAssignment.findFirst({
        where: { projectId: id, userId: user.id, role, isCurrent: true },
      });
      if (!existing) {
        await prisma.roleAssignment.create({
          data: {
            projectId: id,
            userId: user.id,
            role,
            isCurrent: true,
            effectiveFrom: new Date(),
          },
        });
      }
    } else {
      await ensureMemberAndRole(id, user.id, role);
    }

    return NextResponse.json({
      ok: true,
      message: `Added ${label} to ${user.name || user.email}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
