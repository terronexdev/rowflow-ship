import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ALLOWED_CATEGORIES,
  MAX_UPLOAD_BYTES,
  inferDocumentType,
  isAllowedMimeType,
  storeScopedFile,
} from '@/lib/uploads';
import { getAccessibleProject } from '@/lib/projectAccess';

async function accessiblePermit(permitId: string, userId: string) {
  return prisma.permit.findFirst({
    where: {
      id: permitId,
      project: {
        OR: [
          { userId },
          { members: { some: { userId } } },
          { roleAssignments: { some: { userId, isCurrent: true } } },
        ],
      },
    },
    include: { project: { select: { id: true, userId: true } } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const permit = await accessiblePermit(id, session.user.id);
  if (!permit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const documents = await prisma.document.findMany({
    where: { permitId: id },
    orderBy: { createdAt: 'desc' },
  });
  const notes = await prisma.note.findMany({
    where: { permitId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ documents, notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const permit = await accessiblePermit(id, session.user.id);
    if (!permit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
    }
    if (!isAllowedMimeType(file.type || 'application/octet-stream')) {
      return NextResponse.json(
        { error: 'Unsupported file type (PDF, Office, images, text/csv)' },
        { status: 400 }
      );
    }
    let category = String(form.get('category') || 'PERMIT');
    if (!ALLOWED_CATEGORIES.has(category as any)) category = 'PERMIT';
    const label = form.get('label') ? String(form.get('label')) : null;
    const typeHint = form.get('type') ? String(form.get('type')) : null;

    const url = await storeScopedFile('permits', id, file);
    const document = await prisma.document.create({
      data: {
        permitId: id,
        projectId: permit.projectId,
        name: file.name,
        type: inferDocumentType(file.type || 'application/octet-stream', typeHint),
        category: category as any,
        url,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        label,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    console.error('permit document upload', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
