import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isEmailConfigured, sendEmail } from '@/lib/email/send';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, offerId } = await params;

    const access = await getAccessibleParcel(id, session.user.id);
    if (!access) return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    try {
      assertParcelWritable(access);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const parcel = await prisma.parcel.findFirst({
      where: { id },
      include: {
        project: {
          include: {
            roleAssignments: {
              where: { isCurrent: true, role: { in: ['MANAGER', 'LEAD_AGENT'] } },
              include: { user: true },
            },
          },
        },
      },
    });
    if (!parcel) return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    const offer = await prisma.compensationOffer.findFirst({ where: { id: offerId, parcelId: id } });
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    if (!offer.outsideRange) {
      return NextResponse.json(
        { error: 'Offer is within range; counter-offer email not required' },
        { status: 400 }
      );
    }
    if (!offer.outsideRangeReason?.trim()) {
      return NextResponse.json(
        { error: 'Outside-range reason is required before sending' },
        { status: 400 }
      );
    }
    const recipients = parcel.project.roleAssignments
      .map((a) => a.user.email)
      .filter(Boolean) as string[];
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Assign Manager and Lead Agent on the Project before sending' },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'https://rowflow-alpha.vercel.app';
    const deepLink = `${appUrl}/projects/${parcel.projectId}/parcels/${parcel.id}/edit#compensation`;
    const subject = `Counter-offer review: ${parcel.pin || parcel.parcelNumber || parcel.id}`;
    const text = [
      `Project: ${parcel.project.name}`,
      `Project ID: ${parcel.project.projectCode || '—'}`,
      `WO#: ${parcel.project.workOrderNumber || '—'}`,
      `Parcel: ${parcel.pin || parcel.parcelNumber || parcel.id}`,
      `Address: ${parcel.propertyAddress || '—'}`,
      `Matrix range: $${Number(offer.rangeLow).toFixed(2)} – $${Number(offer.rangeHigh).toFixed(2)}`,
      `Negotiated: $${Number(offer.negotiatedAmount).toFixed(2)}`,
      `Damages: $${Number(offer.damages).toFixed(2)}`,
      `Other: $${Number(offer.otherAmount).toFixed(2)}`,
      `Total: $${Number(offer.total).toFixed(2)}`,
      `Reason: ${offer.outsideRangeReason}`,
      `Link: ${deepLink}`,
    ].join('\n');

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            'Email not configured (RESEND_API_KEY). Add RESEND_API_KEY and ROWFLOW_EMAIL_FROM on Vercel, then redeploy.',
          preview: { recipients, subject, text },
        },
        { status: 503 }
      );
    }

    const result = await sendEmail({ to: recipients, subject, text });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const updated = await prisma.compensationOffer.update({
      where: { id: offerId },
      data: {
        counterEmailSentAt: new Date(),
        counterEmailTo: recipients.join(','),
        decision: 'PENDING_REVIEW',
      },
    });
    return NextResponse.json({ offer: updated, sentTo: recipients, emailId: result.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
