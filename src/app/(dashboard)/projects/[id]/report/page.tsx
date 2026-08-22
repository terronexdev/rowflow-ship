'use client';

import { useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuthReady } from '@/components/providers/AppProviders';
import { summarizeSchedule } from '@/lib/analytics/statsHelpers';

function countByStatus(parcels: any[], key: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of parcels) {
    const v = String(p?.[key] || 'NOT_STARTED');
    out[v] = (out[v] || 0) + 1;
  }
  return out;
}

const healthColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  LATE: 'error',
  NOT_STARTED: 'default',
  COMPLETE: 'info',
  UNKNOWN: 'default',
};

async function loadReport(id: string) {
  const projRes = await fetch(`/api/projects/${id}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!projRes.ok) {
    const body = await projRes.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load project (${projRes.status})`);
  }
  const projJson = await projRes.json();
  const project = projJson.project;
  if (!project) throw new Error('Project payload missing');

  const settled = await Promise.allSettled([
    fetch(`/api/projects/${id}/stats`, { credentials: 'same-origin', cache: 'no-store' }),
    fetch(`/api/activity?projectId=${id}&limit=15`, {
      credentials: 'same-origin',
      cache: 'no-store',
    }),
    fetch(`/api/projects/${id}/matrix`, { credentials: 'same-origin', cache: 'no-store' }),
    fetch(`/api/projects/${id}/schedule`, { credentials: 'same-origin', cache: 'no-store' }),
    fetch(`/api/projects/${id}/budget`, { credentials: 'same-origin', cache: 'no-store' }),
  ]);

  const readOk = async (i: number) => {
    const r = settled[i];
    if (r.status !== 'fulfilled' || !r.value.ok) return null;
    try {
      return await r.value.json();
    } catch {
      return null;
    }
  };

  const statsJson = await readOk(0);
  const stats = statsJson?.stats || statsJson;
  const activity = (await readOk(1)) || { events: [] };
  const matrix = await readOk(2);
  const schedule = await readOk(3);
  const budget = await readOk(4);

  return { project, stats, activity, matrix, schedule, budget };
}

