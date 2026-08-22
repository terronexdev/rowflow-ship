import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateParcelSchema } from '@/lib/validations';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

// GET /api/parcels/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const base = await getAccessibleParcel(id, session.user.id);
    if (!base) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    const parcel = await prisma.parcel.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            landPaymentMatrix: { include: { rows: { orderBy: { sortOrder: 'asc' } } } },
            roleAssignments: {
              where: { isCurrent: true },
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            roleRates: { where: { isCurrent: true } },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, name: true, email: true } } },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: { uploadedBy: { select: { id: true, name: true, email: true } } },
        },
        compensationOffers: { orderBy: { createdAt: 'desc' }, take: 20 },
        appraisalTracking: { orderBy: { updatedAt: 'desc' }, take: 5 },
        condemnationTracking: { orderBy: { updatedAt: 'desc' }, take: 5 },
        costEntries: {
          orderBy: { workDate: 'desc' },
          take: 100,
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        labels: { orderBy: { code: 'asc' } },
        permits: { orderBy: { updatedAt: 'desc' } },
      },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    return NextResponse.json({
      parcel,
      access: { readOnly: false },
    });
  } catch (error) {
    console.error('Error fetching parcel:', error);
    return NextResponse.json({ error: 'Failed to fetch parcel' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingParcel = await getAccessibleParcel(id, session.user.id);
    if (!existingParcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }
    try {
      assertParcelWritable(existingParcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = await req.json();
    const validatedData = updateParcelSchema.parse(body);
    const before = { ...existingParcel } as Record<string, unknown>;

    const { applyStatusRollup } = await import('@/lib/parcels/statusRollup');
    const rollup = applyStatusRollup(
      {
        status: existingParcel.status,
        titleStatus: (existingParcel as any).titleStatus,
        surveyStatus: (existingParcel as any).surveyStatus,
        appraisalStatus: (existingParcel as any).appraisalStatus,
        acquisitionStatus: (existingParcel as any).acquisitionStatus,
        ptsStatus: (existingParcel as any).ptsStatus,
        permitStatus: (existingParcel as any).permitStatus,
        condemnationStatus: (existingParcel as any).condemnationStatus,
        damagesStatus: (existingParcel as any).damagesStatus,
        specialConditionsStatus: (existingParcel as any).specialConditionsStatus,
        existingRightsStatus: (existingParcel as any).existingRightsStatus,
        encroachmentStatus: (existingParcel as any).encroachmentStatus,
      },
      validatedData as any
    );
    const data = { ...validatedData, status: rollup.status };

    const parcel = await prisma.parcel.update({
      where: { id },
      data: data as any,
    });

    const { diffStatusFields, summaryFromChanges, logActivity } = await import(
      '@/lib/activity/logActivity'
    );
    const changes = diffStatusFields(before, parcel as unknown as Record<string, unknown>);
    if (changes.length) {
      await logActivity({
        userId: session.user.id,
        projectId: parcel.projectId,
        parcelId: parcel.id,
        action: 'STATUS_CHANGE',
        entityType: 'parcel',
        entityId: parcel.id,
        summary: summaryFromChanges(changes),
        changes,
      });
    }

    return NextResponse.json({ parcel });
  } catch (error) {
    console.error('Error updating parcel:', error);
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update parcel' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingParcel = await getAccessibleParcel(id, session.user.id);
    if (!existingParcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }
    try {
      assertParcelWritable(existingParcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    await prisma.parcel.delete({ where: { id } });
    return NextResponse.json({ message: 'Parcel deleted successfully' });
  } catch (error) {
    console.error('Error deleting parcel:', error);
    return NextResponse.json({ error: 'Failed to delete parcel' }, { status: 500 });
  }
}
