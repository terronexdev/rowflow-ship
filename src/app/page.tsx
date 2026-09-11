'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupsIcon from '@mui/icons-material/Groups';
import PaymentsIcon from '@mui/icons-material/Payments';
import HubIcon from '@mui/icons-material/Hub';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { FONT_SERIF, terronex } from '@/lib/theme';
import ThemeToggle from '@/components/layout/ThemeToggle';

type FeatureKey = 'map' | 'lifecycle' | 'matrix' | 'team' | 'analytics' | 'suite';

const SHOTS: Partial<Record<FeatureKey, { src: string; alt: string }>> = {
  map: {
    src: '/marketing/map.jpg',
    alt: 'ROWFlow map: color-by Overall, Class, Rights, Encroach plus corridor layers',
  },
  lifecycle: {
    src: '/marketing/parcel.jpg',
    alt: 'Parcel workspace: titled owner, contact log, Create Take',
  },
  analytics: {
    src: '/marketing/overview.jpg',
    alt: 'Project Overview: stale contacts, past-due follow-up, estimate vs actual',
  },
  suite: {
    src: '/marketing/suite.jpg',
    alt: 'Suite handoff: Tractsource package → ROWScope seed → ROWFlow import',
  },
};

const GALLERY: Array<{ src: string; label: string; blurb: string }> = [
  {
    src: '/marketing/map.jpg',
    label: 'Map workspace',
    blurb: 'Live goode corridor. Color-by Overall, tract selected, access dashes, parcel inspector.',
  },
  {
    src: '/marketing/overview.jpg',
    label: 'Overview',
    blurb: '100 tracts, Scope estimate vs actual, stale-contact chip. Desk BOE ≠ offer.',
  },
  {
    src: '/marketing/list.jpg',
    label: 'Line list',
    blurb: 'Easement / PIN / owner / status matrix. Double-click status. CSV of the visible filter.',
  },
  {
    src: '/marketing/parcel.jpg',
    label: 'Parcel edit',
    blurb: 'Summary | Full. Status, identity, titled owner, contacts, existing rights, take.',
  },
  {
    src: '/marketing/suite.jpg',
    label: 'Import',
    blurb: 'Corridor package for the map. ROWScope seed for budget. No auto offers.',
  },
];

const FEATURES: Array<{
  key: FeatureKey;
  icon: React.ReactNode;
  title: string;
  body: string;
}> = [
  {
    key: 'map',
    icon: <MapIcon fontSize="small" />,
    title: 'Map-first parcel workspace',
    body: 'Color-by Overall, parcel class, existing rights, or encroachments. Corridor package layers sit on the same map.',
  },
  {
    key: 'lifecycle',
    icon: <TimelineIcon fontSize="small" />,
    title: 'Contact → negotiate → status',
    body: 'Contact log with stale and past-due follow-up. Create Take on the matrix. Who + when on notes, docs, and contacts.',
  },
  {
    key: 'matrix',
    icon: <PaymentsIcon fontSize="small" />,
    title: 'Matrix + Scope budget',
    body: 'Land matrix and offer bands in Flow. Budget lines seed from ROWScope, including per-parcel × an editable tract count.',
  },
  {
    key: 'team',
    icon: <GroupsIcon fontSize="small" />,
    title: 'Team roles & labor',
    body: 'Multi-role roster, invites, billable labor by discipline, and budget vs actuals.',
  },
  {
    key: 'analytics',
    icon: <AnalyticsIcon fontSize="small" />,
    title: 'Overview + Activity',
    body: 'Command-center chips and bars on the project. One Activity feed: filters, group-by-day, CSV.',
  },
  {
    key: 'suite',
    icon: <HubIcon fontSize="small" />,
    title: 'Tractsource → ROWScope → ROWFlow',
    body: 'Package for the map. Seed for budget + PE + land use. No auto offers.',
  },
];

const STATUS_COLORS: Record<string, string> = {
  ACQUIRED: '#4caf50',
  IN_PROGRESS: '#2196f3',
  NOT_STARTED: '#9e9e9e',
  GRANTED: '#10b981',
  REQUESTED: '#3b82f6',
  NEGOTIATING: '#f59e0b',
  LATE: '#ef4444',
  AT_RISK: '#f59e0b',
};

