import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parcelCostEntrySchema } from '@/lib/validations';
import { computeLaborAmount } from '@/lib/compensation/matrix';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import type {
  AssignmentRole,
  CostDiscipline,
  CostEntryType,
  CostExpenseCategory,
  CostFeeCode,
} from '@prisma/client';

const DISCIPLINE_DEFAULT_ROLE: Record<string, AssignmentRole> = {
  ROW: 'AGENT',
  TITLE: 'TITLE',
  SURVEY: 'SURVEY',
  APPRAISAL: 'APPRAISAL',
  LEGAL: 'LEGAL',
  CONSTRUCTION: 'CONSTRUCTION_SUPPORT',
  PERMITTING: 'PERMIT',
  GENERAL: 'AGENT',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await getAccessibleParcel(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const discipline = req.nextUrl.searchParams.get('discipline') || undefined;
  const entries = await prisma.parcelCostEntry.findMany({
    where: {
      parcelId: id,
      ...(discipline ? { discipline: discipline as CostDiscipline } : {}),
    },
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const billableTotal = entries
    .filter((e) => e.billable)
    .reduce((s, e) => s + Number(e.amount), 0);
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  const project = await prisma.project.findUnique({
    where: { id: access.projectId },
    select: { mileageRate: true, id: true },
  });

  return NextResponse.json({
    entries,
    total,
    billableTotal,
    mileageRate: project?.mileageRate != null ? Number(project.mileageRate) : 0.7,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const parcel = await getAccessibleParcel(id, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = parcelCostEntrySchema.parse(await req.json());
    const entryType = body.entryType as CostEntryType;
    const discipline = body.discipline as CostDiscipline;

    const project = await prisma.project.findUnique({ where: { id: parcel.projectId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    let hours: number | null = null;
    let role: AssignmentRole | null = null;
    let hourlyRate: number | null = null;
    let feeCode: CostFeeCode | null = null;
    let expenseCategory: CostExpenseCategory | null = null;
    let miles: number | null = null;
    let mileageRate: number | null = null;
    let amount = 0;
    if (entryType === 'TIME') {
      hours = body.hours!;
      role =
        (body.role as AssignmentRole) ||
        DISCIPLINE_DEFAULT_ROLE[discipline] ||
        'AGENT';
      const rateRow = await prisma.roleRate.findFirst({
        where: { projectId: parcel.projectId, role, isCurrent: true },
      });
      if (!rateRow) {
        return NextResponse.json(
          {
            error: `Set ${role.replaceAll('_', ' ')} hourly rate on Project People before logging time`,
          },
          { status: 400 }
        );
      }
      hourlyRate = Number(rateRow.hourlyRate);
      amount = computeLaborAmount(hours, hourlyRate);

    } else if (entryType === 'FEE') {
      feeCode = (body.feeCode as CostFeeCode) || 'OTHER';
      amount = body.feeAmount ?? 0;
    } else if (entryType === 'EXPENSE') {
      expenseCategory = (body.expenseCategory as CostExpenseCategory) || 'OTHER';
      amount = body.expenseAmount ?? 0;
    } else if (entryType === 'MILEAGE') {
      miles = body.miles!;
      mileageRate =
        body.mileageRate != null
          ? body.mileageRate
          : project.mileageRate != null
            ? Number(project.mileageRate)
            : 0.7;
      amount = Math.round(miles * mileageRate * 100) / 100;
      expenseCategory = 'MILEAGE';
    }

    const entry = await prisma.parcelCostEntry.create({
      data: {
        parcelId: id,
        userId: session.user.id,
        discipline,
        entryType,
        workDate: new Date(body.workDate),
        hours: hours,
        role: role,
        hourlyRate: hourlyRate,
        feeCode,
        expenseCategory,
        vendor: body.vendor || null,
        miles,
        mileageRate,
        amount,
        description: body.description || null,
        billable: body.billable ?? true,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: parcelId } = await params;
    const parcel = await getAccessibleParcel(parcelId, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const entryId = req.nextUrl.searchParams.get('entryId');
    if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 });

    const existing = await prisma.parcelCostEntry.findFirst({
      where: { id: entryId, parcelId },
    });
    if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    await prisma.parcelCostEntry.delete({ where: { id: entryId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
