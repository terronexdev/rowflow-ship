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


export default function RowAgentSection(props: any) {
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
        id="row-agent"
        title="ROW agent"
        defaultOpen={true}
        summary={
          <SummaryLine>
            <SChip label={`Overall: ${fmtStatus(parcelStatus)}`} statusValue={parcelStatus} />
            <SChip label={`PTS: ${fmtStatus(ptsStatus)}`} statusValue={ptsStatus} />
            <SChip label={`Acquisition: ${fmtStatus(acquisitionStatus)}`} statusValue={acquisitionStatus} />
            <SChip
              label={`Special: ${fmtStatus(specialConditionsStatus)}`}
              statusValue={specialConditionsStatus}
            />
            <SChip
              label={`${(parcel.compensationOffers || []).length} offer(s)${
                (parcel.compensationOffers || []).some((o: any) => o.decision === 'ACCEPTED')
                  ? ' · accepted'
                  : ''
              }`}
              fill
            />
          </SummaryLine>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          PTS access, acquisition path, overall status, special conditions, and compensation
          offers. Damages stay under Construction support.
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Overall status"
              value={parcelStatus}
              onChange={(e) => setParcelStatus(e.target.value)}
            >
              {OVERALL_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="PTS status"
              value={ptsStatus}
              onChange={(e) => setPtsStatus(e.target.value)}
            >
              {PTS_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Acquisition status"
              value={acquisitionStatus}
              onChange={(e) => setAcquisitionStatus(e.target.value)}
            >
              {ACQUISITION_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Special conditions"
              value={specialConditionsStatus}
              onChange={(e) => setSpecialConditionsStatus(e.target.value)}
            >
              {SPECIAL_CONDITIONS_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              disabled={saving}
              onClick={() =>
                void saveParcelStatuses({
                  status: parcelStatus,
                  ptsStatus,
                  acquisitionStatus,
                  specialConditionsStatus,
                })
              }
            >
              Save ROW statuses
            </Button>
            <Chip
              size="small"
              variant="outlined"
              component="a"
              clickable
              href="#construction-support"
              label={`Damages: ${damagesStatus.replaceAll('_', ' ')} → Construction`}
            />
          </Grid>
        </Grid>

        <SectionNotesDocs
          title="ROW notes & files (PTS · Acquisition · Compensation · Special conditions)"
          categories={['PTS', 'ACQUISITION', 'COMPENSATION', 'SPECIAL_CONDITIONS']}
          defaultCategory="PTS"
          notes={parcel.notes || []}
          documents={parcel.documents || []}
          onAddNote={addNoteCategory}
          onDeleteNote={deleteNote}
          onUpload={(file, category) => void uploadDocument(file, 'Document', category)}
          uploadLabel="Upload ROW file"
        />

        <Typography variant="subtitle1" id="compensation" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
          Compensation
        </Typography>
        {(() => {
          const rows = parcel.project?.landPaymentMatrix?.rows || [];
          const landUse = parcel.matrixLandUse || surveyTake.matrixLandUse || '';
          const landUseLabel =
            landUse === 'OTHER'
              ? parcel.matrixLandUseLabel || surveyTake.matrixLandUseLabel || ''
              : '';
          const row =
            rows.find(
              (r: any) =>
                r.landUse === landUse &&
                (landUse !== 'OTHER' || !landUseLabel || r.customLabel === landUseLabel)
            ) || rows.find((r: any) => r.landUse === landUse);
          const acres =
            parseFloat(
              String(
                parcel.easementAcresToAcquire ??
                  parcel.easementAcres ??
                  surveyTake.easementAcresToAcquire ??
                  ''
              )
            ) || 0;
          const lowPct = Number(parcel.project?.offerRangeLowPct) || 0.8;
          const highPct = Number(parcel.project?.offerRangeHighPct) || 1.5;
          const range =
            row && acres > 0
              ? computeOfferRange({
                  row: {
                    minAmount: Number(row.minAmount),
                    maxAmount: Number(row.maxAmount),
                    unit: row.unit,
                  },
                  acres,
                  lowPct,
                  highPct,
                })
              : null;
          const negotiated = parseFloat(compForm.negotiatedAmount) || 0;
          const damages = parseFloat(compForm.damages) || 0;
          const otherAmount = parseFloat(compForm.otherAmount) || 0;
          const total = computeCompensationTotal(negotiated, damages, otherAmount);
          const outside = range ? range.outsideRange(negotiated) : false;
          const offers = parcel.compensationOffers || [];
          const accepted = offers.find((o: any) => o.decision === 'ACCEPTED');
          const offeredN = offers.filter((o: any) =>
            ['OFFERED', 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'SUPERSEDED'].includes(o.decision)
          ).length;
          const takeReady = Boolean(landUse && acres > 0 && row);
          const decisionLabel = (d: string) =>
            ({
              DRAFT: 'Draft',
              OFFERED: 'Offer made',
              PENDING_REVIEW: 'Pending review',
              ACCEPTED: 'Accepted',
              REJECTED: 'Rejected',
              SUPERSEDED: 'Superseded',
              WITHDRAWN: 'Withdrawn',
            } as Record<string, string>)[d] || d;

          const saveOffer = async (decision: string) => {
            setCompBusy(true);
            setSaveError(null);
            setSaveSuccess(null);
            try {
              if (!takeReady) {
                throw new Error('Set land use on Appraisal and PE take acres on Survey / take first.');
              }
              if (outside && !compForm.outsideRangeReason.trim() && decision !== 'DRAFT') {
                throw new Error('Outside-range reason is required.');
              }
              const res = await fetch(`/api/parcels/${parcelId}/compensation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  negotiatedAmount: negotiated,
                  damages,
                  otherAmount,
                  outsideRangeReason: compForm.outsideRangeReason || null,
                  notes: compForm.notes || null,
                  decision,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to save offer');
              setCompForm((f: any) => ({
                ...f,
                negotiatedAmount: '',
                damages: '0',
                otherAmount: '0',
                outsideRangeReason: '',
                notes: '',
              }));
              queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
              setSaveSuccess(`Offer saved as ${decisionLabel(decision)}.`);
              return data;
            } catch (e: any) {
              setSaveError(e.message || 'Failed to save offer');
              return null;
            } finally {
              setCompBusy(false);
            }
          };

          const setOfferDecision = async (offerId: string, decision: string) => {
            setCompBusy(true);
            setSaveError(null);
            try {
              const res = await fetch(`/api/parcels/${parcelId}/compensation`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offerId, decision }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to update offer');
              queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
              setSaveSuccess(`Offer marked ${decisionLabel(decision)}.`);
            } catch (e: any) {
              setSaveError(e.message);
            } finally {
              setCompBusy(false);
            }
          };

          return (
            <>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  size="small"
                  color={takeReady ? 'success' : 'warning'}
                  label={
                    takeReady
                      ? `Take: ${LAND_USE_OPTIONS.find((o) => o.value === landUse)?.label || landUse}${
                          landUseLabel ? ` (${landUseLabel})` : ''
                        } · ${acres} ac PE`
                      : 'Incomplete — land use (Appraisal) + PE acres (Survey)'
                  }
                />
                <Chip size="small" variant="outlined" label={`${offeredN} offer(s) made`} />
                <Chip
                  size="small"
                  color={accepted ? 'success' : 'default'}
                  variant={accepted ? 'filled' : 'outlined'}
                  label={
                    accepted
                      ? `Accepted $${Number(accepted.total).toLocaleString()}`
                      : 'No accepted offer'
                  }
                />
                {range && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Window $${range.rangeLow.toLocaleString()} – $${range.rangeHigh.toLocaleString()}`}
                  />
                )}
              </Box>

              {!rows.length && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No land payment matrix on this project. Set matrix rows on Project Edit first.
                </Alert>
              )}
              {rows.length > 0 && landUse && !row && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Land use “{landUse}” is not on the project matrix.
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Negotiated easement $"
                    value={compForm.negotiatedAmount}
                    onChange={(e) => setCompForm({ ...compForm, negotiatedAmount: e.target.value })}
                    disabled={!takeReady}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Damages"
                    value={compForm.damages}
                    onChange={(e) => setCompForm({ ...compForm, damages: e.target.value })}
                    disabled={!takeReady}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Other"
                    value={compForm.otherAmount}
                    onChange={(e) => setCompForm({ ...compForm, otherAmount: e.target.value })}
                    disabled={!takeReady}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Total"
                    value={`$${total.toLocaleString()}`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                {outside && (
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Negotiated amount is outside the offer band for this take.
                    </Alert>
                    <TextField
                      fullWidth
                      required
                      label="Outside-range reason"
                      value={compForm.outsideRangeReason}
                      onChange={(e) =>
                        setCompForm({ ...compForm, outsideRangeReason: e.target.value })
                      }
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Offer notes"
                    value={compForm.notes}
                    onChange={(e) => setCompForm({ ...compForm, notes: e.target.value })}
                    disabled={!takeReady}
                  />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    disabled={compBusy || !takeReady || !negotiated}
                    onClick={() => void saveOffer('DRAFT')}
                  >
                    Save draft
                  </Button>
                  <Button
                    variant="contained"
                    disabled={compBusy || !takeReady || !negotiated}
                    onClick={() => void saveOffer(outside ? 'PENDING_REVIEW' : 'OFFERED')}
                  >
                    {outside ? 'Save OOR offer' : 'Record offer made'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={compBusy || !takeReady || !negotiated}
                    onClick={() => void saveOffer('ACCEPTED')}
                  >
                    Record accepted
                  </Button>
                  {outside && (
                    <Button
                      variant="outlined"
                      color="warning"
                      disabled={
                        compBusy || !compForm.outsideRangeReason.trim() || !takeReady || !negotiated
                      }
                      onClick={async () => {
                        const data = await saveOffer('PENDING_REVIEW');
                        if (!data?.offer?.id) return;
                        setCompBusy(true);
                        try {
                          const sendRes = await fetch(
                            `/api/parcels/${parcelId}/compensation/${data.offer.id}/send`,
                            { method: 'POST' }
                          );
                          const sent = await sendRes.json();
                          if (!sendRes.ok) throw new Error(sent.error || 'Failed to send email');
                          queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
                          setSaveSuccess('OOR offer saved and counter-offer email sent.');
                        } catch (e: any) {
                          setSaveError(e.message);
                        } finally {
                          setCompBusy(false);
                        }
                      }}
                    >
                      Save + send counter-offer email
                    </Button>
                  )}
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Offer ledger
              </Typography>
              {offers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No offers yet.
                </Typography>
              ) : (
                <List dense>
                  {offers.map((o: any) => (
                    <ListItem
                      key={o.id}
                      divider
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {o.decision !== 'ACCEPTED' && o.decision !== 'SUPERSEDED' && (
                            <Button
                              size="small"
                              disabled={compBusy}
                              onClick={() => void setOfferDecision(o.id, 'ACCEPTED')}
                            >
                              Accept
                            </Button>
                          )}
                          {o.decision === 'OFFERED' || o.decision === 'PENDING_REVIEW' || o.decision === 'DRAFT' ? (
                            <Button
                              size="small"
                              color="inherit"
                              disabled={compBusy}
                              onClick={() => void setOfferDecision(o.id, 'WITHDRAWN')}
                            >
                              Withdraw
                            </Button>
                          ) : null}
                        </Box>
                      }
                      sx={{ pr: 18 }}
                    >
                      <ListItemText
                        primary={`$${Number(o.total).toLocaleString()} · ${decisionLabel(o.decision)}${
                          o.outsideRange ? ' · OOR' : ''
                        }`}
                        secondary={`${Number(o.easementAcres)} ac · ${o.landUse} · negotiated $${Number(
                          o.negotiatedAmount
                        ).toLocaleString()} · window $${Number(o.rangeLow).toLocaleString()}–$${Number(
                          o.rangeHigh
                        ).toLocaleString()} · ${new Date(o.createdAt).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          );
        })()}
      
        <ParcelBillingPanel parcelId={parcelId} discipline="ROW" title="ROW billing" />
</CollapsibleSection>
  );
}
