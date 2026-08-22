/**
 * RESERVED / QUARANTINED — not part of the live tracking model.
 *
 * Source of truth for parcel phase status is the Parcel row enums:
 *   status, ptsStatus, titleStatus, surveyStatus, appraisalStatus,
 *   acquisitionStatus, condemnationStatus, specialConditionsStatus, damagesStatus
 * Updated via: PATCH /api/parcels/[id] (and section Save flows that include status).
 *
 * Detail tables (not status SOT):
 *   AppraisalTracking → /api/parcels/[id]/appraisal
 *   CondemnationTracking → /api/parcels/[id]/legal
 *   CompensationOffer → /api/parcels/[id]/compensation
 *
 * This route wrote parallel *Tracking history tables. Tables remain in the DB
 * for a possible future audit/history feature. Do not wire new UI here until
 * product explicitly asks for change-history.
 *
 * Returns 410 Gone so accidental clients fail loudly.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error:
        'Lifecycle history endpoint is retired. Update parcel status enums via PATCH /api/parcels/' +
        id,
      code: 'LIFECYCLE_RETIRED',
      docs: 'docs/DATA_MODEL.md',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Lifecycle history endpoint is retired. See docs/DATA_MODEL.md',
      code: 'LIFECYCLE_RETIRED',
    },
    { status: 410 }
  );
}
