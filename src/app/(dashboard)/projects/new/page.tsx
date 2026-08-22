'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { PROJECT_STATUSES } from '@/lib/constants';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    projectCode: '',
    workOrderNumber: '',
    clientName: '',
    contractNumber: '',
    projectType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((c) => ({ ...c, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const projectData: Record<string, unknown> = {
        name: formData.name,
        status: formData.status,
      };
      if (formData.description) projectData.description = formData.description;
      if (formData.startDate) projectData.startDate = formData.startDate;
      if (formData.endDate) projectData.endDate = formData.endDate;
      if (formData.projectCode) projectData.projectCode = formData.projectCode;
      if (formData.workOrderNumber) projectData.workOrderNumber = formData.workOrderNumber;
      if (formData.clientName) projectData.clientName = formData.clientName;
      if (formData.contractNumber) projectData.contractNumber = formData.contractNumber;
      if (formData.projectType) projectData.projectType = formData.projectType;

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Land to full edit so matrix/roles can be filled immediately
      router.push(`/projects/${data.project.id}/edit`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        New Project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Creates a flat project and seeds default land-payment matrix + schedules. You can finish roles and rates on the next screen.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                required
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {PROJECT_STATUSES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Project ID"
                name="projectCode"
                value={formData.projectCode}
                onChange={handleChange}
                helperText="Business Project ID"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Work Order Number"
                name="workOrderNumber"
                value={formData.workOrderNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Project Type"
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Client"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contract Number"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
              <Button type="submit" variant="contained" disabled={loading || !formData.name.trim()}>
                {loading ? 'Creating…' : 'Create Project'}
              </Button>
              <Button variant="outlined" onClick={() => router.push('/projects')} disabled={loading}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
