'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudDownload as ImportIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import {
  BEDFORD_DATASETS,
  COUNTY_IMPORT_CHUNK_SIZE,
  getArcGISGeoJSONQueryUrl,
  type CountyDataset,
} from '@/lib/countyData';

interface ImportSummary {
  parcelsCreated: number;
  warnings: string[];
  errors: string[];
}

export default function CountyDataPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [selectedIds, setSelectedIds] = useState<string[]>(['bedford-road-centerlines', 'bedford-zoning']);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDatasets = useMemo(
    () => BEDFORD_DATASETS.filter((dataset) => selectedIds.includes(dataset.id)),
    [selectedIds]
  );
  const selectedParcelDatasets = selectedDatasets.filter((dataset) => dataset.kind === 'parcel');
  const selectedReferenceDatasets = selectedDatasets.filter((dataset) => dataset.kind === 'reference');
  const selectedTableDatasets = selectedDatasets.filter((dataset) => dataset.kind === 'table');

  const toggleDataset = (datasetId: string) => {
    setSelectedIds((current) =>
      current.includes(datasetId)
        ? current.filter((id) => id !== datasetId)
        : [...current, datasetId]
    );
  };

  const importSelectedParcelChunks = async () => {
    if (selectedDatasets.length === 0) {
      setError('Select at least one county dataset.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const aggregate: ImportSummary = { parcelsCreated: 0, warnings: [], errors: [] };

    try {
      for (const dataset of selectedParcelDatasets) {
        await runDatasetImport(dataset, aggregate, () => importDatasetFirstChunk(dataset, aggregate));
      }

      for (const dataset of selectedReferenceDatasets) {
        await runDatasetImport(dataset, aggregate, () => importReferenceLayerFirstChunk(dataset, aggregate));
      }

      if (selectedTableDatasets.length > 0) {
        aggregate.warnings.push(
          'Enrichment tables are selected but not imported yet. Next step is joining ownership/valuation tables to parcels by PIN.'
        );
      }

      setResult(aggregate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'County data import failed');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const runDatasetImport = async (
    dataset: CountyDataset,
    aggregate: ImportSummary,
    importer: () => Promise<void>
  ) => {
    try {
      await importer();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      aggregate.errors.push(`${dataset.name}: ${message}`);
    }
  };

  const fetchDatasetChunk = async (dataset: CountyDataset) => {
    const response = await fetch(getArcGISGeoJSONQueryUrl(dataset.serviceUrl, 0, COUNTY_IMPORT_CHUNK_SIZE));
    if (!response.ok) {
      throw new Error(`Failed to fetch ${dataset.name} from Bedford GIS`);
    }

    return response.json();
  };

  const importDatasetFirstChunk = async (dataset: CountyDataset, aggregate: ImportSummary) => {
    setProgress(`Fetching first ${COUNTY_IMPORT_CHUNK_SIZE} ${dataset.name} features from Bedford GIS...`);
    const geoJSON = await fetchDatasetChunk(dataset);
    const features = geoJSON.features || [];
    if (features.length === 0) {
      aggregate.warnings.push(`${dataset.name}: no features returned.`);
      return;
    }

    setProgress(`Importing ${features.length} ${dataset.name} features into ROWFlow...`);
    const importResponse = await fetch('/api/import/parcels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        fileName: `${dataset.name} ArcGIS chunk 1`,
        features,
      }),
    });

    const data = await importResponse.json();
    if (!importResponse.ok) {
      const detail = data.errors?.length ? ` (${data.errors.slice(0, 2).join('; ')})` : '';
      throw new Error(`${data.error || `Failed to import ${dataset.name}`}${detail}`);
    }

    aggregate.parcelsCreated += data.parcelsCreated || 0;
    aggregate.errors.push(...(data.errors || []));
    aggregate.warnings.push(
      `${dataset.name}: imported first ${features.length} features. Full county import will use paged ${COUNTY_IMPORT_CHUNK_SIZE}-feature batches with confirmation.`,
      ...(data.warnings || [])
    );
  };

  const importReferenceLayerFirstChunk = async (dataset: CountyDataset, aggregate: ImportSummary) => {
    setProgress(`Fetching first ${COUNTY_IMPORT_CHUNK_SIZE} ${dataset.name} reference features from Bedford GIS...`);
    const geoJSON = await fetchDatasetChunk(dataset);
    const features = geoJSON.features || [];

    if (features.length === 0) {
      aggregate.warnings.push(`${dataset.name}: no reference features returned.`);
      return;
    }

    setProgress(`Saving ${dataset.name} as a project reference layer...`);
    const response = await fetch(`/api/projects/${projectId}/layers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: dataset.name,
        datasetId: dataset.id,
        sourceUrl: dataset.serviceUrl,
        kind: dataset.kind,
        geometryType: dataset.geometryType,
        data: geoJSON,
        visible: true,
        opacity: 0.5,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Failed to save ${dataset.name} as a reference layer`);
    }

    aggregate.warnings.push(
      `${dataset.name}: saved ${features.length} features as a project reference layer. Open the project map to view it.`
    );
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/projects/${projectId}/import`)}
        sx={{ mb: 2 }}
      >
        Back to Import
      </Button>

      <Typography variant="h4" gutterBottom>
        Import County Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Bedford County GIS is wired first. Parcels can be imported in controlled {COUNTY_IMPORT_CHUNK_SIZE}-feature chunks; reference layers are listed here so they can become project map overlays next.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {result && (
        <Alert severity={result.errors.length > 0 ? 'warning' : 'success'} sx={{ mb: 3 }}>
          Imported {result.parcelsCreated.toLocaleString()} parcels.
          {result.errors.length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              {result.errors.slice(0, 6).map((error, index) => (
                <li key={`error-${index}`}>{error}</li>
              ))}
            </Box>
          )}
          {result.warnings.length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              {result.warnings.slice(0, 6).map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </Box>
          )}
        </Alert>
      )}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {progress || 'Working...'}
          </Typography>
        </Box>
      )}

      <Stack spacing={2}>
        {BEDFORD_DATASETS.map((dataset) => (
          <Card key={dataset.id} variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedIds.includes(dataset.id)}
                        onChange={() => toggleDataset(dataset.id)}
                      />
                    }
                    label={<Typography variant="h6">{dataset.name}</Typography>}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    {dataset.description}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={dataset.kind} />
                  <Chip size="small" label={dataset.geometryType} />
                  <Chip size="small" label={`~${dataset.estimatedCount.toLocaleString()} records`} />
                  <Chip size="small" color="primary" variant="outlined" label={dataset.recommendedMode} />
                </Stack>
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                size="small"
                startIcon={<OpenIcon />}
                href={`${dataset.serviceUrl}?f=pjson`}
                target="_blank"
                rel="noreferrer"
              >
                View ArcGIS Service
              </Button>
              <Button
                size="small"
                href={getArcGISGeoJSONQueryUrl(dataset.serviceUrl, 0, COUNTY_IMPORT_CHUNK_SIZE)}
                target="_blank"
                rel="noreferrer"
              >
                Preview GeoJSON Chunk
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      <Box sx={{ position: 'sticky', bottom: 0, mt: 3, p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Selected: {selectedDatasets.length} dataset(s). Parcels import as parcel records; reference datasets save as map overlays.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ImportIcon />}
            disabled={loading || selectedDatasets.length === 0}
            onClick={importSelectedParcelChunks}
          >
            Import Selected Chunk(s)
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
