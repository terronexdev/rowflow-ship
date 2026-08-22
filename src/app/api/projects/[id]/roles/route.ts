import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rolesPutSchema } from '@/lib/validations';
import type { AssignmentRole } from '@prisma/client';
import { ensureMemberAndRole, removeRoleAssignment } from '@/lib/projectAccess';

async function owned(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await owned(id, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const current = await prisma.roleAssignment.findMany({
    where: { projectId: id, isCurrent: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({
    assignments: current,
  });
}

/** Legacy bulk setter: still multi-role add when id set; clear role when null */
async function setRole(projectId: string, role: AssignmentRole, userId: string | null | undefined) {
  if (userId === null || userId === undefined || userId === '') {
    // End all current holders of this role (legacy clear)
    await prisma.roleAssignment.updateMany({
      where: { projectId, role, isCurrent: true },
      data: { isCurrent: false, effectiveTo: new Date() },
    });
    return;
  }
  await ensureMemberAndRole(projectId, userId, role);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await owned(id, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = rolesPutSchema.parse(await req.json());
    if ('managerId' in body) await setRole(id, 'MANAGER', body.managerId);
    if ('leadAgentId' in body) await setRole(id, 'LEAD_AGENT', body.leadAgentId);
    if ('agentId' in body) await setRole(id, 'AGENT', body.agentId);
    return GET(req, { params: Promise.resolve({ id }) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
