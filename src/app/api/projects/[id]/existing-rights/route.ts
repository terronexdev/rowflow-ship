import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleProject,
  assertProjectWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { existingRightSchema } from '@/lib/validations';
import { normalizeInstrumentNumber, parseRestrictionFlags } from '@/lib/parcels/existingRights';

function serializeRight(r: any) {
  return {
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
      parcelNumber: l.parcel?.parcelNumber || null,
    })),
  };
}

// GET /api/projects/[id]/existing-rights
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await getAccessibleProject(id, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const rights = await prisma.existingRight.findMany({
      where: { projectId: id },
      orderBy: [{ instrumentNumber: 'asc' }, { updatedAt: 'desc' }],
      include: {
        parcels: {
          include: {
            parcel: { select: { id: true, pin: true, parcelNumber: true } },
          },
        },
      },
    });
    return NextResponse.json({ rights: rights.map(serializeRight) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST create instrument (optionally link parcel; link-if-match on instrument #)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: projectId } = await params;
    try {
      assertProjectWritable(projectId);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
    if (!(await getAccessibleProject(projectId, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = existingRightSchema.parse(await req.json());
    const norm = normalizeInstrumentNumber(body.instrumentNumber);

    if (norm && body.linkIfMatch !== false) {
      const match = await prisma.existingRight.findFirst({
        where: { projectId, instrumentNumberNorm: norm },
        include: {
          parcels: {
            include: { parcel: { select: { id: true, pin: true, parcelNumber: true } } },
          },
        },
      });
      if (match) {
        if (body.parcelId) {
          await prisma.existingRightParcel.upsert({
            where: {
              existingRightId_parcelId: {
                existingRightId: match.id,
                parcelId: body.parcelId,
              },
            },
            create: {
              existingRightId: match.id,
              parcelId: body.parcelId,
              impact: body.impact || 'UNKNOWN',
              note: body.linkNote || null,
            },
            update: {
              impact: body.impact || undefined,
              note: body.linkNote !== undefined ? body.linkNote : undefined,
            },
          });
        }
        const refreshed = await prisma.existingRight.findUnique({
          where: { id: match.id },
          include: {
            parcels: {
              include: { parcel: { select: { id: true, pin: true, parcelNumber: true } } },
            },
          },
        });
        return NextResponse.json({
          right: serializeRight(refreshed),
          linkedExisting: true,
          message: `Linked to existing instrument ${match.instrumentNumber || norm}`,
        });
      }
    }

    if (body.parcelId) {
      const parcel = await prisma.parcel.findFirst({
        where: { id: body.parcelId, projectId },
      });
      if (!parcel) return NextResponse.json({ error: 'Parcel not in project' }, { status: 400 });
    }

    const created = await prisma.existingRight.create({
      data: {
        projectId,
        instrumentNumber: body.instrumentNumber?.trim() || null,
        instrumentNumberNorm: norm,
        name: body.name || null,
        rightType: body.rightType,
        purpose: body.purpose,
        grantor: body.grantor || null,
        grantee: body.grantee || null,
        county: body.county || null,
        recordingBook: body.recordingBook || null,
        recordingPage: body.recordingPage || null,
        recordingInstrument: body.recordingInstrument || null,
        recordingDate: body.recordingDate ? new Date(body.recordingDate) : null,
        widthFeet: body.widthFeet ?? null,
        widthNotes: body.widthNotes || null,
        termNotes: body.termNotes || null,
        lifeStatus: body.lifeStatus,
        restrictionFlags: body.restrictionFlags || [],
        restrictionsNote: body.restrictionsNote || null,
        affectsProject: body.affectsProject ?? null,
        geometry: body.geometry ?? undefined,
        geometrySource: body.geometrySource || null,
        notes: body.notes || null,
        parcels: body.parcelId
          ? {
              create: {
                parcelId: body.parcelId,
                impact: body.impact || 'UNKNOWN',
                note: body.linkNote || null,
              },
            }
          : undefined,
      },
      include: {
        parcels: {
          include: { parcel: { select: { id: true, pin: true, parcelNumber: true } } },
        },
      },
    });

    return NextResponse.json({ right: serializeRight(created), linkedExisting: false }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
