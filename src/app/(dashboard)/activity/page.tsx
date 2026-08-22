'use client';

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  Component,
  type ReactNode,
  Suspense,
} from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthReady } from '@/components/providers/AppProviders';
import { fetchProjectList } from '@/lib/queries/projects';

type ActivityEvent = {
  id: string;
  createdAt: string;
  action: string;
  entityType?: string | null;
  summary: string | null;
  projectId: string | null;
  parcelId: string | null;
  user: { id: string; name: string | null; email: string } | null;
  project: { id: string; name: string; projectCode: string | null } | null;
  parcel: {
    id: string;
    parcelNumber: string | null;
    pin: string | null;
    owner: string | null;
    easementNumber?: string | null;
  } | null;
};

type Actor = { id: string; name: string | null; email: string };

const ENTITY_CHIPS: { key: string; label: string; entityType?: string; action?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'status', label: 'Statuses', action: 'STATUS_CHANGE', entityType: 'parcel' },
  { key: 'contact', label: 'Contacts', entityType: 'contact_log' },
  { key: 'note', label: 'Notes', entityType: 'note' },
  { key: 'document', label: 'Files', entityType: 'document' },
  { key: 'offer', label: 'Offers', entityType: 'compensation' },
  { key: 'label', label: 'Labels', entityType: 'parcel_labels' },
  { key: 'permit', label: 'Permits', entityType: 'permit' },
];

const ACTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'STATUS_CHANGE', label: 'Status change' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'IMPORT', label: 'Import' },
  { value: 'EXPORT', label: 'Export' },
];

const STATUS_FIELD_OPTIONS = [
  { value: 'all', label: 'Any status field' },
  { value: 'status', label: 'Overall' },
  { value: 'ptsStatus', label: 'PTS' },
  { value: 'titleStatus', label: 'Title' },
  { value: 'surveyStatus', label: 'Survey' },
  { value: 'appraisalStatus', label: 'Appraisal' },
  { value: 'acquisitionStatus', label: 'Acquisition' },
  { value: 'condemnationStatus', label: 'Condemnation' },
  { value: 'permitStatus', label: 'Permitting' },
  { value: 'existingRightsStatus', label: 'Existing rights' },
  { value: 'parcelClass', label: 'Parcel class' },
  { value: 'encroachmentStatus', label: 'Encroachments' },
  { value: 'specialConditionsStatus', label: 'Special conditions' },
  { value: 'damagesStatus', label: 'Damages' },
  { value: 'priority', label: 'Priority' },
  { value: 'bookmarked', label: 'Bookmark' },
];

type DatePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function rangeFromPreset(preset: DatePreset): { from?: string; to?: string } {
  if (preset === 'all') return {};
  if (preset === 'today') {
    return {
      from: startOfLocalDay().toISOString(),
      to: endOfLocalDay().toISOString(),
    };
  }
  if (preset === '7d') {
    const from = startOfLocalDay();
    from.setDate(from.getDate() - 6);
    return { from: from.toISOString(), to: endOfLocalDay().toISOString() };
  }
  if (preset === '30d') {
    const from = startOfLocalDay();
    from.setDate(from.getDate() - 29);
    return { from: from.toISOString(), to: endOfLocalDay().toISOString() };
  }
  return {};
}

function parcelPrimary(p: ActivityEvent['parcel'], parcelId?: string | null) {
  if (!p && !parcelId) return '—';
  if (!p) return 'Parcel';
  return p.easementNumber || p.pin || p.parcelNumber || 'Parcel';
}

function parcelSecondary(p: ActivityEvent['parcel']) {
  if (!p) return null;
  const bits = [
    p.easementNumber && (p.pin || p.parcelNumber)
      ? `PIN ${p.pin || p.parcelNumber}`
      : !p.easementNumber && p.pin && p.parcelNumber
        ? p.parcelNumber
        : null,
    p.owner || null,
  ].filter(Boolean);
  return bits.length ? bits.join(' · ') : null;
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function daySortKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return startOfLocalDay(d).getTime();
}

