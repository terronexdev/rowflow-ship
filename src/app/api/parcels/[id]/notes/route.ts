import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { noteSchema } from '@/lib/validations';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

// POST /api/parcels/[id]/notes - Add a note/comment to a parcel
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
    const parcel = await getAccessibleParcel(id, session.user.id);

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = await req.json();
    const validatedData = noteSchema.parse({
      ...body,
      parcelId: id,
    });

    const note = await prisma.note.create({
      data: {
        parcelId: id,
        content: validatedData.content,
        category: validatedData.category,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.parcel.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const { logActivity } = await import('@/lib/activity/logActivity');
    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: id,
      action: 'CREATE',
      entityType: 'note',
      entityId: note.id,
      summary: `Note (${note.category}): ${note.content.slice(0, 80)}`,
      changes: [{ field: 'category', to: note.category }],
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating parcel note:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create parcel note' },
      { status: 500 }
    );
  }
}
