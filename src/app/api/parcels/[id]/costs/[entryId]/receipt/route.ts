import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import {
  MAX_UPLOAD_BYTES,
  isAllowedMimeType,
  storeScopedFile,
} from '@/lib/uploads';

/** Attach finance receipt to a cost entry (not work-product Document). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: parcelId, entryId } = await params;

    const parcel = await getAccessibleParcel(parcelId, session.user.id);
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(parcel);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const entry = await prisma.parcelCostEntry.findFirst({
      where: { id: entryId, parcelId },
    });
    if (!entry) return NextResponse.json({ error: 'Cost entry not found' }, { status: 404 });

    if (entry.entryType === 'TIME') {
      return NextResponse.json(
        { error: 'Receipts attach to fees, expenses, or mileage — not time entries' },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
    }
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const url = await storeScopedFile('expenses', entryId, file);
    const updated = await prisma.parcelCostEntry.update({
      where: { id: entryId },
      data: {
        receiptUrl: url,
        receiptName: file.name,
        receiptMimeType: file.type,
        receiptSize: file.size,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ entry: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
