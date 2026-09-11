import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOwnedProject, assertProjectWritable, DemoReadOnlyError } from '@/lib/projectAccess';
import {
  BudgetCategory,
  BudgetLineMode,
  EncroachmentStatus,
  LandUseCategory,
  MatrixUnit,
} from '@prisma/client';

const CATS = new Set(Object.values(BudgetCategory));
const USES = new Set(Object.values(LandUseCategory));

type SeedLine = {
  category?: string;
  mode?: string;
  amount?: number;
  hours?: number;
  rate?: number;
  label?: string;
};

type SeedEncroachItem = {
  type?: string;
  inPe?: boolean;
  amount?: number;
  note?: string;
};

type SeedParcel = {
  pin?: string;
  landUse?: string;
  easementAcres?: number;
  accessAcres?: number;
  accessTemp?: boolean;
  takeTarget?: number;
  unpriced?: boolean;
  encroachmentStatus?: string;
  encroachAmount?: number;
  buildingsInRow?: number;
  encroachItems?: SeedEncroachItem[];
};

type SeedMatrixRow = {
  landUse?: string;
  amount?: number;
  accessAmount?: number;
  unit?: string;
  unpriced?: boolean;
  notes?: string;
};

function lineTotal(mode: string, amount?: number, hours?: number, rate?: number, parcelCount = 0) {
  if (mode === 'HOURS_X_RATE') return Math.round((hours || 0) * (rate || 0) * 100) / 100;
  if (mode === 'PER_PARCEL') {
    const qty = (hours || 0) > 0 ? hours || 0 : Math.max(0, parcelCount);
    return Math.round((amount || 0) * qty * 100) / 100;
  }
  return Math.round((amount || 0) * 100) / 100;
}

function mapEncroachType(raw: string | undefined): 'BUILDING' | 'SHED' | 'FENCE' | 'DRIVEWAY' | 'WELL' | 'OTHER' {
  const t = String(raw || '').toUpperCase();
  if (t === 'BUILDING' || t === 'SHED' || t === 'FENCE' || t === 'DRIVEWAY') return t;
  if (t === 'WELL_SEPTIC' || t === 'WELL') return 'WELL';
  return 'OTHER';
}

