import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleParcel,
  assertParcelWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { z } from 'zod';
import type { CondemnationStatus } from '@prisma/client';

const condemnationStatusEnum = z.enum([
  'NOT_STARTED',
  'NOTICE_SENT',
  'PETITION_FILED',
  'SERVED',
  'HEARING_SCHEDULED',
  'AWARD_ISSUED',
  'APPEALED',
  'TRIAL',
  'JUDGMENT',
  'POSSESSION_GRANTED',
  'COMPLETE',
]);

const num = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable().optional());

const dateStr = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return null;
  return v;
}, z.string().nullable().optional());

const str = z.string().optional().nullable();

const bodySchema = z.object({
  caseNumber: str,
  court: str,
  courtDistrict: str,
  courtAddress: str,
  judge: str,
  counsel: str,
  counselFirm: str,
  counselPhone: str,
  counselEmail: z.string().email().optional().or(z.literal('')).nullable(),
  opposingCounsel: str,
  opposingCounselFirm: str,
  opposingCounselPhone: str,
  opposingCounselEmail: z.string().email().optional().or(z.literal('')).nullable(),
  opposingCounselAddress: str,
  noticeSentDate: dateStr,
  petitionFiledDate: dateStr,
  servedDate: dateStr,
  hearingDate: dateStr,
  awardAmount: num,
  awardDate: dateStr,
  finalOfferAmount: num,
  finalOfferDate: dateStr,
  appealFiled: z.boolean().optional(),
  trialDate: dateStr,
  judgmentDate: dateStr,
  possessionDate: dateStr,
  legalCosts: num,
  status: condemnationStatusEnum.optional(),
  notes: str,
  syncParcelStatus: z.boolean().optional().default(true),
});

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function emptyToNull(v: string | null | undefined) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  return v;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await getAccessibleParcel(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await prisma.condemnationTracking.findMany({
    where: { parcelId: id },
    orderBy: { updatedAt: 'desc' },
  });

  const acceptedOffer = await prisma.compensationOffer.findFirst({
    where: { parcelId: id, decision: 'ACCEPTED' },
    orderBy: { createdAt: 'desc' },
  });
  const latestOffered = await prisma.compensationOffer.findFirst({
    where: {
      parcelId: id,
      decision: { in: ['OFFERED', 'PENDING_REVIEW', 'ACCEPTED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    current: rows[0] || null,
    history: rows,
    fromCompensation: {
      acceptedTotal: acceptedOffer ? Number(acceptedOffer.total) : null,
      acceptedAt: acceptedOffer?.createdAt ?? null,
      latestOfferTotal: latestOffered ? Number(latestOffered.total) : null,
      latestOfferDecision: latestOffered?.decision ?? null,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = bodySchema.parse(await req.json());
    const existing = await prisma.condemnationTracking.findFirst({
      where: { parcelId: id },
      orderBy: { updatedAt: 'desc' },
    });

    const data: Record<string, unknown> = {
      caseNumber: emptyToNull(body.caseNumber),
      court: emptyToNull(body.court),
      courtDistrict: emptyToNull(body.courtDistrict),
      courtAddress: emptyToNull(body.courtAddress),
      judge: emptyToNull(body.judge),
      counsel: emptyToNull(body.counsel),
      counselFirm: emptyToNull(body.counselFirm),
      counselPhone: emptyToNull(body.counselPhone),
      counselEmail: emptyToNull(body.counselEmail as string | null | undefined),
      opposingCounsel: emptyToNull(body.opposingCounsel),
      opposingCounselFirm: emptyToNull(body.opposingCounselFirm),
      opposingCounselPhone: emptyToNull(body.opposingCounselPhone),
      opposingCounselEmail: emptyToNull(body.opposingCounselEmail as string | null | undefined),
      opposingCounselAddress: emptyToNull(body.opposingCounselAddress),
      noticeSentDate: parseDate(body.noticeSentDate ?? null),
      petitionFiledDate: parseDate(body.petitionFiledDate ?? null),
      servedDate: parseDate(body.servedDate ?? null),
      hearingDate: parseDate(body.hearingDate ?? null),
      awardAmount: body.awardAmount ?? null,
      awardDate: parseDate(body.awardDate ?? null),
      finalOfferAmount: body.finalOfferAmount ?? null,
      finalOfferDate: parseDate(body.finalOfferDate ?? null),
      appealFiled: body.appealFiled,
      trialDate: parseDate(body.trialDate ?? null),
      judgmentDate: parseDate(body.judgmentDate ?? null),
      possessionDate: parseDate(body.possessionDate ?? null),
      legalCosts: body.legalCosts ?? null,
      status: body.status as CondemnationStatus | undefined,
      notes: emptyToNull(body.notes),
    };

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }

    let row;
    if (existing) {
      row = await prisma.condemnationTracking.update({
        where: { id: existing.id },
        data: clean,
      });
    } else {
      row = await prisma.condemnationTracking.create({
        data: {
          parcelId: id,
          status: (body.status as CondemnationStatus) || 'NOT_STARTED',
          ...clean,
        },
      });
    }

    if (body.syncParcelStatus !== false && body.status) {
      await prisma.parcel.update({
        where: { id },
        data: { condemnationStatus: body.status as CondemnationStatus },
      });
    }

    return NextResponse.json({ legal: row }, { status: existing ? 200 : 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 400 }
    );
  }
}
