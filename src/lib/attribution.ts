/** Display name for attribution lines. */
export function personLabel(user?: { name?: string | null; email?: string | null } | null): string {
  if (!user) return 'Unknown';
  const n = user.name?.trim();
  if (n) return n;
  const e = user.email?.trim();
  if (e) return e;
  return 'Unknown';
}

export function formatWhen(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

/** e.g. "Jason · 3/6/2026, 2:14:00 PM" */
export function formatAttribution(
  user?: { name?: string | null; email?: string | null } | null,
  when?: string | Date | null
): string {
  return `${personLabel(user)} · ${formatWhen(when)}`;
}

export const userSelectMini = {
  id: true,
  name: true,
  email: true,
} as const;