function csvEscape(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportActivityCsv(events: ActivityEvent[]) {
  const headers = [
    'When',
    'Action',
    'Entity',
    'Summary',
    'Project',
    'Easement #',
    'PIN',
    'Parcel #',
    'Owner',
    'By name',
    'By email',
  ];
  const lines = [headers.join(',')];
  for (const ev of events) {
    lines.push(
      [
        ev.createdAt || '',
        ev.action || '',
        ev.entityType || '',
        ev.summary || '',
        ev.project?.name || '',
        ev.parcel?.easementNumber || '',
        ev.parcel?.pin || '',
        ev.parcel?.parcelNumber || '',
        ev.parcel?.owner || '',
        ev.user?.name || '',
        ev.user?.email || '',
      ]
        .map((c) => csvEscape(String(c)))
        .join(',')
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchActivityPage(params: URLSearchParams) {
  const res = await fetch(`/api/activity?${params}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load activity');
  }
  const data = await res.json();
  return {
    events: (Array.isArray(data?.events) ? data.events : []) as ActivityEvent[],
    nextCursor: (data?.nextCursor as string | null) ?? null,
    lastSeenActivityAt: data?.lastSeenActivityAt ?? null,
    actors: (Array.isArray(data?.actors) ? data.actors : []) as Actor[],
  };
}

class ActivityErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Activity failed to render: {this.state.error.message}
          <Button size="small" sx={{ ml: 2 }} onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}

function ActivityPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthReady();

  const [projectId, setProjectId] = useState(() => searchParams.get('projectId') || 'all');
  const [action, setAction] = useState(() => searchParams.get('action') || 'all');
  const [userId, setUserId] = useState(() => searchParams.get('userId') || 'all');
  const [entityChip, setEntityChip] = useState(() => searchParams.get('entity') || 'all');
  const [statusField, setStatusField] = useState(() => searchParams.get('statusField') || 'all');
  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [groupByDay, setGroupByDay] = useState(() => searchParams.get('group') !== '0');
  const [qDebounced, setQDebounced] = useState(q);
  const [datePreset, setDatePreset] = useState<DatePreset>(
    () => (searchParams.get('range') as DatePreset) || '30d'
  );
  const [customFrom, setCustomFrom] = useState(() => searchParams.get('fromDate') || '');
  const [customTo, setCustomTo] = useState(() => searchParams.get('toDate') || '');
  const [order, setOrder] = useState<'desc' | 'asc'>(
    () => (searchParams.get('order') === 'asc' ? 'asc' : 'desc')
  );
  const [unreadOnly, setUnreadOnly] = useState(() => searchParams.get('unread') === '1');

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Sync filters → URL
  useEffect(() => {
    if (!isAuthenticated) return;
    const p = new URLSearchParams();
    if (projectId !== 'all') p.set('projectId', projectId);
    if (action !== 'all') p.set('action', action);
    if (userId !== 'all') p.set('userId', userId);
    if (entityChip !== 'all') p.set('entity', entityChip);
    if (statusField !== 'all') p.set('statusField', statusField);
    if (qDebounced.trim()) p.set('q', qDebounced.trim());
    if (datePreset !== 'all') p.set('range', datePreset);
    if (datePreset === 'custom') {
      if (customFrom) p.set('fromDate', customFrom);
      if (customTo) p.set('toDate', customTo);
    }
    if (order === 'asc') p.set('order', 'asc');
    if (unreadOnly) p.set('unread', '1');
    if (!groupByDay) p.set('group', '0');
    const next = p.toString();
    const cur = searchParams.toString();
    if (next !== cur) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [
    isAuthenticated,
    projectId,
    action,
    userId,
    entityChip,
    statusField,
    qDebounced,
    datePreset,
    customFrom,
    customTo,
    order,
    unreadOnly,
    groupByDay,
    pathname,
    router,
    searchParams,
  ]);

  const { data: projectsRaw } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjectList,
    enabled: isAuthenticated,
  });

  const projects = useMemo((): { id: string; name: string }[] => {
    if (Array.isArray(projectsRaw)) {
      return projectsRaw.map((p) => ({
        id: String((p as any).id),
        name: String((p as any).name || 'Project'),
      }));
    }
    if (projectsRaw && Array.isArray((projectsRaw as any).projects)) {
      return (projectsRaw as any).projects.map((p: any) => ({
        id: String(p.id),
        name: String(p.name || 'Project'),
      }));
    }
    return [];
  }, [projectsRaw]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      const from = customFrom
        ? startOfLocalDay(new Date(customFrom + 'T12:00:00')).toISOString()
        : undefined;
      const to = customTo
        ? endOfLocalDay(new Date(customTo + 'T12:00:00')).toISOString()
        : undefined;
      return { from, to };
    }
    return rangeFromPreset(datePreset);
  }, [datePreset, customFrom, customTo]);

  const chipMeta = ENTITY_CHIPS.find((c) => c.key === entityChip) || ENTITY_CHIPS[0];

  const buildParams = useCallback(
    (cursor?: string) => {
      const p = new URLSearchParams();
      if (projectId && projectId !== 'all') p.set('projectId', projectId);
      // Chip action/entity unless explicit action overrides when chip is all
      const effectiveAction =
        action !== 'all' ? action : chipMeta.action && entityChip !== 'all' ? chipMeta.action : '';
      const effectiveEntity =
        chipMeta.entityType && entityChip !== 'all' ? chipMeta.entityType : '';
      if (effectiveAction) p.set('action', effectiveAction);
      if (effectiveEntity) p.set('entityType', effectiveEntity);
      if (statusField && statusField !== 'all') p.set('statusField', statusField);
      if (userId && userId !== 'all') p.set('userId', userId);
      if (qDebounced.trim()) p.set('q', qDebounced.trim());
      if (dateRange.from) p.set('from', dateRange.from);
      if (dateRange.to) p.set('to', dateRange.to);
      if (unreadOnly) p.set('unread', '1');
      if (order === 'asc') p.set('order', 'asc');
      p.set('limit', '50');
      p.set('includeActors', '1');
      if (cursor) p.set('cursor', cursor);
      return p;
    },
    [
      projectId,
      action,
      userId,
      chipMeta,
      entityChip,
      statusField,
      qDebounced,
      dateRange,
      unreadOnly,
      order,
    ]
  );

  const infinite = useInfiniteQuery({
    queryKey: [
      'activity',
      projectId,
      action,
      userId,
      entityChip,
      statusField,
      qDebounced,
      datePreset,
      customFrom,
      customTo,
      order,
      unreadOnly,
    ],
    queryFn: ({ pageParam }) => fetchActivityPage(buildParams(pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor || undefined,
    enabled: isAuthenticated,
  });

  const actors = useMemo(() => {
    const first = infinite.data?.pages?.[0]?.actors;
    return Array.isArray(first) ? first : [];
  }, [infinite.data]);

  const events = useMemo(() => {
    const pages = infinite.data?.pages || [];
    return pages.flatMap((pg) => pg.events);
  }, [infinite.data]);

  const dayGroups = useMemo(() => {
    if (!groupByDay) return null;
    const map = new Map<string, { label: string; sort: number; items: ActivityEvent[] }>();
    for (const ev of events) {
      const label = dayKey(ev.createdAt);
      const sort = daySortKey(ev.createdAt);
      const cur = map.get(label) || { label, sort, items: [] };
      cur.items.push(ev);
      map.set(label, cur);
    }
    const groups = [...map.values()];
    groups.sort((a, b) => (order === 'asc' ? a.sort - b.sort : b.sort - a.sort));
    return groups;
  }, [events, groupByDay, order]);

  const seenMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/activity', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to mark seen');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['activity-unread'] });
    },
  });

  const clearFilters = () => {
    setProjectId('all');
    setAction('all');
    setUserId('all');
    setEntityChip('all');
    setStatusField('all');
    setQ('');
    setDatePreset('30d');
    setCustomFrom('');
    setCustomTo('');
    setOrder('desc');
    setUnreadOnly(false);
    setGroupByDay(true);
  };

  if (authLoading || (isAuthenticated && infinite.isLoading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Sign in to view activity.{' '}
        <Button size="small" href="/login?callbackUrl=/activity">
          Log in
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Activity
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Status, contacts, notes, files, offers — filterable for managers.
            {infinite.isFetching ? ' · Updating…' : ''}
            {events.length ? ` · ${events.length} shown` : ''}
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            disabled={!events.length}
            onClick={() => exportActivityCsv(events)}
          >
            Export CSV
          </Button>
          <Button size="small" variant="text" onClick={clearFilters}>
            Reset filters
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => seenMut.mutate()}
            disabled={seenMut.isPending}
          >
            Mark as seen
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
          {ENTITY_CHIPS.map((c) => (
            <Chip
              key={c.key}
              size="small"
              label={c.label}
              color={entityChip === c.key ? 'primary' : 'default'}
              variant={entityChip === c.key ? 'filled' : 'outlined'}
              onClick={() => {
                setEntityChip(c.key);
                if (c.key !== 'all' && c.action) setAction('all');
                if (c.key !== 'status') setStatusField('all');
              }}
            />
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="act-project-label">Project</InputLabel>
            <Select
              labelId="act-project-label"
              label="Project"
              value={projectId}
              onChange={(e) => setProjectId(String(e.target.value))}
            >
              <MenuItem value="all">All accessible</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="act-action-label">Action</InputLabel>
            <Select
              labelId="act-action-label"
              label="Action"
              value={action}
              onChange={(e) => setAction(String(e.target.value))}
            >
              {ACTIONS.map((a) => (
                <MenuItem key={a.value} value={a.value}>
                  {a.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="act-field-label">Status field</InputLabel>
            <Select
              labelId="act-field-label"
              label="Status field"
              value={statusField}
              onChange={(e) => {
                const v = String(e.target.value);
                setStatusField(v);
                if (v !== 'all') {
                  setEntityChip('status');
                  setAction('all');
                }
              }}
            >
              {STATUS_FIELD_OPTIONS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="act-user-label">Person</InputLabel>
            <Select
              labelId="act-user-label"
              label="Person"
              value={userId}
              onChange={(e) => setUserId(String(e.target.value))}
            >
              <MenuItem value="all">Anyone</MenuItem>
              {actors.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="act-range-label">When</InputLabel>
            <Select
              labelId="act-range-label"
              label="When"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="all">All time</MenuItem>
              <MenuItem value="custom">Custom…</MenuItem>
            </Select>
          </FormControl>

          {datePreset === 'custom' && (
            <>
              <TextField
                size="small"
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </>
          )}

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="act-order-label">Sort</InputLabel>
            <Select
              labelId="act-order-label"
              label="Sort"
              value={order}
              onChange={(e) => setOrder(e.target.value === 'asc' ? 'asc' : 'desc')}
            >
              <MenuItem value="desc">Newest first</MenuItem>
              <MenuItem value="asc">Oldest first</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Search summary"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 200, flex: 1 }}
            placeholder="ptsStatus, note text…"
          />

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
            }
            label="Unread only"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={groupByDay}
                onChange={(e) => setGroupByDay(e.target.checked)}
              />
            }
            label="Group by day"
          />
        </Stack>
      </Paper>

      {infinite.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(infinite.error as Error).message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Parcel</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>By</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length === 0 && !infinite.isFetching && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No activity matches these filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {(dayGroups
              ? dayGroups.flatMap((g) => [
                  {
                    kind: 'header' as const,
                    key: `h-${g.label}`,
                    label: g.label,
                    count: g.items.length,
                  },
                  ...g.items.map((ev) => ({ kind: 'row' as const, key: ev.id, ev })),
                ])
              : events.map((ev) => ({ kind: 'row' as const, key: ev.id, ev }))
            ).map((item) => {
              if (item.kind === 'header') {
                return (
                  <TableRow key={item.key} sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={6} sx={{ py: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {item.label}
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {item.count} event{item.count === 1 ? '' : 's'}
                        </Typography>
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              }
              const ev = item.ev;
              const when = ev?.createdAt ? new Date(ev.createdAt) : null;
              const whenLabel =
                when && !Number.isNaN(when.getTime()) ? when.toLocaleString() : '—';
              const primary = parcelPrimary(ev.parcel, ev.parcelId);
              const secondary = parcelSecondary(ev.parcel);
              return (
                <TableRow key={ev.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{whenLabel}</TableCell>
                  <TableCell>{ev?.project?.name || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {primary}
                    </Typography>
                    {secondary ? (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {secondary}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ev?.summary || ev?.action || 'Event'}</Typography>
                    <Stack direction="row" gap={0.5} flexWrap="wrap" mt={0.5}>
                      {ev?.action ? (
                        <Chip size="small" variant="outlined" label={ev.action.replaceAll('_', ' ')} />
                      ) : null}
                      {ev?.entityType ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={String(ev.entityType).replaceAll('_', ' ')}
                        />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{ev?.user?.name || ev?.user?.email || 'System'}</TableCell>
                  <TableCell align="right">
                    {ev?.projectId && (
                      <Button
                        size="small"
                        onClick={() =>
                          router.push(
                            `/projects/${ev.projectId}${
                              ev.parcelId ? `?parcel=${ev.parcelId}` : ''
                            }`
                          )
                        }
                      >
                        Open
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2, mb: 4 }}>
        {infinite.hasNextPage ? (
          <Button
            variant="outlined"
            onClick={() => infinite.fetchNextPage()}
            disabled={infinite.isFetchingNextPage}
          >
            {infinite.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        ) : events.length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            End of results
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function ActivityPage() {
  return (
    <ActivityErrorBoundary>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ActivityPageInner />
      </Suspense>
    </ActivityErrorBoundary>
  );
}
