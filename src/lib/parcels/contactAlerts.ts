/** Open-acq contact health for Overview chips. */

export const CONTACT_STALE_DAYS = 14;
export const CONTACT_ALERT_ID_CAP = 40;

export type ContactLogLite = {
  id: string;
  parcelId: string;
  contactDate: Date;
  followUpDate: Date | null;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Follow-up is still open if nothing else was logged on/after the due date. */
export function isFollowUpOutstanding(
  log: ContactLogLite,
  parcelLogs: ContactLogLite[],
  today: Date
): boolean {
  if (!log.followUpDate) return false;
  const due = startOfDay(log.followUpDate);
  if (!(due < today)) return false;
  return !parcelLogs.some(
    (other) => other.id !== log.id && startOfDay(other.contactDate) >= due
  );
}

export function classifyOpenParcelContacts(
  openParcelIds: string[],
  logs: ContactLogLite[],
  opts?: { now?: Date; staleDays?: number; maxIds?: number }
): {
  staleCount: number;
  pastDueCount: number;
  staleParcelIds: string[];
  pastDueFollowUpParcelIds: string[];
} {
  const today = startOfDay(opts?.now ?? new Date());
  const staleDays = opts?.staleDays ?? CONTACT_STALE_DAYS;
  const maxIds = opts?.maxIds ?? CONTACT_ALERT_ID_CAP;
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - staleDays);

  const byParcel = new Map<string, ContactLogLite[]>();
  for (const log of logs) {
    const arr = byParcel.get(log.parcelId);
    if (arr) arr.push(log);
    else byParcel.set(log.parcelId, [log]);
  }

  let staleCount = 0;
  let pastDueCount = 0;
  const staleParcelIds: string[] = [];
  const pastDueFollowUpParcelIds: string[] = [];

  for (const id of openParcelIds) {
    const parcelLogs = byParcel.get(id) || [];
    let last: Date | null = null;
    for (const log of parcelLogs) {
      if (!last || log.contactDate > last) last = log.contactDate;
    }
    if (!last || startOfDay(last) < cutoff) {
      staleCount += 1;
      if (staleParcelIds.length < maxIds) staleParcelIds.push(id);
    }

    const overdue = parcelLogs.some((log) => isFollowUpOutstanding(log, parcelLogs, today));
    if (overdue) {
      pastDueCount += 1;
      if (pastDueFollowUpParcelIds.length < maxIds) pastDueFollowUpParcelIds.push(id);
    }
  }

  return { staleCount, pastDueCount, staleParcelIds, pastDueFollowUpParcelIds };
}
