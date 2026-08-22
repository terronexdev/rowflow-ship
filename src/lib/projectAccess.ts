import { prisma } from '@/lib/prisma';
import type { AssignmentRole, Project } from '@prisma/client';

/** Prisma where-clause: owner OR member OR current role assignment */
export function projectAccessWhere(userId: string) {
  return {
    OR: [
      { userId },
      { members: { some: { userId } } },
      { roleAssignments: { some: { userId, isCurrent: true } } },
    ],
  };
}

/** Compatibility error class (never thrown). */
export class DemoReadOnlyError extends Error {
  status = 403 as const;
  constructor(message = 'This project is read-only.') {
    super(message);
    this.name = 'DemoReadOnlyError';
  }
}

export function isDemoReadOnly(_projectId: string | null | undefined): boolean {
  return false;
}

export function assertProjectWritable(_projectId: string) {
  // no-op
}

export async function getAccessibleProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ...projectAccessWhere(userId) },
  });
}

/** Owner-only */
export async function getOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

export async function requireProjectOwner(projectId: string, userId: string) {
  return getOwnedProject(projectId, userId);
}

export async function getAccessibleParcel(parcelId: string, userId: string) {
  return prisma.parcel.findFirst({
    where: {
      id: parcelId,
      project: projectAccessWhere(userId),
    },
    include: { project: true },
  });
}

/** @deprecated use getAccessibleParcel */
export async function getOwnedParcel(parcelId: string, userId: string) {
  return getAccessibleParcel(parcelId, userId);
}

export function assertParcelWritable(_parcel: { projectId: string } | null | undefined) {
  // no-op
}

export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function dec(v: number | null | undefined) {
  if (v === null || v === undefined) return undefined;
  return v;
}

/**
 * Ensure user has a project seat and the given operational role.
 * Multi-role: adding a role does NOT remove other roles for this user.
 * Multiple people may hold the same role on a project.
 */
export async function ensureMemberAndRole(
  projectId: string,
  userId: string,
  role: AssignmentRole
) {
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, role },
    // Keep existing primary role; assignments are source of truth for multi-role
    update: {},
  });

  const existing = await prisma.roleAssignment.findFirst({
    where: { projectId, userId, role, isCurrent: true },
  });
  if (existing) return existing;

  return prisma.roleAssignment.create({
    data: {
      projectId,
      userId,
      role,
      isCurrent: true,
      effectiveFrom: new Date(),
    },
  });
}

/** End one operational role for a user (leave seat + other roles intact). */
export async function removeRoleAssignment(
  projectId: string,
  userId: string,
  role: AssignmentRole
) {
  await prisma.roleAssignment.updateMany({
    where: { projectId, userId, role, isCurrent: true },
    data: { isCurrent: false, effectiveTo: new Date() },
  });

  // If member.primary role was this one, point it at another current role if any
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (member?.role === role) {
    const remaining = await prisma.roleAssignment.findFirst({
      where: { projectId, userId, isCurrent: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (remaining) {
      await prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId } },
        data: { role: remaining.role },
      });
    }
  }
}

export async function acceptPendingInvitesForEmail(email: string, userId: string) {
  const now = new Date();
  const invites = await prisma.projectInvite.findMany({
    where: {
      email: { equals: email, mode: 'insensitive' },
      status: 'PENDING',
      expiresAt: { gt: now },
    },
  });

  for (const inv of invites) {
    await ensureMemberAndRole(inv.projectId, userId, inv.role);
    await prisma.projectInvite.update({
      where: { id: inv.id },
      data: { status: 'ACCEPTED', acceptedAt: now },
    });
  }

  return invites.length;
}

export type { Project };
