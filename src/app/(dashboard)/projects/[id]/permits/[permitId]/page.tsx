'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { PERMIT_STATUS_OPTIONS, PERMIT_TYPE_OPTIONS } from '@/lib/constants';

const d = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

type DocRow = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
};

type NoteRow = {
  id: string;
  content: string;
  createdAt: string;
};

export default function PermitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const permitId = params.permitId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [parcelId, setParcelId] = useState<string | null>(null);
  const [parcelLabel, setParcelLabel] = useState<string>('');
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({
    name: '',
    permitType: 'OTHER',
    status: 'NOT_STARTED',
    agency: '',
    referenceNumber: '',
    submittedDate: '',
    approvedDate: '',
    expirationDate: '',
    permitteeName: '',
    permitteeOrg: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    notes: '',
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/permits/${permitId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load permit');
    const p = data.permit;
    if (p.projectId !== projectId) throw new Error('Permit does not belong to this project');
    setParcelId(p.parcelId || null);
    setParcelLabel(
      p.parcel
        ? [p.parcel.pin || p.parcel.parcelNumber, p.parcel.owner].filter(Boolean).join(' · ')
        : ''
    );
    setDocuments(p.documents || []);
    setNotes(p.notesList || []);
    setForm({
      name: p.name || '',
      permitType: p.permitType || 'OTHER',
      status: p.status || 'NOT_STARTED',
      agency: p.agency || '',
      referenceNumber: p.referenceNumber || '',
      submittedDate: d(p.submittedDate),
      approvedDate: d(p.approvedDate),
      expirationDate: d(p.expirationDate),
      permitteeName: p.permitteeName || '',
      permitteeOrg: p.permitteeOrg || '',
      contactName: p.contactName || '',
      contactPhone: p.contactPhone || '',
      contactEmail: p.contactEmail || '',
      contactAddress: p.contactAddress || '',
      notes: p.notes || '',
    });
  }, [permitId, projectId]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/permits/${permitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contactEmail: form.contactEmail || null,
          submittedDate: form.submittedDate || null,
          approvedDate: form.approvedDate || null,
          expirationDate: form.expirationDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMsg('Permit saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'PERMIT');
      const res = await fetch(`/api/permits/${permitId}/documents`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMsg(`Uploaded ${file.name}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (documentId: string) => {
    if (!window.confirm('Delete this file?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const addNote = async () => {
    const content = noteText.trim();
    if (!content) return;
    setError(null);
    try {
      const res = await fetch(`/api/permits/${permitId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add note');
      setNoteText('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add note');
    }
  };

  const deletePermit = async () => {
    if (
      !window.confirm(
        `Delete filing “${form.name || 'this permit'}”? Notes and files will be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/permits/${permitId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      const dest = parcelId
        ? `/projects/${projectId}/parcels/${parcelId}/edit#permitting`
        : `/projects/${projectId}/edit`;
      router.push(dest);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const backHref = parcelId
    ? `/projects/${projectId}/parcels/${parcelId}/edit#permitting`
    : `/projects/${projectId}/edit`;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(backHref)} sx={{ mb: 2 }}>
        {parcelId ? 'Back to parcel' : 'Back to project'}
      </Button>
      <Typography variant="h4" gutterBottom>
        Edit Permit
      </Typography>
      {parcelLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Linked parcel: {parcelLabel}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="error"
          disabled={deleting}
          onClick={() => void deletePermit()}
        >
          {deleting ? 'Deleting…' : 'Delete filing'}
        </Button>
      </Box>
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
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic info
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth required label="Name" name="name" value={form.name} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Type" name="permitType" value={form.permitType} onChange={onChange}>
              {PERMIT_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Status" name="status" value={form.status} onChange={onChange}>
              {PERMIT_STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Agency" name="agency" value={form.agency} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Reference number"
              name="referenceNumber"
              value={form.referenceNumber}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Submitted"
              name="submittedDate"
              value={form.submittedDate}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Approved"
              name="approvedDate"
              value={form.approvedDate}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Expiration"
              name="expirationDate"
              value={form.expirationDate}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
          Permittee / contact
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Permittee name"
              name="permitteeName"
              value={form.permitteeName}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Permittee org"
              name="permitteeOrg"
              value={form.permitteeOrg}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Contact name" name="contactName" value={form.contactName} onChange={onChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact phone"
              name="contactPhone"
              value={form.contactPhone}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Contact address"
              name="contactAddress"
              value={form.contactAddress}
              onChange={onChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Notes (on record)" name="notes" value={form.notes} onChange={onChange} />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save Permit'}
            </Button>
            <Button variant="outlined" onClick={() => router.push(backHref)}>
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Files (crossing agreement, drawings, correspondence)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          PDF, Word, Excel, images, CSV — max 25 MB. Stored as permit work-product files.
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={uploading}
          sx={{ mb: 2 }}
        >
          {uploading ? 'Uploading…' : 'Upload file'}
          <input
            hidden
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,application/pdf,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void uploadFile(f);
            }}
          />
        </Button>
        {documents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No files yet.
          </Typography>
        ) : (
          <List dense>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                divider
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => void deleteDoc(doc.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      {doc.name}
                    </a>
                  }
                  secondary={`${doc.type} · ${(doc.size / 1024).toFixed(0)} KB · ${new Date(doc.createdAt).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Activity notes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a note on this filing…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <Button variant="contained" onClick={() => void addNote()} disabled={!noteText.trim()}>
            Add
          </Button>
        </Box>
        {notes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No notes yet.
          </Typography>
        ) : (
          <List dense>
            {notes.map((n) => (
              <ListItem key={n.id} divider alignItems="flex-start">
                <ListItemText
                  primary={n.content}
                  secondary={new Date(n.createdAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
