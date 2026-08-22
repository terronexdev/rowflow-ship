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

async function owned(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await owned(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const documents = await prisma.document.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ documents });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await owned(id, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size <= 0) return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Uploaded file exceeds the 25 MB limit' }, { status: 400 });
    }
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }

    const category = String(formData.get('category') || 'PROJECT');
    if (!ALLOWED_CATEGORIES.has(category as any)) {
      return NextResponse.json({ error: `Unsupported category: ${category}` }, { status: 400 });
    }

    const type = inferDocumentType(file.type, formData.get('type') as string | null);
    const name = String(formData.get('name') || file.name || type);
    const label = formData.get('label') ? String(formData.get('label')) : null;
    const url = await storeScopedFile('projects', id, file);

    const document = await prisma.document.create({
      data: {
        projectId: id,
        name,
        type,
        category: category as any,
        url,
        size: file.size,
        mimeType: file.type,
        label,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
