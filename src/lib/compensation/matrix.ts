/** Pure matrix → offer range helpers (no Prisma). */

export type MatrixUnit = 'PER_ACRE' | 'PER_SQFT' | 'FLAT';

export interface MatrixRowLike {
  minAmount: number;
  maxAmount: number;
  unit: MatrixUnit | string;
  /** Optional explicit schedule amount; falls back to min/max */
  amount?: number;
}

export interface OfferRangeInput {
  row: MatrixRowLike;
  acres: number;
  /** default 0.80 — ignored for FLAT */
  lowPct?: number;
  /** default 1.50 — ignored for FLAT */
  highPct?: number;
}

export interface OfferRangeResult {
  baseMin: number;
  baseMax: number;
  matrixValue: number;
  rangeLow: number;
  rangeHigh: number;
  /** True when unit uses negotiation band (not FLAT) */
  bandApplies: boolean;
  outsideRange: (negotiated: number) => boolean;
}

function n(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

/**
 * Single schedule amount for a matrix row.
 * Prefers explicit `amount`; else if min===max use that; else legacy midpoint.
 */
export function scheduleAmount(row: MatrixRowLike): number {
  if (row.amount != null && Number.isFinite(Number(row.amount))) {
    return n(Number(row.amount));
  }
  const minA = Number(row.minAmount) || 0;
  const maxA = Number(row.maxAmount) || 0;
  if (minA === maxA) return n(minA);
  return n((minA + maxA) / 2);
}

/** Normalize row to min=max=amount for storage / unit math. */
export function rowFromAmount(
  amount: number,
  unit: MatrixUnit | string
): MatrixRowLike {
  const a = n(amount);
  return { minAmount: a, maxAmount: a, unit, amount: a };
}

/** Convert unit costs to parcel totals (schedule base, before offer band). */
export function unitBase(row: MatrixRowLike, acres: number): { min: number; max: number } {
  const a = Math.max(0, Number(acres) || 0);
  const minA = Number(row.minAmount) || 0;
  const maxA = Number(row.maxAmount) || 0;
  // Explicit amount or single-value row → both ends equal; legacy min≠max keeps span
  let useMin = minA;
  let useMax = maxA;
  if (row.amount != null && Number.isFinite(Number(row.amount))) {
    const amt = n(Number(row.amount));
    useMin = amt;
    useMax = amt;
  } else if (minA === maxA) {
    useMin = minA;
    useMax = maxA;
  }
  const unit = String(row.unit || 'PER_ACRE').toUpperCase();
  if (unit === 'PER_SQFT') {
    const sqft = a * 43560;
    return { min: n(useMin * sqft), max: n(useMax * sqft) };
  }
  if (unit === 'FLAT') {
    return { min: n(useMin), max: n(useMax) };
  }
  // PER_ACRE default
  return { min: n(useMin * a), max: n(useMax * a) };
}

/**
 * Schedule value × quantity, then apply project offer band (default 80–150%).
 * FLAT: no band — range equals the flat amount (OOR only outside that number).
 */
export function computeOfferRange(input: OfferRangeInput): OfferRangeResult {
  const unit = String(input.row.unit || 'PER_ACRE').toUpperCase();
  const isFlat = unit === 'FLAT';
  const lowPct = isFlat ? 1 : input.lowPct ?? 0.8;
  const highPct = isFlat ? 1 : input.highPct ?? 1.5;
  const { min: baseMin, max: baseMax } = unitBase(input.row, input.acres);
  // Single-amount model: schedule value is midpoint (min===max when saved as amount)
  const matrixValue = n((baseMin + baseMax) / 2);
  const rangeLow = n(matrixValue * lowPct);
  const rangeHigh = n(matrixValue * highPct);
  return {
    baseMin,
    baseMax,
    matrixValue,
    rangeLow,
    rangeHigh,
    bandApplies: !isFlat,
    outsideRange: (negotiated: number) => {
      const x = Number(negotiated);
      if (!Number.isFinite(x)) return true;
      return x < rangeLow || x > rangeHigh;
    },
  };
}

/** Unit-level offer window (per acre / per sqft / flat $) before × quantity. */
export function unitOfferWindow(
  row: MatrixRowLike,
  lowPct = 0.8,
  highPct = 1.5
): { amount: number; low: number; high: number; bandApplies: boolean; unit: string } {
  const amount = scheduleAmount(row);
  const unit = String(row.unit || 'PER_ACRE').toUpperCase();
  const bandApplies = unit !== 'FLAT';
  if (!bandApplies) {
    return { amount, low: amount, high: amount, bandApplies: false, unit };
  }
  return {
    amount,
    low: n(amount * lowPct),
    high: n(amount * highPct),
    bandApplies: true,
    unit,
  };
}

export function formatMoney(v: number): string {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export function computeCompensationTotal(
  negotiated: number,
  damages = 0,
  other = 0
): number {
  return n((Number(negotiated) || 0) + (Number(damages) || 0) + (Number(other) || 0));
}

export function computeLaborAmount(hours: number, hourlyRate: number): number {
  return n((Number(hours) || 0) * (Number(hourlyRate) || 0));
}
