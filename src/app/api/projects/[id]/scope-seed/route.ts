import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOwnedProject, assertProjectWritable, DemoReadOnlyError } from '@/lib/projectAccess';
import { BudgetCategory, BudgetLineMode, LandUseCategory } from '@prisma/client';

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

type SeedParcel = {
  pin?: string;
  landUse?: string;
  easementAcres?: number;
  takeTarget?: number;
  unpriced?: boolean;
};

function lineTotal(mode: string, amount?: number, hours?: number, rate?: number, parcelCount = 0) {
  if (mode === 'HOURS_X_RATE') return Math.round((hours || 0) * (rate || 0) * 100) / 100;
  if (mode === 'PER_PARCEL') {
    const qty = (hours || 0) > 0 ? hours || 0 : Math.max(0, parcelCount);
    return Math.round((amount || 0) * qty * 100) / 100;
  }
  return Math.round((amount || 0) * 100) / 100;
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
          label: l.label || (cat === 'LAND' ? 'Scope take target' : null),
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
      await prisma.parcel.update({
        where: { id: hit.id },
        data: {
          ...(Number.isFinite(Number(sp.easementAcres))
            ? { easementAcres: Number(sp.easementAcres) }
            : {}),
          ...(USES.has(use as LandUseCategory) ? { matrixLandUse: use as LandUseCategory } : {}),
        },
      });
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
    // Never treat as offers — agents still create the real take
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
    note: 'Budget + PE acres + matrix land use seeded. No compensation offers created.',
  });
}
