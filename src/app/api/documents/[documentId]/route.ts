import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { del } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function verifyDocument(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
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
      url: true,
      name: true,
      category: true,
      parcel: { select: { projectId: true } },
      permit: { select: { projectId: true } },
    },
  });
}

async function deleteStoredFile(url: string) {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN && url.startsWith('https://')) {
      await del(url);
      return;
    }

    if (url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', url);
      await unlink(filePath);
    }
  } catch (error) {
    console.warn('Unable to delete stored document file:', error);
  }
}

// DELETE /api/documents/[documentId] - Delete a parcel document/photo
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const existingDocument = await verifyDocument(documentId, session.user.id);

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    if (existingDocument.parcelId) {
      await prisma.parcel.update({
        where: { id: existingDocument.parcelId },
        data: { updatedAt: new Date() },
      });
    }

    await deleteStoredFile(existingDocument.url);

    const projectId =
      existingDocument.projectId ||
      existingDocument.parcel?.projectId ||
      existingDocument.permit?.projectId ||
      null;
    const { logActivity } = await import('@/lib/activity/logActivity');
    await logActivity({
      userId: session.user.id,
      projectId,
      parcelId: existingDocument.parcelId,
      action: 'DELETE',
      entityType: 'document',
      entityId: documentId,
      summary: `Deleted file (${existingDocument.category}): ${existingDocument.name}`.slice(0, 120),
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting parcel document:', error);
    return NextResponse.json(
      { error: 'Failed to delete parcel document' },
      { status: 500 }
    );
  }
}
