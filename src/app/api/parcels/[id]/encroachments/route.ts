import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { parcelEncroachmentSchema } from '@/lib/validations';
import { suggestEncroachmentStatusFromItems } from '@/lib/parcels/encroachments';

function serialize(e: any) {
  return {
    ...e,
    estimatedCost: e.estimatedCost != null ? Number(e.estimatedCost) : null,
    actualCost: e.actualCost != null ? Number(e.actualCost) : null,
  };
}

async function applyRollup(parcelId: string) {
  const items = await prisma.parcelEncroachment.findMany({
    where: { parcelId },
    select: { disposition: true },
  });
  const status = suggestEncroachmentStatusFromItems(items.map((i) => i.disposition));
  await prisma.parcel.update({
    where: { id: parcelId },
    data: { encroachmentStatus: status },
  });
  return status;
}

// GET /api/parcels/[id]/encroachments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const parcel = await getAccessibleParcel(id, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = await prisma.parcelEncroachment.findMany({
      where: { parcelId: id },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });

    const estTotal = items.reduce(
      (s, i) => s + (i.estimatedCost != null ? Number(i.estimatedCost) : 0),
      0
    );
    const actTotal = items.reduce(
      (s, i) => s + (i.actualCost != null ? Number(i.actualCost) : 0),
      0
    );

    return NextResponse.json({
      items: items.map(serialize),
      encroachmentStatus: (parcel as any).encroachmentStatus || 'NOT_REVIEWED',
      totals: { estimatedCost: estTotal, actualCost: actTotal, count: items.length },
      suggestedStatus: suggestEncroachmentStatusFromItems(items.map((i) => i.disposition)),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST create item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = parcelEncroachmentSchema.parse(await req.json());
    const item = await prisma.parcelEncroachment.create({
      data: {
        parcelId,
        encroachmentType: body.encroachmentType,
        description: body.description || null,
        locationNote: body.locationNote || null,
        disposition: body.disposition,
        inPermanentEasement: body.inPermanentEasement || 'UNKNOWN',
        inTce: body.inTce || 'UNKNOWN',
        ownerResponsibility: body.ownerResponsibility || 'UNKNOWN',
        agreementRef: body.agreementRef || null,
        estimatedCost: body.estimatedCost ?? null,
        actualCost: body.actualCost ?? null,
        costNotes: body.costNotes || null,
        identifiedDate: body.identifiedDate ? new Date(body.identifiedDate) : null,
        resolvedDate: body.resolvedDate ? new Date(body.resolvedDate) : null,
        notes: body.notes || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    let encroachmentStatus = (parcel as any).encroachmentStatus;
    if (body.applyStatusRollup !== false) {
      encroachmentStatus = await applyRollup(parcelId);
    }

    return NextResponse.json(
      { item: serialize(item), encroachmentStatus },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
