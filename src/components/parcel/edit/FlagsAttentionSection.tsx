'use client';

import {
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import { SummaryLine, SChip } from '@/components/parcel/sectionSummary';
import { PARCEL_LABEL_OPTIONS, PARCEL_LABEL_SHORT, PARCEL_PRIORITY_OPTIONS } from '@/lib/constants';

export default function FlagsAttentionSection({
  parcelId,
  priority,
  setPriority,
  bookmarked,
  setBookmarked,
  selectedLabels,
  setSelectedLabels,
  labelsBusy,
  setLabelsBusy,
  saving,
  setSaveError,
  setSaveSuccess,
  onSaved,
}: {
  parcelId: string;
  priority: string;
  setPriority: (v: string) => void;
  bookmarked: boolean;
  setBookmarked: (fn: (b: boolean) => boolean) => void;
  selectedLabels: Record<string, string>;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  labelsBusy: boolean;
  setLabelsBusy: (v: boolean) => void;
  saving: boolean;
  setSaveError: (v: string | null) => void;
  setSaveSuccess: (v: string | null) => void;
  onSaved: () => void;
}) {
  return (
    <CollapsibleSection
      id="flags-attention"
      title="Flags & attention"
      defaultOpen={Object.keys(selectedLabels).length > 0 || bookmarked || priority !== 'NORMAL'}
      summary={
        <SummaryLine>
          <SChip label={bookmarked ? 'Bookmarked' : 'Not pinned'} />
          <SChip label={`Priority: ${priority}`} />
          <SChip
            label={
              Object.keys(selectedLabels).length
                ? `Labels: ${Object.keys(selectedLabels)
                    .map((c) => PARCEL_LABEL_SHORT[c] || c)
                    .join(' · ')}`
                : 'No labels'
            }
            fill
          />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Constraint labels hatch on the map in every Color-by mode. Bookmark pins this tract for the
        whole project (sorts to top). Priority is severity, separate from the pin.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PARCEL_PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant={bookmarked ? 'contained' : 'outlined'}
            color={bookmarked ? 'warning' : 'inherit'}
            onClick={() => setBookmarked((b) => !b)}
          >
            {bookmarked ? 'Bookmarked' : 'Bookmark parcel'}
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Constraint labels
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {PARCEL_LABEL_OPTIONS.map((opt) => {
              const on = opt.value in selectedLabels;
              return (
                <Chip
                  key={opt.value}
                  label={`${opt.short} · ${opt.label}`}
                  color={on ? 'primary' : 'default'}
                  variant={on ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedLabels((prev) => {
                      const next = { ...prev };
                      if (opt.value in next) delete next[opt.value];
                      else next[opt.value] = '';
                      return next;
                    });
                  }}
                />
              );
            })}
          </Box>
        </Grid>
        {Object.keys(selectedLabels).map((code) => (
          <Grid item xs={12} md={6} key={code}>
            <TextField
              fullWidth
              size="small"
              label={`Note · ${PARCEL_LABEL_OPTIONS.find((o) => o.value === code)?.label || code}`}
              value={selectedLabels[code] || ''}
              onChange={(e) =>
                setSelectedLabels((prev) => ({ ...prev, [code]: e.target.value }))
              }
              placeholder="e.g. CSX mainline, TNC Book 12/45"
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={labelsBusy || saving}
            onClick={async () => {
              setLabelsBusy(true);
              setSaveError(null);
              setSaveSuccess(null);
              try {
                const patchRes = await fetch(`/api/parcels/${parcelId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bookmarked, priority }),
                });
                const patchData = await patchRes.json();
                if (!patchRes.ok) throw new Error(patchData.error || 'Failed to save attention');

                const labelsRes = await fetch(`/api/parcels/${parcelId}/labels`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    labels: Object.entries(selectedLabels).map(([code, note]) => ({
                      code,
                      note: note || null,
                    })),
                  }),
                });
                const labelsData = await labelsRes.json();
                if (!labelsRes.ok) throw new Error(labelsData.error || 'Failed to save labels');
                onSaved();
                setSaveSuccess('Flags & attention saved.');
              } catch (e: any) {
                setSaveError(e.message || 'Failed to save flags');
              } finally {
                setLabelsBusy(false);
              }
            }}
          >
            {labelsBusy ? 'Saving…' : 'Save flags & attention'}
          </Button>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
}
