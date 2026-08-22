'use client';

import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { STATUS_COLORS } from '@/lib/constants/status';

function SChip({ label, value }: { label: string; value?: string | null }) {
  const v = value || '—';
  const color = value ? STATUS_COLORS[value] || '#757575' : '#9e9e9e';
  return (
    <Chip
      size="small"
      label={`${label}: ${String(v).replaceAll('_', ' ')}`}
      sx={{ bgcolor: `${color}22`, borderColor: color }}
      variant="outlined"
    />
  );
}

export type ParcelSummaryValues = {
  pin?: string | null;
  parcelNumber?: string | null;
  easementNumber?: string | null;
  newStructureNumbers?: string | null;
  existingStructureNumbers?: string | null;
  owner?: string | null;
  county?: string | null;
  status?: string | null;
  parcelClass?: string | null;
  existingRightsStatus?: string | null;
  encroachmentStatus?: string | null;
  ptsStatus?: string | null;
  titleStatus?: string | null;
  surveyStatus?: string | null;
  appraisalStatus?: string | null;
  acquisitionStatus?: string | null;
  permitStatus?: string | null;
  lastCompensationTotal?: number | string | null;
  lastCompensationOutsideRange?: boolean | null;
  priority?: string | null;
  bookmarked?: boolean | null;
};

/**
 * Compact one-pager for PM / field glance. Full edit remains the default mode.
 */
export default function ParcelSummarySheet({
  values,
  onEditFull,
  onPrint,
}: {
  values: ParcelSummaryValues;
  onEditFull: () => void;
  onPrint?: () => void;
}) {
  const offer =
    values.lastCompensationTotal != null && values.lastCompensationTotal !== ''
      ? Number(values.lastCompensationTotal)
      : null;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }} className="print-parcel-summary">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1.5}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Parcel summary
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {values.easementNumber || values.pin || values.parcelNumber || 'Parcel'}
            {values.bookmarked ? ' ★' : ''}
          </Typography>
          <Typography color="text.secondary">
            {[
              values.easementNumber && (values.pin || values.parcelNumber)
                ? `PIN ${values.pin || values.parcelNumber}`
                : null,
              values.newStructureNumbers ? `New struct ${values.newStructureNumbers}` : null,
              values.existingStructureNumbers
                ? `Exist struct ${values.existingStructureNumbers}`
                : null,
              values.owner,
              values.county,
              values.priority && values.priority !== 'NORMAL' ? values.priority : null,
            ]
              .filter(Boolean)
              .join(' · ') || '—'}
          </Typography>
        </Box>
        <Stack direction="row" gap={1} sx={{ '@media print': { display: 'none' } }}>
          {onPrint && (
            <Button size="small" variant="outlined" onClick={onPrint}>
              Print
            </Button>
          )}
          <Button size="small" variant="contained" onClick={onEditFull}>
            Full edit
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Status
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.75} mb={2}>
        <SChip label="Overall" value={values.status} />
        <SChip label="Class" value={values.parcelClass} />
        <SChip label="Existing rights" value={values.existingRightsStatus} />
        <SChip label="Encroachments" value={values.encroachmentStatus} />
        <SChip label="PTS" value={values.ptsStatus} />
        <SChip label="Title" value={values.titleStatus} />
        <SChip label="Survey" value={values.surveyStatus} />
        <SChip label="Appraisal" value={values.appraisalStatus} />
        <SChip label="Acquisition" value={values.acquisitionStatus} />
        <SChip label="Permit" value={values.permitStatus} />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary">
            Last offer
          </Typography>
          <Typography variant="h6" fontWeight={700} color={values.lastCompensationOutsideRange ? 'warning.main' : 'text.primary'}>
            {offer != null && Number.isFinite(offer)
              ? `$${offer.toLocaleString()}${values.lastCompensationOutsideRange ? ' (OOR)' : ''}`
              : '—'}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
