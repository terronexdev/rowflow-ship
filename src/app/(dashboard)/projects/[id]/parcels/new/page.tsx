'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { OVERALL_STATUSES } from '@/lib/constants';

export default function NewParcelPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [formData, setFormData] = useState({
    parcelNumber: '',
    pin: '',
    owner: '',
    ownerAddress: '',
    ownerCity: '',
    ownerState: '',
    ownerZip: '',
    ownerPhone: '',
    ownerEmail: '',
    legalDesc: '',
    county: '',
    status: 'NOT_STARTED',
    sequence: '',
    milepost: '',
    acreage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parcelData: Record<string, unknown> = {
        projectId,
        status: formData.status,
      };

      if (formData.parcelNumber) parcelData.parcelNumber = formData.parcelNumber;
      if (formData.pin) parcelData.pin = formData.pin;
      if (formData.owner) parcelData.owner = formData.owner;
      if (formData.ownerAddress) parcelData.ownerAddress = formData.ownerAddress;
      if (formData.ownerCity) parcelData.ownerCity = formData.ownerCity;
      if (formData.ownerState) parcelData.ownerState = formData.ownerState;
      if (formData.ownerZip) parcelData.ownerZip = formData.ownerZip;
      if (formData.ownerPhone) parcelData.ownerPhone = formData.ownerPhone;
      if (formData.ownerEmail) parcelData.ownerEmail = formData.ownerEmail;
      if (formData.legalDesc) parcelData.legalDesc = formData.legalDesc;
      if (formData.county) parcelData.county = formData.county;
      if (formData.sequence) parcelData.sequence = parseInt(formData.sequence, 10);
      if (formData.milepost) parcelData.milepost = parseFloat(formData.milepost);
      if (formData.acreage) parcelData.acreage = parseFloat(formData.acreage);

      const response = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create parcel');

      router.push(`/projects/${projectId}/parcels/${data.parcel.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create parcel');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Add parcel
      </Typography>
      {error && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Parcel number" name="parcelNumber" value={formData.parcelNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="PIN" name="pin" value={formData.pin} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Owner" name="owner" value={formData.owner} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="County" name="county" value={formData.county} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Owner address" name="ownerAddress" value={formData.ownerAddress} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="City" name="ownerCity" value={formData.ownerCity} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="State" name="ownerState" value={formData.ownerState} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="ZIP" name="ownerZip" value={formData.ownerZip} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Phone" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline minRows={2} label="Legal description" name="legalDesc" value={formData.legalDesc} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Sequence" name="sequence" value={formData.sequence} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Milepost" name="milepost" value={formData.milepost} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Acreage" name="acreage" value={formData.acreage} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Overall status</InputLabel>
              <Select
                label="Overall status"
                name="status"
                value={formData.status}
                onChange={(e) => setFormData((c) => ({ ...c, status: e.target.value }))}
              >
                {OVERALL_STATUSES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => router.push(`/projects/${projectId}`)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving…' : 'Create parcel'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
