import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { permitSchema } from '@/lib/validations';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const permit = await prisma.permit.findFirst({
    where: {
      id,
      project: {
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } },
          { roleAssignments: { some: { userId: session.user.id, isCurrent: true } } },
        ],
      },
    },
    include: {
      notesList: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      project: true,
      parcel: { select: { id: true, pin: true, parcelNumber: true, owner: true } },
    },
  });
  if (!permit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ permit });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.permit.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: session.user.id },
            { members: { some: { userId: session.user.id } } },
            { roleAssignments: { some: { userId: session.user.id, isCurrent: true } } },
          ],
        },
      },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = permitSchema.partial().parse(await req.json());
    const permit = await prisma.permit.update({
      where: { id },
      data: {
        ...body,
        parcelId: body.parcelId === undefined ? undefined : body.parcelId || null,
        submittedDate:
          body.submittedDate === undefined
            ? undefined
            : body.submittedDate
              ? new Date(body.submittedDate)
              : null,
        approvedDate:
          body.approvedDate === undefined
            ? undefined
            : body.approvedDate
              ? new Date(body.approvedDate)
              : null,
        expirationDate:
          body.expirationDate === undefined
            ? undefined
            : body.expirationDate
              ? new Date(body.expirationDate)
              : null,
        contactEmail: body.contactEmail === '' ? null : body.contactEmail,
      },
    });
    return NextResponse.json({ permit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const existing = await prisma.permit.findFirst({
      where: {
        id,
        project: {
          OR: [
            { userId: session.user.id },
            { members: { some: { userId: session.user.id } } },
            { roleAssignments: { some: { userId: session.user.id, isCurrent: true } } },
          ],
        },
      },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Notes/documents cascade via Prisma onDelete
    await prisma.permit.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    console.error('permit delete', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete permit' },
      { status: 500 }
    );
  }
}
