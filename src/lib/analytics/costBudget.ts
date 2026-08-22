/**
 * Map parcel cost ledger → project budget categories (actuals).
 * Single place for discipline/type → budget key.
 * (No import from statsHelpers — avoid circular re-export.)
 */

import { BUDGET_CATEGORY_LABELS, BUDGET_CATEGORY_OPTIONS } from '@/lib/constants';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function parcelQty(line: { hours?: unknown }, parcelCount = 0): number {
  const q = Number(line.hours);
  return q > 0 ? q : Math.max(0, parcelCount);
}

export function budgetLineTotal(
  line: { mode?: string; amount?: unknown; hours?: unknown; rate?: unknown },
  parcelCount = 0
): number {
  const mode = String(line.mode || 'TOTAL');
  if (mode === 'HOURS_X_RATE') {
    return round2((Number(line.hours) || 0) * (Number(line.rate) || 0));
  }
  if (mode === 'PER_PARCEL') {
    return round2((Number(line.amount) || 0) * parcelQty(line, parcelCount));
  }
  return round2(Number(line.amount) || 0);
}

export type CostLike = {
  discipline: string;
  entryType: string;
  amount: number | string | { toString(): string };
  billable?: boolean | null;
};

export type LaborLike = {
  role: string;
  amount: number | string | { toString(): string };
  billable?: boolean | null;
  /** When set, this labor row was dual-written from a cost entry — skip to avoid double count */
  linkedToCost?: boolean;
};

/** Labor / professional services budget keys (exclude land, permits, pure OPEX, damages) */
export const LABORISH_BUDGET_KEYS = [
  'ROW_LABOR',
  'TITLE_LABOR',
  'SURVEY_LABOR',
  'APPRAISAL',
  'LEGAL',
  'CONSTRUCTION_LABOR',
] as const;

export function budgetCategoryForCost(entry: {
  discipline: string;
  entryType: string;
}): string {
  const type = entry.entryType;
  const d = entry.discipline;

  if (type === 'MILEAGE') return 'MILEAGE';
  if (type === 'EXPENSE') return 'EXPENSES';

  switch (d) {
    case 'ROW':
      return 'ROW_LABOR';
    case 'TITLE':
      return 'TITLE_LABOR';
    case 'SURVEY':
      return 'SURVEY_LABOR';
    case 'APPRAISAL':
      return 'APPRAISAL';
    case 'LEGAL':
      return 'LEGAL';
    case 'CONSTRUCTION':
      return 'CONSTRUCTION_LABOR';
    case 'PERMITTING':
      return 'PERMITS';
    case 'GENERAL':
    default:
      return type === 'FEE' ? 'OTHER' : 'ROW_LABOR';
  }
}

/** AssignmentRole → budget labor category (legacy LaborEntry without cost ledger) */
export function budgetCategoryForLaborRole(role: string): string {
  switch (role) {
    case 'TITLE':
      return 'TITLE_LABOR';
    case 'SURVEY':
      return 'SURVEY_LABOR';
    case 'APPRAISAL':
      return 'APPRAISAL';
    case 'LEGAL':
      return 'LEGAL';
    case 'CONSTRUCTION_SUPPORT':
      return 'CONSTRUCTION_LABOR';
    case 'PERMIT':
      return 'PERMITS';
    case 'MANAGER':
    case 'LEAD_AGENT':
    case 'AGENT':
    case 'COORDINATOR':
    case 'RECORDS_AGENT':
    default:
      return 'ROW_LABOR';
  }
}

/** Sum billable (default) costs into budget category buckets */
export function actualsFromCostEntries(
  entries: CostLike[],
  opts?: { billableOnly?: boolean }
): Record<string, number> {
  const billableOnly = opts?.billableOnly !== false;
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (billableOnly && e.billable === false) continue;
    const key = budgetCategoryForCost(e);
    const amt = Number(e.amount) || 0;
    out[key] = (out[key] || 0) + amt;
  }
  return out;
}

/** Legacy labor rows → buckets (only rows not already dual-written from costs) */
export function actualsFromLaborEntries(
  entries: LaborLike[],
  opts?: { billableOnly?: boolean }
): Record<string, number> {
  const billableOnly = opts?.billableOnly !== false;
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (billableOnly && e.billable === false) continue;
    if (e.linkedToCost) continue;
    const key = budgetCategoryForLaborRole(e.role);
    const amt = Number(e.amount) || 0;
    out[key] = (out[key] || 0) + amt;
  }
  return out;
}

/** Merge cost ledger actuals + unmatched legacy labor (add amounts per key) */
export function mergeActualBuckets(
  ...parts: Record<string, number>[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of parts) {
    for (const [k, v] of Object.entries(p)) {
      out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

export function buildBudgetVsActualRows(
  budgetByCategory: Record<string, number>,
  actualByCategory: Record<string, number>
): Array<{
  key: string;
  label: string;
  budget: number;
  actual: number;
  variance: number;
}> {
  const keys = Array.from(
    new Set([...Object.keys(budgetByCategory), ...Object.keys(actualByCategory)])
  );
  return keys
    .map((key) => {
      const budget = budgetByCategory[key] || 0;
      const actual = actualByCategory[key] || 0;
      return {
        key,
        label: BUDGET_CATEGORY_LABELS[key] || key,
        budget: round2(budget),
        actual: round2(actual),
        variance: round2(actual - budget),
      };
    })
    .filter((r) => r.budget !== 0 || r.actual !== 0)
    .sort((a, b) => b.budget + b.actual - (a.budget + a.actual));
}

/** Sum of discipline labor/fee budgets (not expenses/mileage/land) */
export function laborBudgetFromCategories(byCategory: Record<string, number>): number {
  return LABORISH_BUDGET_KEYS.reduce((s, k) => s + (byCategory[k] || 0), 0);
}

/** Billable TIME+FEE actuals that map to laborish categories */
export function laborActualFromCostBuckets(actualByCategory: Record<string, number>): number {
  return LABORISH_BUDGET_KEYS.reduce((s, k) => s + (actualByCategory[k] || 0), 0);
}

/** Ensure every budget category appears as a row (empty amount) when editing */
export function mergeBudgetLinesWithDefaults<
  T extends { category: string; label?: string; mode?: string; amount?: unknown; hours?: unknown; rate?: unknown },
>(existing: T[]): T[] {
  const byCat = new Map(existing.map((l) => [l.category, l]));
  return BUDGET_CATEGORY_OPTIONS.map((opt) => {
    const hit = byCat.get(opt.value);
    if (hit) return hit;
    return {
      category: opt.value,
      label: '',
      mode: 'TOTAL',
      amount: '',
      hours: '',
      rate: '',
    } as T;
  });
}
