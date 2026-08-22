import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleProject, getOwnedProject, assertProjectWritable, DemoReadOnlyError } from '@/lib/projectAccess';
import { schedulePutSchema } from '@/lib/validations';
import { ROW_SCHEDULE_PHASES, CONSTRUCTION_SCHEDULE_PHASES } from '@/lib/constants';
import type { SchedulePhaseKey, ScheduleTrack } from '@prisma/client';


async function ensurePhases(projectId: string) {
  const existing = await prisma.projectSchedulePhase.count({ where: { projectId } });
  if (existing > 0) return;
  const rows: { projectId: string; track: ScheduleTrack; phaseKey: SchedulePhaseKey; label: string; sortOrder: number }[] = [];
  ROW_SCHEDULE_PHASES.forEach((p, i) => {
    rows.push({ projectId, track: 'ROW', phaseKey: p.key as SchedulePhaseKey, label: p.label, sortOrder: i });
  });
  CONSTRUCTION_SCHEDULE_PHASES.forEach((p, i) => {
    rows.push({ projectId, track: 'CONSTRUCTION', phaseKey: p.key as SchedulePhaseKey, label: p.label, sortOrder: i });
  });
  await prisma.projectSchedulePhase.createMany({ data: rows });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!(await getAccessibleProject(id, session.user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ensurePhases(id);
  const phases = await prisma.projectSchedulePhase.findMany({
    where: { projectId: id },
    orderBy: [{ track: 'asc' }, { sortOrder: 'asc' }],
  });
  return NextResponse.json({ phases });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    try {
      assertProjectWritable(id);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
    if (!(await getOwnedProject(id, session.user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = schedulePutSchema.parse(await req.json());
    for (const p of body.phases) {
      await prisma.projectSchedulePhase.upsert({
        where: { projectId_phaseKey: { projectId: id, phaseKey: p.phaseKey as SchedulePhaseKey } },
        create: {
          projectId: id,
          track: p.track,
          phaseKey: p.phaseKey as SchedulePhaseKey,
          label: p.label || null,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          isComplete: p.isComplete ?? false,
          sortOrder: p.sortOrder ?? 0,
        },
        update: {
          label: p.label || null,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          isComplete: p.isComplete ?? false,
          sortOrder: p.sortOrder ?? 0,
        },
      });
    }
    const phases = await prisma.projectSchedulePhase.findMany({
      where: { projectId: id },
      orderBy: [{ track: 'asc' }, { sortOrder: 'asc' }],
    });
    return NextResponse.json({ phases });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 });
  }
}
