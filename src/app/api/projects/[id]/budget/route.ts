import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleProject, getOwnedProject, assertProjectWritable, DemoReadOnlyError } from '@/lib/projectAccess';
import { budgetPutSchema } from '@/lib/validations';


import { budgetLineTotal } from '@/lib/analytics/costBudget';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await getAccessibleProject(id, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [lines, parcelCount] = await Promise.all([
    prisma.budgetLine.findMany({ where: { projectId: id }, orderBy: { sortOrder: 'asc' } }),
    prisma.parcel.count({ where: { projectId: id } }),
  ]);
  const mapped = lines.map((l) => ({
    ...l,
    total: budgetLineTotal(l, parcelCount),
  }));
  const total = mapped.reduce((s, l) => s + Number(l.total), 0);
  return NextResponse.json({ lines: mapped, total, parcelCount });
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
    const body = budgetPutSchema.parse(await req.json());
    const parcelCount = await prisma.parcel.count({ where: { projectId: id } });
    await prisma.budgetLine.deleteMany({ where: { projectId: id } });
    if (body.lines.length) {
      await prisma.budgetLine.createMany({
        data: body.lines.map((l, i) => ({
          projectId: id,
          category: l.category,
          label: l.label || null,
          mode: l.mode || 'TOTAL',
          amount: l.amount ?? null,
          hours: l.hours ?? null,
          rate: l.rate ?? null,
          total: budgetLineTotal(l, parcelCount),
          sortOrder: l.sortOrder ?? i,
        })),
      });
    }
    const lines = await prisma.budgetLine.findMany({ where: { projectId: id }, orderBy: { sortOrder: 'asc' } });
    const mapped = lines.map((l) => ({ ...l, total: budgetLineTotal(l, parcelCount) }));
    const total = mapped.reduce((s, l) => s + Number(l.total), 0);
    return NextResponse.json({ lines: mapped, total, parcelCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
