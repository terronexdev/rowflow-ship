import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAccessibleProject,
  assertProjectWritable,
  DemoReadOnlyError,
} from '@/lib/projectAccess';
import { z } from 'zod';
import { applyStatusRollup } from '@/lib/parcels/statusRollup';
import {
  diffStatusFields,
  summaryFromChanges,
  logActivity,
} from '@/lib/activity/logActivity';

const ALLOWED_FIELDS = new Set([
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
]);

const bodySchema = z.object({
  parcelIds: z.array(z.string().min(1)).min(1).max(500),
  field: z.string().min(1),
  value: z.union([z.string(), z.boolean()]),
});

/**
 * POST /api/projects/[id]/parcels/bulk-status
 * Single HTTP round-trip bulk field update for map / line-list multi-select.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getAccessibleProject(projectId, session.user.id);
    if (!access) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    assertProjectWritable(projectId);

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { parcelIds, field, value } = parsed.data;
    if (!ALLOWED_FIELDS.has(field)) {
      return NextResponse.json({ error: `Field not bulk-updatable: ${field}` }, { status: 400 });
    }

    const parcels = await prisma.parcel.findMany({
      where: { projectId, id: { in: parcelIds } },
    });
    if (parcels.length === 0) {
      return NextResponse.json({ error: 'No matching parcels in project' }, { status: 404 });
    }

    const previous: { parcelId: string; field: string; from: string | null }[] = [];
    let updated = 0;

    for (const parcel of parcels) {
      const fromRaw = (parcel as any)[field];
      previous.push({
        parcelId: parcel.id,
        field,
        from: fromRaw == null ? null : String(fromRaw),
      });

      const patch: Record<string, unknown> = { [field]: value };
      let data: Record<string, unknown> = { ...patch };

      if (field !== 'priority' && field !== 'bookmarked') {
        const rollup = applyStatusRollup(
          {
            status: parcel.status,
            titleStatus: (parcel as any).titleStatus,
            surveyStatus: (parcel as any).surveyStatus,
            appraisalStatus: (parcel as any).appraisalStatus,
            acquisitionStatus: (parcel as any).acquisitionStatus,
            ptsStatus: (parcel as any).ptsStatus,
            permitStatus: (parcel as any).permitStatus,
            condemnationStatus: (parcel as any).condemnationStatus,
            damagesStatus: (parcel as any).damagesStatus,
            specialConditionsStatus: (parcel as any).specialConditionsStatus,
            existingRightsStatus: (parcel as any).existingRightsStatus,
            encroachmentStatus: (parcel as any).encroachmentStatus,
          },
          patch as any
        );
        data = { ...patch, status: rollup.status };
      }

      const before = { ...parcel } as Record<string, unknown>;
      const next = await prisma.parcel.update({
        where: { id: parcel.id },
        data: data as any,
      });
      const changes = diffStatusFields(before, next as unknown as Record<string, unknown>);
      if (changes.length) {
        await logActivity({
          userId: session.user.id,
          projectId,
          parcelId: parcel.id,
          action: 'STATUS_CHANGE',
          entityType: 'parcel',
          entityId: parcel.id,
          summary: summaryFromChanges(changes),
          changes,
        });
      }
      updated += 1;
    }

    return NextResponse.json({
      updated,
      field,
      value,
      previous,
      missed: parcelIds.length - parcels.length,
    });
  } catch (error) {
    if (error instanceof DemoReadOnlyError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('bulk-status error', error);
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 });
  }
}
