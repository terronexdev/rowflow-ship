'use client';

import { Box, Chip, IconButton, Typography, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import NextLink from 'next/link';
import { PERMIT_STATUS_OPTIONS } from '@/lib/constants';
import { GisDisclaimer } from '@/components/legal/GisDisclaimer';
import {
  ANN_LAYER_KIND,
  annGroupKey,
  featuresFromLayerData,
  type MapFeatureRow,
} from '@/lib/map/annotations';

export default function ProjectFeaturesPanel({
  layers,
  hiddenTypes,
  hiddenIds,
  onToggleType,
  onToggleId,
  onJump,
  projectId,
  permits = [],
}: {
  layers: Array<{ kind: string; data?: any }>;
  hiddenTypes: string[];
  hiddenIds: string[];
  onToggleType: (t: string) => void;
  onToggleId: (id: string) => void;
  onJump: (row: MapFeatureRow) => void;
  projectId?: string;
  permits?: Array<{ id: string; name: string; status: string; permitType: string }>;
}) {
  const permitById = new Map(permits.map((p) => [p.id, p]));
  const permitStatusLabel = (status: string) =>
    PERMIT_STATUS_OPTIONS.find((o) => o.value === status)?.label || status.replaceAll('_', ' ');
  const layer = layers.find((l) => l.kind === ANN_LAYER_KIND);
  const rows = featuresFromLayerData(layer?.data);
  const groups = new Map<string, { label: string; rows: MapFeatureRow[] }>();
  for (const r of rows) {
    const k = annGroupKey(r.annType);
    const g = groups.get(k);
    if (g) g.rows.push(r);
    else groups.set(k, { label: r.annType, rows: [r] });
  }
  const grouped = [...groups.entries()]
    .map(([key, g]) => ({ key, ...g }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (!rows.length) {
    return (
      <Box sx={{ p: 3, maxWidth: 560 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Features
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No map notes yet. On the map, open Tools, drop a marker or draw a rectangle, and save a
          group (RR, DOT, Crossing, Well — or type your own).
        </Typography>
        <Box sx={{ mt: 2 }}>
          <GisDisclaimer dense />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Features
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Eye on a group hides all of that type. Eye on a row hides one note. Jump flies to it.
      </Typography>
      <Box sx={{ mb: 2 }}>
        <GisDisclaimer dense />
      </Box>
      {grouped.map((g) => {
        const hidden = hiddenTypes.includes(g.key);
        return (
          <Box key={g.key} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography variant="overline" sx={{ letterSpacing: '0.08em', flex: 1 }}>
                {g.label} · {g.rows.length}
              </Typography>
              <Tooltip title={hidden ? `Show ${g.label}` : `Hide ${g.label}`}>
                <IconButton
                  size="small"
                  onClick={() => onToggleType(g.key)}
                  aria-label={`Toggle ${g.label}`}
                >
                  {hidden ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
            {g.rows.map((row) => {
              const rowHidden = hidden || hiddenIds.includes(row.id);
              return (
                <Box
                  key={row.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    px: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    opacity: rowHidden ? 0.45 : 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: row.color,
                      border: '1px solid rgba(255,255,255,0.35)',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 500 }} title={row.label}>
                    {row.label}
                  </Typography>
                  {row.permitId && permitById.get(row.permitId) ? (
                    <Chip
                      size="small"
                      component={projectId ? NextLink : 'span'}
                      href={projectId ? `/projects/${projectId}/permits/${row.permitId}` : undefined}
                      clickable={Boolean(projectId)}
                      label={permitStatusLabel(permitById.get(row.permitId)!.status)}
                      sx={{ textTransform: 'none' }}
                    />
                  ) : null}
                  <Tooltip title={hiddenIds.includes(row.id) ? 'Show this note' : 'Hide this note'}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleId(row.id)}
                      aria-label={`Toggle ${row.label}`}
                    >
                      {hiddenIds.includes(row.id) ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Show on map">
                    <span>
                      <IconButton
                        size="small"
                        disabled={!row.latlng}
                        onClick={() => onJump(row)}
                        aria-label={`Jump to ${row.label}`}
                      >
                        <MyLocationIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
