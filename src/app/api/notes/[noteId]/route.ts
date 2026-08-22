import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateNoteSchema } from '@/lib/validations';

async function verifyNote(noteId: string, userId: string) {
  return prisma.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { parcel: { project: { userId } } },
        { project: { userId } },
        { permit: { project: { userId } } },
      ],
    },
    select: {
      id: true,
      parcelId: true,
      projectId: true,
      content: true,
      category: true,
      parcel: { select: { projectId: true } },
      permit: { select: { projectId: true } },
    },
  });
}

// PATCH /api/notes/[noteId] - Update a note/comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    const existingNote = await verifyNote(noteId, session.user.id);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateNoteSchema.parse(body);

    const note = await prisma.note.update({
      where: { id: noteId },
      data: validatedData,
    });

    if (existingNote.parcelId) {
      await prisma.parcel.update({
        where: { id: existingNote.parcelId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error updating parcel note:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update parcel note' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[noteId] - Delete a note/comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    const existingNote = await verifyNote(noteId, session.user.id);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    if (existingNote.parcelId) {
      await prisma.parcel.update({
        where: { id: existingNote.parcelId },
        data: { updatedAt: new Date() },
      });
    }

    const projectId =
      existingNote.projectId ||
      existingNote.parcel?.projectId ||
      existingNote.permit?.projectId ||
      null;
    const { logActivity } = await import('@/lib/activity/logActivity');
    await logActivity({
      userId: session.user.id,
      projectId,
      parcelId: existingNote.parcelId,
      action: 'DELETE',
      entityType: 'note',
      entityId: noteId,
      summary: `Deleted note (${existingNote.category}): ${String(existingNote.content || '').slice(0, 60)}`,
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting parcel note:', error);
    return NextResponse.json(
      { error: 'Failed to delete parcel note' },
      { status: 500 }
    );
  }
}
