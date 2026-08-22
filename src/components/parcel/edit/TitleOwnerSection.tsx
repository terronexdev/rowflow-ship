'use client';

import { Button, Grid, MenuItem, TextField, Typography } from '@mui/material';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import ParcelBillingPanel from '@/components/parcel/ParcelBillingPanel';
import SectionNotesDocs from '@/components/parcel/SectionNotesDocs';
import { SummaryLine, SChip, dash, fmtStatus } from '@/components/parcel/sectionSummary';
import { TITLE_STATUSES } from '@/lib/constants/status';

export type TitledInfoFields = {
  titledOwnerName: string;
  titledOwnerTaxId: string;
  titledOwnerDistrict: string;
  titledOwnerAddress: string;
  titledOwnerCity: string;
  titledOwnerState: string;
  titledOwnerZip: string;
  titledOwnerPhone: string;
  titledOwnerEmail: string;
  titledLegalDescription: string;
  [key: string]: string;
};

export default function TitleOwnerSection({
  parcelId,
  titleStatus,
  setTitleStatus,
  titledInfo,
  setTitledInfo,
  saving,
  setSaving,
  setSaveError,
  setSaveSuccess,
  onSaved,
  notes = [],
  documents = [],
  addNoteCategory,
  deleteNote,
  uploadDocument,
}: {
  parcelId: string;
  titleStatus: string;
  setTitleStatus: (v: string) => void;
  titledInfo: TitledInfoFields;
  setTitledInfo: (v: TitledInfoFields) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setSaveError: (v: string | null) => void;
  setSaveSuccess: (v: string | null) => void;
  onSaved: () => void;
  notes?: any[];
  documents?: any[];
  addNoteCategory: (content: string, category: string) => Promise<void>;
  deleteNote: (id: string) => void;
  uploadDocument: (file: File | undefined, type: string, category?: string) => Promise<void>;
}) {
  return (
    <CollapsibleSection
      id="title"
      title="Titled owner"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label={`Title: ${fmtStatus(titleStatus)}`} statusValue={titleStatus} />
          <SChip label={`Owner: ${dash(titledInfo.titledOwnerName)}`} fill />
          <SChip
            label={`${dash(titledInfo.titledOwnerCity)}${
              titledInfo.titledOwnerState ? `, ${titledInfo.titledOwnerState}` : ''
            }`}
          />
          <SChip label={`Tax ID: ${dash(titledInfo.titledOwnerTaxId)}`} />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current owner of record — starts blank; separate from county GIS owner fields. Title status
        is owned by this section.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Title status"
            value={titleStatus}
            onChange={(e) => setTitleStatus(e.target.value)}
          >
            {TITLE_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {(
          [
            ['titledOwnerName', 'Current Owner(s)'],
            ['titledOwnerTaxId', 'Tax Id #'],
            ['titledOwnerDistrict', 'District'],
            ['titledOwnerAddress', 'Owner Address'],
            ['titledOwnerCity', 'City'],
            ['titledOwnerState', 'State'],
            ['titledOwnerZip', 'ZIP'],
            ['titledOwnerPhone', 'Phone'],
            ['titledOwnerEmail', 'Email'],
          ] as const
        ).map(([name, label]) => (
          <Grid
            item
            xs={12}
            md={name === 'titledOwnerAddress' || name === 'titledOwnerName' ? 12 : 4}
            key={name}
          >
            <TextField
              fullWidth
              label={label}
              name={name}
              value={titledInfo[name] || ''}
              onChange={(e) => setTitledInfo({ ...titledInfo, [name]: e.target.value })}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Legal description"
            value={titledInfo.titledLegalDescription}
            onChange={(e) =>
              setTitledInfo({ ...titledInfo, titledLegalDescription: e.target.value })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setSaveError(null);
              try {
                const payload: any = { ...titledInfo, titleStatus };
                delete payload.easementAcresToAcquire;
                const res = await fetch(`/api/parcels/${parcelId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || 'Failed to save titled owner');
                }
                onSaved();
                setSaveSuccess('Titled owner + title status saved.');
              } catch (e: any) {
                setSaveError(e.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            Save titled owner
          </Button>
        </Grid>
      </Grid>

      <SectionNotesDocs
        title="Title notes & files"
        categories={['TITLE']}
        defaultCategory="TITLE"
        notes={notes || []}
        documents={documents || []}
        onAddNote={addNoteCategory}
        onDeleteNote={deleteNote}
        onUpload={(file, category) => void uploadDocument(file, 'Document', category)}
        uploadLabel="Upload title / deed file"
      />

      <ParcelBillingPanel parcelId={parcelId} discipline="TITLE" title="Title billing" />
    </CollapsibleSection>
  );
}
