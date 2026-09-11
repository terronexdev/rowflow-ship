import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleProject,
  assertProjectWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; layerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, layerId } = await params;
    try {
      assertProjectWritable(id);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const project = await getAccessibleProject(id, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const existing = await prisma.projectLayer.findFirst({
      where: { id: layerId, projectId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
    }

    const body = await req.json();
    const features = Array.isArray(body.data?.features) ? body.data.features : [];
    const layer = await prisma.projectLayer.update({
      where: { id: layerId },
      data: {
        data: body.data ?? existing.data,
        featureCount: body.data ? features.length : existing.featureCount,
        ...(body.name != null ? { name: String(body.name) } : {}),
        ...(body.visible != null ? { visible: Boolean(body.visible) } : {}),
      },
    });

    return NextResponse.json({ layer });
  } catch (error) {
    console.error('Error updating project layer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project layer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; layerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, layerId } = await params;
    const layer = await prisma.projectLayer.findFirst({
      where: {
        id: layerId,
        projectId: id,
        project: { userId: session.user.id },
      },
    });

    if (!layer) {
      return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
    }

    await prisma.projectLayer.delete({ where: { id: layerId } });
    return NextResponse.json({ message: 'Layer deleted successfully' });
  } catch (error) {
    console.error('Error deleting project layer:', error);
    return NextResponse.json({ error: 'Failed to delete project layer' }, { status: 500 });
  }
}
