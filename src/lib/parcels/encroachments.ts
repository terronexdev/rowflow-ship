/** Worst-open rollup for parcel encroachmentStatus from item dispositions. */
const DISPOSITION_RANK: Record<string, number> = {
  NEEDS_REMOVAL: 50,
  IDENTIFIED: 40,
  CAN_REMAIN: 30,
  REMOVED: 20,
};

export const ENCROACHMENT_TYPE_OPTIONS = [
  { value: 'BUILDING', label: 'Building' },
  { value: 'SHED', label: 'Shed' },
  { value: 'FENCE', label: 'Fence' },
  { value: 'DRIVEWAY', label: 'Driveway' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'SEPTIC', label: 'Septic' },
  { value: 'WELL', label: 'Well' },
  { value: 'CROP_ORCHARD', label: 'Crop / orchard' },
  { value: 'LANDSCAPING', label: 'Landscaping' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'STOCKPILE', label: 'Stockpile' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const ENCROACHMENT_DISPOSITION_OPTIONS = [
  { value: 'IDENTIFIED', label: 'Identified' },
  { value: 'NEEDS_REMOVAL', label: 'Needs removal' },
  { value: 'CAN_REMAIN', label: 'Can remain' },
  { value: 'REMOVED', label: 'Removed' },
] as const;

export const ENCROACHMENT_RESPONSIBILITY_OPTIONS = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'SHARED', label: 'Shared' },
  { value: 'UNKNOWN', label: 'Unknown' },
] as const;

export const YES_NO_UNKNOWN_OPTIONS = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
  { value: 'UNKNOWN', label: 'Unknown' },
] as const;

/** Suggest parcel encroachmentStatus from item dispositions. Empty → NONE. */
export function suggestEncroachmentStatusFromItems(
  dispositions: Array<string | null | undefined>
): 'NONE' | 'IDENTIFIED' | 'NEEDS_REMOVAL' | 'CAN_REMAIN' | 'REMOVED' {
  const list = dispositions.map((d) => String(d || '').toUpperCase()).filter(Boolean);
  if (!list.length) return 'NONE';
  let best = list[0];
  let bestRank = DISPOSITION_RANK[best] ?? 0;
  for (const d of list) {
    const r = DISPOSITION_RANK[d] ?? 0;
    if (r > bestRank) {
      best = d;
      bestRank = r;
    }
  }
  if (best === 'NEEDS_REMOVAL') return 'NEEDS_REMOVAL';
  if (best === 'IDENTIFIED') return 'IDENTIFIED';
  if (best === 'CAN_REMAIN') return 'CAN_REMAIN';
  if (best === 'REMOVED') return 'REMOVED';
  return 'IDENTIFIED';
}

export function isEncroachmentActive(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).toUpperCase();
  return (
    v === 'IDENTIFIED' ||
    v === 'NEEDS_REMOVAL' ||
    v === 'CAN_REMAIN' ||
    v === 'REMOVED'
  );
}
