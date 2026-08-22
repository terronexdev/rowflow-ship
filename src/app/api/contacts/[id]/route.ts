import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { contactLogUpdateSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity/logActivity';

function parseDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// PATCH /api/contacts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.contactLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    const parcel = await getAccessibleParcel(existing.parcelId, session.user.id);
    if (!parcel) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    assertParcelWritable(parcel);

    const body = await req.json();
    const data = contactLogUpdateSchema.parse(body);

    const contact = await prisma.contactLog.update({
      where: { id },
      data: {
        ...(data.contactType != null ? { contactType: data.contactType } : {}),
        ...(data.summary != null ? { summary: data.summary } : {}),
        ...(data.subject !== undefined ? { subject: data.subject || null } : {}),
        ...(data.outcome !== undefined ? { outcome: data.outcome || null } : {}),
        ...(data.contactDate !== undefined
          ? { contactDate: parseDate(data.contactDate) || existing.contactDate }
          : {}),
        ...(data.followUpDate !== undefined
          ? { followUpDate: parseDate(data.followUpDate) ?? null }
          : {}),
      },
    });

    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: parcel.id,
      action: 'UPDATE',
      entityType: 'contact_log',
      entityId: contact.id,
      summary: `Updated contact ${contact.contactType}`,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('contact PATCH', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 400 }
    );
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.contactLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    const parcel = await getAccessibleParcel(existing.parcelId, session.user.id);
    if (!parcel) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    assertParcelWritable(parcel);

    await prisma.contactLog.delete({ where: { id } });
    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: parcel.id,
      action: 'DELETE',
      entityType: 'contact_log',
      entityId: id,
      summary: 'Deleted contact log entry',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('contact DELETE', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
