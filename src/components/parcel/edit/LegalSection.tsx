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


export default function LegalSection(props: any) {
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
        id="legal"
        title="Legal"
        defaultOpen={condemnationStatus !== 'NOT_STARTED'}
        summary={
          <SummaryLine>
            <SChip
              label={`Condemnation: ${fmtStatus(condemnationStatus)}`}
              statusValue={condemnationStatus}
            />
            <SChip label={`Case: ${dash(legalForm.caseNumber)}`} />
            <SChip label={`Court: ${dash(legalForm.court)}`} />
            <SChip label={`Judge: ${dash(legalForm.judge)}`} />
            <SChip label={`Counsel: ${dash(legalForm.counsel)}`} />
            <SChip label={`Opposing: ${dash(legalForm.opposingCounsel)}`} fill />
          </SummaryLine>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Counsel, court / ED docket, final-offer snapshot, and legal files. Compensation remains
          the offer ledger; final offer here is an ED snapshot.
        </Typography>
        {(() => {
          const offers = parcel.compensationOffers || [];
          const accepted = offers.find((o: any) => o.decision === 'ACCEPTED');
          const latestMade = offers.find((o: any) =>
            ['OFFERED', 'PENDING_REVIEW', 'ACCEPTED'].includes(o.decision)
          );
          return (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {accepted ? (
                <Chip
                  size="small"
                  color="success"
                  label={`Comp accepted $${Number(accepted.total).toLocaleString()}`}
                />
              ) : latestMade ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Comp latest $${Number(latestMade.total).toLocaleString()} (${latestMade.decision})`}
                />
              ) : (
                <Chip size="small" variant="outlined" label="No compensation offer yet" />
              )}
            </Box>
          );
        })()}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Condemnation status"
              value={condemnationStatus}
              onChange={(e) => setCondemnationStatus(e.target.value)}
            >
              {CONDEMNATION_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Final offer $ (ED snapshot)"
              value={legalForm.finalOfferAmount}
              onChange={(e) => setLegalForm({ ...legalForm, finalOfferAmount: e.target.value })}
              helperText="Optional copy from Comp for petition / demand"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Final offer date"
              InputLabelProps={{ shrink: true }}
              value={legalForm.finalOfferDate}
              onChange={(e) => setLegalForm({ ...legalForm, finalOfferDate: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Our counsel</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Counsel name"
              value={legalForm.counsel}
              onChange={(e) => setLegalForm({ ...legalForm, counsel: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Firm"
              value={legalForm.counselFirm}
              onChange={(e) => setLegalForm({ ...legalForm, counselFirm: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Phone"
              value={legalForm.counselPhone}
              onChange={(e) => setLegalForm({ ...legalForm, counselPhone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Email"
              value={legalForm.counselEmail}
              onChange={(e) => setLegalForm({ ...legalForm, counselEmail: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Opposing counsel</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Opposing counsel name"
              value={legalForm.opposingCounsel}
              onChange={(e) => setLegalForm({ ...legalForm, opposingCounsel: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Opposing firm"
              value={legalForm.opposingCounselFirm}
              onChange={(e) => setLegalForm({ ...legalForm, opposingCounselFirm: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Phone"
              value={legalForm.opposingCounselPhone}
              onChange={(e) => setLegalForm({ ...legalForm, opposingCounselPhone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Email"
              value={legalForm.opposingCounselEmail}
              onChange={(e) => setLegalForm({ ...legalForm, opposingCounselEmail: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Opposing counsel address"
              value={legalForm.opposingCounselAddress}
              onChange={(e) =>
                setLegalForm({ ...legalForm, opposingCounselAddress: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Court / docket</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Case number"
              value={legalForm.caseNumber}
              onChange={(e) => setLegalForm({ ...legalForm, caseNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Court"
              value={legalForm.court}
              onChange={(e) => setLegalForm({ ...legalForm, court: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Court district"
              value={legalForm.courtDistrict}
              onChange={(e) => setLegalForm({ ...legalForm, courtDistrict: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Judge"
              value={legalForm.judge}
              onChange={(e) => setLegalForm({ ...legalForm, judge: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Court address"
              value={legalForm.courtAddress}
              onChange={(e) => setLegalForm({ ...legalForm, courtAddress: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Key dates</Typography>
          </Grid>
          {[
            ['noticeSentDate', 'Notice sent'],
            ['petitionFiledDate', 'Petition filed'],
            ['servedDate', 'Served'],
            ['hearingDate', 'Hearing'],
            ['trialDate', 'Trial'],
            ['awardDate', 'Award'],
            ['judgmentDate', 'Judgment'],
            ['possessionDate', 'Possession'],
          ].map(([key, label]) => (
            <Grid item xs={12} md={3} key={key}>
              <TextField
                fullWidth
                type="date"
                label={label}
                InputLabelProps={{ shrink: true }}
                value={(legalForm as any)[key]}
                onChange={(e) => setLegalForm({ ...legalForm, [key]: e.target.value })}
              />
            </Grid>
          ))}

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Award amount $"
              value={legalForm.awardAmount}
              onChange={(e) => setLegalForm({ ...legalForm, awardAmount: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Legal costs $"
              value={legalForm.legalCosts}
              onChange={(e) => setLegalForm({ ...legalForm, legalCosts: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant={legalForm.appealFiled ? 'contained' : 'outlined'}
              color={legalForm.appealFiled ? 'warning' : 'inherit'}
              onClick={() => setLegalForm({ ...legalForm, appealFiled: !legalForm.appealFiled })}
            >
              {legalForm.appealFiled ? 'Appeal filed: Yes' : 'Appeal filed: No'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Legal notes (on record)"
              value={legalForm.notes}
              onChange={(e) => setLegalForm({ ...legalForm, notes: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              disabled={legalBusy || saving}
              onClick={async () => {
                setLegalBusy(true);
                setSaveError(null);
                setSaveSuccess(null);
                try {
                  const num = (v: string) => (v !== '' ? Number(v) : null);
                  const payload: any = {
                    ...legalForm,
                    awardAmount: num(legalForm.awardAmount),
                    finalOfferAmount: num(legalForm.finalOfferAmount),
                    legalCosts: num(legalForm.legalCosts),
                    status: condemnationStatus,
                    syncParcelStatus: true,
                  };
                  const res = await fetch(`/api/parcels/${parcelId}/legal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to save legal');
                  queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                  setSaveSuccess('Legal / condemnation saved.');
                } catch (e: any) {
                  setSaveError(e.message || 'Failed to save legal');
                } finally {
                  setLegalBusy(false);
                }
              }}
            >
              {legalBusy ? 'Saving…' : 'Save legal'}
            </Button>
          </Grid>
        </Grid>
        <SectionNotesDocs
          title="Legal notes & files"
          categories={['LEGAL', 'CONDEMNATION']}
          defaultCategory="LEGAL"
          notes={parcel.notes || []}
          documents={parcel.documents || []}
          onAddNote={addNoteCategory}
          onDeleteNote={deleteNote}
          onUpload={(file, category) => void uploadDocument(file, 'Document', category)}
          uploadLabel="Upload legal file"
        />
      
        <ParcelBillingPanel parcelId={parcelId} discipline="LEGAL" title="Legal billing" />
</CollapsibleSection>
  );
}
