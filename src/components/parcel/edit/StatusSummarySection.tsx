'use client';

import { Typography } from '@mui/material';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import ParcelStatusPanel, { type ParcelStatusKey } from '@/components/parcel/ParcelStatusPanel';
import { SummaryLine, SChip, fmtStatus } from '@/components/parcel/sectionSummary';

export type StatusSummaryValues = {
  status: string;
  parcelClass: string;
  existingRightsStatus: string;
  encroachmentStatus: string;
  ptsStatus: string;
  titleStatus: string;
  surveyStatus: string;
  appraisalStatus: string;
  acquisitionStatus: string;
  condemnationStatus: string;
  permitStatus: string;
  specialConditionsStatus: string;
  damagesStatus: string;
};

export default function StatusSummarySection({
  values,
  onChange,
  disabled,
}: {
  values: StatusSummaryValues;
  onChange: (field: ParcelStatusKey, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <CollapsibleSection
      id="status-summary"
      title="Parcel status (summary)"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label={`Overall: ${fmtStatus(values.status)}`} statusValue={values.status} />
          <SChip label={`Class: ${fmtStatus(values.parcelClass)}`} statusValue={values.parcelClass} />
          <SChip
            label={`Existing rights: ${fmtStatus(values.existingRightsStatus)}`}
            statusValue={values.existingRightsStatus}
          />
          <SChip
            label={`Encroachments: ${fmtStatus(values.encroachmentStatus)}`}
            statusValue={values.encroachmentStatus}
          />
          <SChip label={`PTS: ${fmtStatus(values.ptsStatus)}`} statusValue={values.ptsStatus} />
          <SChip label={`Title: ${fmtStatus(values.titleStatus)}`} statusValue={values.titleStatus} />
          <SChip label={`Survey: ${fmtStatus(values.surveyStatus)}`} statusValue={values.surveyStatus} />
          <SChip
            label={`Appraisal: ${fmtStatus(values.appraisalStatus)}`}
            statusValue={values.appraisalStatus}
          />
          <SChip
            label={`Acq: ${fmtStatus(values.acquisitionStatus)}`}
            statusValue={values.acquisitionStatus}
          />
          <SChip
            label={`Legal: ${fmtStatus(values.condemnationStatus)}`}
            statusValue={values.condemnationStatus}
          />
          <SChip label={`Permit: ${fmtStatus(values.permitStatus)}`} statusValue={values.permitStatus} />
          <SChip
            label={`Special: ${fmtStatus(values.specialConditionsStatus)}`}
            statusValue={values.specialConditionsStatus}
          />
          <SChip
            label={`Damages: ${fmtStatus(values.damagesStatus)}`}
            statusValue={values.damagesStatus}
            fill
          />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quick rail (same as map). Prefer section Save buttons below for discipline-owned statuses
        (ROW, Legal, Permitting, Construction, …).
      </Typography>
      <ParcelStatusPanel values={values} onChange={onChange} disabled={disabled} title="Track" />
    </CollapsibleSection>
  );
}
