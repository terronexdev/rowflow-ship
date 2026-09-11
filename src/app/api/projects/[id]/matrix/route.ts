import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleProject, getOwnedProject, assertProjectWritable, DemoReadOnlyError } from '@/lib/projectAccess';
import { matrixPutSchema } from '@/lib/validations';
import { DEFAULT_MATRIX_LAND_USES } from '@/lib/constants';


export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const project = await getAccessibleProject(id, session.user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let matrix = await prisma.landPaymentMatrix.findUnique({
    where: { projectId: id },
    include: { rows: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!matrix) {
    // Don't auto-seed for non-owners
    const owner = await getOwnedProject(id, session.user.id);
    if (!owner) {
      return NextResponse.json({ matrix: null });
    }
    matrix = await prisma.landPaymentMatrix.create({
      data: {
        projectId: id,
        rows: {
          create: DEFAULT_MATRIX_LAND_USES.map((landUse, i) => ({
            landUse: landUse as any,
            unit: 'PER_ACRE',
            minAmount: 0,
            maxAmount: 0,
            sortOrder: i,
          })),
        },
      },
      include: { rows: { orderBy: { sortOrder: 'asc' } } },
    });
  }
  return NextResponse.json({ matrix });
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
    const project = await getOwnedProject(id, session.user.id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = matrixPutSchema.parse(await req.json());
    const matrix = await prisma.landPaymentMatrix.upsert({
      where: { projectId: id },
      create: { projectId: id },
      update: {},
    });
    await prisma.landPaymentMatrixRow.deleteMany({ where: { matrixId: matrix.id } });
    await prisma.landPaymentMatrixRow.createMany({
      data: body.rows.map((r, i) => ({
        matrixId: matrix.id,
        landUse: r.landUse,
        customLabel: r.customLabel || null,
        unit: r.unit || 'PER_ACRE',
        minAmount: r.minAmount,
        maxAmount: r.maxAmount,
        accessAmount: r.accessAmount ?? null,
        notes: r.notes || null,
        sortOrder: r.sortOrder ?? i,
      })),
    });
    const full = await prisma.landPaymentMatrix.findUnique({
      where: { id: matrix.id },
      include: { rows: { orderBy: { sortOrder: 'asc' } } },
    });
    return NextResponse.json({ matrix: full });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
