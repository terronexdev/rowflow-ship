import { prisma } from '@/lib/prisma';
import type { AuditAction, Prisma } from '@prisma/client';

export type ActivityChange = {
  field: string;
  from?: string | number | boolean | null;
  to?: string | number | boolean | null;
};

export type LogActivityInput = {
  userId?: string | null;
  projectId?: string | null;
  parcelId?: string | null;
  action?: AuditAction;
  entityType: string;
  entityId: string;
  summary?: string;
  changes?: ActivityChange[] | Record<string, unknown>;
  ipAddress?: string | null;
};

/**
 * Append-only activity / audit event.
 */
export async function logActivity(input: LogActivityInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        projectId: input.projectId || null,
        parcelId: input.parcelId || null,
        action: input.action || 'STATUS_CHANGE',
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary || null,
        changes: (input.changes as Prisma.InputJsonValue) ?? undefined,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (e) {
    // Never fail the main mutation because of logging
    console.error('[logActivity]', e);
    return null;
  }
}

const STATUS_FIELDS = [
  'status',
  'ptsStatus',
  'titleStatus',
  'surveyStatus',
  'appraisalStatus',
  'acquisitionStatus',
  'condemnationStatus',
  'damagesStatus',
  'specialConditionsStatus',
  'permitStatus',
  'existingRightsStatus',
  'parcelClass',
  'encroachmentStatus',
  'priority',
  'bookmarked',
] as const;

export function diffStatusFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): ActivityChange[] {
  const changes: ActivityChange[] = [];
  for (const field of STATUS_FIELDS) {
    const fromRaw = before[field];
    const toRaw = after[field];
    // Include boolean false (bookmarked off)
    if (fromRaw === toRaw) continue;
    if (toRaw === undefined) continue;
    const from = fromRaw === undefined || fromRaw === null ? null : String(fromRaw);
    const to = toRaw === null ? null : String(toRaw);
    if (from === to) continue;
    changes.push({ field, from, to });
  }
  return changes;
}

export function summaryFromChanges(changes: ActivityChange[]): string {
  if (!changes.length) return 'Updated parcel';
  return changes.map((c) => `${c.field}: ${c.from ?? '—'} → ${c.to ?? '—'}`).join('; ');
}
