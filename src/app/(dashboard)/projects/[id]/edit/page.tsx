'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  BUDGET_CATEGORY_OPTIONS,
  CONSTRUCTION_SCHEDULE_PHASES,
  LAND_USE_OPTIONS,
  MATRIX_UNIT_OPTIONS,
  NOTE_CATEGORIES,
  PROJECT_STATUSES,
  ROW_SCHEDULE_PHASES,
} from '@/lib/constants';
import { mergeBudgetLinesWithDefaults } from '@/lib/analytics/costBudget';
import ProjectPeoplePanel from '@/components/project/ProjectPeoplePanel';
import {
  formatMoney,
  scheduleAmount,
  unitOfferWindow,
} from '@/lib/compensation/matrix';

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

type MatrixRow = {
  id?: string;
  landUse: string;
  customLabel?: string | null;
  unit: string;
  /** Single schedule amount (stored as min=max) */
  amount: number | string;
  minAmount?: number | string;
  maxAmount?: number | string;
  notes?: string | null;
  sortOrder?: number;
};

type BudgetLine = {
  category: string;
  label?: string;
  mode: 'TOTAL' | 'HOURS_X_RATE' | 'PER_PARCEL';
  amount?: number | string;
  hours?: number | string;
  rate?: number | string;
};

type SchedulePhase = {
  phaseKey: string;
  track: 'ROW' | 'CONSTRUCTION';
  label?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isComplete?: boolean;
  sortOrder?: number;
};

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

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
    offerRangeLowPct: '0.80',
    offerRangeHighPct: '1.50',
  });
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [parcelCount, setParcelCount] = useState(0);
  const [schedulePhases, setSchedulePhases] = useState<SchedulePhase[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [projectNotes, setProjectNotes] = useState<any[]>([]);
  const [projectDocs, setProjectDocs] = useState<any[]>([]);
  const [newProjectNote, setNewProjectNote] = useState('');
  const [projectNoteCategory, setProjectNoteCategory] = useState('PROJECT');
  const [docCategory, setDocCategory] = useState('PROJECT');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [reportStats, setReportStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionMsg, setSectionMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, matrixRes, budgetRes, scheduleRes, permitsRes, notesRes, docsRes] =
        await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/matrix`),
          fetch(`/api/projects/${projectId}/budget`),
          fetch(`/api/projects/${projectId}/schedule`),
          fetch(`/api/projects/${projectId}/permits`),
          fetch(`/api/projects/${projectId}/notes`),
          fetch(`/api/projects/${projectId}/documents`),
        ]);

      const projData = await projRes.json();
      if (!projRes.ok) throw new Error(projData.error || 'Failed to load project');
      const p = projData.project;
      setFormData({
        name: p.name || '',
        description: p.description || '',
        status: p.status || 'Active',
        startDate: formatDateForInput(p.startDate),
        endDate: formatDateForInput(p.endDate),
        projectCode: p.projectCode || '',
        workOrderNumber: p.workOrderNumber || '',
        clientName: p.clientName || '',
        contractNumber: p.contractNumber || '',
        projectType: p.projectType || '',
        offerRangeLowPct:
          p.offerRangeLowPct != null ? String(Number(p.offerRangeLowPct)) : '0.80',
        offerRangeHighPct:
          p.offerRangeHighPct != null ? String(Number(p.offerRangeHighPct)) : '1.50',
      });

      const matrixData = await matrixRes.json();
      if (matrixRes.ok) {
        setMatrixRows(
          (matrixData.matrix?.rows || []).map((r: any) => {
            const minA = Number(r.minAmount) || 0;
            const maxA = Number(r.maxAmount) || 0;
            const amt =
              minA === maxA ? minA : scheduleAmount({ minAmount: minA, maxAmount: maxA, unit: r.unit });
            return {
              id: r.id,
              landUse: r.landUse,
              customLabel: r.customLabel,
              unit: r.unit,
              amount: amt,
              minAmount: minA,
              maxAmount: maxA,
              notes: r.notes || '',
              sortOrder: r.sortOrder,
            };
          })
        );
      }

      const budgetData = await budgetRes.json();
      if (budgetRes.ok) {
        if (typeof budgetData.parcelCount === 'number') setParcelCount(budgetData.parcelCount);
        if ((budgetData.lines || []).length) {
          setBudgetLines(
            mergeBudgetLinesWithDefaults(
              budgetData.lines.map((l: any) => ({
                category: l.category,
                label: l.label || '',
                mode: l.mode || 'TOTAL',
                amount: l.amount != null ? Number(l.amount) : '',
                hours: l.hours != null ? Number(l.hours) : '',
                rate: l.rate != null ? Number(l.rate) : '',
              }))
            )
          );
        } else {
          setBudgetLines(
            BUDGET_CATEGORY_OPTIONS.map((c) => ({
              category: c.value,
              label: '',
              mode: 'TOTAL' as const,
              amount: '',
              hours: '',
              rate: '',
            }))
          );
        }
      }

      const scheduleData = await scheduleRes.json();
      if (scheduleRes.ok) {
        setSchedulePhases(
          (scheduleData.phases || []).map((ph: any) => ({
            phaseKey: ph.phaseKey,
            track: ph.track,
            label: ph.label,
            startDate: formatDateForInput(ph.startDate),
            endDate: formatDateForInput(ph.endDate),
            isComplete: Boolean(ph.isComplete),
            sortOrder: ph.sortOrder,
          }))
        );
      }

      const permitsData = await permitsRes.json();
      if (permitsRes.ok) setPermits(permitsData.permits || []);

      const notesData = await notesRes.json();
      if (notesRes.ok) setProjectNotes(notesData.notes || []);
      const docsData = await docsRes.json();
      if (docsRes.ok) setProjectDocs(docsData.documents || []);

      try {
        const statsRes = await fetch(`/api/projects/${projectId}/stats`);
        const statsData = await statsRes.json();
        if (statsRes.ok) setReportStats(statsData.stats);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const saveInfo = async () => {
    setSaving(true);
    setError(null);
    setSectionMsg(null);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        status: formData.status,
        description: formData.description || undefined,
        projectCode: formData.projectCode || undefined,
        workOrderNumber: formData.workOrderNumber || undefined,
        clientName: formData.clientName || undefined,
        contractNumber: formData.contractNumber || undefined,
        projectType: formData.projectType || undefined,
      };
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;
      // Offer band is saved with Land matrix (not project info)

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update project');
      setSectionMsg('Project information saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const saveMatrix = async () => {
    setSaving(true);
    setError(null);
    setSectionMsg(null);
    try {
      const low = parseFloat(formData.offerRangeLowPct);
      const high = parseFloat(formData.offerRangeHighPct);
      const bandPayload: Record<string, number> = {};
      if (Number.isFinite(low)) bandPayload.offerRangeLowPct = low;
      if (Number.isFinite(high)) bandPayload.offerRangeHighPct = high;
      if (Object.keys(bandPayload).length) {
        const br = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bandPayload),
        });
        if (!br.ok) {
          const err = await br.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to save offer band');
        }
      }

      const res = await fetch(`/api/projects/${projectId}/matrix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: matrixRows.map((r, i) => {
            const amt = Number(r.amount) || 0;
            return {
              landUse: r.landUse,
              customLabel: r.landUse === 'OTHER' ? r.customLabel || 'Other' : r.customLabel || null,
              unit: r.unit || 'PER_ACRE',
              minAmount: amt,
              maxAmount: amt,
              notes: r.notes || null,
              sortOrder: i,
            };
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save matrix');
      setSectionMsg('Land matrix and offer band saved');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save matrix');
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phases: schedulePhases.map((p, i) => ({
            phaseKey: p.phaseKey,
            track: p.track,
            label: p.label,
            startDate: p.startDate || null,
            endDate: p.endDate || null,
            isComplete: Boolean(p.isComplete),
            sortOrder: i,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save schedule');
      setSectionMsg('Schedule saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const saveBudget = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: budgetLines.map((l, i) => ({
            category: l.category,
            label: l.label || null,
            mode: l.mode,
            amount: l.mode === 'HOURS_X_RATE' ? null : Number(l.amount) || 0,
            hours:
              l.mode === 'HOURS_X_RATE' || l.mode === 'PER_PARCEL' ? Number(l.hours) || 0 : null,
            rate: l.mode === 'HOURS_X_RATE' ? Number(l.rate) || 0 : null,
            sortOrder: i,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save budget');
      setSectionMsg(`Budget saved (total $${Number(data.total || 0).toLocaleString()})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const budgetTotal = useMemo(() => {
    return budgetLines.reduce((sum, l) => {
      if (l.mode === 'HOURS_X_RATE') {
        return sum + (Number(l.hours) || 0) * (Number(l.rate) || 0);
      }
      if (l.mode === 'PER_PARCEL') {
        const qty = Number(l.hours) > 0 ? Number(l.hours) : parcelCount;
        return sum + (Number(l.amount) || 0) * qty;
      }
      return sum + (Number(l.amount) || 0);
    }, 0);
  }, [budgetLines, parcelCount]);

  const rolePhases = (track: 'ROW' | 'CONSTRUCTION') =>
    schedulePhases.filter((p) => p.track === track);

  const updatePhase = (
    phaseKey: string,
    field: 'startDate' | 'endDate' | 'isComplete',
    value: string | boolean
  ) => {
    setSchedulePhases((prev) =>
      prev.map((p) => (p.phaseKey === phaseKey ? { ...p, [field]: value } : p))
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
        <Button
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          disabled={saving}
          onClick={async () => {
            if (
              !window.confirm(
                'Delete this project and all parcels/docs/notes? This cannot be undone.'
              )
            ) {
              return;
            }
            setSaving(true);
            setError(null);
            try {
              const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data.error || 'Failed to delete project');
              router.push('/projects');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete project');
              setSaving(false);
            }
          }}
        >
          Delete project
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom>
        Edit Project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Flat project model — Project ID & WO# live here. Matrix drives parcel compensation.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {sectionMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSectionMsg(null)}>
          {sectionMsg}
        </Alert>
      )}

      {/* 1. Project Information */}
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Project Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Project Name" name="name" value={formData.name} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Status" name="status" value={formData.status} onChange={handleChange}>
              {PROJECT_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Project ID" name="projectCode" value={formData.projectCode} onChange={handleChange} helperText="Business Project ID (not system cuid)" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Work Order Number" name="workOrderNumber" value={formData.workOrderNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Project Type" name="projectType" value={formData.projectType} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Client" name="clientName" value={formData.clientName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contract Number" name="contractNumber" value={formData.contractNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Description" name="description" value={formData.description} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={saveInfo} disabled={saving}>
              Save Project Information
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 2. People — unified roster (roles + team + rates) */}
      <ProjectPeoplePanel
        projectId={projectId}
        onMessage={(msg, err) => {
          if (err) {
            setError(err);
            setSectionMsg(null);
          } else {
            setError(null);
            setSectionMsg(msg);
          }
        }}
      />

      {/* 3. Land Payment Matrix */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6">Land payment matrix</Typography>
            <Typography variant="body2" color="text.secondary">
              One schedule amount per land use. Offer band applies to per-acre / per-sqft (not flat).
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              setMatrixRows((rows) => [
                ...rows,
                { landUse: 'OTHER', customLabel: '', unit: 'PER_ACRE', amount: 0, notes: '' },
              ])
            }
          >
            Add row
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Offer band low"
              name="offerRangeLowPct"
              value={formData.offerRangeLowPct}
              onChange={handleChange}
              inputProps={{ min: 0, max: 5, step: '0.01' }}
              helperText="0.80 = 80% of schedule"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Offer band high"
              name="offerRangeHighPct"
              value={formData.offerRangeHighPct}
              onChange={handleChange}
              inputProps={{ min: 0, max: 5, step: '0.01' }}
              helperText="1.50 = 150% of schedule"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Negotiation envelope around each schedule amount. Flat rows ignore the band (fixed amount).
            </Typography>
          </Grid>
        </Grid>

        {matrixRows.some((r) => !(Number(r.amount) > 0)) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Some rows still have $0 schedule amount. Offer windows stay $0 until you enter rates.
          </Alert>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Land use</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Amount ($)</TableCell>
              <TableCell>Offer window</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {matrixRows.map((row, idx) => {
              const lowPct = parseFloat(formData.offerRangeLowPct);
              const highPct = parseFloat(formData.offerRangeHighPct);
              const win = unitOfferWindow(
                {
                  minAmount: Number(row.amount) || 0,
                  maxAmount: Number(row.amount) || 0,
                  unit: row.unit || 'PER_ACRE',
                },
                Number.isFinite(lowPct) ? lowPct : 0.8,
                Number.isFinite(highPct) ? highPct : 1.5
              );
              const unitSuffix =
                String(row.unit).toUpperCase() === 'PER_SQFT'
                  ? ' / sqft'
                  : String(row.unit).toUpperCase() === 'FLAT'
                    ? ''
                    : ' / ac';
              return (
                <TableRow key={row.id || idx}>
                  <TableCell sx={{ minWidth: 160 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={row.landUse}
                      onChange={(e) =>
                        setMatrixRows((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, landUse: e.target.value } : r))
                        )
                      }
                    >
                      {LAND_USE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    {row.landUse === 'OTHER' && (
                      <TextField
                        size="small"
                        fullWidth
                        sx={{ mt: 1 }}
                        placeholder="Custom label"
                        value={row.customLabel || ''}
                        onChange={(e) =>
                          setMatrixRows((rows) =>
                            rows.map((r, i) =>
                              i === idx ? { ...r, customLabel: e.target.value } : r
                            )
                          )
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={row.unit}
                      onChange={(e) =>
                        setMatrixRows((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, unit: e.target.value } : r))
                        )
                      }
                    >
                      {MATRIX_UNIT_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={row.amount}
                      onChange={(e) =>
                        setMatrixRows((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r))
                        )
                      }
                      inputProps={{ step: '0.01', min: 0 }}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    {win.bandApplies ? (
                      <Typography variant="body2" color="text.secondary">
                        {formatMoney(win.low)} – {formatMoney(win.high)}
                        {unitSuffix}
                      </Typography>
                    ) : (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Flat ${formatMoney(win.amount)}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={row.notes || ''}
                      onChange={(e) =>
                        setMatrixRows((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r))
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setMatrixRows((rows) => rows.filter((_, i) => i !== idx))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Button variant="contained" sx={{ mt: 2 }} onClick={saveMatrix} disabled={saving}>
          Save matrix and offer band
        </Button>
      </Paper>

      {/* ROW + Construction schedules */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          ROW Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Target dates for acquisition milestones. Used by analytics schedule health (on track /
          at risk / late). Mark <strong>Complete</strong> when work is done so past end dates do not
          stay LATE.
        </Typography>
        <Grid container spacing={2}>
          {(rolePhases('ROW').length
            ? rolePhases('ROW')
            : ROW_SCHEDULE_PHASES.map((p) => ({
                phaseKey: p.key,
                track: 'ROW' as const,
                label: p.label,
                startDate: '',
                endDate: '',
                isComplete: false,
              }))
          ).map((ph) => {
            const meta = ROW_SCHEDULE_PHASES.find((p) => p.key === ph.phaseKey);
            const single = meta?.single;
            return (
              <Grid item xs={12} md={6} key={ph.phaseKey}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2">
                    {ph.label || meta?.label || ph.phaseKey}
                  </Typography>
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(ph.isComplete)}
                        onChange={(e) => updatePhase(ph.phaseKey, 'isComplete', e.target.checked)}
                      />
                    }
                    label={<Typography variant="caption">Complete</Typography>}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!single && (
                    <TextField
                      size="small"
                      type="date"
                      label="Start"
                      InputLabelProps={{ shrink: true }}
                      value={ph.startDate || ''}
                      onChange={(e) => updatePhase(ph.phaseKey, 'startDate', e.target.value)}
                      fullWidth
                    />
                  )}
                  <TextField
                    size="small"
                    type="date"
                    label={single ? 'Date' : 'End'}
                    InputLabelProps={{ shrink: true }}
                    value={ph.endDate || ''}
                    onChange={(e) => updatePhase(ph.phaseKey, 'endDate', e.target.value)}
                    fullWidth
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Construction Schedule
        </Typography>
        <Grid container spacing={2}>
          {(rolePhases('CONSTRUCTION').length
            ? rolePhases('CONSTRUCTION')
            : CONSTRUCTION_SCHEDULE_PHASES.map((p) => ({
                phaseKey: p.key,
                track: 'CONSTRUCTION' as const,
                label: p.label,
                startDate: '',
                endDate: '',
                isComplete: false,
              }))
          ).map((ph) => {
            const meta = CONSTRUCTION_SCHEDULE_PHASES.find((p) => p.key === ph.phaseKey);
            const single = meta?.single;
            return (
              <Grid item xs={12} md={6} key={ph.phaseKey}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2">
                    {ph.label || meta?.label || ph.phaseKey}
                  </Typography>
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(ph.isComplete)}
                        onChange={(e) => updatePhase(ph.phaseKey, 'isComplete', e.target.checked)}
                      />
                    }
                    label={<Typography variant="caption">Complete</Typography>}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!single && (
                    <TextField
                      size="small"
                      type="date"
                      label="Start"
                      InputLabelProps={{ shrink: true }}
                      value={ph.startDate || ''}
                      onChange={(e) => updatePhase(ph.phaseKey, 'startDate', e.target.value)}
                      fullWidth
                    />
                  )}
                  <TextField
                    size="small"
                    type="date"
                    label={single ? 'Date' : 'End'}
                    InputLabelProps={{ shrink: true }}
                    value={ph.endDate || ''}
                    onChange={(e) => updatePhase(ph.phaseKey, 'endDate', e.target.value)}
                    fullWidth
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Button variant="contained" sx={{ mt: 2 }} onClick={saveSchedule} disabled={saving}>
          Save Schedules
        </Button>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Breakdown
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Amount / Hours / $ per parcel</TableCell>
              <TableCell>Rate / count</TableCell>
              <TableCell>Line total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budgetLines.map((line, idx) => {
              const lineTotal =
                line.mode === 'HOURS_X_RATE'
                  ? (Number(line.hours) || 0) * (Number(line.rate) || 0)
                  : line.mode === 'PER_PARCEL'
                    ? (Number(line.amount) || 0) *
                      (Number(line.hours) > 0 ? Number(line.hours) : parcelCount)
                    : Number(line.amount) || 0;
              return (
                <TableRow key={idx}>
                  <TableCell>
                    {BUDGET_CATEGORY_OPTIONS.find((c) => c.value === line.category)?.label ||
                      line.category}
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={line.mode}
                      onChange={(e) =>
                        setBudgetLines((rows) =>
                          rows.map((r, i) => {
                            if (i !== idx) return r;
                            const mode = e.target.value as 'TOTAL' | 'HOURS_X_RATE' | 'PER_PARCEL';
                            const hours =
                              mode === 'PER_PARCEL' && !(Number(r.hours) > 0) ? parcelCount : r.hours;
                            return { ...r, mode, hours };
                          })
                        )
                      }
                    >
                      <MenuItem value="TOTAL">Total</MenuItem>
                      <MenuItem value="HOURS_X_RATE">Hours × Rate</MenuItem>
                      <MenuItem value="PER_PARCEL">Per parcel</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    {line.mode === 'HOURS_X_RATE' ? (
                      <TextField
                        size="small"
                        type="number"
                        value={line.hours ?? ''}
                        onChange={(e) =>
                          setBudgetLines((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, hours: e.target.value } : r))
                          )
                        }
                      />
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.amount ?? ''}
                        onChange={(e) =>
                          setBudgetLines((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r))
                          )
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {line.mode === 'HOURS_X_RATE' ? (
                      <TextField
                        size="small"
                        type="number"
                        value={line.rate ?? ''}
                        onChange={(e) =>
                          setBudgetLines((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, rate: e.target.value } : r))
                          )
                        }
                      />
                    ) : line.mode === 'PER_PARCEL' ? (
                      <TextField
                        size="small"
                        type="number"
                        label="parcels"
                        value={Number(line.hours) > 0 ? line.hours : parcelCount}
                        onChange={(e) =>
                          setBudgetLines((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, hours: e.target.value } : r))
                          )
                        }
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>${lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Typography sx={{ mt: 2 }} fontWeight={700}>
          Total: ${budgetTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={saveBudget} disabled={saving}>
          Save Budget
        </Button>
      </Paper>


      {/* 7–8 Project Documents + Notes */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Project Notes
        </Typography>
        {projectNotes.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No project notes yet.
          </Typography>
        ) : (
          <List dense sx={{ mb: 2 }}>
            {projectNotes.map((n) => (
              <ListItem key={n.id} divider>
                <ListItemText
                  primary={n.content}
                  secondary={`${String(n.category).replaceAll('_', ' ')} · ${new Date(n.createdAt).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        )}
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Add project note"
              value={newProjectNote}
              onChange={(e) => setNewProjectNote(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Category"
              value={projectNoteCategory}
              onChange={(e) => setProjectNoteCategory(e.target.value)}
            >
              {NOTE_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Button
              variant="contained"
              disabled={saving || !newProjectNote.trim()}
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch(`/api/projects/${projectId}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      content: newProjectNote,
                      category: projectNoteCategory,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to add note');
                  setNewProjectNote('');
                  setSectionMsg('Project note added');
                  await loadAll();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Add Note
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Project Documents
        </Typography>
        {projectDocs.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No project documents yet.
          </Typography>
        ) : (
          <List dense sx={{ mb: 2 }}>
            {projectDocs.map((doc) => (
              <ListItem key={doc.id} divider>
                <ListItemText
                  primary={
                    <Button
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ p: 0, textTransform: 'none', justifyContent: 'flex-start' }}
                    >
                      {doc.label || doc.name}
                    </Button>
                  }
                  secondary={`${doc.type} · ${String(doc.category).replaceAll('_', ' ')} · ${(doc.size / 1024).toFixed(1)} KB`}
                />
              </ListItem>
            ))}
          </List>
        )}
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Category"
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
            >
              {NOTE_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={uploadingDoc}>
              {uploadingDoc ? 'Uploading…' : 'Upload file'}
              <input
                hidden
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingDoc(true);
                  setError(null);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('name', file.name);
                    fd.append('category', docCategory);
                    const res = await fetch(`/api/projects/${projectId}/documents`, {
                      method: 'POST',
                      body: fd,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Upload failed');
                    setSectionMsg('Document uploaded');
                    await loadAll();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setUploadingDoc(false);
                    e.target.value = '';
                  }
                }}
              />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Reporting */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6">Reporting</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} href={`/api/projects/${projectId}/export/report?type=labor`}>
              Labor CSV
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} href={`/api/projects/${projectId}/export/report?type=compensation`}>
              Compensation CSV
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} href={`/api/projects/${projectId}/export/report?type=budget`}>
              Budget CSV
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} href={`/api/projects/${projectId}/export/report?type=schedule`}>
              Schedule CSV
            </Button>
            <Button size="small" variant="text" href={`/projects/${projectId}/export`}>
              Parcel export…
            </Button>
          </Box>
        </Box>
        {!reportStats ? (
          <Typography color="text.secondary">Loading stats…</Typography>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Parcels</Typography>
              <Typography fontWeight={700}>{reportStats.total}</Typography>
              <Typography variant="body2">{reportStats.completionPercentage}% acquired</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Budget total</Typography>
              <Typography fontWeight={700}>${Number(reportStats.budget?.total || 0).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Labor actual (billable)</Typography>
              <Typography fontWeight={700}>${Number(reportStats.labor?.billableAmount || 0).toLocaleString()}</Typography>
              <Typography variant="body2">{Number(reportStats.labor?.totalHours || 0).toLocaleString()} hrs</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Compensation offers</Typography>
              <Typography fontWeight={700}>${Number(reportStats.compensation?.offerTotal || 0).toLocaleString()}</Typography>
              <Typography variant="body2">
                {reportStats.compensation?.offerCount || 0} offers · {reportStats.compensation?.outsideRangeCount || 0} outside range
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Labor by role</Typography>
              {Object.keys(reportStats.labor?.byRole || {}).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No labor logged.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Hours</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Entries</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(reportStats.labor.byRole).map(([role, v]: any) => (
                      <TableRow key={role}>
                        <TableCell>{String(role).replaceAll('_', ' ')}</TableCell>
                        <TableCell align="right">{v.hours}</TableCell>
                        <TableCell align="right">${Number(v.amount).toLocaleString()}</TableCell>
                        <TableCell align="right">{v.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>PTS breakdown</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {Object.entries(reportStats.ptsBreakdown || {}).map(([k, v]: any) => (
                  <Chip key={k} size="small" label={`${String(k).replaceAll('_', ' ')}: ${v}`} />
                ))}
              </Box>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>Counts</Typography>
              <Typography variant="body2">
                Notes {reportStats.counts?.notes ?? 0} · Docs {reportStats.counts?.documents ?? 0} · Permits {reportStats.counts?.permits ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Labor vs ROW+Survey labor budget: ${Number(reportStats.variance?.laborVsBudgetLabor || 0).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* 9. Permits */}
      <Paper sx={{ p: 3, mt: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Permits</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/projects/${projectId}/permits/new`)}
          >
            Add Permit
          </Button>
        </Box>
        {permits.length === 0 ? (
          <Typography color="text.secondary">No permits yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Agency</TableCell>
                <TableCell>Ref #</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permits.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/projects/${projectId}/permits/${p.id}`)}
                  >
                    {p.name}
                  </TableCell>
                  <TableCell>{p.permitType}</TableCell>
                  <TableCell>
                    <Chip size="small" label={String(p.status).replaceAll('_', ' ')} />
                  </TableCell>
                  <TableCell>{p.agency || '—'}</TableCell>
                  <TableCell>{p.referenceNumber || '—'}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      onClick={() => router.push(`/projects/${projectId}/permits/${p.id}`)}
                    >
                      Open
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Delete permit"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Delete permit “${p.name}”? Notes and files on this filing will be removed.`
                          )
                        ) {
                          return;
                        }
                        try {
                          const res = await fetch(`/api/permits/${p.id}`, { method: 'DELETE' });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data.error || 'Failed to delete');
                          setPermits((prev) => prev.filter((x) => x.id !== p.id));
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Failed to delete permit');
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
