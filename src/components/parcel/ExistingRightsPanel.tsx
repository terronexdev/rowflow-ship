'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  EXISTING_RIGHT_FLAG_OPTIONS,
  EXISTING_RIGHT_IMPACT_OPTIONS,
  EXISTING_RIGHT_LIFE_OPTIONS,
  EXISTING_RIGHT_PURPOSE_OPTIONS,
  EXISTING_RIGHT_TYPE_OPTIONS,
} from '@/lib/parcels/existingRights';
import { EXISTING_RIGHTS_STATUSES, PARCEL_CLASS_OPTIONS } from '@/lib/constants/status';

type Right = {
  id: string;
  instrumentNumber?: string | null;
  name?: string | null;
  rightType: string;
  purpose: string;
  grantor?: string | null;
  grantee?: string | null;
  county?: string | null;
  recordingBook?: string | null;
  recordingPage?: string | null;
  recordingInstrument?: string | null;
  recordingDate?: string | null;
  widthFeet?: number | null;
  widthNotes?: string | null;
  termNotes?: string | null;
  lifeStatus: string;
  restrictionFlags?: string[];
  restrictionsNote?: string | null;
  notes?: string | null;
  parcelCount?: number;
  parcels?: Array<{ parcelId: string; pin?: string | null; impact?: string }>;
};

type Linked = {
  linkId: string;
  impact: string;
  note?: string | null;
  right: Right;
};

const emptyForm = () => ({
  instrumentNumber: '',
  name: '',
  rightType: 'EASEMENT',
  purpose: 'OTHER',
  grantor: '',
  grantee: '',
  county: '',
  recordingBook: '',
  recordingPage: '',
  recordingInstrument: '',
  recordingDate: '',
  widthFeet: '',
  widthNotes: '',
  termNotes: '',
  lifeStatus: 'ACTIVE',
  restrictionFlags: [] as string[],
  restrictionsNote: '',
  notes: '',
  impact: 'UNKNOWN',
});

