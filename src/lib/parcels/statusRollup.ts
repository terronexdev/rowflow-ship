/**
 * Overall parcel status rollup from domain fields + acquisition/offer signals.
 * Never downgrades CONDEMNED / RELOCATED. Prefer upgrade NOT_STARTED → IN_PROGRESS → ACQUIRED.
 */

export type ParcelStatusValue =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ACQUIRED'
  | 'CONDEMNED'
  | 'RELOCATED'
  | string;

export type ParcelStatusLike = {
  status?: string | null;
  titleStatus?: string | null;
  surveyStatus?: string | null;
  appraisalStatus?: string | null;
  acquisitionStatus?: string | null;
  ptsStatus?: string | null;
  permitStatus?: string | null;
  condemnationStatus?: string | null;
  damagesStatus?: string | null;
  specialConditionsStatus?: string | null;
  existingRightsStatus?: string | null;
  parcelClass?: string | null;
  encroachmentStatus?: string | null;
  /** When true, treat as acquired for rollup (accepted offer) */
  hasAcceptedOffer?: boolean | null;
};

const TERMINAL_OVERALL = new Set(['CONDEMNED', 'RELOCATED']);

const OVERALL_RANK: Record<string, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  ACQUIRED: 2,
  CONDEMNED: 3,
  RELOCATED: 3,
};

/** Domain value is past default / empty */
export function isDomainActive(value: string | null | undefined): boolean {
  if (value == null || value === '') return false;
  const v = String(value).toUpperCase();
  return (
    v !== 'NOT_STARTED' &&
    v !== 'NONE' &&
    v !== 'N_A' &&
    v !== 'NA' &&
    v !== 'NOT_REVIEWED' &&
    v !== 'NOT_APPLICABLE' &&
    v !== 'UNKNOWN'
  );
}

/** Existing-rights strategy counts as “work” for overall rollup */
export function isExistingRightsActive(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).toUpperCase();
  return v === 'RESTRICTED' || v === 'SUPPLEMENT_NEEDED' || v === 'SUPPLEMENT_ACQUIRED';
}

/** Acquisition considered complete for progress + overall rollup */
export function isAcquisitionComplete(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).toUpperCase();
  return v === 'ACQUIRED' || v === 'CLOSED' || v === 'COMPLETE' || v === 'COMPLETED';
}

/** Parcel counts as acquired for dashboard / analytics % */
export function isEffectivelyAcquired(p: ParcelStatusLike): boolean {
  const st = String(p.status || '').toUpperCase();
  if (st === 'ACQUIRED' || st === 'RELOCATED') return true;
  if (isAcquisitionComplete(p.acquisitionStatus)) return true;
  if (p.hasAcceptedOffer) return true;
  return false;
}

/** Any domain work started (or overall already in progress/acquired) */
export function hasDomainProgress(p: ParcelStatusLike): boolean {
  if (isEffectivelyAcquired(p)) return true;
  const st = String(p.status || '').toUpperCase();
  if (st === 'IN_PROGRESS' || st === 'CONDEMNED') return true;
  return (
    isDomainActive(p.titleStatus) ||
    isDomainActive(p.surveyStatus) ||
    isDomainActive(p.appraisalStatus) ||
    isDomainActive(p.acquisitionStatus) ||
    isDomainActive(p.ptsStatus) ||
    isDomainActive(p.permitStatus) ||
    isDomainActive(p.condemnationStatus) ||
    isDomainActive(p.damagesStatus) ||
    isDomainActive(p.specialConditionsStatus) ||
    isExistingRightsActive(p.existingRightsStatus) ||
    isEncroachmentActiveForRollup(p.encroachmentStatus)
  );
}

function isEncroachmentActiveForRollup(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).toUpperCase();
  return v === 'IDENTIFIED' || v === 'NEEDS_REMOVAL' || v === 'CAN_REMAIN';
}

/**
 * Suggested overall status from domains (ignores preserving CONDEMNED — caller merges).
 */
