import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { updateParcelEncroachmentSchema } from '@/lib/validations';
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

async function loadItem(id: string) {
  return prisma.parcelEncroachment.findUnique({ where: { id } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const item = await loadItem(id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const parcel = await getAccessibleParcel(item.parcelId, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item: serialize(item) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await loadItem(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const parcel = await getAccessibleParcel(existing.parcelId, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = updateParcelEncroachmentSchema.parse(await req.json());
    const data: any = {};
    if (body.encroachmentType) data.encroachmentType = body.encroachmentType;
    if (body.disposition) data.disposition = body.disposition;
    if (body.inPermanentEasement) data.inPermanentEasement = body.inPermanentEasement;
    if (body.inTce) data.inTce = body.inTce;
    if (body.ownerResponsibility) data.ownerResponsibility = body.ownerResponsibility;
    for (const f of [
      'description',
      'locationNote',
      'agreementRef',
      'costNotes',
      'notes',
    ] as const) {
      if (f in body) data[f] = (body as any)[f] || null;
    }
    if ('estimatedCost' in body) data.estimatedCost = body.estimatedCost ?? null;
    if ('actualCost' in body) data.actualCost = body.actualCost ?? null;
    if ('sortOrder' in body && body.sortOrder != null) data.sortOrder = body.sortOrder;
    if ('identifiedDate' in body) {
      data.identifiedDate = body.identifiedDate ? new Date(body.identifiedDate) : null;
    }
    if ('resolvedDate' in body) {
      data.resolvedDate = body.resolvedDate ? new Date(body.resolvedDate) : null;
    }

    const item = await prisma.parcelEncroachment.update({ where: { id }, data });
    let encroachmentStatus = (parcel as any).encroachmentStatus;
    if (body.applyStatusRollup !== false) {
      encroachmentStatus = await applyRollup(existing.parcelId);
    }
    return NextResponse.json({ item: serialize(item), encroachmentStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await loadItem(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const parcel = await getAccessibleParcel(existing.parcelId, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const url = new URL(req.url);
    const apply = url.searchParams.get('rollup') !== '0';

    await prisma.parcelEncroachment.delete({ where: { id } });
    let encroachmentStatus = (parcel as any).encroachmentStatus;
    if (apply) {
      encroachmentStatus = await applyRollup(existing.parcelId);
    }
    return NextResponse.json({ ok: true, encroachmentStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