function ProjectReportInner() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthReady();

  const { data, isLoading, error } = useQuery({
    queryKey: ['project-report', id],
    queryFn: () => loadReport(id),
    enabled: isAuthenticated && Boolean(id),
    retry: 1,
  });

  const parcels = data?.project?.parcels || [];
  const rates = data?.stats?.rates || data?.stats?.summary?.rates;
  const breakdown =
    data?.stats?.statusBreakdown ||
    data?.stats?.summary?.statusBreakdown ||
    countByStatus(parcels, 'status');
  const pts =
    data?.stats?.ptsBreakdown ||
    data?.stats?.summary?.ptsBreakdown ||
    countByStatus(parcels, 'ptsStatus');
  const statsRoot = data?.stats || {};
  const classBreakdown =
    statsRoot.parcelClassBreakdown || countByStatus(parcels, 'parcelClass');
  const existingRightsBreakdown =
    statsRoot.existingRightsBreakdown || countByStatus(parcels, 'existingRightsStatus');
  const encroachmentBreakdown =
    statsRoot.encroachmentBreakdown || countByStatus(parcels, 'encroachmentStatus');
  const effectiveAcquired =
    Number(statsRoot.acquired ?? statsRoot.domainProgress?.acquired) ||
    Number(breakdown.ACQUIRED || 0) + Number(breakdown.RELOCATED || 0);

  const parcelCount =
    parcels.length || data?.project?._count?.parcels || Number(data?.stats?.parcelCount) || 0;

  const matrixRows = data?.matrix?.matrix?.rows || data?.matrix?.rows || [];
  const rawPhases = data?.schedule?.phases || [];
  const scheduleEval = useMemo(() => {
    const fromStats = data?.stats?.schedule;
    if (fromStats?.phases?.length) {
      return {
        phases: fromStats.phases,
        counts: fromStats.counts,
        health: fromStats.health,
      };
    }
    return summarizeSchedule(
      rawPhases.map((ph: any) => ({
        id: ph.id || ph.phaseKey,
        track: ph.track || 'ROW',
        phaseKey: ph.phaseKey || ph.name || 'PHASE',
        label: ph.label || ph.name,
        startDate: ph.startDate,
        endDate: ph.endDate,
        isComplete: ph.isComplete,
      }))
    );
  }, [data?.stats?.schedule, rawPhases]);
  const events = Array.isArray(data?.activity?.events) ? data!.activity.events : [];
  const budgetTotal = data?.budget?.total ?? data?.budget?.totals?.total;
  const oorParcels = useMemo(() => {
    return parcels.filter((p: any) => p.lastCompensationOutsideRange).slice(0, 25);
  }, [parcels]);

  const generated = useMemo(() => new Date().toLocaleString(), []);

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!isAuthenticated) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Sign in to view this status report.{' '}
        <Button size="small" href={`/login?callbackUrl=/projects/${id}/report`}>
          Log in
        </Button>
      </Alert>
    );
  }
  if (error || !data?.project) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error)?.message || 'Report unavailable'}
        </Alert>
        <Button onClick={() => router.push(`/projects/${id}`)}>← Back to project</Button>
      </Box>
    );
  }

  const p = data.project;
  const acquiredN = effectiveAcquired;
  const acquiredPct = parcelCount ? Math.round((acquiredN / parcelCount) * 1000) / 10 : 0;

  return (
    <Box className="print-report" sx={{ maxWidth: 960, mx: 'auto', pb: 6, px: { xs: 1.5, sm: 0 } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 2, '@media print': { display: 'none' } }}
      >
        <Button onClick={() => router.push(`/projects/${id}`)}>← Project</Button>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              ROWFlow status report
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {p.name}
            </Typography>
            <Typography color="text.secondary">
              {[p.projectCode, p.workOrderNumber, p.clientName, p.description]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" align="right">
            Generated {generated}
            <br />
            {parcelCount} parcels
          </Typography>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Parcels
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {parcelCount}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Acquired
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {acquiredPct}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {acquiredN} parcels
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              OOR offers
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {oorParcels.length}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Budget
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {budgetTotal != null
                ? typeof budgetTotal === 'number'
                  ? `$${Number(budgetTotal).toLocaleString()}`
                  : String(budgetTotal)
                : '—'}
            </Typography>
          </Grid>
        </Grid>

        {rates ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Project rates loaded from stats.
          </Typography>
        ) : null}

        <Typography variant="subtitle2" gutterBottom>
          Overall status
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
          {Object.keys(breakdown).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No status breakdown yet.
            </Typography>
          ) : (
            Object.entries(breakdown).map(([k, v]) => (
              <Chip key={k} size="small" label={`${String(k).replaceAll('_', ' ')}: ${v}`} />
            ))
          )}
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          PTS
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
          {Object.keys(pts).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No PTS breakdown yet.
            </Typography>
          ) : (
            Object.entries(pts).map(([k, v]) => (
              <Chip
                key={k}
                size="small"
                variant="outlined"
                label={`${String(k).replaceAll('_', ' ')}: ${v}`}
              />
            ))
          )}
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Parcel class
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
          {Object.entries(classBreakdown).map(([k, v]) => (
            <Chip
              key={k}
              size="small"
              variant="outlined"
              label={`${String(k).replaceAll('_', ' ')}: ${v}`}
            />
          ))}
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Existing rights
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
          {Object.entries(existingRightsBreakdown).map(([k, v]) => (
            <Chip
              key={k}
              size="small"
              variant="outlined"
              label={`${String(k).replaceAll('_', ' ')}: ${v}`}
            />
          ))}
        </Stack>

        <Typography variant="subtitle2" gutterBottom>
          Encroachments
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 3 }}>
          {Object.entries(encroachmentBreakdown).map(([k, v]) => (
            <Chip
              key={k}
              size="small"
              variant="outlined"
              label={`${String(k).replaceAll('_', ' ')}: ${v}`}
            />
          ))}
        </Stack>

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Outside-range offers
        </Typography>
        {oorParcels.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No outside-range offers on this project.
          </Typography>
        ) : (
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Easement #</TableCell>
                <TableCell>PIN</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Last total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {oorParcels.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>{row.easementNumber || '—'}</TableCell>
                  <TableCell>{row.pin || row.parcelNumber || '—'}</TableCell>
                  <TableCell>{row.owner || '—'}</TableCell>
                  <TableCell align="right">
                    {row.lastCompensationTotal != null
                      ? `$${Number(row.lastCompensationTotal).toLocaleString()}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Schedule
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            color={healthColor[scheduleEval.health] || 'default'}
            label={`Project: ${String(scheduleEval.health).replaceAll('_', ' ')}`}
          />
          <Typography variant="caption" color="text.secondary">
            Late {scheduleEval.counts.late} · At risk {scheduleEval.counts.atRisk} · On track{' '}
            {scheduleEval.counts.onTrack} · Complete {scheduleEval.counts.complete} · Not started{' '}
            {scheduleEval.counts.notStarted}
          </Typography>
          <Button
            size="small"
            href={`/api/projects/${id}/export/report?type=schedule`}
            sx={{ ml: 'auto' }}
          >
            Schedule CSV
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Health = plan end date vs today (at risk = within 14 days). Mark phases Complete on Project
          Edit so finished work is not LATE.
        </Typography>
        {scheduleEval.phases.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No schedule phases configured.
          </Typography>
        ) : (
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Phase</TableCell>
                <TableCell>Track</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Timing</TableCell>
                <TableCell>Health</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...scheduleEval.phases]
                .sort((a: any, b: any) => {
                  const rank = (h: string) =>
                    h === 'LATE' ? 0 : h === 'AT_RISK' ? 1 : h === 'ON_TRACK' ? 2 : h === 'COMPLETE' ? 4 : 3;
                  return rank(a.health) - rank(b.health);
                })
                .map((ph: any) => (
                  <TableRow key={ph.id || ph.phaseKey} selected={ph.isPastDue}>
                    <TableCell>{ph.label || ph.phaseKey || '—'}</TableCell>
                    <TableCell>{ph.track || '—'}</TableCell>
                    <TableCell>
                      {ph.startDate ? new Date(ph.startDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {ph.endDate ? new Date(ph.endDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {ph.health === 'COMPLETE'
                        ? 'Done'
                        : ph.daysLate != null && ph.daysLate > 0
                          ? `${ph.daysLate}d late`
                          : ph.daysToEnd != null
                            ? ph.daysToEnd === 0
                              ? 'Due today'
                              : `${ph.daysToEnd}d left`
                            : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={healthColor[ph.health] || 'default'}
                        label={String(ph.health || '—').replaceAll('_', ' ')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Land matrix
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {matrixRows.length} matrix row(s)
          {matrixRows.length === 0 ? ' — none configured.' : '.'}
        </Typography>

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Recent activity
        </Typography>
        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No recent activity events.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {events.slice(0, 12).map((ev: any) => (
              <Typography key={ev.id} variant="body2" color="text.secondary">
                {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''} ·{' '}
                {ev.summary || ev.action || 'Event'}
              </Typography>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

export default function ProjectReportPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ProjectReportInner />
    </Suspense>
  );
}