export function suggestOverallStatus(p: ParcelStatusLike): ParcelStatusValue {
  if (isEffectivelyAcquired(p)) return 'ACQUIRED';
  if (hasDomainProgress(p)) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

/**
 * Merge current overall with suggestion.
 * - Never change CONDEMNED / RELOCATED automatically
 * - Never downgrade rank (ACQUIRED stays ACQUIRED)
 * - If userExplicitStatus is set, still allow auto-upgrade to ACQUIRED when acquisition complete
 */
export function mergeOverallStatus(
  current: string | null | undefined,
  suggested: ParcelStatusValue,
  opts?: { userSetStatus?: string | null }
): ParcelStatusValue {
  const cur = String(current || 'NOT_STARTED').toUpperCase();
  const sug = String(suggested || 'NOT_STARTED').toUpperCase();
  const user = opts?.userSetStatus != null ? String(opts.userSetStatus).toUpperCase() : null;

  if (TERMINAL_OVERALL.has(cur) && sug !== 'ACQUIRED') {
    // Keep condemnation/relocation terminal unless acquisition complete says ACQUIRED
    // (usually keep CONDEMNED)
    return cur as ParcelStatusValue;
  }
  if (TERMINAL_OVERALL.has(cur)) return cur as ParcelStatusValue;

  // User explicitly set a status this request
  if (user) {
    if (TERMINAL_OVERALL.has(user)) return user as ParcelStatusValue;
    // Allow upgrade to ACQUIRED over user's IN_PROGRESS/NOT_STARTED when domains say so
    if (sug === 'ACQUIRED' && (OVERALL_RANK[user] ?? 0) < OVERALL_RANK.ACQUIRED) {
      return 'ACQUIRED';
    }
    return user as ParcelStatusValue;
  }

  const cr = OVERALL_RANK[cur] ?? 0;
  const sr = OVERALL_RANK[sug] ?? 0;
  if (sr > cr) return sug as ParcelStatusValue;
  return cur as ParcelStatusValue;
}

/** Build status fields after a write (domains + optional explicit overall). */
export function applyStatusRollup(
  before: ParcelStatusLike,
  patch: ParcelStatusLike & { status?: string | null }
): { status: ParcelStatusValue } {
  const merged: ParcelStatusLike = {
    ...before,
    ...patch,
    status: patch.status !== undefined ? patch.status : before.status,
  };
  const suggested = suggestOverallStatus(merged);
  const next = mergeOverallStatus(before.status, suggested, {
    userSetStatus: patch.status !== undefined ? patch.status : null,
  });
  return { status: next };
}

export type DomainProgressSummary = {
  total: number;
  acquired: number;
  inProgress: number;
  notStarted: number;
  /** overall field only (raw) */
  overallAcquired: number;
  titleActive: number;
  surveyActive: number;
  appraisalActive: number;
  acquisitionActive: number;
  acquisitionComplete: number;
  ptsActive: number;
  ptsGranted: number;
  permitActive: number;
  acquiredPct: number;
  titleActivePct: number;
  surveyActivePct: number;
  appraisalActivePct: number;
  acquisitionCompletePct: number;
  ptsActivePct: number;
};

function pct(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function summarizeDomainProgress(parcels: ParcelStatusLike[]): DomainProgressSummary {
  const total = parcels.length;
  let acquired = 0;
  let inProgress = 0;
  let notStarted = 0;
  let overallAcquired = 0;
  let titleActive = 0;
  let surveyActive = 0;
  let appraisalActive = 0;
  let acquisitionActive = 0;
  let acquisitionComplete = 0;
  let ptsActive = 0;
  let ptsGranted = 0;
  let permitActive = 0;

  for (const p of parcels) {
    const st = String(p.status || '').toUpperCase();
    if (st === 'ACQUIRED' || st === 'RELOCATED') overallAcquired += 1;
    if (isEffectivelyAcquired(p)) {
      acquired += 1;
    } else if (hasDomainProgress(p) || st === 'IN_PROGRESS' || st === 'CONDEMNED') {
      inProgress += 1;
    } else {
      notStarted += 1;
    }
    if (isDomainActive(p.titleStatus)) titleActive += 1;
    if (isDomainActive(p.surveyStatus)) surveyActive += 1;
    if (isDomainActive(p.appraisalStatus)) appraisalActive += 1;
    if (isDomainActive(p.acquisitionStatus)) acquisitionActive += 1;
    if (isAcquisitionComplete(p.acquisitionStatus)) acquisitionComplete += 1;
    if (isDomainActive(p.ptsStatus)) ptsActive += 1;
    if (String(p.ptsStatus || '').toUpperCase() === 'GRANTED') ptsGranted += 1;
    if (isDomainActive(p.permitStatus)) permitActive += 1;
  }

  return {
    total,
    acquired,
    inProgress,
    notStarted,
    overallAcquired,
    titleActive,
    surveyActive,
    appraisalActive,
    acquisitionActive,
    acquisitionComplete,
    ptsActive,
    ptsGranted,
    permitActive,
    acquiredPct: pct(acquired, total),
    titleActivePct: pct(titleActive, total),
    surveyActivePct: pct(surveyActive, total),
    appraisalActivePct: pct(appraisalActive, total),
    acquisitionCompletePct: pct(acquisitionComplete, total),
    ptsActivePct: pct(ptsActive, total),
  };
}
