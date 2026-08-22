import { prisma } from '@/lib/prisma';
import { DEFAULT_MATRIX_LAND_USES, ROW_SCHEDULE_PHASES, CONSTRUCTION_SCHEDULE_PHASES } from '@/lib/constants';
import type { SchedulePhaseKey, ScheduleTrack } from '@prisma/client';

/** Seed matrix + schedule when a project is first created. */
export async function seedProjectDefaults(projectId: string) {
  await prisma.landPaymentMatrix.create({
    data: {
      projectId,
      rows: {
        create: DEFAULT_MATRIX_LAND_USES.map((landUse, i) => ({
          landUse: landUse as any,
          unit: 'PER_ACRE',
          minAmount: 0,
          maxAmount: 0,
          sortOrder: i,
        })),
      },
    },
  });

  const phases: {
    projectId: string;
    track: ScheduleTrack;
    phaseKey: SchedulePhaseKey;
    label: string;
    sortOrder: number;
  }[] = [];

  ROW_SCHEDULE_PHASES.forEach((p, i) => {
    phases.push({
      projectId,
      track: 'ROW',
      phaseKey: p.key as SchedulePhaseKey,
      label: p.label,
      sortOrder: i,
    });
  });
  CONSTRUCTION_SCHEDULE_PHASES.forEach((p, i) => {
    phases.push({
      projectId,
      track: 'CONSTRUCTION',
      phaseKey: p.key as SchedulePhaseKey,
      label: p.label,
      sortOrder: i,
    });
  });

  await prisma.projectSchedulePhase.createMany({ data: phases });
}
