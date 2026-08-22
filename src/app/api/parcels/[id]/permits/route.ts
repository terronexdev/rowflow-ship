import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { permitSchema } from '@/lib/validations';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await getAccessibleParcel(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const permits = await prisma.permit.findMany({
    where: { parcelId: id },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ permits });
}

export async function POST(
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

    const body = permitSchema.parse(await req.json());
    const permit = await prisma.permit.create({
      data: {
        projectId: parcel.projectId,
        parcelId: id,
        name: body.name,
        permitType: body.permitType,
        status: body.status,
        agency: body.agency || null,
        referenceNumber: body.referenceNumber || null,
        submittedDate: body.submittedDate ? new Date(body.submittedDate) : null,
        approvedDate: body.approvedDate ? new Date(body.approvedDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        permitteeName: body.permitteeName || null,
        permitteeOrg: body.permitteeOrg || null,
        contactName: body.contactName || null,
        contactPhone: body.contactPhone || null,
        contactEmail: body.contactEmail || null,
        contactAddress: body.contactAddress || null,
        notes: body.notes || null,
      },
    });

    const { logActivity } = await import('@/lib/activity/logActivity');
    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: id,
      action: 'CREATE',
      entityType: 'permit',
      entityId: permit.id,
      summary: `Permit created: ${permit.name} (${permit.permitType})`,
    });

    return NextResponse.json({ permit }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
