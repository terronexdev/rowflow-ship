import {
  ROW_SCHEDULE_PHASES,
  CONSTRUCTION_SCHEDULE_PHASES,
} from '@/lib/constants';

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function countBy<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item) || 'NOT_STARTED';
    acc[k] = (acc[k] || 0) + 1;
  }
  return acc;
}

export function mergeCounts(
  ...maps: Array<Record<string, number> | undefined>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of maps) {
    if (!m) continue;
    for (const [k, v] of Object.entries(m)) {
      out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

export function pct(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10; // one decimal
}

const PHASE_LABELS: Record<string, string> = Object.fromEntries([
  ...ROW_SCHEDULE_PHASES.map((p) => [p.key, p.label]),
  ...CONSTRUCTION_SCHEDULE_PHASES.map((p) => [p.key, p.label]),
]);

export type PhaseHealth = 'COMPLETE' | 'LATE' | 'AT_RISK' | 'ON_TRACK' | 'NOT_STARTED';
export type ScheduleHealth = 'LATE' | 'AT_RISK' | 'ON_TRACK' | 'UNKNOWN';

export type SchedulePhaseInput = {
  id: string;
  track: string;
  phaseKey: string;
  label?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isComplete?: boolean | null;
  sortOrder?: number;
};

/** Whole calendar days from `from` to `to` (UTC date parts). Negative = past. */
export function daysBetweenUtc(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** v1: dates + optional isComplete — no percentComplete field */
export function evaluatePhase(
  phase: SchedulePhaseInput,
  now = new Date()
): {
  id: string;
  track: string;
  phaseKey: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  isComplete: boolean;
  percentComplete: number;
  isPastDue: boolean;
  daysToEnd: number | null;
  daysLate: number | null;
  health: PhaseHealth;
} {
  const start = phase.startDate ? new Date(phase.startDate) : null;
  const end = phase.endDate ? new Date(phase.endDate) : null;
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const markedComplete = Boolean(phase.isComplete);

  let health: PhaseHealth = 'NOT_STARTED';
  let isPastDue = false;
  let isComplete = false;
  let percentComplete = 0;
  let daysToEnd: number | null = null;
  let daysLate: number | null = null;

  if (end) {
    const d = daysBetweenUtc(startOfToday, end);
    if (d >= 0) daysToEnd = d;
    else daysLate = -d;
  }

  if (markedComplete) {
    health = 'COMPLETE';
    isComplete = true;
    percentComplete = 100;
    isPastDue = false;
  } else if (!start && !end) {
    health = 'NOT_STARTED';
  } else if (end && end < startOfToday) {
    // Without completion, past end = LATE (operational attention)
    health = 'LATE';
    isPastDue = true;
    percentComplete = 0;
  } else if (end) {
    const ms14 = 14 * 24 * 60 * 60 * 1000;
    if (end.getTime() - startOfToday.getTime() <= ms14) {
      health = 'AT_RISK';
      percentComplete = start && start <= startOfToday ? 50 : 0;
    } else {
      health = 'ON_TRACK';
      percentComplete = start && start <= startOfToday ? 25 : 0;
    }
  } else if (start && start <= startOfToday) {
    health = 'ON_TRACK';
    percentComplete = 25;
  } else {
    health = 'NOT_STARTED';
  }

  return {
    id: phase.id,
    track: phase.track,
    phaseKey: phase.phaseKey,
    label: phase.label || PHASE_LABELS[phase.phaseKey] || phase.phaseKey,
    startDate: start ? start.toISOString() : null,
    endDate: end ? end.toISOString() : null,
    isComplete,
    percentComplete,
    isPastDue,
    daysToEnd,
    daysLate,
    health,
  };
}

export function summarizeSchedule(phases: SchedulePhaseInput[], now = new Date()) {
  const evaluated = phases.map((p) => evaluatePhase(p, now));
  const counts = {
    complete: evaluated.filter((p) => p.health === 'COMPLETE').length,
    late: evaluated.filter((p) => p.health === 'LATE').length,
    atRisk: evaluated.filter((p) => p.health === 'AT_RISK').length,
    onTrack: evaluated.filter((p) => p.health === 'ON_TRACK').length,
    notStarted: evaluated.filter((p) => p.health === 'NOT_STARTED').length,
  };

  let health: ScheduleHealth = 'UNKNOWN';
  if (evaluated.length === 0) health = 'UNKNOWN';
  else if (counts.late > 0) health = 'LATE';
  else if (counts.atRisk > 0) health = 'AT_RISK';
  else if (counts.onTrack > 0 || counts.complete > 0) health = 'ON_TRACK';
  else health = 'UNKNOWN';

  return { phases: evaluated, counts, health };
}

export function isAcceptedDecision(decision: string | null | undefined): boolean {
  if (!decision) return false;
  return decision.toUpperCase() === 'ACCEPTED';
}

export function isActiveProjectStatus(status: string | null | undefined): boolean {
  if (!status) return true;
  return !/^(archived|complete|completed|cancelled|canceled|closed)$/i.test(status.trim());
}

export function computeRates(input: {
  total: number;
  acquired: number;
  ptsGranted: number;
  ptsProgress: number;
  offerCount: number;
  outsideRangeCount: number;
  acceptedOfferCount: number;
  acceptedOfferTotal: number;
}) {
  const { total, acquired, ptsGranted, ptsProgress, offerCount, outsideRangeCount } = input;
  return {
    acquiredPct: pct(acquired, total),
    ptsGrantedPct: pct(ptsGranted, total),
    ptsProgressPct: pct(ptsProgress, total),
    outsideRangeRatePct: pct(outsideRangeCount, offerCount),
    acceptedOfferCount: input.acceptedOfferCount,
    acceptedOfferTotal: round2(input.acceptedOfferTotal),
  };
}

export function ptsProgressCount(ptsBreakdown: Record<string, number>): number {
  return (
    (ptsBreakdown.REQUESTED || 0) +
    (ptsBreakdown.GRANTED || 0) +
    (ptsBreakdown.NOT_REQUIRED || 0)
  );
}

/** @deprecated import from costBudget — kept for existing imports */
export { laborBudgetFromCategories } from '@/lib/analytics/costBudget';

/**
 * True when billable labor spend is materially over budget.
 * Underspend (including $0 actual early in a job) is normal — not an attention flag.
 * Threshold: actual > budget + 25% of budget (i.e. actual > 1.25 × budget).
 */
export function isHighLaborVariance(laborBillable: number, laborBudget: number): boolean {
  if (laborBudget <= 0) return false;
  return laborBillable > laborBudget * 1.25;
}