function MockChrome({
  title,
  children,
  tabs,
  tab,
  onTab,
}: {
  title: string;
  children: React.ReactNode;
  tabs?: string[];
  tab?: number;
  onTab?: (i: number) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${terronex.border}`,
        overflow: 'hidden',
        bgcolor: terronex.panelAlt,
        boxShadow: terronex.shadow,
        minHeight: 360,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${terronex.border}`,
          bgcolor: terronex.panel,
        }}
      >
        <Stack direction="row" spacing={0.6}>
          {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
            <Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c, opacity: 0.85 }} />
          ))}
        </Stack>
        <Typography variant="caption" sx={{ color: terronex.muted, ml: 1, flex: 1 }} noWrap>
          rowflow · {title}
        </Typography>
        <Chip size="small" label="Workspace" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
      </Box>
      {tabs && (
        <Tabs
          value={tab ?? 0}
          onChange={(_, v) => onTab?.(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            borderBottom: `1px solid ${terronex.border}`,
            px: 1,
            '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 12, textTransform: 'none' },
          }}
        >
          {tabs.map((t) => (
            <Tab key={t} label={t} />
          ))}
        </Tabs>
      )}
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Paper>
  );
}

function MapMock({ layer }: { layer: number }) {
  const label = layer === 1 ? 'Color-by: PTS' : 'Color-by: Overall status';
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Chip size="small" label={label} variant="outlined" />
        <Chip size="small" label="Sample preview" variant="outlined" />
      </Stack>
      <Box
        sx={{
          height: 300,
          borderRadius: 1,
          border: `1px dashed ${terronex.border}`,
          bgcolor: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Map-first parcel workspace — import your corridor from Tractsource and track ROW statuses live.
        </Typography>
      </Box>
    </Box>
  );
}

function DashboardMock() {
  const kpis = [
    { l: 'Active projects', v: '1' },
    { l: 'Parcels', v: '—' },
    { l: '% Acquired', v: '—', c: terronex.ok },
    { l: '% PTS granted', v: '—' },
    { l: 'OOR offers', v: '1', c: terronex.warn },
    { l: 'Labor billable', v: '$8.2k' },
  ];
  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1.5 }}>
        {kpis.map((k) => (
          <Grid item xs={4} sm={2} key={k.l}>
            <Paper variant="outlined" sx={{ p: 1, bgcolor: terronex.panel, borderColor: terronex.border }}>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {k.l}
              </Typography>
              <Typography fontWeight={700} sx={{ color: k.c || terronex.text, fontSize: 18 }}>
                {k.v}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" color="text.secondary">
        Status at a glance · Overall
      </Typography>
      <Box sx={{ display: 'flex', height: 12, borderRadius: 1, overflow: 'hidden', my: 0.75 }}>
        <Box sx={{ width: '38%', bgcolor: STATUS_COLORS.ACQUIRED }} />
        <Box sx={{ width: '27%', bgcolor: STATUS_COLORS.IN_PROGRESS }} />
        <Box sx={{ width: '35%', bgcolor: STATUS_COLORS.NOT_STARTED }} />
      </Box>
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {[
          { n: 'Corridor A', a: 42, p: 58, s: 'ON_TRACK' },
        ].map((p) => (
          <Grid item xs={12} sm={4} key={p.n}>
            <Paper variant="outlined" sx={{ p: 1.25, bgcolor: terronex.panel, borderColor: terronex.border }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700} fontSize={13}>
                  {p.n}
                </Typography>
                <Chip
                  size="small"
                  label={p.s.replaceAll('_', ' ')}
                  color={p.s === 'LATE' ? 'error' : p.s === 'AT_RISK' ? 'warning' : 'success'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: 10 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Acquired {p.a}%
              </Typography>
              <LinearProgress variant="determinate" value={p.a} color="success" sx={{ height: 5, borderRadius: 1, mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                PTS progress {p.p}%
              </Typography>
              <LinearProgress variant="determinate" value={p.p} sx={{ height: 5, borderRadius: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function AnalyticsMock() {
  const bars = [
    { n: 'Acquired', v: 98, c: STATUS_COLORS.ACQUIRED },
    { n: 'In progress', v: 70, c: STATUS_COLORS.IN_PROGRESS },
    { n: 'Not started', v: 89, c: STATUS_COLORS.NOT_STARTED },
  ];
  const max = 100;
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        {['Overall', 'PTS', 'Title', 'Acquisition'].map((d, i) => (
          <Chip
            key={d}
            size="small"
            label={d}
            color={i === 0 ? 'primary' : 'default'}
            variant={i === 0 ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5}>
          <Box
            sx={{
              width: 150,
              height: 150,
              mx: 'auto',
              borderRadius: '50%',
              background: `conic-gradient(${STATUS_COLORS.ACQUIRED} 0 38%, ${STATUS_COLORS.IN_PROGRESS} 38% 65%, ${STATUS_COLORS.NOT_STARTED} 65% 100%)`,
              border: `6px solid ${terronex.panel}`,
              boxShadow: `inset 0 0 0 28px ${terronex.panelAlt}`,
            }}
          />
          <Typography align="center" variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Status distribution
          </Typography>
        </Grid>
        <Grid item xs={12} sm={7}>
          {bars.map((b) => (
            <Box key={b.n} sx={{ mb: 1.25 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">{b.n}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {b.v}
                </Typography>
              </Stack>
              <Box sx={{ height: 10, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ width: `${(b.v / max) * 100}%`, height: '100%', bgcolor: b.c }} />
              </Box>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary">
            Budget vs actual · Land $2.1M offered · Labor $124k billable
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

function ParcelEditMock() {
  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12} md={5}>
        <Typography variant="caption" color="text.secondary">
          Parcel 12-051 · Blue Ridge LLC
        </Typography>
        <Typography fontWeight={700} sx={{ mb: 1 }}>
          Edit parcel
        </Typography>
        {[
          ['Overall', 'IN PROGRESS'],
          ['PTS', 'GRANTED'],
          ['Title', 'COMPLETE'],
          ['Acquisition', 'NEGOTIATING'],
        ].map(([k, v]) => (
          <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {k}
            </Typography>
            <Chip size="small" label={v} sx={{ height: 22, fontSize: 11 }} color="primary" variant="outlined" />
          </Stack>
        ))}
        <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: terronex.panel, border: `1px solid ${terronex.border}` }}>
          <Typography variant="caption" color="text.secondary">
            Titled owner
          </Typography>
          <Typography variant="body2">Blue Ridge Holdings LLC</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
            Tenant
          </Typography>
          <Typography variant="body2">— none —</Typography>
        </Box>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: terronex.panel, borderColor: terronex.border }}>
          <Typography fontWeight={700} fontSize={13} gutterBottom>
            Compensation offer
          </Typography>
          <Grid container spacing={1}>
            {[
              ['Land use', 'Timber'],
              ['Easement ac', '3.40'],
              ['Range', '$8,160 – $15,300'],
              ['Negotiated', '$14,200'],
            ].map(([l, v]) => (
              <Grid item xs={6} key={l}>
                <Typography variant="caption" color="text.secondary">
                  {l}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {v}
                </Typography>
              </Grid>
            ))}
          </Grid>
          <Chip size="small" color="warning" label="Inside range" sx={{ mt: 1 }} />
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button size="small" variant="contained" disabled>
              Save offer
            </Button>
            <Button size="small" variant="outlined" disabled>
              Send email
            </Button>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: terronex.panel, borderColor: terronex.border }}>
          <Typography fontWeight={700} fontSize={13} gutterBottom>
            Labor entry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lead Agent · 4.5 hrs · $585 billable · site meet + offer prep
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

function MatrixMock() {
  const rows = [
    ['Timber', '$2,400', '$4,500', '/ac'],
    ['Pasture', '$1,800', '$3,200', '/ac'],
    ['Residential', '$8,000', '$14,000', '/ac'],
    ['Commercial', '$12,000', '$22,000', '/ac'],
  ];
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        Land payment matrix · offer band 80–150%
      </Typography>
      <Box
        component="table"
        sx={{
          width: '100%',
          mt: 1,
          borderCollapse: 'collapse',
          fontSize: 12,
          '& th, & td': {
            borderBottom: `1px solid ${terronex.border}`,
            py: 0.85,
            px: 1,
            textAlign: 'left',
          },
          '& th': { color: terronex.muted, fontWeight: 600 },
        }}
      >
        <thead>
          <tr>
            <th>Land use</th>
            <th>Min</th>
            <th>Max</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td>{r[0]}</td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
        Outside-range offers email Manager + Lead · 2 open alerts on portfolio
      </Typography>
    </Box>
  );
}

function TeamMock() {
  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12} sm={6}>
        <Typography fontWeight={700} fontSize={13} gutterBottom>
          Roles
        </Typography>
        {[
          ['Manager', 'A. Whitfield', '$145/hr'],
          ['Lead Agent', 'R. Calderon', '$95/hr'],
          ['Agent', 'S. Okonkwo', '$75/hr'],
          ['Agent', 'L. Brennan', '$75/hr'],
        ].map(([r, n, rate]) => (
          <Stack
            key={r}
            direction="row"
            justifyContent="space-between"
            sx={{
              py: 0.75,
              borderBottom: `1px solid ${terronex.border}`,
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {n}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {r}
              </Typography>
            </Box>
            <Typography variant="caption" color="primary.light">
              {rate}
            </Typography>
          </Stack>
        ))}
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography fontWeight={700} fontSize={13} gutterBottom>
          Labor this week
        </Typography>
        {[
          ['Manager', 12, 1740],
          ['Lead Agent', 28, 2660],
          ['Agent', 41, 3075],
        ].map(([r, h, $]) => (
          <Box key={String(r)} sx={{ mb: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption">{r}</Typography>
              <Typography variant="caption" color="text.secondary">
                {h}h · ${Number($).toLocaleString()}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (Number(h) / 45) * 100)}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        ))}
      </Grid>
    </Grid>
  );
}

function SuiteMock() {
  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Paper
          variant="outlined"
          sx={{ flex: 1, p: 1.5, bgcolor: terronex.panel, borderColor: terronex.border }}
        >
          <Chip size="small" label="Tractsource" color="success" variant="outlined" sx={{ mb: 1 }} />
          <Typography fontWeight={700} fontSize={13}>
            Extract AOI
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            VA · Amherst · 83 parcels · owners rich · ~11s
          </Typography>
          <Box
            sx={{
              height: 90,
              borderRadius: 1,
              bgcolor: terronex.panelAlt,
              border: `1px dashed ${terronex.border}`,
              display: 'grid',
              placeItems: 'center',
              color: terronex.muted,
              fontSize: 11,
            }}
          >
            county parcels + owners
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.5 }}>
          <Typography color="primary.light" fontWeight={700}>
            →
          </Typography>
        </Box>
        <Paper
          variant="outlined"
          sx={{ flex: 1, p: 1.5, bgcolor: terronex.panel, borderColor: terronex.border }}
        >
          <Chip size="small" label="ROWFlow" color="primary" variant="outlined" sx={{ mb: 1 }} />
          <Typography fontWeight={700} fontSize={13}>
            Import GeoJSON
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            *-rowflow.geojson → project map + parcel list
          </Typography>
          <Box
            sx={{
              height: 90,
              borderRadius: 1,
              bgcolor: terronex.panelAlt,
              border: `1px dashed ${terronex.border}`,
              p: 1,
              fontSize: 11,
              color: terronex.muted,
            }}
          >
            ✓ geometry preserved
            <br />
            ✓ owner / PIN / acreage
            <br />
            ✓ ready for PTS + offers
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

function FeaturePreview({ featureKey }: { featureKey: FeatureKey }) {
  const shot = SHOTS[featureKey];
  if (shot) {
    const titles: Record<FeatureKey, string> = {
      map: 'map · color-by + package layers',
      lifecycle: 'parcel · contacts + Create Take',
      matrix: 'project · matrix',
      team: 'project · people',
      analytics: 'project · overview',
      suite: 'suite · Tractsource → ROWScope → ROWFlow',
    };
    return (
      <MockChrome title={titles[featureKey]}>
        <Box
          component="img"
          src={shot.src}
          alt={shot.alt}
          sx={{
            display: 'block',
            width: '100%',
            height: 'auto',
            borderRadius: 1,
            border: `1px solid ${terronex.border}`,
          }}
        />
      </MockChrome>
    );
  }
  if (featureKey === 'matrix') {
    return (
      <MockChrome title="projects / Outblitz / edit · matrix">
        <MatrixMock />
      </MockChrome>
    );
  }
  return (
    <MockChrome title="projects / edit · roles & labor">
      <TeamMock />
    </MockChrome>
  );
}

export default function HomePage() {
  const [active, setActive] = useState<FeatureKey>('map');
  const activeMeta = useMemo(() => FEATURES.find((f) => f.key === active)!, [active]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: terronex.bg, color: terronex.text }}>
      {/* Nav */}
      <Box sx={{ borderBottom: `1px solid ${terronex.border}` }}>
        <Container
          maxWidth="lg"
          sx={{
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography component="span" fontWeight={700} letterSpacing="0.02em">
              ROWFlow
            </Typography>
            <Typography component="span" sx={{ color: terronex.muted, ml: 1, fontSize: 12, fontWeight: 500 }}>
              by Terronex
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button component={Link} href="https://tractsource.vercel.app" target="_blank" size="small" color="inherit">
              Tractsource
            </Button>
            <Button component={Link} href="/pricing" size="small" color="inherit">
              Pricing
            </Button>
            <Button component={Link} href="/terms" size="small" color="inherit">
              Terms
            </Button>
            <Button component={Link} href="/privacy" size="small" color="inherit">
              Privacy
            </Button>
            <ThemeToggle />
            <Button component={Link} href="/login" size="small" variant="outlined" color="inherit">
              Sign in
            </Button>
            <Button component={Link} href="/register" size="small" variant="contained">
              Create account
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Hero */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Chip
          label="Terronex suite · ROW + GIS"
          size="small"
          sx={{
            mb: 2,
            color: terronex.ok,
            borderColor: 'color-mix(in srgb, var(--tx-ok) 35%, transparent)',
            bgcolor: 'color-mix(in srgb, var(--tx-ok) 10%, transparent)',
          }}
          variant="outlined"
        />
        <Typography
          variant="h2"
          sx={{
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            fontSize: { xs: 32, md: 46 },
            lineHeight: 1.08,
            mb: 2,
            maxWidth: 780,
          }}
        >
          Right-of-way tracking built for the field — and the map.
        </Typography>
        <Typography sx={{ color: terronex.muted, fontSize: 18, mb: 3, maxWidth: '40em' }}>
          ROWFlow is the live tracker after the desk estimate. Import a corridor package, seed the
          budget from ROWScope, then contact, negotiate, and move status on the map.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
          <Button component={Link} href="/register" variant="contained" size="large">
            Create account
          </Button>
          <Button component={Link} href="/pricing" variant="outlined" size="large" color="inherit">
            Pro · $99/mo
          </Button>
          <Button component={Link} href="/login" size="large" color="inherit">
            Sign in
          </Button>
        </Stack>
        <Typography sx={{ color: terronex.faint, fontSize: 12, mb: 4 }}>
          Pro includes full projects, team seats, and Tractsource suite access. By continuing you
          agree to our Terms and Privacy Policy.
        </Typography>

        {/* Interactive product tour */}
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={4}>
            <Stack spacing={1}>
              {FEATURES.map((f) => {
                const selected = active === f.key;
                return (
                  <Paper
                    key={f.key}
                    component="button"
                    onClick={() => setActive(f.key)}
                    variant="outlined"
                    sx={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      p: 1.5,
                      bgcolor: selected ? terronex.accentSoft : terronex.panel,
                      borderColor: selected ? 'primary.main' : terronex.border,
                      color: 'inherit',
                      font: 'inherit',
                      transition: 'border-color 0.15s, background 0.15s',
                      '&:hover': {
                        borderColor: 'primary.light',
                        bgcolor: terronex.accentSoft,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Box sx={{ color: selected ? 'primary.light' : terronex.muted, mt: 0.25 }}>
                        {f.icon}
                      </Box>
                      <Box>
                        <Typography fontWeight={700} fontSize={14}>
                          {f.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: terronex.muted, mt: 0.35 }}>
                          {f.body}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="overline" sx={{ color: terronex.muted }}>
              Workspace · {activeMeta.title}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <FeaturePreview featureKey={active} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Live captures from project goode. Click a capability. Sign in for your projects.
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h5" fontWeight={700} sx={{ mt: 7, mb: 1, fontFamily: FONT_SERIF }}>
          What it looks like
        </Typography>
        <Typography sx={{ color: terronex.muted, mb: 2, maxWidth: '40em' }}>
          Live captures from project goode (100 Bedford tracts). Your project is the source of truth.
        </Typography>
        <Grid container spacing={2}>
          {GALLERY.map((g) => (
            <Grid item xs={12} sm={6} md={4} key={g.src}>
              <Paper
                variant="outlined"
                sx={{ overflow: 'hidden', bgcolor: terronex.panel, borderColor: terronex.border, height: '100%' }}
              >
                <Box
                  component="img"
                  src={g.src}
                  alt={g.label}
                  sx={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
                />
                <Box sx={{ p: 1.5 }}>
                  <Typography fontWeight={700} fontSize={14}>
                    {g.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: terronex.muted, mt: 0.4 }}>
                    {g.blurb}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Suite strip */}
      <Box sx={{ borderTop: `1px solid ${terronex.border}`, borderBottom: `1px solid ${terronex.border}`, py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontFamily: FONT_SERIF }}>
                One suite: Tractsource → ROWScope → ROWFlow
              </Typography>
              <Typography sx={{ color: terronex.muted, mb: 2 }}>
                Tractsource owns facts. ROWScope owns the first number. ROWFlow lives the number —
                negotiate, status, actuals vs seed. Pro is a suite seat.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label="Tractsource package" variant="outlined" />
                <Chip label="ROWScope seed" variant="outlined" />
                <Chip label="No auto offers" variant="outlined" />
                <Chip label="$99/mo Pro seat" color="primary" variant="outlined" />
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack spacing={1.5}>
                {[
                  'Extract corridor package in Tractsource',
                  'Freeze take + budget in ROWScope, download seed',
                  'Import package then seed — agents still Create Take',
                ].map((step, i) => (
                  <Paper
                    key={step}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'center',
                      bgcolor: terronex.panelAlt,
                      borderColor: terronex.border,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: terronex.accentSoft,
                        color: 'primary.main',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="body2">{step}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing teaser */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontFamily: FONT_SERIF }}>
          Simple pricing
        </Typography>
        <Typography sx={{ color: terronex.muted, mb: 3 }}>
          Pro is a flat <strong style={{ color: terronex.text }}>$99/month</strong> —
          projects, team, Activity, Scope seed, and suite access including Tractsource.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <Button component={Link} href="/pricing" variant="contained" size="large">
            See pricing
          </Button>
          <Button component={Link} href="/register" variant="outlined" size="large" color="inherit">
            Create account
          </Button>
        </Stack>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: `1px solid ${terronex.border}`, py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography fontWeight={700}>ROWFlow</Typography>
              <Typography variant="body2" sx={{ color: terronex.muted }}>
                A Terronex LLC product · right-of-way acquisition software
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" sx={{ color: terronex.muted }}>
                <Link href="/pricing" style={{ color: 'inherit' }}>
                  Pricing
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ color: terronex.muted }}>
                <a href="https://tractsource.vercel.app" style={{ color: 'inherit' }}>
                  Tractsource
                </a>
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" sx={{ color: terronex.muted }}>
                support@terronex.dev
              </Typography>
              <Typography variant="body2" sx={{ color: terronex.muted }}>
                <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
                {' · '}
                <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
              </Typography>
              <Typography variant="body2" sx={{ color: terronex.faint }}>
                © {new Date().getFullYear()} Terronex LLC
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
