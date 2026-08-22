import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/validations';
import { log } from '@/lib/logger';
import { freeLimitFields } from '@/lib/constants/subscription';

// GET /api/projects - Get all projects for the authenticated user
export async function GET(req: NextRequest) {
  let session: any;

  try {
    session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } },
          { roleAssignments: { some: { userId: session.user.id, isCurrent: true } } },
        ],
      },
      include: {
        _count: {
          select: { parcels: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    log.error('Failed to fetch projects', error instanceof Error ? error : new Error(String(error)), {
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  let session: any;
  let subscription: any;

  try {
    session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // After Neon cutover, JWT may still carry a user id from the old database.
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            'Your login session is from before the database move and no longer matches this app. Sign out completely (or clear site cookies for rowflow-alpha.vercel.app), then register or sign in again.',
          code: 'STALE_SESSION',
        },
        { status: 401 }
      );
    }

    // Check subscription limits
    subscription = await prisma.subscription.findUnique({
      where: { userId: dbUser.id },
    });

    // Auto-create FREE subscription if missing (safety fallback)
    if (!subscription) {
      log.info('Creating FREE subscription for user (missing subscription)', {
        userId: dbUser.id,
      });
      try {
        subscription = await prisma.subscription.create({
          data: {
            userId: dbUser.id,
            stripeCustomerId: null,
            ...freeLimitFields(),
          },
        });
      } catch (subErr) {
        // Race or FK — re-read
        subscription = await prisma.subscription.findUnique({
          where: { userId: dbUser.id },
        });
        if (!subscription) throw subErr;
      }
      // Terronex staff → PRO
      try {
        const { ensureCompedProIfEligible } = await import('@/lib/billing/comped');
        await ensureCompedProIfEligible(dbUser.id, dbUser.email);
        subscription = await prisma.subscription.findUnique({
          where: { userId: dbUser.id },
        });
      } catch {
        /* non-fatal */
      }
    }

    // Check project limit
    const projectCount = await prisma.project.count({
      where: { userId: dbUser.id },
    });

    if (
      subscription.projectLimit !== -1 &&
      projectCount >= subscription.projectLimit
    ) {
      return NextResponse.json(
        {
          error: `Project limit reached. Your ${subscription.tier} plan allows ${subscription.projectLimit} projects.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    log.debug('Creating new project', {
      userId: dbUser.id,
      hasData: !!body,
    });

    const validatedData = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        userId: dbUser.id,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });

    // Seed land matrix + schedule phases (best-effort)
    try {
      const { seedProjectDefaults } = await import('@/lib/projectSeed');
      await seedProjectDefaults(project.id);
    } catch (seedErr) {
      log.error(
        'Failed to seed project defaults',
        seedErr instanceof Error ? seedErr : new Error(String(seedErr)),
        { projectId: project.id }
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    log.error('Failed to create project', error instanceof Error ? error : new Error(String(error)), {
      userId: session?.user?.id,
      tier: subscription?.tier,
    });

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