function mapEncroachStatus(raw: string | undefined): EncroachmentStatus | null {
  const s = String(raw || '').toUpperCase();
  if (s === 'CLEAR') return 'NONE';
  if (s === 'POTENTIAL_REMOVAL') return 'NEEDS_REMOVAL';
  if (s === 'PROXIMITY_REVIEW') return 'IDENTIFIED';
  if (s === 'UNKNOWN') return 'NOT_REVIEWED';
  if (['NOT_REVIEWED', 'NONE', 'IDENTIFIED', 'NEEDS_REMOVAL', 'CAN_REMAIN', 'REMOVED'].includes(s)) {
    return s as EncroachmentStatus;
  }
  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    assertProjectWritable(id);
  } catch (e) {
    if (e instanceof DemoReadOnlyError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  if (!(await getOwnedProject(id, session.user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const seed = body.seed && typeof body.seed === 'object' ? body.seed : body;
  if (!seed || typeof seed !== 'object') {
    return NextResponse.json({ error: 'Invalid seed JSON' }, { status: 400 });
  }

  const parcelCount = await prisma.parcel.count({ where: { projectId: id } });
  const budgetLines = Array.isArray(seed.budgetLines) ? (seed.budgetLines as SeedLine[]) : [];
  const created: SeedLine[] = [];
  if (budgetLines.length) {
    await prisma.budgetLine.deleteMany({ where: { projectId: id } });
    let i = 0;
    for (const l of budgetLines) {
      const cat = String(l.category || 'OTHER');
      if (!CATS.has(cat as BudgetCategory)) continue;
      const modeStr =
        l.mode === 'HOURS_X_RATE' ? 'HOURS_X_RATE' : l.mode === 'PER_PARCEL' ? 'PER_PARCEL' : 'TOTAL';
      const amount = Number(l.amount) || 0;
      const hours = Number(l.hours) || 0;
      const rate = Number(l.rate) || 0;
      const total = lineTotal(modeStr, amount, hours, rate, parcelCount);
      await prisma.budgetLine.create({
        data: {
          projectId: id,
          category: cat as BudgetCategory,
          label:
            l.label ||
            (cat === 'LAND' ? 'Scope take (PE + access)' : cat === 'ENCROACHMENTS' ? 'Scope encroach' : null),
          mode: modeStr as BudgetLineMode,
          amount,
          hours,
          rate,
          total,
          sortOrder: i++,
        },
      });
      created.push(l);
    }
  }

  const takeMatrix = seed.takeMatrix as
    | { tempAccessPct?: number; rows?: SeedMatrixRow[] }
    | null
    | undefined;
  if (takeMatrix && Array.isArray(takeMatrix.rows) && takeMatrix.rows.length) {
    const matrix = await prisma.landPaymentMatrix.upsert({
      where: { projectId: id },
      create: { projectId: id, tempAccessPct: Number(takeMatrix.tempAccessPct) > 0 ? Number(takeMatrix.tempAccessPct) : 0.5 },
      update: {
        tempAccessPct: Number(takeMatrix.tempAccessPct) > 0 ? Number(takeMatrix.tempAccessPct) : 0.5,
      },
    });
    await prisma.landPaymentMatrixRow.deleteMany({ where: { matrixId: matrix.id } });
    let i = 0;
    for (const r of takeMatrix.rows) {
      const use = String(r.landUse || '');
      if (!USES.has(use as LandUseCategory)) continue;
      const pe = Number(r.amount) || 0;
      const acc =
        r.accessAmount != null && Number.isFinite(Number(r.accessAmount)) ? Number(r.accessAmount) : pe * 0.5;
      const unit = String(r.unit || 'PER_ACRE').toUpperCase();
      await prisma.landPaymentMatrixRow.create({
        data: {
          matrixId: matrix.id,
          landUse: use as LandUseCategory,
          unit: (unit === 'PER_SQFT' || unit === 'FLAT' ? unit : 'PER_ACRE') as MatrixUnit,
          minAmount: pe,
          maxAmount: pe,
          accessAmount: acc,
          notes: r.unpriced ? 'Unpriced / coordination' : r.notes || null,
          sortOrder: i++,
        },
      });
    }
  }

  const seedParcels = Array.isArray(seed.parcels) ? (seed.parcels as SeedParcel[]) : [];
  let parcelsUpdated = 0;
  if (seedParcels.length) {
    const existing = await prisma.parcel.findMany({
      where: { projectId: id },
      select: { id: true, pin: true, parcelNumber: true },
    });
    const byPin = new Map(
      existing.map((p) => [String(p.pin || p.parcelNumber || '').replace(/\s+/g, ''), p])
    );
    for (const sp of seedParcels) {
      const key = String(sp.pin || '').replace(/\s+/g, '');
      const hit = byPin.get(key);
      if (!hit) continue;
      const use = String(sp.landUse || '');
      const encStatus = mapEncroachStatus(sp.encroachmentStatus);
      const encroachAmount = Number(sp.encroachAmount);
      await prisma.parcel.update({
        where: { id: hit.id },
        data: {
          ...(Number.isFinite(Number(sp.easementAcres)) ? { easementAcres: Number(sp.easementAcres) } : {}),
          ...(Number.isFinite(Number(sp.accessAcres)) ? { accessAcres: Number(sp.accessAcres) } : {}),
          ...(sp.accessTemp != null ? { accessTemp: Boolean(sp.accessTemp) } : {}),
          ...(USES.has(use as LandUseCategory) ? { matrixLandUse: use as LandUseCategory } : {}),
          ...(encStatus ? { encroachmentStatus: encStatus } : {}),
          ...(Number.isFinite(encroachAmount) ? { encroachAmount } : {}),
        },
      });
      await prisma.parcelEncroachment.deleteMany({
        where: { parcelId: hit.id, description: { startsWith: '[ROWScope]' } },
      });
      const items = Array.isArray(sp.encroachItems) ? sp.encroachItems : [];
      if (items.length) {
        for (const it of items) {
          const amt = Number(it.amount) || 0;
          await prisma.parcelEncroachment.create({
            data: {
              parcelId: hit.id,
              encroachmentType: mapEncroachType(it.type),
              description: `[ROWScope] ${it.note || it.type || 'item'}`,
              estimatedCost: amt || null,
              inPermanentEasement: it.inPe ? 'YES' : 'NO',
            },
          });
        }
      } else if (Number.isFinite(encroachAmount) && encroachAmount > 0) {
        await prisma.parcelEncroachment.create({
          data: {
            parcelId: hit.id,
            encroachmentType: 'BUILDING',
            description: '[ROWScope] desk encroach',
            estimatedCost: encroachAmount,
            inPermanentEasement: encStatus === 'NEEDS_REMOVAL' ? 'YES' : 'UNKNOWN',
            notes: `${sp.buildingsInRow || 0} building(s) in ROW`,
          },
        });
      }
      parcelsUpdated++;
    }
  }

  const snapshot = {
    source: 'rowscope',
    scopeId: seed.scopeId || null,
    name: seed.name || null,
    ingestedAt: new Date().toISOString(),
    totals: seed.totals || null,
    takeMatrix: seed.takeMatrix || null,
    parcels: seedParcels.map((p) => ({
      pin: p.pin,
      easementAcres: p.easementAcres,
      accessAcres: p.accessAcres,
      accessTemp: p.accessTemp,
      takeTarget: p.takeTarget,
      encroachAmount: p.encroachAmount,
      encroachmentStatus: p.encroachmentStatus,
    })),
    offersCreated: 0,
  };

  await prisma.project.update({
    where: { id },
    data: { scopeEstimateJson: snapshot as object },
  });

  return NextResponse.json({
    ok: true,
    budgetLines: created.length,
    parcelsUpdated,
    offersCreated: 0,
    note: 'Budget + PE/access acres + encroach $ + matrix seeded. No compensation offers created.',
  });
}
