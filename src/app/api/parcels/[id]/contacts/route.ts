import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { contactLogSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity/logActivity';

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// GET /api/parcels/[id]/contacts
export async function GET(
  _req: NextRequest,
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

    const contacts = await prisma.contactLog.findMany({
      where: { parcelId: id },
      orderBy: [{ contactDate: 'desc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('contacts GET', error);
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 });
  }
}

// POST /api/parcels/[id]/contacts
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
    assertParcelWritable(parcel);

    const body = await req.json();
    const data = contactLogSchema.parse(body);

    const contact = await prisma.contactLog.create({
      data: {
        parcelId: id,
        contactType: data.contactType,
        contactDate: parseDate(data.contactDate) || new Date(),
        subject: data.subject || null,
        summary: data.summary,
        outcome: data.outcome || null,
        followUpDate: parseDate(data.followUpDate),
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: id,
      action: 'CREATE',
      entityType: 'contact_log',
      entityId: contact.id,
      summary: `Contact ${contact.contactType}: ${contact.summary.slice(0, 80)}`,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('contacts POST', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contact' },
      { status: 400 }
    );
  }
}
