'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  ENCROACHMENT_DISPOSITION_OPTIONS,
  ENCROACHMENT_RESPONSIBILITY_OPTIONS,
  ENCROACHMENT_TYPE_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from '@/lib/parcels/encroachments';
import { ENCROACHMENT_STATUSES } from '@/lib/constants/status';

type Item = {
  id: string;
  encroachmentType: string;
  description?: string | null;
  locationNote?: string | null;
  disposition: string;
  inPermanentEasement?: string;
  inTce?: string;
  ownerResponsibility?: string;
  agreementRef?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  costNotes?: string | null;
  identifiedDate?: string | null;
  resolvedDate?: string | null;
  notes?: string | null;
};

const emptyForm = () => ({
  encroachmentType: 'OTHER',
  description: '',
  locationNote: '',
  disposition: 'IDENTIFIED',
  inPermanentEasement: 'UNKNOWN',
  inTce: 'UNKNOWN',
  ownerResponsibility: 'UNKNOWN',
  agreementRef: '',
  estimatedCost: '',
  actualCost: '',
  costNotes: '',
  identifiedDate: '',
  resolvedDate: '',
  notes: '',
});

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function EncroachmentsPanel({
  parcelId,
  status,
  onStatusChange,
  onSaved,
}: {
  parcelId: string;
  status: string;
  onStatusChange: (v: string) => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [totals, setTotals] = useState({ estimatedCost: 0, actualCost: 0, count: 0 });
  const [suggested, setSuggested] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/encroachments`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load encroachments');
      setItems(data.items || []);
      setTotals(data.totals || { estimatedCost: 0, actualCost: 0, count: 0 });
      setSuggested(data.suggestedStatus || null);
      if (data.encroachmentStatus) onStatusChange(data.encroachmentStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [parcelId, onStatusChange]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStatus = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encroachmentStatus: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save status');
      setMsg('Encroachment status saved');
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const applySuggested = async () => {
    if (!suggested) return;
    onStatusChange(suggested);
    setBusy(true);
    try {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encroachmentStatus: suggested }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg(`Status set from items → ${suggested.replaceAll('_', ' ')}`);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const createItem = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/encroachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encroachmentType: form.encroachmentType,
          description: form.description || null,
          locationNote: form.locationNote || null,
          disposition: form.disposition,
          inPermanentEasement: form.inPermanentEasement,
          inTce: form.inTce,
          ownerResponsibility: form.ownerResponsibility,
          agreementRef: form.agreementRef || null,
          estimatedCost: form.estimatedCost === '' ? null : Number(form.estimatedCost),
          actualCost: form.actualCost === '' ? null : Number(form.actualCost),
          costNotes: form.costNotes || null,
          identifiedDate: form.identifiedDate || null,
          resolvedDate: form.resolvedDate || null,
          notes: form.notes || null,
          applyStatusRollup: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      if (data.encroachmentStatus) onStatusChange(data.encroachmentStatus);
      setShowForm(false);
      setForm(emptyForm());
      setMsg('Encroachment added');
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const updateDisposition = async (id: string, disposition: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/encroachments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disposition, applyStatusRollup: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.encroachmentStatus) onStatusChange(data.encroachmentStatus);
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm('Delete this encroachment record?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/encroachments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.encroachmentStatus) onStatusChange(data.encroachmentStatus);
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {msg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg(null)}>
          {msg}
        </Alert>
      )}

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Section status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {ENCROACHMENT_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item>
          <Button variant="outlined" size="small" disabled={busy} onClick={saveStatus}>
            Save status
          </Button>
        </Grid>
        {suggested && suggested !== status && (
          <Grid item>
            <Button size="small" disabled={busy} onClick={applySuggested}>
              Set from items ({suggested.replaceAll('_', ' ')})
            </Button>
          </Grid>
        )}
      </Grid>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
        <Chip size="small" label={`${totals.count} item${totals.count === 1 ? '' : 's'}`} />
        <Chip size="small" variant="outlined" label={`Est ${money(totals.estimatedCost)}`} />
        <Chip size="small" variant="outlined" label={`Actual ${money(totals.actualCost)}`} />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Track physical/use conflicts (shed, driveway, septic, etc.). Disposition is per item; section
        status is the tract rollup (worst open: needs removal &gt; identified &gt; can remain &gt;
        removed). Photos and survey files go in notes/docs below.
      </Typography>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No encroachment items yet. Set status to None/clear if reviewed with nothing found.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {items.map((it) => {
            const open = expandedId === it.id;
            return (
              <Box
                key={it.id}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography fontWeight={600}>
                      {it.encroachmentType.replaceAll('_', ' ')}
                      {it.description ? ` · ${it.description}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {it.disposition.replaceAll('_', ' ')}
                      {it.estimatedCost != null ? ` · est ${money(it.estimatedCost)}` : ''}
                      {it.locationNote ? ` · ${it.locationNote}` : ''}
                    </Typography>
                    <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
                      {it.inPermanentEasement === 'YES' && (
                        <Chip size="small" label="In PE" color="warning" variant="outlined" />
                      )}
                      {it.inTce === 'YES' && (
                        <Chip size="small" label="In TCE" variant="outlined" />
                      )}
                      {it.ownerResponsibility && it.ownerResponsibility !== 'UNKNOWN' && (
                        <Chip
                          size="small"
                          label={it.ownerResponsibility.replaceAll('_', ' ')}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                    <TextField
                      select
                      size="small"
                      label="Disposition"
                      value={it.disposition}
                      onChange={(e) => void updateDisposition(it.id, e.target.value)}
                      sx={{ minWidth: 150 }}
                      disabled={busy}
                    >
                      {ENCROACHMENT_DISPOSITION_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <IconButton size="small" onClick={() => setExpandedId(open ? null : it.id)}>
                      {open ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={busy}
                      onClick={() => void removeItem(it.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {open && (
                  <Box sx={{ mt: 1.5 }}>
                    {it.notes && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Notes: {it.notes}
                      </Typography>
                    )}
                    {it.costNotes && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Cost notes: {it.costNotes}
                      </Typography>
                    )}
                    {it.agreementRef && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Agreement: {it.agreementRef}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Actual {money(it.actualCost)}
                      {it.resolvedDate
                        ? ` · resolved ${new Date(it.resolvedDate).toLocaleDateString()}`
                        : ''}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setShowForm((v) => !v)}
        sx={{ mb: 2 }}
      >
        {showForm ? 'Cancel' : 'Add encroachment'}
      </Button>

      {showForm && (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type"
                value={form.encroachmentType}
                onChange={(e) => setForm({ ...form, encroachmentType: e.target.value })}
              >
                {ENCROACHMENT_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Disposition"
                value={form.disposition}
                onChange={(e) => setForm({ ...form, disposition: e.target.value })}
              >
                {ENCROACHMENT_DISPOSITION_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Responsibility"
                value={form.ownerResponsibility}
                onChange={(e) => setForm({ ...form, ownerResponsibility: e.target.value })}
              >
                {ENCROACHMENT_RESPONSIBILITY_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Location / station"
                value={form.locationNote}
                onChange={(e) => setForm({ ...form, locationNote: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="In PE"
                value={form.inPermanentEasement}
                onChange={(e) => setForm({ ...form, inPermanentEasement: e.target.value })}
              >
                {YES_NO_UNKNOWN_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="In TCE"
                value={form.inTce}
                onChange={(e) => setForm({ ...form, inTce: e.target.value })}
              >
                {YES_NO_UNKNOWN_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Est. cost $"
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Actual cost $"
                value={form.actualCost}
                onChange={(e) => setForm({ ...form, actualCost: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Agreement / condition ref"
                value={form.agreementRef}
                onChange={(e) => setForm({ ...form, agreementRef: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Cost notes"
                value={form.costNotes}
                onChange={(e) => setForm({ ...form, costNotes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Grid>
          </Grid>
          <Button sx={{ mt: 2 }} variant="contained" disabled={busy} onClick={createItem}>
            Save encroachment
          </Button>
        </Box>
      )}
    </Box>
  );
}
