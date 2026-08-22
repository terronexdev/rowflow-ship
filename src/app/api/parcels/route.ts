import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parcelSchema } from '@/lib/validations';

// GET /api/parcels - Get parcels (optionally filtered by project)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const county = searchParams.get('county');
    
    // Build where clause
    const where: any = {
      project: {
        userId: session.user.id,
      },
    };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (county) {
      where.county = county;
    }
    
    const parcels = await prisma.parcel.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            notes: true,
            documents: true,
          },
        },
      },
      orderBy: {
        sequence: 'asc',
      },
    });
    
    return NextResponse.json({ parcels });
  } catch (error) {
    console.error('Error fetching parcels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parcels' },
      { status: 500 }
    );
  }
}

// POST /api/parcels - Create a new parcel
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const validatedData = parcelSchema.parse(body);
    
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id,
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }
    
    // Check parcel limit per project
    const parcelCount = await prisma.parcel.count({
      where: { projectId: validatedData.projectId },
    });
    
    if (
      subscription.parcelLimitPerProject !== -1 &&
      parcelCount >= subscription.parcelLimitPerProject
    ) {
      return NextResponse.json(
        {
          error: `Parcel limit reached for this project. Your ${subscription.tier} plan allows ${subscription.parcelLimitPerProject} parcels per project.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
    
    const parcel = await prisma.parcel.create({
      data: validatedData,
    });
    
    return NextResponse.json({ parcel }, { status: 201 });
  } catch (error) {
    console.error('Error creating parcel:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create parcel' },
      { status: 500 }
    );
  }
}