export default function ExistingRightsPanel({
  projectId,
  parcelId,
  status,
  onStatusChange,
  parcelClass,
  onParcelClassChange,
  onSaved,
}: {
  projectId: string;
  parcelId: string;
  status: string;
  onStatusChange: (v: string) => void;
  parcelClass: string;
  onParcelClassChange: (v: string) => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [linked, setLinked] = useState<Linked[]>([]);
  const [catalog, setCatalog] = useState<Right[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [linkId, setLinkId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/existing-rights`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load existing rights');
      setLinked(data.linked || []);
      setCatalog(data.catalog || []);
      if (data.existingRightsStatus) onStatusChange(data.existingRightsStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [parcelId, onStatusChange]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFlag = (code: string) => {
    setForm((f) => ({
      ...f,
      restrictionFlags: f.restrictionFlags.includes(code)
        ? f.restrictionFlags.filter((c) => c !== code)
        : [...f.restrictionFlags, code],
    }));
  };

  const saveStatus = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingRightsStatus: status,
          parcelClass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save status');
      setMsg('Parcel class & existing rights status saved');
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const createOrLink = async () => {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/existing-rights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrumentNumber: form.instrumentNumber || null,
          name: form.name || null,
          rightType: form.rightType,
          purpose: form.purpose,
          grantor: form.grantor || null,
          grantee: form.grantee || null,
          county: form.county || null,
          recordingBook: form.recordingBook || null,
          recordingPage: form.recordingPage || null,
          recordingInstrument: form.recordingInstrument || null,
          recordingDate: form.recordingDate || null,
          widthFeet: form.widthFeet === '' ? null : Number(form.widthFeet),
          widthNotes: form.widthNotes || null,
          termNotes: form.termNotes || null,
          lifeStatus: form.lifeStatus,
          restrictionFlags: form.restrictionFlags,
          restrictionsNote: form.restrictionsNote || null,
          notes: form.notes || null,
          parcelId,
          impact: form.impact,
          linkIfMatch: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMsg(data.message || (data.linkedExisting ? 'Linked to existing instrument' : 'Instrument created'));
      setShowForm(false);
      setForm(emptyForm());
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const linkExisting = async () => {
    if (!linkId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/existing-rights/${linkId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcelId, impact: 'UNKNOWN' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link');
      setMsg('Linked instrument to this parcel');
      setLinkId('');
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const unlink = async (existingRightId: string) => {
    if (!window.confirm('Unlink this instrument from this parcel? (Does not delete the project instrument.)')) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/existing-rights`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingRightId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlink');
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteInstrument = async (rightId: string) => {
    if (
      !window.confirm(
        'Delete this instrument from the entire project? It will be removed from all linked parcels.'
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/existing-rights/${rightId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const linkedIds = new Set(linked.map((l) => l.right.id));
  const linkable = catalog.filter((c) => !linkedIds.has(c.id));

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
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Parcel class"
            value={parcelClass}
            onChange={(e) => onParcelClassChange(e.target.value)}
            helperText="Why this tract is on the job"
          >
            {PARCEL_CLASS_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Existing rights status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            helperText="Rights strategy outcome"
          >
            {EXISTING_RIGHTS_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item>
          <Button variant="outlined" size="small" disabled={busy} onClick={saveStatus}>
            Save class & status
          </Button>
        </Grid>
      </Grid>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        <strong>Greenfield</strong> — full new rights. <strong>Brownfield</strong> — existing
        agreement may cover some/all (may need supplement). <strong>3rd party</strong> — access /
        staging off centerline. Instruments are project-wide; same easement # links one right across
        split parcels. Map highlights linked tracts.
      </Typography>

      {linked.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No existing rights linked to this parcel yet.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {linked.map((l) => {
            const r = l.right;
            const open = expandedId === r.id;
            const otherPins = (r.parcels || [])
              .filter((p) => p.parcelId !== parcelId)
              .map((p) => p.pin || '—');
            const flags = r.restrictionFlags || [];
            return (
              <Box
                key={l.linkId}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography fontWeight={600}>
                      {r.instrumentNumber ? `#${r.instrumentNumber}` : r.name || 'Untitled'}
                      {r.name && r.instrumentNumber ? ` · ${r.name}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.rightType.replaceAll('_', ' ')} · {r.purpose.replaceAll('_', ' ')} ·{' '}
                      {r.lifeStatus}
                      {r.widthFeet != null ? ` · ${r.widthFeet}'` : ''}
                      {otherPins.length ? ` · also on ${otherPins.join(', ')}` : ''}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
                      {flags.map((f) => (
                        <Chip key={f} size="small" label={f.replaceAll('_', ' ')} variant="outlined" />
                      ))}
                      {r.grantor && <Chip size="small" label={`Grantor: ${r.grantor}`} />}
                      {r.grantee && <Chip size="small" label={`Grantee: ${r.grantee}`} />}
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                    <IconButton size="small" onClick={() => setExpandedId(open ? null : r.id)}>
                      {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Button size="small" onClick={() => unlink(r.id)} disabled={busy}>
                      Unlink
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteInstrument(r.id)}
                      disabled={busy}
                      title="Delete instrument project-wide"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {open && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Recording:{' '}
                      {[r.recordingBook && `Bk ${r.recordingBook}`, r.recordingPage && `Pg ${r.recordingPage}`, r.recordingInstrument]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                      {r.recordingDate
                        ? ` · ${new Date(r.recordingDate).toLocaleDateString()}`
                        : ''}
                      {r.county ? ` · ${r.county}` : ''}
                    </Typography>
                    {r.restrictionsNote && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Restrictions: {r.restrictionsNote}
                      </Typography>
                    )}
                    {r.notes && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Notes: {r.notes}
                      </Typography>
                    )}
                    {r.widthNotes && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Width notes: {r.widthNotes}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'Create / add instrument'}
        </Button>
        {linkable.length > 0 && (
          <>
            <TextField
              select
              size="small"
              label="Link existing on project"
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Select…</MenuItem>
              {linkable.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.instrumentNumber ? `#${c.instrumentNumber}` : c.name || c.id.slice(0, 8)}
                  {c.parcelCount ? ` (${c.parcelCount} parcels)` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LinkIcon />}
              disabled={!linkId || busy}
              onClick={linkExisting}
            >
              Link
            </Button>
          </>
        )}
      </Stack>

      {showForm && (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            New instrument (auto-links this parcel; same # merges project-wide)
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Easement / instrument #"
                value={form.instrumentNumber}
                onChange={(e) => setForm({ ...form, instrumentNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Name / title"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type"
                value={form.rightType}
                onChange={(e) => setForm({ ...form, rightType: e.target.value })}
              >
                {EXISTING_RIGHT_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Purpose"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              >
                {EXISTING_RIGHT_PURPOSE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Grantor"
                value={form.grantor}
                onChange={(e) => setForm({ ...form, grantor: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Grantee"
                value={form.grantee}
                onChange={(e) => setForm({ ...form, grantee: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="County"
                value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Book"
                value={form.recordingBook}
                onChange={(e) => setForm({ ...form, recordingBook: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Page"
                value={form.recordingPage}
                onChange={(e) => setForm({ ...form, recordingPage: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Rec. instrument #"
                value={form.recordingInstrument}
                onChange={(e) => setForm({ ...form, recordingInstrument: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Record date"
                InputLabelProps={{ shrink: true }}
                value={form.recordingDate}
                onChange={(e) => setForm({ ...form, recordingDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Width (ft)"
                value={form.widthFeet}
                onChange={(e) => setForm({ ...form, widthFeet: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Life status"
                value={form.lifeStatus}
                onChange={(e) => setForm({ ...form, lifeStatus: e.target.value })}
              >
                {EXISTING_RIGHT_LIFE_OPTIONS.map((o) => (
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
                label="Width notes"
                value={form.widthNotes}
                onChange={(e) => setForm({ ...form, widthNotes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Restriction flags
              </Typography>
              <FormGroup row>
                {EXISTING_RIGHT_FLAG_OPTIONS.map((f) => (
                  <FormControlLabel
                    key={f.value}
                    control={
                      <Checkbox
                        size="small"
                        checked={form.restrictionFlags.includes(f.value)}
                        onChange={() => toggleFlag(f.value)}
                      />
                    }
                    label={<Typography variant="body2">{f.label}</Typography>}
                  />
                ))}
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Restrictions detail"
                value={form.restrictionsNote}
                onChange={(e) => setForm({ ...form, restrictionsNote: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Impact on this parcel"
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: e.target.value })}
              >
                {EXISTING_RIGHT_IMPACT_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Instrument notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Grid>
          </Grid>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            disabled={busy}
            onClick={createOrLink}
          >
            Save instrument
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" color="text.secondary">
        Section notes and documents: use category <strong>Existing Rights</strong> below (or in
        Notes / Documents sections).
      </Typography>
    </Box>
  );
}
