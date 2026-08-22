/**
 * Pure helpers for parcel multi-select (map + list).
 * Shift/Ctrl/Cmd toggle; Shift+click range uses ordered list + anchor.
 */

export function toggleSelection(ids: string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function mergeUnique(a: string[], b: string[]): string[] {
  if (!b.length) return a.slice();
  if (!a.length) return Array.from(new Set(b));
  return Array.from(new Set([...a, ...b]));
}

/** Inclusive range between anchor and target in ordered id list. */
export function rangeSelect(
  orderedIds: string[],
  anchorId: string | null | undefined,
  targetId: string
): string[] {
  if (!targetId) return [];
  if (!anchorId || anchorId === targetId) return [targetId];
  const a = orderedIds.indexOf(anchorId);
  const t = orderedIds.indexOf(targetId);
  if (a < 0 && t < 0) return [targetId];
  if (a < 0) return [targetId];
  if (t < 0) return [anchorId];
  const lo = Math.min(a, t);
  const hi = Math.max(a, t);
  return orderedIds.slice(lo, hi + 1);
}

/** Modifier that means "toggle multi" (Shift, Ctrl, or Meta/Cmd). */
export function isMultiModifier(ev: {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
} | null | undefined): boolean {
  if (!ev) return false;
  return Boolean(ev.shiftKey || ev.ctrlKey || ev.metaKey);
}

/** Shift alone → range; Ctrl/Cmd (with or without Shift) → toggle one. */
export function isRangeModifier(ev: {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
} | null | undefined): boolean {
  if (!ev) return false;
  return Boolean(ev.shiftKey && !ev.ctrlKey && !ev.metaKey);
}
