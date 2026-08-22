'use client';

import {
  Alert,
  Button,
  Chip,
  Paper,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type SchedulePhaseRow = {
  id: string;
  projectId: string;
  projectName: string;
  track: string;
  phaseKey: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  health: string;
  isPastDue: boolean;
  isComplete?: boolean;
  daysToEnd?: number | null;
  daysLate?: number | null;
};

const healthColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  LATE: 'error',
  NOT_STARTED: 'default',
  COMPLETE: 'info',
};

function daysLabel(ph: SchedulePhaseRow) {
  if (ph.health === 'COMPLETE') return 'Done';
  if (ph.daysLate != null && ph.daysLate > 0) return `${ph.daysLate}d late`;
  if (ph.daysToEnd != null) return ph.daysToEnd === 0 ? 'Due today' : `${ph.daysToEnd}d left`;
  return '—';
}

export default function ScheduleHealthPanel({
  counts,
  phases,
  showExportHint,
}: {
  counts: { complete: number; late: number; atRisk: number; onTrack: number; notStarted: number };
  phases: SchedulePhaseRow[];
  showExportHint?: boolean;
}) {
  const chartData = [
    { name: 'Complete', value: counts.complete || 0 },
    { name: 'On track', value: counts.onTrack || 0 },
    { name: 'At risk', value: counts.atRisk || 0 },
    { name: 'Late', value: counts.late || 0 },
    { name: 'Not started', value: counts.notStarted || 0 },
  ];

  const sorted = [...(phases || [])].sort((a, b) => {
    const rank = (h: string) =>
      h === 'LATE' ? 0 : h === 'AT_RISK' ? 1 : h === 'ON_TRACK' ? 2 : h === 'COMPLETE' ? 4 : 3;
    return rank(a.health) - rank(b.health);
  });

  // Portfolio: one row per project (worst health)
  const byProject = new Map<
    string,
    { projectId: string; projectName: string; health: string; late: number; atRisk: number; nextEnd: string | null }
  >();
  for (const ph of phases || []) {
    const cur = byProject.get(ph.projectId) || {
      projectId: ph.projectId,
      projectName: ph.projectName,
      health: 'UNKNOWN',
      late: 0,
      atRisk: 0,
      nextEnd: null as string | null,
    };
    if (ph.health === 'LATE') cur.late += 1;
    if (ph.health === 'AT_RISK') cur.atRisk += 1;
    const rank = (h: string) =>
      h === 'LATE' ? 0 : h === 'AT_RISK' ? 1 : h === 'ON_TRACK' ? 2 : h === 'COMPLETE' ? 4 : 3;
    if (cur.health === 'UNKNOWN' || rank(ph.health) < rank(cur.health)) {
      cur.health = ph.health === 'NOT_STARTED' && cur.health !== 'UNKNOWN' ? cur.health : ph.health;
      if (ph.health === 'LATE' || ph.health === 'AT_RISK' || ph.health === 'ON_TRACK') {
        cur.health = ph.health === 'LATE' || cur.health === 'LATE'
          ? (cur.late > 0 || ph.health === 'LATE' ? 'LATE' : cur.health)
          : ph.health === 'AT_RISK' || cur.atRisk > 0
            ? (cur.late > 0 ? 'LATE' : 'AT_RISK')
            : ph.health;
      }
    }
    if (ph.endDate && ph.health !== 'COMPLETE') {
      if (!cur.nextEnd || ph.endDate < cur.nextEnd) cur.nextEnd = ph.endDate;
    }
    byProject.set(ph.projectId, cur);
  }
  // Recompute project health cleanly
  for (const [id, row] of byProject) {
    if (row.late > 0) row.health = 'LATE';
    else if (row.atRisk > 0) row.health = 'AT_RISK';
    else {
      const anyOnTrack = (phases || []).some(
        (p) => p.projectId === id && (p.health === 'ON_TRACK' || p.health === 'COMPLETE')
      );
      row.health = anyOnTrack ? 'ON_TRACK' : 'UNKNOWN';
    }
  }
  const portfolio = Array.from(byProject.values()).sort((a, b) => {
    const rank = (h: string) =>
      h === 'LATE' ? 0 : h === 'AT_RISK' ? 1 : h === 'ON_TRACK' ? 2 : 3;
    return rank(a.health) - rank(b.health);
  });

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Schedule health
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Plan dates vs today. AT risk = end within 14 days. Past end = late unless marked complete.
        {showExportHint ? ' Export schedule CSV from Project Edit → Reporting.' : ''}
      </Typography>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" name="Phases" fill="#ffb74d" />
        </BarChart>
      </ResponsiveContainer>

      {portfolio.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Projects (worst first)
          </Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Health</TableCell>
                <TableCell align="right">Late</TableCell>
                <TableCell align="right">At risk</TableCell>
                <TableCell>Next end</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.map((row) => (
                <TableRow key={row.projectId} selected={row.health === 'LATE'}>
                  <TableCell>{row.projectName}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.health.replaceAll('_', ' ')}
                      color={healthColor[row.health] || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{row.late}</TableCell>
                  <TableCell align="right">{row.atRisk}</TableCell>
                  <TableCell>
                    {row.nextEnd ? new Date(row.nextEnd).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" href={`/projects/${row.projectId}/report`}>
                      Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {sorted.length === 0 ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          No schedule phases. They seed when you create a project (or add on Project Edit).
        </Alert>
      ) : (
        <>
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
            Phases (late first)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Track</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Timing</TableCell>
                <TableCell>Health</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.slice(0, 40).map((ph) => (
                <TableRow key={ph.id} selected={ph.isPastDue}>
                  <TableCell>{ph.projectName}</TableCell>
                  <TableCell>{ph.track}</TableCell>
                  <TableCell>{ph.label}</TableCell>
                  <TableCell>
                    {ph.endDate ? new Date(ph.endDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>{daysLabel(ph)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={ph.health.replaceAll('_', ' ')}
                      color={healthColor[ph.health] || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Paper>
  );
}
