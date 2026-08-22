import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { parseRestrictionFlags } from '@/lib/parcels/existingRights';

// GET /api/parcels/[id]/existing-rights — linked instruments + project catalog
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const parcel = await getAccessibleParcel(id, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const links = await prisma.existingRightParcel.findMany({
      where: { parcelId: id },
      include: {
        existingRight: {
          include: {
            parcels: {
              include: { parcel: { select: { id: true, pin: true, parcelNumber: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const catalog = await prisma.existingRight.findMany({
      where: { projectId: parcel.projectId },
      orderBy: [{ instrumentNumber: 'asc' }, { updatedAt: 'desc' }],
      include: {
        _count: { select: { parcels: true } },
        parcels: {
          include: { parcel: { select: { id: true, pin: true, parcelNumber: true } } },
        },
      },
    });

    const serialize = (r: any) => ({
      ...r,
      widthFeet: r.widthFeet != null ? Number(r.widthFeet) : null,
      restrictionFlags: parseRestrictionFlags(r.restrictionFlags),
      parcelCount: r.parcels?.length ?? r._count?.parcels ?? 0,
      parcels: (r.parcels || []).map((l: any) => ({
        id: l.id,
        parcelId: l.parcelId,
        impact: l.impact,
        note: l.note,
        pin: l.parcel?.pin || l.parcel?.parcelNumber || null,
      })),
    });

    return NextResponse.json({
      linked: links.map((l) => ({
        linkId: l.id,
        impact: l.impact,
        note: l.note,
        right: serialize(l.existingRight),
      })),
      catalog: catalog.map(serialize),
      existingRightsStatus: (parcel as any).existingRightsStatus || 'NOT_REVIEWED',
      parcelClass: (parcel as any).parcelClass || 'UNKNOWN',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE unlink: body { existingRightId }
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
    const body = await req.json().catch(() => ({}));
    const existingRightId = String(body.existingRightId || '');
    if (!existingRightId) {
      return NextResponse.json({ error: 'existingRightId required' }, { status: 400 });
    }
    await prisma.existingRightParcel.deleteMany({
      where: { parcelId, existingRightId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
