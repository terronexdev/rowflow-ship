'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuthReady } from '@/components/providers/AppProviders';
import KpiStatCard, { formatMoney } from '@/components/analytics/KpiStatCard';
import { STATUS_COLORS } from '@/lib/constants/status';
import BudgetVsActualPanel from '@/components/analytics/BudgetVsActualPanel';
import LaborByRolePanel from '@/components/analytics/LaborByRolePanel';
import OutsideRangeTable from '@/components/analytics/OutsideRangeTable';
import ScheduleHealthPanel from '@/components/analytics/ScheduleHealthPanel';

type Dimension =
  | 'status'
  | 'pts'
  | 'title'
  | 'acquisition'
  | 'survey'
  | 'appraisal'
  | 'condemnation'
  | 'damages'
  | 'specialConditions';

const DIMENSIONS: Array<{ value: Dimension; label: string; key: string }> = [
  { value: 'status', label: 'Overall', key: 'statusBreakdown' },
  { value: 'pts', label: 'PTS', key: 'ptsBreakdown' },
  { value: 'title', label: 'Title', key: 'titleBreakdown' },
  { value: 'acquisition', label: 'Acquisition', key: 'acquisitionBreakdown' },
  // Phase 2+ dimensions available in API already:
  { value: 'survey', label: 'Survey', key: 'surveyBreakdown' },
  { value: 'appraisal', label: 'Appraisal', key: 'appraisalBreakdown' },
  { value: 'condemnation', label: 'Condemnation', key: 'condemnationBreakdown' },
  { value: 'damages', label: 'Damages', key: 'damagesBreakdown' },
  { value: 'specialConditions', label: 'Special conditions', key: 'specialConditionsBreakdown' },
];

async function fetchSummary(projectIds: string[]) {
  const q =
    projectIds.length > 0 ? `?projectIds=${encodeURIComponent(projectIds.join(','))}` : '';
  const res = await fetch(`/api/analytics/summary${q}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load analytics');
  const data = await res.json();
  return data.summary;
}

async function fetchProjects() {
  const res = await fetch('/api/projects', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load projects');
  const data = await res.json();
  return data.projects as Array<{ id: string; name: string }>;
}

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthReady();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dimension, setDimension] = useState<Dimension>('status');

  const { data: projectList } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    enabled: isAuthenticated,
  });

  const { data: summary, isLoading, error, isFetching } = useQuery({
    queryKey: ['analytics-summary', selectedProjects.join(',')],
    queryFn: () => fetchSummary(selectedProjects),
    enabled: isAuthenticated,
  });

  const dimMeta = DIMENSIONS.find((d) => d.value === dimension)!;
  const breakdown: Record<string, number> = summary?.[dimMeta.key] || {};

  const statusData = useMemo(
    () =>
      Object.entries(breakdown)
        .map(([name, value]) => ({
          name: name.replaceAll('_', ' '),
          raw: name,
          value,
          color: STATUS_COLORS[name] || '#757575',
        }))
        .sort((a, b) => b.value - a.value),
    [breakdown]
  );

  const totalForDim = statusData.reduce((s, r) => s + r.value, 0) || 1;

  const loading = authLoading || (isAuthenticated && isLoading);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load analytics</Alert>;
  }

  const s = summary;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Deep-dive metrics across projects.
        {isFetching ? ' · Updating…' : ''}
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Projects</InputLabel>
            <Select
              multiple
              value={selectedProjects}
              onChange={(e) => setSelectedProjects(e.target.value as string[])}
              input={<OutlinedInput label="Projects" />}
              renderValue={(selected) =>
                selected.length === 0
                  ? 'All projects'
                  : (projectList || [])
                      .filter((p) => selected.includes(p.id))
                      .map((p) => p.name)
                      .join(', ')
              }
            >
              {(projectList || []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Checkbox checked={selectedProjects.includes(p.id)} />
                  <ListItemText primary={p.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Status dimension</InputLabel>
            <Select
              label="Status dimension"
              value={dimension}
              onChange={(e) => setDimension(e.target.value as Dimension)}
            >
              {DIMENSIONS.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <KpiStatCard label="Projects" value={s?.projectCount ?? 0} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard label="Parcels" value={s?.parcelCount ?? 0} sub={`${s?.totalAcreage ?? 0} ac`} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard label="% Acquired" value={`${s?.rates?.acquiredPct ?? 0}%`} color="success.main" />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard label="% PTS granted" value={`${s?.rates?.ptsGrantedPct ?? 0}%`} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="Comp offered"
            value={formatMoney(s?.compensation?.offerTotal ?? 0)}
            sub={`${s?.compensation?.outsideRangeCount ?? 0} OOR (${s?.rates?.outsideRangeRatePct ?? 0}%)`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="Labor hours"
            value={s?.labor?.totalHours ?? 0}
            sub={formatMoney(s?.labor?.billableAmount ?? 0)}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Status distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status distribution — {dimMeta.label}
            </Typography>
            {statusData.length === 0 ? (
              <Alert severity="info">No parcel data</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.raw} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statusData.map((row) => (
                  <TableRow key={row.raw}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.value}</TableCell>
                    <TableCell align="right">
                      {((row.value / totalForDim) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Parcels by project */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Parcels by project
            </Typography>
            {(s?.parcelsByProject || []).length === 0 ? (
              <Alert severity="info">No projects</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={s.parcelsByProject}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="parcels" fill="#2196f3" name="Parcels" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Top counties */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top counties
            </Typography>
            {(s?.topCounties || []).length === 0 ? (
              <Alert severity="info">No county data on parcels</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={s.topCounties} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="county" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4caf50" name="Parcels" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <BudgetVsActualPanel
            rows={s?.budgetVsActual?.rows || []}
            laborBudget={s?.budgetVsActual?.laborBudget}
            laborActual={s?.budgetVsActual?.laborActual}
            laborVariance={s?.budgetVsActual?.laborVariance}
            note={s?.budgetVsActual?.note}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LaborByRolePanel rows={s?.laborRoleRows || []} />
        </Grid>
        <Grid item xs={12}>
          <OutsideRangeTable
            offers={s?.outsideRangeOffers || []}
            count={s?.compensation?.outsideRangeCount}
            ratePct={s?.rates?.outsideRangeRatePct}
          />
        </Grid>
        <Grid item xs={12}>
          <ScheduleHealthPanel
            counts={
              s?.schedule?.counts || {
                complete: 0,
                late: 0,
                atRisk: 0,
                onTrack: 0,
                notStarted: 0,
              }
            }
            phases={s?.schedule?.phases || []}
            showExportHint
          />
        </Grid>
      </Grid>
    </Box>
  );
}
