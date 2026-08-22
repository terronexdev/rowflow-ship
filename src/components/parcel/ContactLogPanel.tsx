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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { personLabel } from '@/lib/attribution';

const CONTACT_TYPES = [
  { value: 'PHONE', label: 'Phone' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'LETTER', label: 'Letter' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'TEXT', label: 'Text' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'OTHER', label: 'Other' },
] as const;

type Contact = {
  id: string;
  contactType: string;
  contactDate: string;
  subject?: string | null;
  summary: string;
  outcome?: string | null;
  followUpDate?: string | null;
  createdAt?: string;
  createdBy?: { id?: string; name?: string | null; email?: string | null } | null;
};

function toInputDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

function isPastFollowUp(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export default function ContactLogPanel({
  parcelId,
  readOnly,
}: {
  parcelId: string;
  readOnly?: boolean;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    contactType: 'PHONE',
    contactDate: new Date().toISOString().slice(0, 10),
    subject: '',
    summary: '',
    outcome: '',
    followUpDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/contacts`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.summary.trim()) {
      setError('Summary is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType: form.contactType,
          contactDate: form.contactDate || null,
          subject: form.subject || null,
          summary: form.summary.trim(),
          outcome: form.outcome || null,
          followUpDate: form.followUpDate || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setForm({
        contactType: 'PHONE',
        contactDate: new Date().toISOString().slice(0, 10),
        subject: '',
        summary: '',
        outcome: '',
        followUpDate: '',
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this contact entry?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const openFollowUps = contacts.filter((c) => isPastFollowUp(c.followUpDate)).length;
  const last = contacts[0];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }} alignItems="center">
        <Chip size="small" label={`${contacts.length} contact(s)`} />
        {last && (
          <Chip
            size="small"
            variant="outlined"
            label={`Last: ${fmtDate(last.contactDate)} · ${last.contactType.replaceAll('_', ' ')}`}
          />
        )}
        {openFollowUps > 0 && (
          <Chip size="small" color="warning" label={`${openFollowUps} past-due follow-up(s)`} />
        )}
        {!readOnly && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowForm((v) => !v)}
            sx={{ ml: 'auto' }}
          >
            {showForm ? 'Cancel' : 'Log contact'}
          </Button>
        )}
      </Stack>

      {showForm && !readOnly && (
        <Box sx={{ p: 1.5, mb: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Method"
                value={form.contactType}
                onChange={(e) => setForm({ ...form, contactType: e.target.value })}
              >
                {CONTACT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Contact date"
                InputLabelProps={{ shrink: true }}
                value={form.contactDate}
                onChange={(e) => setForm({ ...form, contactDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Follow-up date"
                InputLabelProps={{ shrink: true }}
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Outcome"
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                placeholder="Left voicemail, interested, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Summary"
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" size="small" disabled={busy} onClick={create}>
                Save contact
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {contacts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No landowner contacts logged yet. Log phone/email/visits for audit trail and follow-ups.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {contacts.map((c) => (
            <Box
              key={c.id}
              sx={{
                p: 1.25,
                borderRadius: 1,
                bgcolor: 'action.hover',
                borderLeft: 3,
                borderColor: isPastFollowUp(c.followUpDate) ? 'warning.main' : 'divider',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {fmtDate(c.contactDate)} · {c.contactType.replaceAll('_', ' ')}
                    {c.subject ? ` · ${c.subject}` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {c.summary}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                    Logged by {personLabel(c.createdBy)}
                    {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString()}` : ''}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {c.outcome && (
                      <Chip size="small" variant="outlined" label={`Outcome: ${c.outcome}`} />
                    )}
                    {c.followUpDate && (
                      <Chip
                        size="small"
                        color={isPastFollowUp(c.followUpDate) ? 'warning' : 'default'}
                        variant="outlined"
                        label={`Follow-up: ${fmtDate(c.followUpDate)}`}
                      />
                    )}
                  </Stack>
                </Box>
                {!readOnly && (
                  <IconButton size="small" onClick={() => remove(c.id)} disabled={busy} aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export { toInputDate };
