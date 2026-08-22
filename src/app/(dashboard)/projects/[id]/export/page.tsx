'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Download as DownloadIcon } from '@mui/icons-material';

export default function ExportProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [format, setFormat] = useState('csv');
  const [sortBy, setSortBy] = useState('sequence');
  const [status, setStatus] = useState('');
  const [county, setCounty] = useState('');
  const [detailed, setDetailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    const params = new URLSearchParams({ format, sortBy });
    if (status) params.set('status', status);
    if (county) params.set('county', county);
    if (detailed) params.set('detailed', 'true');

    const url = `/api/projects/${projectId}/export?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;
      setError(data?.error || 'Export failed');
      return;
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `rowflow-export.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/projects/${projectId}`)}
        sx={{ mb: 2 }}
      >
        Back to Project
      </Button>

      <Typography variant="h4" gutterBottom>
        Export Project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Export parcel records from this project as CSV or PDF.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth select label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="geojson">GeoJSON</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth select label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="sequence">Sequence</MenuItem>
              <MenuItem value="milepost">Milepost</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="county">County</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Filter Status (optional)"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="NOT_STARTED"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Filter County (optional)"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="Bedford"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />}
              disabled={format !== 'pdf'}
              label="Detailed PDF with notes"
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
              Download Export
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
