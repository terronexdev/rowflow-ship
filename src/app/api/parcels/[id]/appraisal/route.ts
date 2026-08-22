import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { z } from 'zod';
import type { AppraisalStatus, AppraisalType } from '@prisma/client';

const appraisalStatusEnum = z.enum([
  'NOT_STARTED',
  'ORDERED',
  'INSPECTION_SCHEDULED',
  'DRAFT_RECEIVED',
  'UNDER_REVIEW',
  'FINAL',
  'HOLD',
]);

const appraisalTypeEnum = z.enum(['FEE_SIMPLE', 'EASEMENT', 'DAMAGES_ONLY', 'REVIEW']);

const num = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable().optional());

const dateStr = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return null;
  return v;
}, z.string().nullable().optional());

const appraisalBodySchema = z.object({
  appraiser: z.string().optional().nullable(),
  appraisalType: appraisalTypeEnum.optional(),
  scope: z.string().optional().nullable(),
  orderDate: dateStr,
  inspectionDate: dateStr,
  draftDate: dateStr,
  reviewDate: dateStr,
  finalDate: dateStr,
  beforeValue: num,
  afterValue: num,
  easementValue: num,
  damageValue: num,
  totalValue: num,
  cost: num,
  bpid: z.string().optional().nullable(),
  workOrder: z.string().optional().nullable(),
  status: appraisalStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  /** Also sync parcel.appraisalStatus */
  syncParcelStatus: z.boolean().optional().default(true),
});

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dec(v: number | null | undefined) {
  if (v === null || v === undefined) return undefined;
  return v;
}

/** GET latest appraisal + history for parcel */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await getAccessibleParcel(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await prisma.appraisalTracking.findMany({
    where: { parcelId: id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    current: rows[0] || null,
    history: rows,
    parcelAppraisalStatus: access.project
      ? (await prisma.parcel.findUnique({
          where: { id },
          select: { appraisalStatus: true },
        }))?.appraisalStatus
      : undefined,
  });
}

/** POST create/update current appraisal (upsert latest) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const access = await getAccessibleParcel(id, session.user.id);
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(access);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = appraisalBodySchema.parse(await req.json());
    const existing = await prisma.appraisalTracking.findFirst({
      where: { parcelId: id },
      orderBy: { updatedAt: 'desc' },
    });

    const data = {
      appraiser: body.appraiser ?? undefined,
      appraisalType: (body.appraisalType as AppraisalType) || undefined,
      scope: body.scope ?? undefined,
      orderDate: parseDate(body.orderDate ?? null),
      inspectionDate: parseDate(body.inspectionDate ?? null),
      draftDate: parseDate(body.draftDate ?? null),
      reviewDate: parseDate(body.reviewDate ?? null),
      finalDate: parseDate(body.finalDate ?? null),
      beforeValue: dec(body.beforeValue ?? null),
      afterValue: dec(body.afterValue ?? null),
      easementValue: dec(body.easementValue ?? null),
      damageValue: dec(body.damageValue ?? null),
      totalValue: dec(body.totalValue ?? null),
      cost: dec(body.cost ?? null),
      bpid: body.bpid ?? undefined,
      workOrder: body.workOrder ?? undefined,
      status: (body.status as AppraisalStatus) || undefined,
      notes: body.notes ?? undefined,
    };

    // Clean undefined for prisma
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }

    let row;
    if (existing) {
      row = await prisma.appraisalTracking.update({
        where: { id: existing.id },
        data: clean,
      });
    } else {
      row = await prisma.appraisalTracking.create({
        data: {
          parcelId: id,
          status: (body.status as AppraisalStatus) || 'NOT_STARTED',
          appraisalType: (body.appraisalType as AppraisalType) || 'EASEMENT',
          ...clean,
        },
      });
    }

    if (body.syncParcelStatus !== false && body.status) {
      await prisma.parcel.update({
        where: { id },
        data: { appraisalStatus: body.status as AppraisalStatus },
      });
    }

    return NextResponse.json({ appraisal: row }, { status: existing ? 200 : 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
