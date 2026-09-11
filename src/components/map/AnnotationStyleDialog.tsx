'use client';

import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import {
  ANN_COLORS,
  ANN_GROUP_SUGGESTIONS,
  DEFAULT_ANN,
  MARKER_STYLES,
  defaultGroupForGeometry,
  defaultMarkerForGroup,
  isCrossingPermitGroup,
  normalizeAnnotationStyle,
  type AnnotationStyle,
  type MarkerStyle,
} from '@/lib/map/annotations';

export default function AnnotationStyleDialog({
  open,
  geometry,
  initial,
  existingGroups = [],
  onConfirm,
  onCancel,
}: {
  open: boolean;
  geometry: 'point' | 'area' | 'line';
  initial?: Partial<AnnotationStyle> | null;
  existingGroups?: string[];
  onConfirm: (style: AnnotationStyle) => void;
  onCancel: () => void;
}) {
  const [style, setStyle] = useState<AnnotationStyle>(DEFAULT_ANN);

  const groupOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const g of [...existingGroups, ...ANN_GROUP_SUGGESTIONS]) {
      const t = String(g || '').trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }, [existingGroups]);

  useEffect(() => {
    if (!open) return;
    const next = normalizeAnnotationStyle(initial);
    if (!initial?.annType) {
      next.annType = defaultGroupForGeometry(geometry);
    }
    if (!initial?.markerStyle) {
      next.markerStyle = defaultMarkerForGroup(next.annType);
    }
    if (geometry === 'area' && initial?.hatch == null && /septic|drain|wetland/i.test(next.annType)) {
      next.hatch = true;
    }
    next.neededPermit = isCrossingPermitGroup(next.annType);
    setStyle(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog opens
  }, [open]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Map note</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
        <TextField
          autoFocus
          label="Label"
          placeholder={geometry === 'point' ? 'Water well' : 'Septic drain'}
          value={style.label}
          onChange={(e) => setStyle((s) => ({ ...s, label: e.target.value }))}
          size="small"
          fullWidth
        />
        <Autocomplete
          freeSolo
          options={groupOptions}
          value={style.annType}
          onChange={(_e, v) => {
            const nextGroup = typeof v === 'string' ? v : '';
            setStyle((s) => ({
              ...s,
              annType: nextGroup,
              markerStyle: defaultMarkerForGroup(nextGroup),
              neededPermit: isCrossingPermitGroup(nextGroup),
            }));
          }}
          onInputChange={(_e, v, reason) => {
            if (reason === 'input') {
              setStyle((s) => ({
                ...s,
                annType: v,
                neededPermit: isCrossingPermitGroup(v),
              }));
            }
          }}
          renderInput={(params) => (
            <TextField {...params} size="small" label="Group" placeholder="Well, Hydrant, Valve…" />
          )}
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={Boolean(style.neededPermit)}
              onChange={(e) => setStyle((s) => ({ ...s, neededPermit: e.target.checked }))}
            />
          }
          label="Job permit (no parcel) — RR / DOT / crossing"
        />
        <Box>
          <Typography variant="caption" color="text.secondary">
            Color
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            {ANN_COLORS.map((c) => (
              <Box
                key={c.id}
                component="button"
                type="button"
                aria-label={c.id}
                onClick={() => setStyle((s) => ({ ...s, color: c.hex }))}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: c.hex,
                  border: style.color === c.hex ? '2px solid #fff' : '2px solid transparent',
                  outline: style.color === c.hex ? '2px solid var(--tx-accent)' : '1px solid var(--tx-border)',
                  cursor: 'pointer',
                  p: 0,
                }}
              />
            ))}
          </Box>
        </Box>
        {geometry === 'point' ? (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Marker
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={style.markerStyle}
              onChange={(_e, v: MarkerStyle | null) => {
                if (v) setStyle((s) => ({ ...s, markerStyle: v }));
              }}
              sx={{ mt: 0.5, display: 'flex' }}
            >
              {MARKER_STYLES.map((m) => (
                <ToggleButton key={m} value={m} sx={{ textTransform: 'none', flex: 1 }}>
                  {m}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        ) : null}
        {geometry === 'area' ? (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Fill
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={style.hatch ? 'hatch' : 'solid'}
              onChange={(_e, v: string | null) => {
                if (v) setStyle((s) => ({ ...s, hatch: v === 'hatch' }));
              }}
              sx={{ mt: 0.5 }}
            >
              <ToggleButton value="solid" sx={{ textTransform: 'none' }}>
                Solid
              </ToggleButton>
              <ToggleButton value="hatch" sx={{ textTransform: 'none' }}>
                Hatch
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => onConfirm(normalizeAnnotationStyle(style))} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
