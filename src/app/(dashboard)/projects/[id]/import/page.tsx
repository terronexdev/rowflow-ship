'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  RadioGroup,
  Radio,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { COUNTY_IMPORT_CHUNK_SIZE } from '@/lib/countyData';

const SERVER_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;

interface ImportResult {
  success: boolean;
  parcelsCreated: number;
  layersCreated?: number;
  errors: string[];
  warnings: string[];
}

type ImportMode = 'parcels' | 'layer' | 'scope-seed';

function ImportPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const fromTractsource = searchParams.get('from') === 'tractsource';
  const tractsourceJob = searchParams.get('job') || '';
  const modeParam = searchParams.get('mode');

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>(
    modeParam === 'layer' ? 'layer' : 'parcels'
  );
  const [layerName, setLayerName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['kml', 'kmz', 'geojson', 'json', 'dxf'].includes(extension || '')) {
        setError('Please select a valid KML, KMZ, GeoJSON, or DXF file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setLayerName(selectedFile.name.replace(/\.(kml|kmz|geojson|json|dxf)$/i, ''));
      setError(null);
      setResult(null);
    }
  };

  const parseImportResponse = async (response: Response): Promise<ImportResult> => {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || 'Failed to import parcels');
    }

    return {
      success: Boolean(data.success),
      parcelsCreated: data.parcelsCreated || 0,
      layersCreated: data.layersCreated || 0,
      errors: data.errors || [],
      warnings: data.warnings || [],
    };
  };

  const parseLargeFileInBrowser = async (selectedFile: File, extension: string) => {
    if (extension === 'geojson' || extension === 'json') {
      return JSON.parse(await selectedFile.text());
    }

    if (extension === 'kml') {
      const toGeoJSON = await import('@tmcw/togeojson');
      const kmlDoc = new DOMParser().parseFromString(await selectedFile.text(), 'text/xml');
      return toGeoJSON.kml(kmlDoc);
    }

    if (extension === 'kmz') {
      const [{ default: JSZip }, toGeoJSON] = await Promise.all([
        import('jszip'),
        import('@tmcw/togeojson'),
      ]);
      const zip = await JSZip.loadAsync(await selectedFile.arrayBuffer());
      const kmlFile = Object.keys(zip.files).find((name) => name.toLowerCase().endsWith('.kml'));
      if (!kmlFile) throw new Error('No KML file found in KMZ archive');
      const kmlDoc = new DOMParser().parseFromString(await zip.files[kmlFile].async('text'), 'text/xml');
      return toGeoJSON.kml(kmlDoc);
    }

    throw new Error('Unsupported file format. Please use KML, KMZ, or GeoJSON');
  };

  const importFileAsLayer = async (selectedFile: File, extension: string): Promise<ImportResult> => {
    setProgressText('Parsing design/reference layer...');
    const geoJSON = await parseLargeFileInBrowser(selectedFile, extension);
    const features = geoJSON.features || [];

    if (features.length === 0) {
      throw new Error('No features found in the file');
    }

    setProgressText(`Saving ${features.length.toLocaleString()} features as a project layer...`);
    const firstGeometryType = features.find((feature: any) => feature.geometry)?.geometry?.type || 'mixed';
    const response = await fetch(`/api/projects/${projectId}/layers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: layerName || selectedFile.name,
        datasetId: null,
        sourceUrl: selectedFile.name,
        kind: 'design',
        geometryType: firstGeometryType.toLowerCase().includes('line')
          ? 'polyline'
          : firstGeometryType.toLowerCase().includes('point')
            ? 'point'
            : firstGeometryType.toLowerCase().includes('polygon')
              ? 'polygon'
              : 'mixed',
        data: geoJSON,
        visible: true,
        opacity: 0.65,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save project layer');
    }

    // Best-effort: store first LineString collection as project centerline for corridor tools
    try {
      const lineFeatures = features.filter(
        (f: any) =>
          f?.geometry?.type === 'LineString' || f?.geometry?.type === 'MultiLineString'
      );
      if (lineFeatures.length) {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            centerlineData: {
              type: 'FeatureCollection',
              features: lineFeatures,
            },
          }),
        });
      }
    } catch {
      /* non-fatal */
    }

    return {
      success: true,
      parcelsCreated: 0,
      layersCreated: 1,
      errors: [],
      warnings: [
        `Saved ${features.length.toLocaleString()} feature${features.length !== 1 ? 's' : ''} as a separate project layer. Parcels were not modified.`,
      ],
    };
  };

  const importLargeFileInChunks = async (selectedFile: File, extension: string): Promise<ImportResult> => {
    setProgressText('Parsing large file in browser...');
    const geoJSON = await parseLargeFileInBrowser(selectedFile, extension);
    const features = geoJSON.features || [];
    if (features.length === 0) throw new Error('No features found in the file');

    const aggregate: ImportResult = {
      success: true,
      parcelsCreated: 0,
      errors: [],
      warnings: [
        `Large file detected. Importing ${features.length.toLocaleString()} features in ${COUNTY_IMPORT_CHUNK_SIZE}-feature chunks.`,
      ],
    };

    for (let offset = 0; offset < features.length; offset += COUNTY_IMPORT_CHUNK_SIZE) {
      const chunk = features.slice(offset, offset + COUNTY_IMPORT_CHUNK_SIZE);
      const chunkNumber = Math.floor(offset / COUNTY_IMPORT_CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(features.length / COUNTY_IMPORT_CHUNK_SIZE);
      setProgressText(
        `Importing chunk ${chunkNumber.toLocaleString()} of ${totalChunks.toLocaleString()} (${Math.min(offset + chunk.length, features.length).toLocaleString()} / ${features.length.toLocaleString()} features)`
      );

      const response = await fetch('/api/import/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fileName: `${selectedFile.name} chunk ${chunkNumber}`,
          features: chunk,
        }),
      });

      const chunkResult = await parseImportResponse(response);
      aggregate.parcelsCreated += chunkResult.parcelsCreated;
      aggregate.errors.push(...chunkResult.errors);
      aggregate.warnings.push(...chunkResult.warnings);

      if (chunkResult.errors.length > 0) {
        aggregate.success = false;
      }
    }

    return aggregate;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let data: ImportResult;

      if (extension === 'dxf') {
        throw new Error(
          'DXF import needs the next parser/conversion step. For now, convert DXF to KML or GeoJSON and import it as a design/reference layer.'
        );
      }

      if (importMode === 'scope-seed') {
        setProgressText('Reading ROWScope seed…');
        const seed = JSON.parse(await file.text());
        const response = await fetch(`/api/projects/${projectId}/scope-seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seed),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error || 'Seed ingest failed');
        data = {
          success: true,
          parcelsCreated: json.parcelsUpdated || 0,
          layersCreated: 0,
          errors: [],
          warnings: [
            `Budget lines: ${json.budgetLines || 0}`,
            'No compensation offers created — agents still create the real take.',
          ],
        };
      } else if (importMode === 'layer') {
        data = await importFileAsLayer(file, extension || '');
      } else if (file.size > SERVER_UPLOAD_LIMIT_BYTES) {
        data = await importLargeFileInChunks(file, extension || '');
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        const response = await fetch('/api/import/parcels', {
          method: 'POST',
          body: formData,
        });
        data = await parseImportResponse(response);
      }

      setResult(data);
      if (data.success && (data.parcelsCreated > 0 || (data.layersCreated || 0) > 0)) {
        setTimeout(() => {
          router.push(`/projects/${projectId}`);
        }, 3000);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setLoading(false);
      setProgressText(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/projects/${projectId}`)}
          sx={{ mb: 2 }}
        >
          Back to Project
        </Button>
        <Typography variant="h4">Import Files</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>Parcel records / corridor package</strong> — polygons become parcels. A ROWScope
          or Tractsource package also imports centerline, access, PE, and buildings as map layers.
          <strong>Design / survey / reference</strong> stays a generic overlay. <strong>ROWScope
          seed</strong> fills project budget + PE acres / land use — does not create offers.
        </Typography>
        {fromTractsource && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Tractsource import</strong>
            {tractsourceJob ? ` · job ${tractsourceJob}` : ''}. Keep mode on{' '}
            <strong>Parcel records</strong> and choose the downloaded{' '}
            <code>*-rowflow.geojson</code> (flat owner / situs / PIN fields).
          </Alert>
        )}
        <Button
          startIcon={<MapIcon />}
          variant="outlined"
          onClick={() => router.push(`/projects/${projectId}/county-data`)}
          sx={{ mt: 2 }}
        >
          Import County Data
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <FormControl sx={{ mb: 3, textAlign: 'left' }}>
            <FormLabel>Import Mode</FormLabel>
            <RadioGroup
              row
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as ImportMode)}
            >
              <FormControlLabel value="parcels" control={<Radio />} label="Parcels / corridor package" />
              <FormControlLabel value="layer" control={<Radio />} label="Design / survey / reference layer" />
              <FormControlLabel value="scope-seed" control={<Radio />} label="ROWScope seed (budget)" />
            </RadioGroup>
          </FormControl>

          {importMode === 'layer' && (
            <TextField
              fullWidth
              label="Layer Name"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              placeholder="Engineer line design, access roads, structure locations, survey boundary"
              sx={{ mb: 3, maxWidth: 520 }}
            />
          )}

          <input
            accept=".kml,.kmz,.geojson,.json,.dxf"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button variant="outlined" component="span" startIcon={<UploadIcon />} size="large" sx={{ mb: 2 }}>
              {fromTractsource ? 'Choose Tractsource rowflow.geojson' : 'Choose File'}
            </Button>
          </label>

          {file && (
            <Box sx={{ mt: 2 }}>
              <Chip label={file.name} onDelete={() => setFile(null)} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {(file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            {progressText && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {progressText}
              </Typography>
            )}
          </Box>
        )}

        {result && (
          <Alert
            severity={result.success ? 'success' : 'warning'}
            sx={{ mb: 2 }}
            icon={result.success ? <CheckIcon /> : <ErrorIcon />}
          >
            <Typography variant="subtitle2">
              {result.success ? 'Import complete' : 'Import finished with issues'}
            </Typography>
            <Typography variant="body2">
              Parcels created: {result.parcelsCreated}
              {result.layersCreated ? ` · Layers: ${result.layersCreated}` : ''}
            </Typography>
            {result.errors?.length > 0 && (
              <List dense>
                {result.errors.slice(0, 8).map((err, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={err} />
                  </ListItem>
                ))}
              </List>
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" onClick={handleUpload} disabled={!file || loading} size="large">
            {loading ? 'Importing…' : 'Import'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}>Loading import…</Box>}>
      <ImportPageInner />
    </Suspense>
  );
}
