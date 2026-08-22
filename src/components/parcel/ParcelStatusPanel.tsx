'use client';

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Divider,
} from '@mui/material';
import {
  getStatusColor,
  OVERALL_STATUSES,
  TITLE_STATUSES,
  SURVEY_STATUSES,
  APPRAISAL_STATUSES,
  ACQUISITION_STATUSES,
  CONDEMNATION_STATUSES,
  SPECIAL_CONDITIONS_STATUSES,
  DAMAGES_STATUSES,
  PTS_STATUSES,
  PERMIT_PHASE_STATUSES,
  EXISTING_RIGHTS_STATUSES,
  PARCEL_CLASS_OPTIONS,
  ENCROACHMENT_STATUSES,
  type StatusOption,
} from '@/lib/constants';

/** Canonical status fields on Parcel — single source for map + edit */
export type ParcelStatusKey =
  | 'status'
  | 'ptsStatus'
  | 'titleStatus'
  | 'surveyStatus'
  | 'appraisalStatus'
  | 'acquisitionStatus'
  | 'condemnationStatus'
  | 'specialConditionsStatus'
  | 'damagesStatus'
  | 'permitStatus'
  | 'existingRightsStatus'
  | 'parcelClass'
  | 'encroachmentStatus';

export interface ParcelStatusValues {
  status?: string | null;
  ptsStatus?: string | null;
  titleStatus?: string | null;
  surveyStatus?: string | null;
  appraisalStatus?: string | null;
  acquisitionStatus?: string | null;
  condemnationStatus?: string | null;
  specialConditionsStatus?: string | null;
  damagesStatus?: string | null;
  permitStatus?: string | null;
  existingRightsStatus?: string | null;
  parcelClass?: string | null;
  encroachmentStatus?: string | null;
}

export interface ParcelIdentity {
  pin?: string | null;
  parcelNumber?: string | null;
  owner?: string | null;
  propertyAddress?: string | null;
  ownerAddress?: string | null;
  ownerCity?: string | null;
  ownerState?: string | null;
  ownerZip?: string | null;
  county?: string | null;
  acreage?: number | null;
  sequence?: number | null;
  titledOwnerName?: string | null;
  tenantName?: string | null;
  lastCompensationTotal?: number | null;
  lastCompensationOutsideRange?: boolean | null;
}

export interface ProjectContext {
  name?: string | null;
  projectCode?: string | null;
  workOrderNumber?: string | null;
  managerName?: string | null;
  leadAgentName?: string | null;
}

export const PARCEL_STATUS_FIELDS: {
  key: ParcelStatusKey;
  label: string;
  options: StatusOption[];
}[] = [
  { key: 'status', label: 'Overall', options: OVERALL_STATUSES },
  { key: 'parcelClass', label: 'Parcel class', options: PARCEL_CLASS_OPTIONS },
  { key: 'existingRightsStatus', label: 'Existing rights', options: EXISTING_RIGHTS_STATUSES },
  { key: 'encroachmentStatus', label: 'Encroachments', options: ENCROACHMENT_STATUSES },
  { key: 'ptsStatus', label: 'PTS', options: PTS_STATUSES },
  { key: 'titleStatus', label: 'Title', options: TITLE_STATUSES },
  { key: 'surveyStatus', label: 'Survey', options: SURVEY_STATUSES },
  { key: 'appraisalStatus', label: 'Appraisal', options: APPRAISAL_STATUSES },
  { key: 'acquisitionStatus', label: 'Acquisition', options: ACQUISITION_STATUSES },
  { key: 'condemnationStatus', label: 'Condemnation', options: CONDEMNATION_STATUSES },
  { key: 'permitStatus', label: 'Permitting', options: PERMIT_PHASE_STATUSES },
  { key: 'specialConditionsStatus', label: 'Special conditions', options: SPECIAL_CONDITIONS_STATUSES },
  { key: 'damagesStatus', label: 'Damages', options: DAMAGES_STATUSES },
];

function StatusSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: StatusOption[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const color = getStatusColor(value);
  return (
    <FormControl fullWidth size="small">
      <InputLabel shrink>{label}</InputLabel>
      <Select
        label={label}
        notched
        value={value || 'NOT_STARTED'}
        disabled={disabled}
        onChange={(e) => onChange(String(e.target.value))}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
          },
        }}
        renderValue={(selected) => {
          const opt = options.find((o) => o.value === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: color,
                  flexShrink: 0,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.15)`,
                }}
              />
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {opt?.label || String(selected).replaceAll('_', ' ')}
              </Typography>
            </Box>
          );
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(opt.value),
                }}
              />
              {opt.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function ParcelStatusPanel({
  values,
  onChange,
  disabled,
  compact = false,
  identity,
  title = 'Tracking',
}: {
  values: ParcelStatusValues;
  onChange: (field: ParcelStatusKey, value: string) => void;
  disabled?: boolean;
  /** denser 2-col grid for map rail */
  compact?: boolean;
  identity?: ParcelIdentity | null;
  title?: string;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1.25 : 1.75 }}>
      <Typography
        variant="overline"
        sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr 1fr' : { xs: '1fr', sm: '1fr 1fr' },
          gap: compact ? 1 : 1.25,
        }}
      >
        {PARCEL_STATUS_FIELDS.map((field) => (
          <StatusSelect
            key={field.key}
            label={field.label}
            value={String(values[field.key] || 'NOT_STARTED')}
            options={field.options}
            disabled={disabled}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
      </Box>

      {identity && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Typography
            variant="overline"
            sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
          >
            Identity
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
            }}
          >
            {[
              { label: 'PIN', value: identity.pin },
              { label: 'Parcel #', value: identity.parcelNumber },
              { label: 'Owner', value: identity.owner },
              { label: 'Situs', value: identity.propertyAddress },
              {
                label: 'Mail',
                value: [identity.ownerAddress, identity.ownerCity, identity.ownerState, identity.ownerZip]
                  .filter(Boolean)
                  .join(', '),
              },
              { label: 'County', value: identity.county },
              {
                label: 'Acres',
                value: identity.acreage != null ? String(identity.acreage) : null,
              },
              {
                label: 'Seq',
                value: identity.sequence != null ? String(identity.sequence) : null,
              },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <Box key={row.label} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {row.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={String(row.value)}>
                    {row.value}
                  </Typography>
                </Box>
              ))}
          </Box>
        </>
      )}
    </Box>
  );
}
