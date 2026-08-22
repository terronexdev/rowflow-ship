import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleProject,
  assertProjectWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { updateExistingRightSchema, existingRightLinkSchema } from '@/lib/validations';
import { normalizeInstrumentNumber, parseRestrictionFlags } from '@/lib/parcels/existingRights';

async function loadRight(id: string) {
  return prisma.existingRight.findUnique({
    where: { id },
    include: {
      parcels: {
        include: { parcel: { select: { id: true, pin: true, parcelNumber: true, projectId: true } } },
      },
    },
  });
}

function serializeRight(r: any) {
  return {
    ...r,
    widthFeet: r.widthFeet != null ? Number(r.widthFeet) : null,
    restrictionFlags: parseRestrictionFlags(r.restrictionFlags),
    parcelCount: r.parcels?.length ?? 0,
    parcels: (r.parcels || []).map((l: any) => ({
      id: l.id,
      parcelId: l.parcelId,
      impact: l.impact,
      note: l.note,
      pin: l.parcel?.pin || l.parcel?.parcelNumber || null,
      parcelNumber: l.parcel?.parcelNumber || null,
    })),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const right = await loadRight(id);
    if (!right) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!(await getAccessibleProject(right.projectId, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ right: serializeRight(right) });
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
    const existing = await prisma.existingRight.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertProjectWritable(existing.projectId);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
    if (!(await getAccessibleProject(existing.projectId, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = updateExistingRightSchema.parse(await req.json());
    const data: any = {};
    const strFields = [
      'name',
      'grantor',
      'grantee',
      'county',
      'recordingBook',
      'recordingPage',
      'recordingInstrument',
      'widthNotes',
      'termNotes',
      'restrictionsNote',
      'geometrySource',
      'notes',
    ] as const;
    for (const f of strFields) {
      if (f in body) data[f] = (body as any)[f] || null;
    }
    if ('rightType' in body && body.rightType) data.rightType = body.rightType;
    if ('purpose' in body && body.purpose) data.purpose = body.purpose;
    if ('lifeStatus' in body && body.lifeStatus) data.lifeStatus = body.lifeStatus;
    if ('widthFeet' in body) data.widthFeet = body.widthFeet ?? null;
    if ('affectsProject' in body) data.affectsProject = body.affectsProject ?? null;
    if ('restrictionFlags' in body) data.restrictionFlags = body.restrictionFlags || [];
    if ('geometry' in body) data.geometry = body.geometry ?? null;
    if ('recordingDate' in body) {
      data.recordingDate = body.recordingDate ? new Date(body.recordingDate) : null;
    }
    if ('instrumentNumber' in body) {
      data.instrumentNumber = body.instrumentNumber?.trim() || null;
      data.instrumentNumberNorm = normalizeInstrumentNumber(body.instrumentNumber);
    }

    const right = await prisma.existingRight.update({
      where: { id },
      data,
      include: {
        parcels: {
          include: { parcel: { select: { id: true, pin: true, parcelNumber: true } } },
        },
      },
    });
    return NextResponse.json({ right: serializeRight(right) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.existingRight.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertProjectWritable(existing.projectId);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
    if (!(await getAccessibleProject(existing.projectId, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.existingRight.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

/** POST link a parcel to this instrument */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.existingRight.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertProjectWritable(existing.projectId);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
    if (!(await getAccessibleProject(existing.projectId, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = existingRightLinkSchema.parse(await req.json());
    const parcel = await prisma.parcel.findFirst({
      where: { id: body.parcelId, projectId: existing.projectId },
    });
    if (!parcel) return NextResponse.json({ error: 'Parcel not in project' }, { status: 400 });

    await prisma.existingRightParcel.upsert({
      where: {
        existingRightId_parcelId: { existingRightId: id, parcelId: body.parcelId },
      },
      create: {
        existingRightId: id,
        parcelId: body.parcelId,
        impact: body.impact || 'UNKNOWN',
        note: body.note || null,
      },
      update: {
        impact: body.impact || undefined,
        note: body.note !== undefined ? body.note : undefined,
      },
    });

    const right = await loadRight(id);
    return NextResponse.json({ right: serializeRight(right) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
