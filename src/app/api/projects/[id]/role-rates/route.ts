import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleProject,
  getOwnedProject,
  assertProjectWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { roleRatesPutSchema } from '@/lib/validations';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await getAccessibleProject(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const rates = await prisma.roleRate.findMany({
    where: { projectId: id, isCurrent: true },
  });
  return NextResponse.json({ rates });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    try {
      assertProjectWritable(id);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
    if (!(await getOwnedProject(id, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = roleRatesPutSchema.parse(await req.json());
    for (const r of body.rates) {
      await prisma.roleRate.updateMany({
        where: { projectId: id, role: r.role, isCurrent: true },
        data: { isCurrent: false, effectiveTo: new Date() },
      });
      await prisma.roleRate.create({
        data: {
          projectId: id,
          role: r.role,
          hourlyRate: r.hourlyRate,
          isCurrent: true,
          effectiveFrom: new Date(),
        },
      });
    }
    const rates = await prisma.roleRate.findMany({ where: { projectId: id, isCurrent: true } });
    return NextResponse.json({ rates });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
