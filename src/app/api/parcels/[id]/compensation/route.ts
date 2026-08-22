import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compensationOfferSchema } from '@/lib/validations';
import { computeOfferRange, computeCompensationTotal } from '@/lib/compensation/matrix';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import type { CompensationDecision, LandUseCategory, MatrixUnit } from '@prisma/client';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const access = await getAccessibleParcel(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parcel = await prisma.parcel.findFirst({
    where: { id },
    include: {
      project: { include: { landPaymentMatrix: { include: { rows: true } } } },
      compensationOffers: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const offers = parcel.compensationOffers;
  const accepted = offers.find((o) => o.decision === 'ACCEPTED') || null;
  const offeredCount = offers.filter((o) =>
    ['OFFERED', 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'SUPERSEDED'].includes(o.decision)
  ).length;

  return NextResponse.json({
    offers,
    accepted,
    stats: {
      total: offers.length,
      offered: offeredCount,
      accepted: offers.filter((o) => o.decision === 'ACCEPTED').length,
      draft: offers.filter((o) => o.decision === 'DRAFT').length,
    },
    take: {
      matrixLandUse: parcel.matrixLandUse,
      matrixLandUseLabel: parcel.matrixLandUseLabel,
      easementAcres: parcel.easementAcresToAcquire ?? parcel.easementAcres,
      tceAcres: parcel.tceAcres,
    },
    matrix: parcel.project.landPaymentMatrix,
    project: {
      id: parcel.project.id,
      offerRangeLowPct: parcel.project.offerRangeLowPct,
      offerRangeHighPct: parcel.project.offerRangeHighPct,
    },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const access = await getAccessibleParcel(id, session.user.id);
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
        project: { include: { landPaymentMatrix: { include: { rows: true } } } },
      },
    });
    if (!parcel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = compensationOfferSchema.parse(await req.json());

    const landUse = (body.landUse || parcel.matrixLandUse) as LandUseCategory | null | undefined;
    const landUseLabel =
      body.landUseLabel ||
      (landUse === 'OTHER' ? parcel.matrixLandUseLabel : null) ||
      null;

    const acresRaw =
      body.easementAcres ??
      (parcel.easementAcresToAcquire != null
        ? Number(parcel.easementAcresToAcquire)
        : parcel.easementAcres != null
          ? Number(parcel.easementAcres)
          : null);

    if (!landUse) {
      return NextResponse.json(
        {
          error:
            'Set land use on Appraisal (matrix category) before recording compensation.',
        },
        { status: 400 }
      );
    }
    if (acresRaw == null || !(Number(acresRaw) > 0)) {
      return NextResponse.json(
        {
          error:
            'Set permanent easement take acres on Survey / take before recording compensation.',
        },
        { status: 400 }
      );
    }
    const easementAcres = Number(acresRaw);

    const rows = parcel.project.landPaymentMatrix?.rows || [];
    const row =
      rows.find(
        (r) =>
          r.landUse === landUse &&
          (landUse !== 'OTHER' ||
            !landUseLabel ||
            r.customLabel === landUseLabel)
      ) || rows.find((r) => r.landUse === landUse);
    if (!row) {
      return NextResponse.json(
        {
          error:
            'Land use not found on project matrix. Ask the owner to add this land use to the matrix.',
        },
        { status: 400 }
      );
    }

    const lowPct = Number(parcel.project.offerRangeLowPct) || 0.8;
    const highPct = Number(parcel.project.offerRangeHighPct) || 1.5;
    const range = computeOfferRange({
      row: {
        minAmount: Number(row.minAmount),
        maxAmount: Number(row.maxAmount),
        unit: row.unit as MatrixUnit,
      },
      acres: easementAcres,
      lowPct,
      highPct,
    });
    const damages = body.damages ?? 0;
    const otherAmount = body.otherAmount ?? 0;
    const total = computeCompensationTotal(body.negotiatedAmount, damages, otherAmount);
    const outsideRange = range.outsideRange(body.negotiatedAmount);

    let decision = (body.decision || 'DRAFT') as CompensationDecision;
    // OOR + reason without explicit decision → pending review
    if (outsideRange && body.outsideRangeReason?.trim() && decision === 'DRAFT') {
      decision = 'PENDING_REVIEW';
    }

    const offer = await prisma.$transaction(async (tx) => {
      if (decision === 'ACCEPTED') {
        await tx.compensationOffer.updateMany({
          where: { parcelId: id, decision: 'ACCEPTED' },
          data: { decision: 'SUPERSEDED' },
        });
      }

      const created = await tx.compensationOffer.create({
        data: {
          parcelId: id,
          landUse: landUse as LandUseCategory,
          landUseLabel: landUseLabel || null,
          matrixRowId: row.id,
          easementAcres,
          matrixMinUnit: Number(row.minAmount),
          matrixMaxUnit: Number(row.maxAmount),
          unit: row.unit,
          rangeLow: range.rangeLow,
          rangeHigh: range.rangeHigh,
          negotiatedAmount: body.negotiatedAmount,
          damages,
          otherAmount,
          total,
          outsideRange,
          outsideRangeReason: body.outsideRangeReason || null,
          decision,
          notes: body.notes || null,
          createdById: session.user.id,
        },
      });

      // Cache side-panel from accepted, else latest offered/pending, else this offer
      const cacheFrom =
        decision === 'ACCEPTED'
          ? created
          : (await tx.compensationOffer.findFirst({
              where: { parcelId: id, decision: 'ACCEPTED' },
              orderBy: { createdAt: 'desc' },
            })) || created;

      await tx.parcel.update({
        where: { id },
        data: {
          lastCompensationTotal: cacheFrom.total,
          lastCompensationLandUse: cacheFrom.landUseLabel || cacheFrom.landUse,
          lastCompensationOutsideRange: cacheFrom.outsideRange,
          ...(decision === 'ACCEPTED'
            ? {
                // Accepted offer ⇒ acquisition complete + overall ACQUIRED (unless condemned/relocated)
                acquisitionStatus:
                  parcel.acquisitionStatus === 'ACQUIRED'
                    ? parcel.acquisitionStatus
                    : 'ACQUIRED',
                status:
                  parcel.status === 'CONDEMNED' || parcel.status === 'RELOCATED'
                    ? parcel.status
                    : 'ACQUIRED',
              }
            : {}),
        },
      });

      return created;
    });

    const { logActivity } = await import('@/lib/activity/logActivity');
    await logActivity({
      userId: session.user.id,
      projectId: parcel.projectId,
      parcelId: id,
      action: outsideRange ? 'UPDATE' : 'CREATE',
      entityType: 'compensation',
      entityId: offer.id,
      summary:
        decision === 'ACCEPTED'
          ? `Accepted offer $${total.toLocaleString()} (${landUse})`
          : outsideRange
            ? `Outside-range offer $${total.toLocaleString()} (${landUse}) · ${decision}`
            : `Compensation ${decision.toLowerCase()} $${total.toLocaleString()} (${landUse})`,
      changes: [
        { field: 'negotiatedAmount', to: body.negotiatedAmount },
        { field: 'total', to: total },
        { field: 'outsideRange', to: outsideRange },
        { field: 'decision', to: decision },
        { field: 'easementAcres', to: easementAcres },
        { field: 'landUse', to: landUse },
      ],
    });

    return NextResponse.json({ offer, range }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}

/** PATCH existing offer decision (accept / reject / withdraw) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id: parcelId } = await params;
    const access = await getAccessibleParcel(parcelId, session.user.id);
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    try {
      assertParcelWritable(access);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const body = await req.json();
    const offerId = String(body.offerId || '');
    const decision = body.decision as CompensationDecision;
    if (!offerId || !decision) {
      return NextResponse.json({ error: 'offerId and decision required' }, { status: 400 });
    }
    const allowed: CompensationDecision[] = [
      'DRAFT',
      'OFFERED',
      'PENDING_REVIEW',
      'ACCEPTED',
      'REJECTED',
      'WITHDRAWN',
      'SUPERSEDED',
    ];
    if (!allowed.includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const existing = await prisma.compensationOffer.findFirst({
      where: { id: offerId, parcelId },
    });
    if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    const offer = await prisma.$transaction(async (tx) => {
      if (decision === 'ACCEPTED') {
        await tx.compensationOffer.updateMany({
          where: { parcelId, decision: 'ACCEPTED', id: { not: offerId } },
          data: { decision: 'SUPERSEDED' },
        });
      }
      const updated = await tx.compensationOffer.update({
        where: { id: offerId },
        data: {
          decision,
          ...(body.outsideRangeReason != null
            ? { outsideRangeReason: body.outsideRangeReason }
            : {}),
          ...(body.notes != null ? { notes: body.notes } : {}),
        },
      });

      const cacheFrom =
        (await tx.compensationOffer.findFirst({
          where: { parcelId, decision: 'ACCEPTED' },
          orderBy: { createdAt: 'desc' },
        })) ||
        (await tx.compensationOffer.findFirst({
          where: { parcelId },
          orderBy: { createdAt: 'desc' },
        }));

      if (cacheFrom) {
        await tx.parcel.update({
          where: { id: parcelId },
          data: {
            lastCompensationTotal: cacheFrom.total,
            lastCompensationLandUse: cacheFrom.landUseLabel || cacheFrom.landUse,
            lastCompensationOutsideRange: cacheFrom.outsideRange,
            ...(decision === 'ACCEPTED'
              ? {
                  acquisitionStatus: 'ACQUIRED',
                  status:
                    access.status === 'CONDEMNED' || access.status === 'RELOCATED'
                      ? access.status
                      : 'ACQUIRED',
                }
              : {}),
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ offer });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
