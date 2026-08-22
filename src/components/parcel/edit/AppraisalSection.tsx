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


export default function AppraisalSection(props: any) {
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
        id="appraisal"
        title="Appraisal"
        defaultOpen={!surveyTake.matrixLandUse && !parcel.matrixLandUse}
        summary={
          <SummaryLine>
            <SChip label={`Appraisal: ${fmtStatus(appraisalStatus)}`} statusValue={appraisalStatus} />
            <SChip
              label={`Land use: ${
                LAND_USE_OPTIONS.find(
                  (o) => o.value === (surveyTake.matrixLandUse || parcel.matrixLandUse || '')
                )?.label ||
                dash(surveyTake.matrixLandUse || parcel.matrixLandUse)
              }`}
            />
            <SChip label={`Type: ${fmtStatus(appraisalForm.appraisalType)}`} />
            <SChip label={`Appraiser: ${dash(appraisalForm.appraiser)}`} />
            <SChip
              label={`Total: ${
                appraisalForm.totalValue ? `$${Number(appraisalForm.totalValue).toLocaleString()}` : '—'
              }`}
              fill
            />
          </SummaryLine>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Valuation and matrix land use (schedule category for offers). PE take acres come from
          Survey. Land use must match a project matrix row so compensation can compute windows.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Appraisal status"
              value={appraisalStatus}
              onChange={(e) => setAppraisalStatus(e.target.value)}
            >
              {APPRAISAL_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Appraisal type"
              value={appraisalForm.appraisalType}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, appraisalType: e.target.value })}
            >
              {[
                ['EASEMENT', 'Easement'],
                ['FEE_SIMPLE', 'Fee simple'],
                ['DAMAGES_ONLY', 'Damages only'],
                ['REVIEW', 'Review'],
              ].map(([v, l]) => (
                <MenuItem key={v} value={v}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Appraiser / firm"
              value={appraisalForm.appraiser}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, appraiser: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Land use (matrix / offers)"
              value={surveyTake.matrixLandUse}
              onChange={(e) => setSurveyTake({ ...surveyTake, matrixLandUse: e.target.value })}
              helperText="Source of truth for compensation schedule"
            >
              <MenuItem value="">— Select —</MenuItem>
              {(parcel.project?.landPaymentMatrix?.rows || []).length
                ? (parcel.project.landPaymentMatrix.rows as any[]).map((r) => (
                    <MenuItem key={r.id || r.landUse} value={r.landUse}>
                      {r.landUse === 'OTHER' && r.customLabel
                        ? r.customLabel
                        : LAND_USE_OPTIONS.find((o) => o.value === r.landUse)?.label || r.landUse}
                    </MenuItem>
                  ))
                : LAND_USE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
            </TextField>
          </Grid>
          {surveyTake.matrixLandUse === 'OTHER' && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Custom land use label"
                value={surveyTake.matrixLandUseLabel}
                onChange={(e) =>
                  setSurveyTake({ ...surveyTake, matrixLandUseLabel: e.target.value })
                }
              />
            </Grid>
          )}
          {(parcel.easementAcresToAcquire != null ||
            parcel.easementAcres != null ||
            surveyTake.easementAcresToAcquire) && (
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                size="small"
                variant="outlined"
                component="a"
                clickable
                href="#survey-take"
                label={`PE take (Survey): ${
                  parcel.easementAcresToAcquire ??
                  parcel.easementAcres ??
                  surveyTake.easementAcresToAcquire
                } ac`}
              />
            </Grid>
          )}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Order date"
              InputLabelProps={{ shrink: true }}
              value={appraisalForm.orderDate}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, orderDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Inspection date"
              InputLabelProps={{ shrink: true }}
              value={appraisalForm.inspectionDate}
              onChange={(e) =>
                setAppraisalForm({ ...appraisalForm, inspectionDate: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Draft date"
              InputLabelProps={{ shrink: true }}
              value={appraisalForm.draftDate}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, draftDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Final date"
              InputLabelProps={{ shrink: true }}
              value={appraisalForm.finalDate}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, finalDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Before value $"
              value={appraisalForm.beforeValue}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, beforeValue: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="After value $"
              value={appraisalForm.afterValue}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, afterValue: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Easement value $"
              value={appraisalForm.easementValue}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, easementValue: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Damages value $"
              value={appraisalForm.damageValue}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, damageValue: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Total appraised $"
              value={appraisalForm.totalValue}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, totalValue: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Appraisal cost $"
              value={appraisalForm.cost}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, cost: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Work order #"
              value={appraisalForm.workOrder}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, workOrder: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Scope"
              value={appraisalForm.scope}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, scope: e.target.value })}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Appraisal notes (on record)"
              value={appraisalForm.notes}
              onChange={(e) => setAppraisalForm({ ...appraisalForm, notes: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              disabled={appraisalBusy || saving}
              onClick={async () => {
                setAppraisalBusy(true);
                setSaveError(null);
                setSaveSuccess(null);
                try {
                  const payload: any = {
                    appraiser: appraisalForm.appraiser || null,
                    appraisalType: appraisalForm.appraisalType,
                    scope: appraisalForm.scope || null,
                    orderDate: appraisalForm.orderDate || null,
                    inspectionDate: appraisalForm.inspectionDate || null,
                    draftDate: appraisalForm.draftDate || null,
                    finalDate: appraisalForm.finalDate || null,
                    beforeValue:
                      appraisalForm.beforeValue !== '' ? Number(appraisalForm.beforeValue) : null,
                    afterValue:
                      appraisalForm.afterValue !== '' ? Number(appraisalForm.afterValue) : null,
                    easementValue:
                      appraisalForm.easementValue !== ''
                        ? Number(appraisalForm.easementValue)
                        : null,
                    damageValue:
                      appraisalForm.damageValue !== '' ? Number(appraisalForm.damageValue) : null,
                    totalValue:
                      appraisalForm.totalValue !== '' ? Number(appraisalForm.totalValue) : null,
                    cost: appraisalForm.cost !== '' ? Number(appraisalForm.cost) : null,
                    workOrder: appraisalForm.workOrder || null,
                    notes: appraisalForm.notes || null,
                    status: appraisalStatus,
                    syncParcelStatus: true,
                  };
                  const landPatch: any = {
                    matrixLandUse: surveyTake.matrixLandUse || null,
                    matrixLandUseLabel:
                      surveyTake.matrixLandUse === 'OTHER'
                        ? surveyTake.matrixLandUseLabel || null
                        : null,
                  };
                  const landRes = await fetch(`/api/parcels/${parcelId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(landPatch),
                  });
                  if (!landRes.ok) {
                    const err = await landRes.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to save land use');
                  }
                  const res = await fetch(`/api/parcels/${parcelId}/appraisal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to save appraisal');
                  if (appraisalNote.trim()) {
                    await fetch(`/api/parcels/${parcelId}/notes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        content: appraisalNote.trim(),
                        category: 'APPRAISAL',
                      }),
                    });
                    setAppraisalNote('');
                  }
                  queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                  setSaveSuccess('Appraisal + land use saved.');
                } catch (e: any) {
                  setSaveError(e.message || 'Failed to save appraisal');
                } finally {
                  setAppraisalBusy(false);
                }
              }}
            >
              {appraisalBusy ? 'Saving…' : 'Save appraisal'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Appraisal comments
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                fullWidth
                sx={{ flex: 1, minWidth: 220 }}
                placeholder="Add appraisal comment…"
                value={appraisalNote}
                onChange={(e) => setAppraisalNote(e.target.value)}
              />
              <Button
                variant="outlined"
                disabled={!appraisalNote.trim()}
                onClick={async () => {
                  if (!appraisalNote.trim()) return;
                  await fetch(`/api/parcels/${parcelId}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      content: appraisalNote.trim(),
                      category: 'APPRAISAL',
                    }),
                  });
                  setAppraisalNote('');
                  queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                }}
              >
                Add comment
              </Button>
            </Box>
            <List dense>
              {(parcel.notes || [])
                .filter((n: any) => n.category === 'APPRAISAL')
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
            <Typography variant="subtitle2">Appraisal files</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} size="small">
                Upload appraisal report
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadDocument(f, 'Document', 'APPRAISAL');
                    e.target.value = '';
                  }}
                />
              </Button>
            </Box>
            <List dense>
              {(parcel.documents || [])
                .filter((d: any) => d.category === 'APPRAISAL')
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
      
        <ParcelBillingPanel parcelId={parcelId} discipline="APPRAISAL" title="Appraisal billing" />
</CollapsibleSection>
  );
}
