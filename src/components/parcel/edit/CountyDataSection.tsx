'use client';

import { Button, Grid, TextField, Typography } from '@mui/material';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import { SummaryLine, SChip, dash } from '@/components/parcel/sectionSummary';

export type BasicInfoFields = {
  easementNumber: string;
  newStructureNumbers: string;
  parcelNumber: string;
  pin: string;
  sequence: string;
  milepost: string;
  acreage: string;
  owner: string;
  ownerEmail: string;
  ownerAddress: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  ownerPhone: string;
  county: string;
  legalDesc: string;
};

export default function CountyDataSection({
  basicInfo,
  handleChange,
  saveBasicInfo,
  saving,
}: {
  basicInfo: BasicInfoFields;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  saveBasicInfo: () => void;
  saving: boolean;
}) {
  return (
    <CollapsibleSection
      id="county"
      title="Tract identity & county"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label={`Easement #: ${dash(basicInfo.easementNumber)}`} fill />
          <SChip label={`PIN: ${dash(basicInfo.pin)}`} />
          <SChip label={`Parcel: ${dash(basicInfo.parcelNumber)}`} />
          <SChip label={`New struct: ${dash(basicInfo.newStructureNumbers)}`} />
          <SChip label={`Owner (GIS): ${dash(basicInfo.owner)}`} />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Project tract IDs and GIS / assessor fields. Easement # is this job&apos;s file number (not an
        existing-rights instrument). Structure #s are utility plant IDs (poles, towers) — not
        buildings. Titled owner is separate below.
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            This project
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Easement #"
            name="easementNumber"
            value={basicInfo.easementNumber}
            onChange={handleChange}
            helperText="Project tract / easement file # (corridor job ID)"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="New structure #s"
            name="newStructureNumbers"
            value={basicInfo.newStructureNumbers}
            onChange={handleChange}
            helperText="This project’s poles/towers/plant IDs (comma-separated OK)"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            County / GIS
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Parcel Number (tax map)"
            name="parcelNumber"
            value={basicInfo.parcelNumber}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="PIN" name="pin" value={basicInfo.pin} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Sequence"
            name="sequence"
            type="number"
            value={basicInfo.sequence}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Milepost"
            name="milepost"
            type="number"
            inputProps={{ step: '0.01' }}
            value={basicInfo.milepost}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Acreage"
            name="acreage"
            type="number"
            inputProps={{ step: '0.01' }}
            value={basicInfo.acreage}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Owner Name"
            name="owner"
            value={basicInfo.owner}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Owner Email"
            name="ownerEmail"
            type="email"
            value={basicInfo.ownerEmail}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Owner Address"
            name="ownerAddress"
            value={basicInfo.ownerAddress}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="City"
            name="ownerCity"
            value={basicInfo.ownerCity}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="State"
            name="ownerState"
            value={basicInfo.ownerState}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="ZIP"
            name="ownerZip"
            value={basicInfo.ownerZip}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Owner Phone"
            name="ownerPhone"
            value={basicInfo.ownerPhone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="County"
            name="county"
            value={basicInfo.county}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Legal Description"
            name="legalDesc"
            value={basicInfo.legalDesc}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={saveBasicInfo} disabled={saving}>
            {saving ? 'Saving...' : 'Save identity & county'}
          </Button>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
}
