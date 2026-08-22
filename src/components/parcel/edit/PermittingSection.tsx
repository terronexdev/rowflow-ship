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


export default function PermittingSection(props: any) {
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
        id="permitting"
        title="Permitting"
        defaultOpen={
          permitStatus !== 'NOT_STARTED' ||
          (parcel.permits && parcel.permits.length > 0) ||
          Object.keys(selectedLabels).some((c) =>
            ['RAILROAD', 'HIGHWAY_ROW', 'WORK_PERMIT_REQUIRED', 'UTILITY_CROSSING'].includes(c)
          )
        }
        summary={
          <SummaryLine>
            <SChip label={`Phase: ${fmtStatus(permitStatus)}`} statusValue={permitStatus} />
            <SChip label={`Filings: ${(parcel.permits || []).length}`} fill />
          </SummaryLine>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Parcel permitting phase (Color-by) plus tract-specific filings (e.g. railroad right-of-entry).
          Corridor-wide permits stay on the project. Status is manual — not auto-rolled from children.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Permit phase status"
              value={permitStatus}
              onChange={(e) => setPermitStatus(e.target.value)}
            >
              {PERMIT_PHASE_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              disabled={saving}
              onClick={() => void saveParcelStatuses({ permitStatus })}
            >
              Save permit phase
            </Button>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
          Filings on this parcel
        </Typography>
        {(parcel.permits || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No tract filings yet. Add a railroad / highway / local permit below.
          </Typography>
        ) : (
          <List dense sx={{ mb: 2 }}>
            {(parcel.permits || []).map((p: any) => (
              <ListItem
                key={p.id}
                divider
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Button
                      size="small"
                      onClick={() => router.push(`/projects/${projectId}/permits/${p.id}`)}
                    >
                      Open
                    </Button>
                    <IconButton
                      edge="end"
                      size="small"
                      aria-label="Delete filing"
                      color="error"
                      disabled={permitBusy}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Delete filing “${p.name}”? Notes and files on this filing will be removed.`
                          )
                        ) {
                          return;
                        }
                        setPermitBusy(true);
                        setSaveError(null);
                        try {
                          const res = await fetch(`/api/permits/${p.id}`, { method: 'DELETE' });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data.error || 'Failed to delete filing');
                          await queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                          await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
                        } catch (e) {
                          setSaveError(e instanceof Error ? e.message : 'Failed to delete filing');
                        } finally {
                          setPermitBusy(false);
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${p.name} · ${p.permitType}`}
                  secondary={`${p.status}${p.agency ? ` · ${p.agency}` : ''}${
                    p.referenceNumber ? ` · #${p.referenceNumber}` : ''
                  }`}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Add filing
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Name"
                value={permitForm.name}
                onChange={(e) => setPermitForm({ ...permitForm, name: e.target.value })}
                placeholder="CSX right-of-entry"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Type"
                value={permitForm.permitType}
                onChange={(e) => setPermitForm({ ...permitForm, permitType: e.target.value })}
              >
                {PERMIT_TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Filing status"
                value={permitForm.status}
                onChange={(e) => setPermitForm({ ...permitForm, status: e.target.value })}
              >
                {PERMIT_STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Agency"
                value={permitForm.agency}
                onChange={(e) => setPermitForm({ ...permitForm, agency: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Reference #"
                value={permitForm.referenceNumber}
                onChange={(e) => setPermitForm({ ...permitForm, referenceNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Submitted"
                InputLabelProps={{ shrink: true }}
                value={permitForm.submittedDate}
                onChange={(e) => setPermitForm({ ...permitForm, submittedDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={permitForm.notes}
                onChange={(e) => setPermitForm({ ...permitForm, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={permitBusy || !permitForm.name.trim()}
                onClick={async () => {
                  setPermitBusy(true);
                  setSaveError(null);
                  try {
                    const res = await fetch(`/api/parcels/${parcelId}/permits`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: permitForm.name.trim(),
                        permitType: permitForm.permitType,
                        status: permitForm.status,
                        agency: permitForm.agency || null,
                        referenceNumber: permitForm.referenceNumber || null,
                        submittedDate: permitForm.submittedDate || null,
                        notes: permitForm.notes || null,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to create permit');
                    setPermitForm({
                      name: '',
                      permitType: permitForm.permitType,
                      status: 'NOT_STARTED',
                      agency: '',
                      referenceNumber: '',
                      submittedDate: '',
                      notes: '',
                    });
                    queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                    setSaveSuccess('Permit filing added.');
                  } catch (e: any) {
                    setSaveError(e.message || 'Failed to add permit');
                  } finally {
                    setPermitBusy(false);
                  }
                }}
              >
                {permitBusy ? 'Adding…' : 'Add permit filing'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <SectionNotesDocs
          title="Permitting notes & files"
          categories={['PERMIT']}
          defaultCategory="PERMIT"
          notes={parcel.notes || []}
          documents={parcel.documents || []}
          onAddNote={addNoteCategory}
          onDeleteNote={deleteNote}
          onUpload={(file, category) => void uploadDocument(file, 'Document', category)}
          uploadLabel="Upload permit file"
        />

        <ParcelBillingPanel
          parcelId={parcelId}
          discipline="PERMITTING"
          title="Permitting billing"
        />
      </CollapsibleSection>
  );
}
