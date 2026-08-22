import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleProject,
  assertProjectWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

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
    const project = await getAccessibleProject(id, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const layers = await prisma.projectLayer.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ layers });
  } catch (error) {
    console.error('Error fetching project layers:', error);
    return NextResponse.json({ error: 'Failed to fetch project layers' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
      assertProjectWritable(id);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    // Owner or team member with access
    const project = await getAccessibleProject(id, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
    const features = Array.isArray(body.data?.features) ? body.data.features : [];
    const layer = await prisma.projectLayer.create({
      data: {
        projectId: id,
        name: String(body.name || 'Reference Layer'),
        datasetId: body.datasetId ? String(body.datasetId) : null,
        sourceUrl: body.sourceUrl ? String(body.sourceUrl) : null,
        kind: body.kind ? String(body.kind) : 'design',
        geometryType: body.geometryType ? String(body.geometryType) : null,
        featureCount: features.length,
        data: body.data,
        visible: body.visible !== false,
        opacity: typeof body.opacity === 'number' ? body.opacity : 0.55,
      },
    });

    return NextResponse.json({ layer }, { status: 201 });
  } catch (error) {
    console.error('Error creating project layer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project layer' },
      { status: 500 }
    );
  }
}
