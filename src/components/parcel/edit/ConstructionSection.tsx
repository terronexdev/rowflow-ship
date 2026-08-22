'use client';

import { Button, Grid, MenuItem, TextField, Typography } from '@mui/material';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import ParcelBillingPanel from '@/components/parcel/ParcelBillingPanel';
import SectionNotesDocs from '@/components/parcel/SectionNotesDocs';
import { SummaryLine, SChip, fmtStatus } from '@/components/parcel/sectionSummary';
import { DAMAGES_STATUSES } from '@/lib/constants/status';

export default function ConstructionSection({
  parcelId,
  damagesStatus,
  setDamagesStatus,
  saving,
  saveParcelStatuses,
  notes,
  documents,
  addNoteCategory,
  deleteNote,
  uploadDocument,
}: {
  parcelId: string;
  damagesStatus: string;
  setDamagesStatus: (v: string) => void;
  saving: boolean;
  saveParcelStatuses: (patch: Record<string, string>) => void | Promise<void>;
  notes: any[];
  documents: any[];
  addNoteCategory: (content: string, category: string) => Promise<void>;
  deleteNote: (id: string) => void;
  uploadDocument: (file: File | undefined, type: string, category?: string) => Promise<void>;
}) {
  return (
    <CollapsibleSection
      id="construction-support"
      title="Construction support"
      defaultOpen={damagesStatus !== 'NOT_STARTED'}
      summary={
        <SummaryLine>
          <SChip label={`Damages: ${fmtStatus(damagesStatus)}`} statusValue={damagesStatus} fill />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Damages / field claims. Special conditions and overall / acquisition stay under ROW agent.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Damages status"
            value={damagesStatus}
            onChange={(e) => setDamagesStatus(e.target.value)}
          >
            {DAMAGES_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => void saveParcelStatuses({ damagesStatus })}
          >
            Save construction statuses
          </Button>
        </Grid>
      </Grid>
      <SectionNotesDocs
        title="Construction notes & files"
        categories={['DAMAGES']}
        defaultCategory="DAMAGES"
        notes={notes || []}
        documents={documents || []}
        onAddNote={addNoteCategory}
        onDeleteNote={deleteNote}
        onUpload={(file, category) => void uploadDocument(file, 'Document', category)}
        uploadLabel="Upload field file"
      />

      <ParcelBillingPanel
        parcelId={parcelId}
        discipline="CONSTRUCTION"
        title="Construction billing"
        allowFees={false}
      />
    </CollapsibleSection>
  );
}
