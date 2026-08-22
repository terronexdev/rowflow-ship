'use client';

import { Box, LinearProgress, Paper, Typography, Stack, Chip } from '@mui/material';
import { STATUS_COLORS } from '@/lib/constants/status';

type Breakdown = Record<string, number>;

function topBuckets(breakdown: Breakdown, max = 4): Array<{ key: string; count: number; color: string }> {
  const entries = Object.entries(breakdown || {}).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, max);
  const rest = entries.slice(max).reduce((s, [, c]) => s + c, 0);
  const rows = top.map(([key, count]) => ({
    key,
    count,
    color: STATUS_COLORS[key] || '#757575',
  }));
  if (rest > 0) rows.push({ key: 'OTHER', count: rest, color: '#616161' });
  return rows;
}

function GlanceRow({ title, breakdown, total }: { title: string; breakdown: Breakdown; total: number }) {
  const rows = topBuckets(breakdown);
  const sum = rows.reduce((s, r) => s + r.count, 0) || total || 1;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', height: 12, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover', mb: 1 }}>
        {rows.map((r) => (
          <Box
            key={r.key}
            title={`${r.key}: ${r.count}`}
            sx={{
              width: `${(r.count / sum) * 100}%`,
              bgcolor: r.color,
              minWidth: r.count > 0 ? 2 : 0,
            }}
          />
        ))}
      </Box>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {rows.map((r) => (
          <Chip
            key={r.key}
            size="small"
            label={`${r.key.replaceAll('_', ' ')} ${r.count}`}
            sx={{ bgcolor: `${r.color}33`, borderColor: r.color }}
            variant="outlined"
          />
        ))}
      </Stack>
      {total > 0 && (
        <LinearProgress
          variant="determinate"
          value={Math.min(100, ((breakdown.ACQUIRED || breakdown.GRANTED || breakdown.COMPLETE || 0) / total) * 100)}
          sx={{ mt: 1, height: 4, borderRadius: 1, opacity: 0.5 }}
        />
      )}
    </Box>
  );
}

export default function StatusGlanceBars({
  total,
  statusBreakdown,
  ptsBreakdown,
  titleBreakdown,
  acquisitionBreakdown,
}: {
  total: number;
  statusBreakdown: Breakdown;
  ptsBreakdown: Breakdown;
  titleBreakdown: Breakdown;
  acquisitionBreakdown: Breakdown;
}) {
  if (!total) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Status at a glance
        </Typography>
        <Typography color="text.secondary">No parcels yet.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Status at a glance
      </Typography>
      <GlanceRow title="Overall" breakdown={statusBreakdown} total={total} />
      <GlanceRow title="PTS" breakdown={ptsBreakdown} total={total} />
      <GlanceRow title="Title" breakdown={titleBreakdown} total={total} />
      <GlanceRow title="Acquisition" breakdown={acquisitionBreakdown} total={total} />
    </Paper>
  );
}
