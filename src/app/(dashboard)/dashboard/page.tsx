'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthReady } from '@/components/providers/AppProviders';
import KpiStatCard, { formatMoney } from '@/components/analytics/KpiStatCard';
import StatusGlanceBars from '@/components/analytics/StatusGlanceBars';
import AlertsList from '@/components/analytics/AlertsList';
import ProjectHealthCard from '@/components/analytics/ProjectHealthCard';
import BudgetVsActualPanel from '@/components/analytics/BudgetVsActualPanel';
import LaborByRolePanel from '@/components/analytics/LaborByRolePanel';
import OutsideRangeTable from '@/components/analytics/OutsideRangeTable';
import ScheduleHealthPanel from '@/components/analytics/ScheduleHealthPanel';
import CollapsibleWidget, {
  loadWidgetPrefs,
  saveWidgetPrefs,
  type DashboardWidgetPrefs,
} from '@/components/analytics/CollapsibleWidget';
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { isAuthenticated, isLoading: authLoading } = useAuthReady();
  const sessionTier = (session?.user as { subscriptionTier?: string } | undefined)
    ?.subscriptionTier;
  const [widgetPrefs, setWidgetPrefs] = useState<DashboardWidgetPrefs>({
    collapsed: {},
    hidden: {},
  });

  useEffect(() => {
    setWidgetPrefs(loadWidgetPrefs());
  }, []);

  const toggleCollapse = (id: string) => {
    setWidgetPrefs((prev) => {
      const next = {
        ...prev,
        collapsed: { ...prev.collapsed, [id]: !prev.collapsed[id] },
      };
      saveWidgetPrefs(next);
      return next;
    });
  };

  const hideWidget = (id: string) => {
    setWidgetPrefs((prev) => {
      const next = {
        ...prev,
        hidden: { ...prev.hidden, [id]: true },
      };
      saveWidgetPrefs(next);
      return next;
    });
  };

  const resetWidgets = () => {
    const empty = { collapsed: {}, hidden: {} };
    setWidgetPrefs(empty);
    saveWidgetPrefs(empty);
  };

  const { data: summary, isLoading, error, isFetching } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/summary`,
        { credentials: 'same-origin', cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Failed to load dashboard summary');
      const data = await res.json();
      return data.summary;
    },
    enabled: isAuthenticated,
  });

  const loading = authLoading || (isAuthenticated && isLoading);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard</Alert>;
  }

  const s = summary;
  const c = (id: string) => Boolean(widgetPrefs.collapsed[id]);
  const h = (id: string) => Boolean(widgetPrefs.hidden[id]);
  const anyHidden = Object.values(widgetPrefs.hidden).some(Boolean);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Operational command center for ROW acquisition health.
        {isFetching ? ' · Updating…' : ''}
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {anyHidden && (
          <Button size="small" variant="text" onClick={resetWidgets}>
            Reset hidden widgets
          </Button>
        )}
      </Box>

      {/* KPI row — always visible */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="Active projects"
            value={s?.activeProjectCount ?? 0}
            sub={`${s?.projectCount ?? 0} total`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="Parcels"
            value={s?.parcelCount ?? 0}
            sub={`${s?.totalAcreage ?? 0} ac`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="% Acquired"
            value={`${s?.rates?.acquiredPct ?? 0}%`}
            color="success.main"
            sub={`${s?.statusBreakdown?.ACQUIRED ?? 0} parcels`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="% PTS granted"
            value={`${s?.rates?.ptsGrantedPct ?? 0}%`}
            sub={`Progress ${s?.rates?.ptsProgressPct ?? 0}%`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="Outside-range offers"
            value={s?.alerts?.outsideRangeOffers ?? 0}
            color={(s?.alerts?.outsideRangeOffers ?? 0) > 0 ? 'warning.main' : undefined}
            sub={`Rate ${s?.rates?.outsideRangeRatePct ?? 0}%`}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiStatCard
            label="Labor (billable)"
            value={formatMoney(s?.labor?.billableAmount ?? 0)}
            sub={`${s?.labor?.totalHours ?? 0} hrs`}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="contained" onClick={() => router.push('/projects/new')}>
          New project
        </Button>
        <Button variant="outlined" onClick={() => router.push('/projects')}>
          All projects
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => router.push('/activity')}>
          Activity
        </Button>
        
        <Button variant="outlined" onClick={() => router.push('/analytics')}>
          Analytics
        </Button>
        <Button variant="text" onClick={() => router.push('/settings')}>
          Settings
        </Button>
      </Box>

      {/* Command strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <CollapsibleWidget
            id="next_up"
            title="Next up"
            collapsed={c('next_up')}
            hidden={h('next_up')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Open work to clear — click through to the map.
            </Typography>
            <Stack spacing={1}>
              <Button size="small" variant="outlined" onClick={() => router.push('/projects')}>
                Open a project map
              </Button>
              <Button size="small" variant="outlined" onClick={() => router.push('/analytics')}>
                Review acquisition KPIs
              </Button>
              <Button size="small" variant="text" onClick={() => router.push('/activity')}>
                Review recent status changes →
              </Button>
              {(s?.alerts?.outsideRangeOffers ?? 0) > 0 && (
                <Button size="small" color="warning" onClick={() => router.push('/analytics')}>
                  {s.alerts.outsideRangeOffers} OOR offer(s) need review
                </Button>
              )}
            </Stack>
          </CollapsibleWidget>
        </Grid>
        <Grid item xs={12} md={6}>
          <CollapsibleWidget
            id="blocked"
            title="Blocked / attention"
            collapsed={c('blocked')}
            hidden={h('blocked')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
            borderColor="warning.main"
          >
            <AlertsList
              alerts={
                s?.alerts || {
                  outsideRangeOffers: 0,
                  pastDuePhases: 0,
                  projectsMissingManager: 0,
                  projectsMissingLead: 0,
                  highLaborVarianceProjects: 0,
                }
              }
              lateSamples={s?.schedule?.latePhaseSamples}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Use Activity for who-changed-what. Collapse or hide panels you don’t need.
            </Typography>
          </CollapsibleWidget>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          {!h('status_glance') && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                <Button size="small" onClick={() => hideWidget('status_glance')}>
                  Hide status glance
                </Button>
              </Box>
              <StatusGlanceBars
                total={s?.parcelCount ?? 0}
                statusBreakdown={s?.statusBreakdown || {}}
                ptsBreakdown={s?.ptsBreakdown || {}}
                titleBreakdown={s?.titleBreakdown || {}}
                acquisitionBreakdown={s?.acquisitionBreakdown || {}}
              />
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={5}>
          <CollapsibleWidget
            id="deep_links"
            title="Deep links"
            collapsed={c('deep_links')}
            hidden={h('deep_links')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
          >
            <Stack spacing={1}>
              
              <Button size="small" onClick={() => router.push('/analytics')}>
                Full analytics (budget / labor)
              </Button>
            </Stack>
          </CollapsibleWidget>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <CollapsibleWidget
            id="budget"
            title="Budget vs actual"
            collapsed={c('budget')}
            hidden={h('budget')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
          >
            <BudgetVsActualPanel
              rows={s?.budgetVsActual?.rows || []}
              laborBudget={s?.budgetVsActual?.laborBudget}
              laborActual={s?.budgetVsActual?.laborActual}
              laborVariance={s?.budgetVsActual?.laborVariance}
              note={s?.budgetVsActual?.note}
            />
          </CollapsibleWidget>
        </Grid>
        <Grid item xs={12} md={6}>
          <CollapsibleWidget
            id="labor"
            title="Labor by role"
            collapsed={c('labor')}
            hidden={h('labor')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
          >
            <LaborByRolePanel rows={s?.laborRoleRows || []} />
          </CollapsibleWidget>
        </Grid>
        <Grid item xs={12} md={6}>
          <CollapsibleWidget
            id="oor"
            title="Outside-range offers"
            collapsed={c('oor')}
            hidden={h('oor')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
          >
            <OutsideRangeTable
              offers={s?.outsideRangeOffers || []}
              count={s?.compensation?.outsideRangeCount}
              ratePct={s?.rates?.outsideRangeRatePct}
            />
          </CollapsibleWidget>
        </Grid>
        <Grid item xs={12} md={6}>
          <CollapsibleWidget
            id="schedule"
            title="Schedule health"
            collapsed={c('schedule')}
            hidden={h('schedule')}
            onToggleCollapse={toggleCollapse}
            onHide={hideWidget}
          >
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
            />
          </CollapsibleWidget>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>
        Projects
      </Typography>
      <Grid container spacing={2}>
        {(s?.projects || []).slice(0, 8).map((p: any) => (
          <Grid item xs={12} md={6} key={p.id}>
            <ProjectHealthCard project={p} />
          </Grid>
        ))}
        {(s?.projects || []).length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No projects yet. Create one to start tracking acquisition health.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
