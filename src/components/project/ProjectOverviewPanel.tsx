'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { STATUS_COLORS } from '@/lib/constants/status';
import KpiStatCard, { formatMoney } from '@/components/analytics/KpiStatCard';

type Breakdown = Record<string, number>;

export type OverviewFilterAction =
  | { type: 'quick'; key: string }
  | { type: 'colorBy'; tab: string; statusValue?: string }
  | { type: 'selectParcels'; ids: string[]; filter?: string };

function fmtKey(k: string) {
  return String(k).replaceAll('_', ' ');
}

function BreakdownBar({
  title,
  breakdown,
  total,
  onBucketClick,
}: {
  title: string;
  breakdown: Breakdown;
  total: number;
  onBucketClick?: (key: string) => void;
}) {
  const entries = Object.entries(breakdown || {}).sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((s, [, c]) => s + c, 0) || total || 1;
  if (!total && !entries.length) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          height: 14,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'action.hover',
          mb: 1,
        }}
      >
        {entries.map(([key, count]) => (
          <Box
            key={key}
            title={`${fmtKey(key)}: ${count}`}
            onClick={() => onBucketClick?.(key)}
            sx={{
              width: `${(count / sum) * 100}%`,
              bgcolor: STATUS_COLORS[key] || '#757575',
              minWidth: count > 0 ? 3 : 0,
              cursor: onBucketClick ? 'pointer' : 'default',
              '&:hover': onBucketClick ? { opacity: 0.85 } : undefined,
            }}
          />
        ))}
      </Box>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {entries.map(([key, count]) => (
          <Chip
            key={key}
            size="small"
            label={`${fmtKey(key)} ${count}`}
            onClick={onBucketClick ? () => onBucketClick(key) : undefined}
            clickable={Boolean(onBucketClick)}
            variant="outlined"
            sx={{
              borderColor: STATUS_COLORS[key] || undefined,
              bgcolor: `${STATUS_COLORS[key] || '#757575'}22`,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

async function fetchStats(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/stats`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load project stats');
  const data = await res.json();
  return data.stats;
}

export default function ProjectOverviewPanel({
  projectId,
  onAction,
  onOpenMap,
}: {
  projectId: string;
  onAction: (action: OverviewFilterAction) => void;
  onOpenMap?: () => void;
}) {
  const { data: stats, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => fetchStats(projectId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        {(error as Error)?.message || 'Could not load overview'}
      </Alert>
    );
  }

  const total = stats.total || 0;
  const acquired = stats.acquired || 0;
  const completion = stats.completionPercentage ?? 0;
  const budgetTotal = stats.budget?.total ?? 0;
  const laborBudget = stats.budgetVsActual?.laborBudget ?? 0;
  const laborActual = stats.budgetVsActual?.laborActual ?? 0;
  const schedule = stats.schedule;
  const alerts = stats.alerts || {};
  const oorParcels = stats.oorParcels || [];
  const domain = stats.domainProgress || {};

  const alertChips: Array<{ label: string; action: OverviewFilterAction; color?: 'warning' | 'error' | 'default' }> =
    [];
  if (alerts.outsideRangeOffers > 0) {
    alertChips.push({
      label: `${alerts.outsideRangeOffers} OOR offer(s)`,
      action: { type: 'quick', key: 'oor' },
      color: 'warning',
    });
  }
  if (alerts.supplementNeeded > 0) {
    alertChips.push({
      label: `${alerts.supplementNeeded} supplement needed`,
      action: { type: 'quick', key: 'supplement_needed' },
      color: 'warning',
    });
  }
  if (alerts.encroachNeedsRemoval > 0) {
    alertChips.push({
      label: `${alerts.encroachNeedsRemoval} encroach needs removal`,
      action: { type: 'quick', key: 'encroach_removal' },
      color: 'error',
    });
  }
  if (alerts.staleContacts > 0) {
    alertChips.push({
      label: `${alerts.staleContacts} stale contact(s) (14d)`,
      action: {
        type: 'selectParcels',
        ids: stats.staleContactParcelIds || [],
        filter: 'stale_contact',
      },
      color: 'warning',
    });
  }
  if (alerts.pastDueFollowUps > 0) {
    alertChips.push({
      label: `${alerts.pastDueFollowUps} past-due follow-up(s)`,
      action: {
        type: 'selectParcels',
        ids: stats.pastDueFollowUpParcelIds || [],
        filter: 'past_due_followup',
      },
      color: 'warning',
    });
  }
  if (alerts.pastDuePhases > 0) {
    alertChips.push({
      label: `${alerts.pastDuePhases} schedule phase(s) late`,
      action: { type: 'quick', key: 'all' },
      color: 'warning',
    });
  }
  if (alerts.highLaborVariance) {
    alertChips.push({
      label: 'Labor over budget (>25%)',
      action: { type: 'quick', key: 'all' },
      color: 'warning',
    });
  }
  if (alerts.missingManager) {
    alertChips.push({
      label: 'Missing Manager role',
      action: { type: 'quick', key: 'all' },
    });
  }
  if (alerts.missingLead) {
    alertChips.push({
      label: 'Missing Lead Agent',
      action: { type: 'quick', key: 'all' },
    });
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Project overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Corridor command center — click bars/chips to filter the parcel list and map.
            {isFetching ? ' · refreshing…' : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
          {onOpenMap && (
            <Button size="small" variant="contained" onClick={onOpenMap}>
              Open map
            </Button>
          )}
        </Stack>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Box
            onClick={() => onAction({ type: 'quick', key: 'all' })}
            sx={{ cursor: 'pointer', height: '100%' }}
          >
            <KpiStatCard label="Parcels" value={total} sub={`${stats.totalAcreage || 0} ac`} />
          </Box>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Box
            onClick={() => onAction({ type: 'quick', key: 'acquired' })}
            sx={{ cursor: 'pointer', height: '100%' }}
          >
            <KpiStatCard
              label="Acquired"
              value={`${completion}%`}
              sub={`${acquired} of ${total}`}
              color="#4caf50"
            />
          </Box>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Box
            onClick={() => onAction({ type: 'quick', key: 'oor' })}
            sx={{ cursor: 'pointer', height: '100%' }}
          >
            <KpiStatCard
              label="OOR offers"
              value={stats.compensation?.outsideRangeCount ?? 0}
              sub="outside range"
              color={
                (stats.compensation?.outsideRangeCount || 0) > 0 ? '#ff9800' : undefined
              }
            />
          </Box>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiStatCard
            label="Budget"
            value={formatMoney(budgetTotal)}
            sub={`Land accepted ${formatMoney(stats.compensation?.acceptedOfferTotal || 0)}`}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiStatCard
            label="Labor"
            value={formatMoney(laborActual)}
            sub={
              laborBudget
                ? `of ${formatMoney(laborBudget)} budget`
                : `${stats.labor?.totalHours || 0} hrs`
            }
            color={alerts.highLaborVariance ? '#f44336' : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiStatCard
            label="Schedule"
            value={
              schedule?.counts?.late
                ? `${schedule.counts.late} late`
                : schedule?.counts?.atRisk
                  ? `${schedule.counts.atRisk} at risk`
                  : 'On track'
            }
            sub={
              schedule?.counts
                ? `${schedule.counts.complete || 0} complete · ${schedule.counts.onTrack || 0} on track`
                : '—'
            }
            color={
              schedule?.counts?.late
                ? '#f44336'
                : schedule?.counts?.atRisk
                  ? '#ff9800'
                  : '#4caf50'
            }
          />
        </Grid>
      </Grid>

      {stats.scopeEstimate && (stats.scopeEstimate.takeTarget > 0 || stats.scopeEstimate.budgetTotal > 0) && (
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Estimate vs actual
            {stats.scopeEstimate.name ? ` · ${stats.scopeEstimate.name}` : ''}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Scope / budget</TableCell>
                <TableCell align="right">Actual</TableCell>
                <TableCell align="right">Variance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Land take</TableCell>
                <TableCell align="right">{formatMoney(stats.scopeEstimate.takeTarget)}</TableCell>
                <TableCell align="right">{formatMoney(stats.compensation?.acceptedOfferTotal || 0)}</TableCell>
                <TableCell align="right">
                  {stats.scopeEstimate.acceptedVsTake != null
                    ? formatMoney(stats.scopeEstimate.acceptedVsTake)
                    : '—'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Project budget (all lines)</TableCell>
                <TableCell align="right">{formatMoney(budgetTotal)}</TableCell>
                <TableCell align="right">
                  {formatMoney((stats.compensation?.acceptedOfferTotal || 0) + laborActual)}
                </TableCell>
                <TableCell align="right">
                  {stats.scopeEstimate.usedVsBudget != null
                    ? formatMoney(stats.scopeEstimate.usedVsBudget)
                    : '—'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary">
            Scope take is the desk BOE. Actual land is accepted offers only — agents create the take.
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Attention
        </Typography>
        {alertChips.length === 0 ? (
          <Alert severity="success" variant="outlined">
            No operational alerts right now.
          </Alert>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {alertChips.map((a) => (
              <Chip
                key={a.label}
                label={a.label}
                color={a.color === 'default' ? undefined : a.color}
                onClick={() => onAction(a.action)}
                clickable
              />
            ))}
          </Stack>
        )}
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Phase mix
            </Typography>
            <BreakdownBar
              title="Overall"
              breakdown={stats.statusBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'status', statusValue: key })
              }
            />
            <BreakdownBar
              title="PTS"
              breakdown={stats.ptsBreakdown || {}}
              total={total}
              onBucketClick={(key) => onAction({ type: 'colorBy', tab: 'pts', statusValue: key })}
            />
            <BreakdownBar
              title="Title"
              breakdown={stats.titleBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'title', statusValue: key })
              }
            />
            <BreakdownBar
              title="Survey"
              breakdown={stats.surveyBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'survey', statusValue: key })
              }
            />
            <BreakdownBar
              title="Acquisition"
              breakdown={stats.acquisitionBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'acquisition', statusValue: key })
              }
            />
            <BreakdownBar
              title="Permitting"
              breakdown={stats.permitBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'permit', statusValue: key })
              }
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Class & rights
            </Typography>
            <BreakdownBar
              title="Parcel class"
              breakdown={stats.parcelClassBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'parcel_class', statusValue: key })
              }
            />
            <BreakdownBar
              title="Existing rights"
              breakdown={stats.existingRightsBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'existing_rights', statusValue: key })
              }
            />
            <BreakdownBar
              title="Encroachments"
              breakdown={stats.encroachmentBreakdown || {}}
              total={total}
              onBucketClick={(key) =>
                onAction({ type: 'colorBy', tab: 'encroachments', statusValue: key })
              }
            />

            <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
              Domain started (active)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {[
                ['Title', domain.titleActive],
                ['Survey', domain.surveyActive],
                ['Appraisal', domain.appraisalActive],
                ['Acq done', domain.acquisitionComplete],
                ['PTS granted', domain.ptsGranted],
                ['Permit', domain.permitActive],
              ].map(([label, n]) => (
                <Chip key={String(label)} size="small" label={`${label}: ${n ?? 0}`} />
              ))}
            </Stack>

            {budgetTotal > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Labor burn
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, laborBudget ? (laborActual / laborBudget) * 100 : 0)}
                  color={alerts.highLaborVariance ? 'error' : 'primary'}
                  sx={{ height: 8, borderRadius: 1, mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatMoney(laborActual)} / {formatMoney(laborBudget)} labor budget
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {oorParcels.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Outside-range offers
            </Typography>
            <Button size="small" onClick={() => onAction({ type: 'quick', key: 'oor' })}>
              Filter list
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>PIN</TableCell>
                <TableCell align="right">Last total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {oorParcels.map((row: any) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    onAction({ type: 'selectParcels', ids: [row.id] });
                    onOpenMap?.();
                  }}
                >
                  <TableCell>{row.pin || row.parcelNumber || row.id.slice(0, 8)}</TableCell>
                  <TableCell align="right">
                    {row.lastCompensationTotal != null
                      ? formatMoney(Number(row.lastCompensationTotal))
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {schedule?.phases?.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Schedule phases
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {(schedule.phases as any[]).slice(0, 16).map((ph: any) => (
              <Chip
                key={ph.id || ph.key || ph.label}
                size="small"
                label={`${ph.label || ph.key}: ${fmtKey(String(ph.health || ph.status || '—'))}`}
                color={
                  ph.health === 'LATE' || ph.status === 'LATE'
                    ? 'error'
                    : ph.health === 'AT_RISK'
                      ? 'warning'
                      : ph.health === 'COMPLETE' || ph.isComplete
                        ? 'success'
                        : 'default'
                }
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
