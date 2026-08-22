'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PERMIT_STATUS_OPTIONS, PERMIT_TYPE_OPTIONS } from '@/lib/constants';

export default function NewPermitPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    permitType: 'OTHER',
    status: 'NOT_STARTED',
    agency: '',
    referenceNumber: '',
    submittedDate: '',
    approvedDate: '',
    expirationDate: '',
    permitteeName: '',
    permitteeOrg: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    notes: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/permits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contactEmail: form.contactEmail || null,
          submittedDate: form.submittedDate || null,
          approvedDate: form.approvedDate || null,
          expirationDate: form.expirationDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create permit');
      router.push(`/projects/${projectId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/projects/${projectId}/edit`)} sx={{ mb: 2 }}>
        Back to Project
      </Button>
      <Typography variant="h4" gutterBottom>
        Add Permit
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Basic info</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth required label="Name" name="name" value={form.name} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Type" name="permitType" value={form.permitType} onChange={onChange}>
              {PERMIT_TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Status" name="status" value={form.status} onChange={onChange}>
              {PERMIT_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Agency" name="agency" value={form.agency} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Reference number" name="referenceNumber" value={form.referenceNumber} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth type="date" label="Submitted" name="submittedDate" value={form.submittedDate} onChange={onChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth type="date" label="Approved" name="approvedDate" value={form.approvedDate} onChange={onChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth type="date" label="Expiration" name="expirationDate" value={form.expirationDate} onChange={onChange} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Permittee / contact</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Permittee name" name="permitteeName" value={form.permitteeName} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Permittee org" name="permitteeOrg" value={form.permitteeOrg} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contact name" name="contactName" value={form.contactName} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contact phone" name="contactPhone" value={form.contactPhone} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contact email" name="contactEmail" value={form.contactEmail} onChange={onChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Contact address" name="contactAddress" value={form.contactAddress} onChange={onChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Notes" name="notes" value={form.notes} onChange={onChange} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save Permit'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
