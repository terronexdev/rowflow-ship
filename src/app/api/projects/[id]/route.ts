import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProjectSchema } from '@/lib/validations';
import {
  projectAccessWhere,
  getOwnedProject,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

const projectInclude = {
  user: { select: { id: true, name: true, email: true } },
  parcels: {
    orderBy: [{ sequence: 'asc' as const }, { parcelNumber: 'asc' as const }],
    include: {
      _count: { select: { notes: true, documents: true } },
      notes: {
        orderBy: { createdAt: 'desc' as const },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      documents: {
        orderBy: { createdAt: 'desc' as const },
        include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      },
      contactLogs: {
        orderBy: { contactDate: 'desc' as const },
        take: 1,
        select: { contactDate: true, followUpDate: true },
      },
      encroachments: {
        select: { id: true, encroachmentType: true, disposition: true },
        orderBy: { sortOrder: 'asc' as const },
      },
      labels: { orderBy: { code: 'asc' as const } },
      existingRightLinks: {
        include: {
          existingRight: {
            select: {
              id: true,
              instrumentNumber: true,
              name: true,
              rightType: true,
              purpose: true,
              lifeStatus: true,
              restrictionFlags: true,
              widthFeet: true,
              grantor: true,
              grantee: true,
            },
          },
        },
      },
    },
  },
  layers: { orderBy: { createdAt: 'desc' as const } },
  existingRights: {
    select: {
      id: true,
      instrumentNumber: true,
      name: true,
      rightType: true,
      purpose: true,
      lifeStatus: true,
      geometry: true,
      parcels: { select: { parcelId: true } },
    },
  },
  landPaymentMatrix: {
    include: { rows: { orderBy: { sortOrder: 'asc' as const } } },
  },
  roleAssignments: {
    where: { isCurrent: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  roleRates: { where: { isCurrent: true } },
  budgetLines: { orderBy: { sortOrder: 'asc' as const } },
  schedulePhases: { orderBy: [{ track: 'asc' as const }, { sortOrder: 'asc' as const }] },
  permits: { orderBy: { updatedAt: 'desc' as const } },
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  _count: {
    select: { parcels: true, permits: true, documents: true, notes: true },
  },
};

// GET /api/projects/[id]
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

    const project = await prisma.project.findFirst({
      where: {
        id,
        ...projectAccessWhere(session.user.id),
      },
      include: projectInclude,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      project,
      access: {
        isOwner: project.userId === session.user.id,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PATCH owner-only
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

    const existingProject = await getOwnedProject(id, session.user.id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found or not owner' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        landBudget: validatedData.landBudget !== undefined ? validatedData.landBudget : undefined,
        laborBudget: validatedData.laborBudget !== undefined ? validatedData.laborBudget : undefined,
        offerRangeLowPct:
          validatedData.offerRangeLowPct !== undefined ? validatedData.offerRangeLowPct : undefined,
        offerRangeHighPct:
          validatedData.offerRangeHighPct !== undefined
            ? validatedData.offerRangeHighPct
            : undefined,
        centerlineData:
          validatedData.centerlineData !== undefined ? validatedData.centerlineData : undefined,
        rowExtents: validatedData.rowExtents !== undefined ? validatedData.rowExtents : undefined,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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

    const existingProject = await getOwnedProject(id, session.user.id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to delete project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
