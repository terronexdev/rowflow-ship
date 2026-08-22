import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ALLOWED_CATEGORIES,
  isAllowedMimeType,
  inferDocumentType,
  MAX_UPLOAD_BYTES,
  storeScopedFile,
} from '@/lib/uploads';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

// POST /api/parcels/[id]/documents - Upload a parcel document/photo
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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Uploaded file exceeds the 25 MB limit' },
        { status: 400 }
      );
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }

    const category = String(formData.get('category') || 'GENERAL');
    if (!ALLOWED_CATEGORIES.has(category as any)) {
      return NextResponse.json(
        { error: `Unsupported document category: ${category}` },
        { status: 400 }
      );
    }

    const type = inferDocumentType(file.type, formData.get('type') as string | null);
    const name = String(formData.get('name') || file.name || type);
    const url = await storeScopedFile('parcels', id, file);

    const document = await prisma.document.create({
      data: {
        parcelId: id,
        name,
        type,
        category: category as any,
        url,
        size: file.size,
        mimeType: file.type,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
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
      entityType: 'document',
      entityId: document.id,
      summary: `Upload (${document.category}): ${document.name}`.slice(0, 120),
      changes: [
        { field: 'category', to: document.category },
        { field: 'name', to: document.name },
      ],
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading parcel document:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to upload parcel document' },
      { status: 500 }
    );
  }
}
