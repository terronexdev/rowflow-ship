import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
