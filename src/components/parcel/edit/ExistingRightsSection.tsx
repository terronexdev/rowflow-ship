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


export default function ExistingRightsSection(props: any) {
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
        id="existing-rights"
        title="Existing rights"
        defaultOpen={
          existingRightsStatus !== 'NOT_REVIEWED' ||
          Boolean(parcelClass && parcelClass !== 'UNKNOWN')
        }
        summary={
          <SummaryLine>
            <SChip label={`Class: ${fmtStatus(parcelClass)}`} statusValue={parcelClass} />
            <SChip
              label={`Rights: ${fmtStatus(existingRightsStatus)}`}
              statusValue={existingRightsStatus}
            />
            {props.existingStructureNumbers ? (
              <SChip label={`Exist struct: ${props.existingStructureNumbers}`} fill />
            ) : null}
          </SummaryLine>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Existing utility plant (poles, towers) under prior / foreign rights — not this project&apos;s
          new structure numbers.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems="flex-start">
          <TextField
            fullWidth
            size="small"
            label="Existing structure #s"
            value={props.existingStructureNumbers || ''}
            onChange={(e) => props.setExistingStructureNumbers?.(e.target.value)}
            helperText="In-place / foreign plant IDs (comma-separated OK)"
          />
          <Button
            variant="outlined"
            disabled={saving || !props.setExistingStructureNumbers}
            sx={{ flexShrink: 0, mt: { xs: 0, sm: 0.5 } }}
            onClick={async () => {
              setSaving(true);
              setSaveError(null);
              try {
                const res = await fetch(`/api/parcels/${parcelId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    existingStructureNumbers: props.existingStructureNumbers || null,
                  }),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || 'Failed to save');
                }
                queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                queryClient.invalidateQueries({ queryKey: ['project', projectId] });
                setSaveSuccess('Existing structure #s saved.');
              } catch (e: any) {
                setSaveError(e.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            Save structures
          </Button>
        </Stack>
        <ExistingRightsPanel
          projectId={projectId}
          parcelId={parcelId}
          status={existingRightsStatus}
          onStatusChange={setExistingRightsStatus}
          parcelClass={parcelClass}
          onParcelClassChange={setParcelClass}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
            setSaveSuccess('Existing rights updated.');
          }}
        />
        <SectionNotesDocs
          title="Existing rights notes & files"
          categories={['EXISTING_RIGHTS']}
          defaultCategory="EXISTING_RIGHTS"
          notes={parcel.notes || []}
          documents={parcel.documents || []}
          onAddNote={addNoteCategory}
          onDeleteNote={deleteNote}
          onUpload={(file, category) => void uploadDocument(file, 'Document', category)}
          uploadLabel="Upload existing rights file"
        />
      </CollapsibleSection>
  );
}
