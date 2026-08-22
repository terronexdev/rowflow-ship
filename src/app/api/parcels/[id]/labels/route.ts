import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parcelLabelsPutSchema } from '@/lib/validations';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import type { ParcelLabelCode } from '@prisma/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await getAccessibleParcel(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const labels = await prisma.parcelLabel.findMany({
    where: { parcelId: id },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json({ labels });
}

/** Replace full label set for parcel (idempotent PUT-style POST). */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const parcel = await getAccessibleParcel(id, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = parcelLabelsPutSchema.parse(await req.json());
    // Dedupe by code (last note wins)
    const byCode = new Map<string, string | null | undefined>();
    for (const row of body.labels) {
      byCode.set(row.code, row.note);
    }
    const next = Array.from(byCode.entries()).map(([code, note]) => ({
      code: code as ParcelLabelCode,
      note: note?.trim() ? note.trim() : null,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.parcelLabel.deleteMany({ where: { parcelId: id } });
      if (next.length) {
        await tx.parcelLabel.createMany({
          data: next.map((l) => ({
            parcelId: id,
            code: l.code,
            note: l.note,
          })),
        });
      }
    });

    const labels = await prisma.parcelLabel.findMany({
      where: { parcelId: id },
      orderBy: { code: 'asc' },
    });

    const { logActivity } = await import('@/lib/activity/logActivity');
    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: id,
      action: 'UPDATE',
      entityType: 'parcel_labels',
      entityId: id,
      summary: `Labels: ${labels.map((l) => l.code).join(', ') || '(none)'}`,
      changes: { labels: labels.map((l) => ({ code: l.code, note: l.note })) },
    });

    return NextResponse.json({ labels });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to save labels' },
      { status: 400 }
    );
  }
}
