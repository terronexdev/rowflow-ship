import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { statusCategoryEnum } from '@/lib/validations';
import { z } from 'zod';

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
  const notes = await prisma.note.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ notes });
}

const bodySchema = z.object({
  content: z.string().min(1),
  category: statusCategoryEnum.default('PROJECT'),
});

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
    const body = bodySchema.parse(await req.json());
    const note = await prisma.note.create({
      data: {
        projectId: id,
        content: body.content,
        category: body.category,
        authorId: session.user.id,
      },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
