'use client';

import { useState } from 'react';
import {
  Box,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatWhen } from '@/lib/attribution';
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
  easementNumber?: string | null;
  owner?: string | null;
  ownerPhone?: string | null;
  titledOwnerName?: string | null;
  titledOwnerPhone?: string | null;
  tenantName?: string | null;
  propertyAddress?: string | null;
  ownerAddress?: string | null;
  ownerCity?: string | null;
  ownerState?: string | null;
  ownerZip?: string | null;
  county?: string | null;
  acreage?: number | null;
  milepost?: number | null;
  peAcres?: number | null;
  tceAcres?: number | null;
  landUseLabel?: string | null;
  rangeText?: string | null;
  lastOfferText?: string | null;
  lastOfferOor?: boolean | null;
  lastContact?: string | null;
  followUp?: string | null;
  followUpPastDue?: boolean | null;
  mail?: string | null;
  newStructureNumbers?: string | null;
  existingStructureNumbers?: string | null;
  titleText?: string | null;
  erText?: string | null;
  encroachText?: string | null;
  notes?: {
    id?: string;
    content: string;
    category?: string | null;
    createdAt?: string | Date | null;
    who?: string | null;
    role?: string | null;
  }[];
  docs?: {
    id: string;
    name: string;
    url: string;
    createdAt?: string | Date | null;
    who?: string | null;
  }[];
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

function FoldHeader({
  label,
  open,
  onToggle,
  summary,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  summary?: string | null;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Typography
        variant="overline"
        sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        {!open && summary ? (
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'none' }} noWrap>
            {summary}
          </Typography>
        ) : null}
        <IconButton
          size="small"
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ExpandMoreIcon
            fontSize="small"
            sx={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          />
        </IconButton>
      </Box>
    </Box>
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
  const [trackOpen, setTrackOpen] = useState(!compact);
  const [identityOpen, setIdentityOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const overall = String(values.status || 'NOT_STARTED').replaceAll('_', ' ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1.25 : 1.75 }}>
      {compact ? (
        <FoldHeader
          label={title}
          open={trackOpen}
          onToggle={() => setTrackOpen((v) => !v)}
          summary={overall}
        />
      ) : (
        <Typography
          variant="overline"
          sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
        >
          {title}
        </Typography>
      )}

      <Collapse in={!compact || trackOpen} unmountOnExit={false}>
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
      </Collapse>

      {identity && (
        <>
          <Divider sx={{ my: 0.5 }} />
          {compact ? (
            <FoldHeader
              label="Identity"
              open={identityOpen}
              onToggle={() => setIdentityOpen((v) => !v)}
              summary={identity.easementNumber || identity.pin || identity.titledOwnerName || identity.owner || undefined}
            />
          ) : (
            <Typography
              variant="overline"
              sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
            >
              Identity
            </Typography>
          )}
          <Collapse in={!compact || identityOpen} unmountOnExit={false}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
            }}
          >
            {[
              { label: 'Easement #', value: identity.easementNumber, span: false },
              { label: 'PIN', value: identity.pin, span: false },
              { label: 'County', value: identity.county, span: false },
              {
                label: 'Acres',
                value: identity.acreage != null ? String(identity.acreage) : null,
                span: false,
              },
              {
                label: 'Milepost',
                value: identity.milepost != null ? String(identity.milepost) : null,
                span: false,
              },
              {
                label: 'Titled owner',
                value: [identity.titledOwnerName || identity.owner, identity.titledOwnerPhone || identity.ownerPhone]
                  .filter(Boolean)
                  .join(' · '),
                span: true,
              },
              { label: 'Tenant', value: identity.tenantName, span: true },
              { label: 'Mail', value: identity.mail, span: true },
              {
                label: 'Structures',
                value: [
                  identity.newStructureNumbers ? `New ${identity.newStructureNumbers}` : null,
                  identity.existingStructureNumbers ? `Existing ${identity.existingStructureNumbers}` : null,
                ]
                  .filter(Boolean)
                  .join(' · '),
                span: true,
              },
              { label: 'Title', value: identity.titleText, span: false },
              { label: 'Existing rights', value: identity.erText, span: false },
              { label: 'Encroach', value: identity.encroachText, span: true },
              {
                label: 'Last contact',
                value: identity.lastContact
                  ? `${identity.lastContact}${identity.followUp ? ` · FU ${identity.followUp}` : ''}${
                      identity.followUpPastDue ? ' · past due' : ''
                    }`
                  : identity.followUp
                    ? `FU ${identity.followUp}${identity.followUpPastDue ? ' · past due' : ''}`
                    : null,
                span: true,
                warn: Boolean(identity.followUpPastDue),
              },
              {
                label: 'PE / TCE',
                value:
                  identity.peAcres != null || identity.tceAcres != null
                    ? `PE ${identity.peAcres != null ? identity.peAcres : '—'} ac · TCE ${
                        identity.tceAcres != null ? identity.tceAcres : '—'
                      } ac`
                    : null,
                span: false,
              },
              { label: 'Land use', value: identity.landUseLabel, span: false },
              {
                label: 'Range',
                value: identity.rangeText || 'No range',
                span: true,
                muted: !identity.rangeText,
              },
              {
                label: 'Last offer',
                value: identity.lastOfferText,
                span: true,
                warn: Boolean(identity.lastOfferOor),
              },
              { label: 'Situs', value: identity.propertyAddress, span: true },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <Box key={row.label} sx={{ minWidth: 0, gridColumn: row.span ? '1 / -1' : undefined }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {row.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: row.warn ? 'warning.main' : row.muted ? 'text.secondary' : 'text.primary',
                    }}
                    noWrap
                    title={String(row.value)}
                  >
                    {row.value}
                    {row.warn && row.label === 'Last offer' ? ' · OOR' : ''}
                  </Typography>
                </Box>
              ))}
          </Box>
          </Collapse>
          {identity.notes && identity.notes.length > 0 ? (
            <Box sx={{ mt: 1.25 }}>
              {compact ? (
                <FoldHeader
                  label="Notes"
                  open={notesOpen}
                  onToggle={() => setNotesOpen((v) => !v)}
                  summary={String(identity.notes.length)}
                />
              ) : (
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
                >
                  Notes
                </Typography>
              )}
              <Collapse in={!compact || notesOpen} unmountOnExit={false}>
              <Box sx={{ maxHeight: 160, overflowY: 'auto', pr: 0.5 }}>
                {identity.notes.map((n, i) => (
                  <Box key={n.id || i} sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {[n.who, n.role, n.createdAt ? formatWhen(n.createdAt) : null, n.category]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {n.content}
                    </Typography>
                  </Box>
                ))}
              </Box>
              </Collapse>
            </Box>
          ) : null}
          {identity.docs && identity.docs.length > 0 ? (
            <Box sx={{ mt: 1.25 }}>
              {compact ? (
                <FoldHeader
                  label="Docs"
                  open={docsOpen}
                  onToggle={() => setDocsOpen((v) => !v)}
                  summary={String(identity.docs.length)}
                />
              ) : (
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1.2 }}
                >
                  Docs
                </Typography>
              )}
              <Collapse in={!compact || docsOpen} unmountOnExit={false}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {identity.docs.map((d) => (
                  <Box key={d.id}>
                    <Link
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      underline="hover"
                    >
                      {d.name}
                    </Link>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {[d.who, d.createdAt ? formatWhen(d.createdAt) : null].filter(Boolean).join(' · ')}
                    </Typography>
                  </Box>
                ))}
              </Box>
              </Collapse>
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
}
