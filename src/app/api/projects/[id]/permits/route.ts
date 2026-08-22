import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { permitSchema } from '@/lib/validations';
import { getAccessibleProject } from '@/lib/projectAccess';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await getAccessibleProject(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const scope = req.nextUrl.searchParams.get('scope'); // all | project | parcel
  const parcelId = req.nextUrl.searchParams.get('parcelId') || undefined;

  const parcelInclude = {
    parcel: { select: { id: true, parcelNumber: true, pin: true, owner: true } },
  } as const;

  let permits;
  if (parcelId) {
    permits = await prisma.permit.findMany({
      where: { projectId: id, parcelId },
      orderBy: { updatedAt: 'desc' },
      include: parcelInclude,
    });
  } else if (scope === 'project') {
    permits = await prisma.permit.findMany({
      where: { projectId: id, parcelId: null },
      orderBy: { updatedAt: 'desc' },
      include: parcelInclude,
    });
  } else if (scope === 'parcel') {
    permits = await prisma.permit.findMany({
      where: { projectId: id, parcelId: { not: null } },
      orderBy: { updatedAt: 'desc' },
      include: parcelInclude,
    });
  } else {
    permits = await prisma.permit.findMany({
      where: { projectId: id },
      orderBy: { updatedAt: 'desc' },
      include: parcelInclude,
    });
  }

  return NextResponse.json({ permits });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await getAccessibleProject(id, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = permitSchema.parse(await req.json());

    if (body.parcelId) {
      const parcel = await prisma.parcel.findFirst({
        where: { id: body.parcelId, projectId: id },
      });
      if (!parcel) {
        return NextResponse.json({ error: 'Parcel not found on this project' }, { status: 400 });
      }
    }

    const permit = await prisma.permit.create({
      data: {
        projectId: id,
        parcelId: body.parcelId || null,
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
      include: {
        parcel: { select: { id: true, parcelNumber: true, pin: true, owner: true } },
      },
    });
    return NextResponse.json({ permit }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
