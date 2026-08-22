'use client';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import SectionNotesDocs from '@/components/parcel/SectionNotesDocs';
import ParcelBillingPanel from '@/components/parcel/ParcelBillingPanel';
import ExistingRightsPanel from '@/components/parcel/ExistingRightsPanel';
import EncroachmentsPanel from '@/components/parcel/EncroachmentsPanel';
import { SummaryLine, SChip, fmtStatus, dash } from '@/components/parcel/sectionSummary';
import {
  LAND_USE_OPTIONS,
  ASSIGNMENT_ROLE_OPTIONS,
  PERMIT_TYPE_OPTIONS,
  PERMIT_STATUS_OPTIONS,
} from '@/lib/constants';
import {
  APPRAISAL_STATUSES,
  PTS_STATUSES,
  ACQUISITION_STATUSES,
  OVERALL_STATUSES,
  CONDEMNATION_STATUSES,
  SPECIAL_CONDITIONS_STATUSES,
  PERMIT_PHASE_STATUSES,
} from '@/lib/constants/status';
import { computeOfferRange, computeCompensationTotal } from '@/lib/compensation/matrix';
import { formatAttribution } from '@/lib/attribution';


export default function SurveyTakeSection(props: any) {
  const projectId = props.projectId;
  const parcelId = props.parcelId;
  const parcel = props.parcel;
  const queryClient = props.queryClient;
  const router = props.router;
  const setSaveSuccess = props.setSaveSuccess;
  const setSaveError = props.setSaveError;
  const saving = props.saving;
  const setSaving = props.setSaving;
  const existingRightsStatus = props.existingRightsStatus;
  const setExistingRightsStatus = props.setExistingRightsStatus;
  const parcelClass = props.parcelClass;
  const setParcelClass = props.setParcelClass;
  const surveyStatus = props.surveyStatus;
  const setSurveyStatus = props.setSurveyStatus;
  const surveyTake = props.surveyTake;
  const setSurveyTake = props.setSurveyTake;
  const appraisalStatus = props.appraisalStatus;
  const setAppraisalStatus = props.setAppraisalStatus;
  const appraisalForm = props.appraisalForm;
  const setAppraisalForm = props.setAppraisalForm;
  const appraisalNote = props.appraisalNote;
  const setAppraisalNote = props.setAppraisalNote;
  const appraisalBusy = props.appraisalBusy;
  const setAppraisalBusy = props.setAppraisalBusy;
  const acquisitionStatus = props.acquisitionStatus;
  const setAcquisitionStatus = props.setAcquisitionStatus;
  const ptsStatus = props.ptsStatus;
  const setPtsStatus = props.setPtsStatus;
  const parcelStatus = props.parcelStatus;
  const setParcelStatus = props.setParcelStatus;
  const specialConditionsStatus = props.specialConditionsStatus;
  const setSpecialConditionsStatus = props.setSpecialConditionsStatus;
  const condemnationStatus = props.condemnationStatus;
  const setCondemnationStatus = props.setCondemnationStatus;
  const permitStatus = props.permitStatus;
  const setPermitStatus = props.setPermitStatus;
  const permitForm = props.permitForm;
  const setPermitForm = props.setPermitForm;
  const permitBusy = props.permitBusy;
  const setPermitBusy = props.setPermitBusy;
  const legalForm = props.legalForm;
  const setLegalForm = props.setLegalForm;
  const legalBusy = props.legalBusy;
  const setLegalBusy = props.setLegalBusy;
  const compForm = props.compForm;
  const setCompForm = props.setCompForm;
  const compBusy = props.compBusy;
  const setCompBusy = props.setCompBusy;
  const compensationBusy = props.compensationBusy ?? props.compBusy;
  const setCompensationBusy = props.setCompensationBusy ?? props.setCompBusy;
  const compensationOffers = props.compensationOffers ?? parcel?.compensationOffers ?? [];
  const encroachmentStatus = props.encroachmentStatus;
  const setEncroachmentStatus = props.setEncroachmentStatus;
  const damagesStatus = props.damagesStatus;
  const setDamagesStatus = props.setDamagesStatus;
  const selectedLabels = props.selectedLabels ?? {};
  const addNoteCategory = props.addNoteCategory;
  const deleteNote = props.deleteNote;
  const uploadDocument = props.uploadDocument;
  const saveParcelStatuses = props.saveParcelStatuses;

  const surveyNote = props.surveyNote;
  const setSurveyNote = props.setSurveyNote;
  const documentCategory = props.documentCategory;
  const setDocumentCategory = props.setDocumentCategory;

  return (
<CollapsibleSection
        id="survey-take"
        title="Survey / take"
        defaultOpen={
          !surveyTake.easementAcresToAcquire &&
          !(parcel.easementAcresToAcquire || parcel.easementAcres)
        }
        summary={
          <SummaryLine>
            <SChip label={`Survey: ${fmtStatus(surveyStatus)}`} statusValue={surveyStatus} />
            <SChip
              label={`PE: ${dash(
                surveyTake.easementAcresToAcquire ||
                  parcel.easementAcresToAcquire ||
                  parcel.easementAcres
              )} ac`}
            />
            <SChip
              label={`TCE: ${dash(surveyTake.tceAcres || parcel.tceAcres)} ac`}
            />
            <SChip
              label={`Land use (Appraisal): ${
                LAND_USE_OPTIONS.find(
                  (o) => o.value === (parcel.matrixLandUse || surveyTake.matrixLandUse || '')
                )?.label ||
                dash(parcel.matrixLandUse || surveyTake.matrixLandUse)
              }`}
              fill
            />
          </SummaryLine>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Permanent easement / TCE take acres and exhibits. Matrix land use is set under Appraisal
          (drives offer schedule). Compensation reads PE acres from here + land use from Appraisal.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Survey status</InputLabel>
              <Select
                label="Survey status"
                value={surveyStatus}
                onChange={(e) => setSurveyStatus(e.target.value)}
              >
                {['NOT_STARTED', 'ORDERED', 'FIELD_WORK', 'DRAFTING', 'REVIEW', 'COMPLETE', 'HOLD'].map(
                  (s) => (
                    <MenuItem key={s} value={s}>
                      {s.replaceAll('_', ' ')}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>
          {(parcel.matrixLandUse || surveyTake.matrixLandUse) && (
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                size="small"
                variant="outlined"
                component="a"
                clickable
                href="#appraisal"
                label={`Land use (Appraisal): ${
                  LAND_USE_OPTIONS.find(
                    (o) => o.value === (parcel.matrixLandUse || surveyTake.matrixLandUse)
                  )?.label ||
                  parcel.matrixLandUse ||
                  surveyTake.matrixLandUse
                }${
                  (parcel.matrixLandUseLabel || surveyTake.matrixLandUseLabel)
                    ? ` · ${parcel.matrixLandUseLabel || surveyTake.matrixLandUseLabel}`
                    : ''
                }`}
              />
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Permanent easement acres (PE take)"
              value={surveyTake.easementAcresToAcquire}
              onChange={(e) =>
                setSurveyTake({ ...surveyTake, easementAcresToAcquire: e.target.value })
              }
              inputProps={{ step: '0.001', min: 0 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="TCE acres (optional)"
              value={surveyTake.tceAcres}
              onChange={(e) => setSurveyTake({ ...surveyTake, tceAcres: e.target.value })}
              inputProps={{ step: '0.001', min: 0 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setSaveError(null);
                setSaveSuccess(null);
                try {
                  const payload: any = {
                    surveyStatus,
                  };
                  if (surveyTake.easementAcresToAcquire !== '') {
                    const n = parseFloat(surveyTake.easementAcresToAcquire);
                    payload.easementAcresToAcquire = n;
                    payload.easementAcres = n;
                  }
                  if (surveyTake.tceAcres !== '') {
                    payload.tceAcres = parseFloat(surveyTake.tceAcres);
                  } else {
                    payload.tceAcres = null;
                  }
                  const res = await fetch(`/api/parcels/${parcelId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to save survey / take');
                  }
                  if (surveyNote.trim()) {
                    await fetch(`/api/parcels/${parcelId}/notes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content: surveyNote.trim(), category: 'SURVEY' }),
                    });
                    setSurveyNote('');
                  }
                  queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                  setSaveSuccess('Survey / take saved.');
                } catch (e: any) {
                  setSaveError(e.message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save survey / take
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Survey notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                fullWidth
                sx={{ flex: 1, minWidth: 220 }}
                placeholder="Add survey note…"
                value={surveyNote}
                onChange={(e) => setSurveyNote(e.target.value)}
              />
              <Button
                variant="outlined"
                disabled={!surveyNote.trim()}
                onClick={async () => {
                  if (!surveyNote.trim()) return;
                  await fetch(`/api/parcels/${parcelId}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: surveyNote.trim(), category: 'SURVEY' }),
                  });
                  setSurveyNote('');
                  queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                }}
              >
                Add note
              </Button>
            </Box>
            <List dense>
              {(parcel.notes || [])
                .filter((n: any) => n.category === 'SURVEY')
                .map((n: any) => (
                  <ListItem
                    key={n.id}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => deleteNote(n.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={n.content}
                      secondary={formatAttribution(n.author, n.createdAt)}
                    />
                  </ListItem>
                ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Survey / exhibit files</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} size="small">
                Upload exhibit / survey
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setDocumentCategory('SURVEY');
                    void uploadDocument(f, 'Document');
                    e.target.value = '';
                  }}
                />
              </Button>
            </Box>
            <List dense>
              {(parcel.documents || [])
                .filter((d: any) => d.category === 'SURVEY')
                .map((d: any) => (
                  <ListItem key={d.id}>
                    <ListItemText
                      primary={
                        <a href={d.url} target="_blank" rel="noreferrer">
                          {d.name}
                        </a>
                      }
                      secondary={`${d.category} · ${formatAttribution(d.uploadedBy, d.createdAt)}`}
                    />
                  </ListItem>
                ))}
            </List>
          </Grid>
        </Grid>
      
        <ParcelBillingPanel parcelId={parcelId} discipline="SURVEY" title="Survey billing" />
</CollapsibleSection>
  );
}
