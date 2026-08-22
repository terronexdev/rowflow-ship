/** Normalize instrument / easement numbers for same-# matching within a project. */
export function normalizeInstrumentNumber(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw)
    .trim()
    .toUpperCase()
    .replace(/[\u2013\u2014]/g, '-') // en/em dash
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9\-_/]/g, '');
  return s.length ? s : null;
}

export const EXISTING_RIGHT_TYPE_OPTIONS = [
  { value: 'EASEMENT', label: 'Easement' },
  { value: 'ROW', label: 'Right-of-way' },
  { value: 'LICENSE', label: 'License' },
  { value: 'COVENANT', label: 'Covenant' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const EXISTING_RIGHT_PURPOSE_OPTIONS = [
  { value: 'INGRESS_EGRESS', label: 'Ingress / egress' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'PIPELINE', label: 'Pipeline' },
  { value: 'RAIL', label: 'Railroad' },
  { value: 'ACCESS', label: 'Access' },
  { value: 'DRAINAGE', label: 'Drainage' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'TELECOM', label: 'Telecom' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const EXISTING_RIGHT_LIFE_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'UNKNOWN', label: 'Unknown' },
] as const;

export const EXISTING_RIGHT_IMPACT_OPTIONS = [
  { value: 'FULL', label: 'Full' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'UNKNOWN', label: 'Unknown' },
] as const;

/** Restriction flags stored as string[] on ExistingRight.restrictionFlags */
export const EXISTING_RIGHT_FLAG_OPTIONS = [
  { value: 'INGRESS_EGRESS', label: 'Ingress / egress' },
  { value: 'HERBICIDE', label: 'Herbicide restricted' },
  { value: 'POLE', label: 'Pole / structure restricted' },
  { value: 'MATERIAL', label: 'Material restricted' },
  { value: 'DEPTH_COVER', label: 'Depth / cover' },
  { value: 'CLEARANCE', label: 'Clearance / setback' },
  { value: 'VEGETATION', label: 'Vegetation / tree' },
  { value: 'NO_BUILD', label: 'No-build / building' },
  { value: 'CROSSING_PERMIT', label: 'Crossing permit required' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ExistingRightFlagCode = (typeof EXISTING_RIGHT_FLAG_OPTIONS)[number]['value'];

export function parseRestrictionFlags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter(Boolean);
}
