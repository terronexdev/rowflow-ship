'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { ASSIGNMENT_ROLE_OPTIONS } from '@/lib/constants';

export type CostDiscipline =
  | 'ROW'
  | 'TITLE'
  | 'SURVEY'
  | 'APPRAISAL'
  | 'LEGAL'
  | 'CONSTRUCTION'
  | 'PERMITTING'
  | 'GENERAL';

type EntryType = 'TIME' | 'FEE' | 'EXPENSE' | 'MILEAGE';

type CostEntry = {
  id: string;
  entryType: EntryType;
  workDate: string;
  hours?: number | string | null;
  role?: string | null;
  hourlyRate?: number | string | null;
  feeCode?: string | null;
  expenseCategory?: string | null;
  miles?: number | string | null;
  mileageRate?: number | string | null;
  amount: number | string;
  description?: string | null;
  vendor?: string | null;
  billable: boolean;
  receiptUrl?: string | null;
  receiptName?: string | null;
  user?: { name?: string | null; email?: string | null };
};

const FEE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  SURVEY: [{ value: 'EXHIBIT', label: 'Exhibit cost' }, { value: 'OTHER', label: 'Other fee' }],
  APPRAISAL: [
    { value: 'APPRAISAL', label: 'Appraisal fee' },
    { value: 'EDIT', label: 'Edit fee' },
    { value: 'UPDATE', label: 'Update fee' },
    { value: 'OTHER', label: 'Other fee' },
  ],
  LEGAL: [
    { value: 'FILING', label: 'Filing fee' },
    { value: 'OTHER', label: 'Other fee' },
  ],
  PERMITTING: [
    { value: 'FILING', label: 'Filing / application fee' },
    { value: 'OTHER', label: 'Other fee' },
  ],
  ROW: [{ value: 'OTHER', label: 'Other fee' }],
  TITLE: [{ value: 'OTHER', label: 'Other fee' }],
  CONSTRUCTION: [{ value: 'OTHER', label: 'Other fee' }],
  GENERAL: [{ value: 'OTHER', label: 'Other fee' }],
};

const EXPENSE_CATS = [
  { value: 'LODGING', label: 'Lodging' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'FILING', label: 'Filing' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'OTHER', label: 'Other' },
];

const DEFAULT_ROLE: Record<CostDiscipline, string> = {
  ROW: 'AGENT',
  TITLE: 'TITLE',
  SURVEY: 'SURVEY',
  APPRAISAL: 'APPRAISAL',
  LEGAL: 'LEGAL',
  CONSTRUCTION: 'CONSTRUCTION_SUPPORT',
  PERMITTING: 'PERMIT',
  GENERAL: 'AGENT',
};

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function primaryLine(e: CostEntry) {
  const amt = money(Number(e.amount));
  if (e.entryType === 'TIME') {
    return `TIME · ${Number(e.hours)}h @ $${Number(e.hourlyRate).toFixed(2)} = ${amt} · ${e.role || ''}`;
  }
  if (e.entryType === 'FEE') {
    return `FEE · ${(e.feeCode || 'OTHER').replaceAll('_', ' ')} · ${amt}`;
  }
  if (e.entryType === 'MILEAGE') {
    return `MILEAGE · ${Number(e.miles)} mi × $${Number(e.mileageRate).toFixed(2)} = ${amt}`;
  }
  return `EXPENSE · ${(e.expenseCategory || 'OTHER').replaceAll('_', ' ')} · ${amt}${
    e.vendor ? ` · ${e.vendor}` : ''
  }`;
}

interface Props {
  parcelId: string;
  discipline: CostDiscipline;
  /** Show fee button with discipline-specific codes */
  allowFees?: boolean;
  title?: string;
}

export default function ParcelBillingPanel({
  parcelId,
  discipline,
  allowFees,
  title = 'Billing',
}: Props) {
  const showFees = allowFees ?? ['SURVEY', 'APPRAISAL', 'LEGAL', 'PERMITTING'].includes(discipline);
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [billableTotal, setBillableTotal] = useState(0);
  const [mileageRateDefault, setMileageRateDefault] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EntryType | null>(null);

  const [form, setForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    hours: '',
    role: DEFAULT_ROLE[discipline],
    feeCode: FEE_OPTIONS[discipline]?.[0]?.value || 'OTHER',
    feeAmount: '',
    expenseCategory: 'OTHER',
    expenseAmount: '',
    miles: '',
    mileageRate: '',
    vendor: '',
    description: '',
    billable: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/parcels/${parcelId}/costs?discipline=${encodeURIComponent(discipline)}`,
        { credentials: 'same-origin', cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load billing');
      setEntries(data.entries || []);
      setBillableTotal(Number(data.billableTotal || 0));
      if (data.mileageRate != null) {
        setMileageRateDefault(Number(data.mileageRate));
        setForm((f) => ({
          ...f,
          mileageRate: f.mileageRate || String(Number(data.mileageRate)),
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, [parcelId, discipline]);

  useEffect(() => {
    load();
  }, [load]);

  const feeOpts = useMemo(() => FEE_OPTIONS[discipline] || FEE_OPTIONS.GENERAL, [discipline]);

  const submit = async () => {
    if (!mode) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        discipline,
        entryType: mode,
        workDate: form.workDate,
        description: form.description || null,
        billable: form.billable,
      };
      if (mode === 'TIME') {
        payload.hours = parseFloat(form.hours);
        payload.role = form.role;
      } else if (mode === 'FEE') {
        payload.feeCode = form.feeCode;
        payload.feeAmount = parseFloat(form.feeAmount);
      } else if (mode === 'EXPENSE') {
        payload.expenseCategory = form.expenseCategory;
        payload.expenseAmount = parseFloat(form.expenseAmount);
        payload.vendor = form.vendor || null;
      } else if (mode === 'MILEAGE') {
        payload.miles = parseFloat(form.miles);
        if (form.mileageRate) payload.mileageRate = parseFloat(form.mileageRate);
      }

      const res = await fetch(`/api/parcels/${parcelId}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMode(null);
      setForm((f) => ({
        ...f,
        hours: '',
        feeAmount: '',
        expenseAmount: '',
        miles: '',
        vendor: '',
        description: '',
      }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entryId: string) => {
    if (!confirm('Delete this billing line?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/parcels/${parcelId}/costs?entryId=${encodeURIComponent(entryId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const attachReceipt = async (entryId: string, file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/parcels/${parcelId}/costs/${entryId}/receipt`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Receipt upload failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Receipt upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {title}
        </Typography>
        <Chip size="small" color="primary" variant="outlined" label={`Billable ${money(billableTotal)}`} />
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Hours, fees, expenses & mileage for this discipline. Receipts attach to fee/expense/mileage
        lines (finance — not work-product files).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Button size="small" variant={mode === 'TIME' ? 'contained' : 'outlined'} onClick={() => setMode('TIME')}>
          + Hours
        </Button>
        {showFees && (
          <Button size="small" variant={mode === 'FEE' ? 'contained' : 'outlined'} onClick={() => setMode('FEE')}>
            + Fee
          </Button>
        )}
        <Button
          size="small"
          variant={mode === 'EXPENSE' ? 'contained' : 'outlined'}
          onClick={() => setMode('EXPENSE')}
        >
          + Expense
        </Button>
        <Button
          size="small"
          variant={mode === 'MILEAGE' ? 'contained' : 'outlined'}
          onClick={() => setMode('MILEAGE')}
        >
          + Mileage
        </Button>
        {mode && (
          <Button size="small" onClick={() => setMode(null)}>
            Cancel
          </Button>
        )}
      </Box>

      {mode && (
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
            />
          </Grid>
          {mode === 'TIME' && (
            <>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Hours"
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  inputProps={{ step: '0.25', min: 0 }}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Role (rate)"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ASSIGNMENT_ROLE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}
          {mode === 'FEE' && (
            <>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Fee type"
                  value={form.feeCode}
                  onChange={(e) => setForm({ ...form, feeCode: e.target.value })}
                >
                  {feeOpts.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount $"
                  value={form.feeAmount}
                  onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
                />
              </Grid>
            </>
          )}
          {mode === 'EXPENSE' && (
            <>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Category"
                  value={form.expenseCategory}
                  onChange={(e) => setForm({ ...form, expenseCategory: e.target.value })}
                >
                  {EXPENSE_CATS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount $"
                  value={form.expenseAmount}
                  onChange={(e) => setForm({ ...form, expenseAmount: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Vendor"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                />
              </Grid>
            </>
          )}
          {mode === 'MILEAGE' && (
            <>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Miles"
                  value={form.miles}
                  onChange={(e) => setForm({ ...form, miles: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="$/mile"
                  value={form.mileageRate || String(mileageRateDefault)}
                  onChange={(e) => setForm({ ...form, mileageRate: e.target.value })}
                  inputProps={{ step: '0.01' }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={form.billable}
                  onChange={(e) => setForm({ ...form, billable: e.target.checked })}
                />
              }
              label="Billable"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button fullWidth variant="contained" disabled={busy} onClick={() => void submit()}>
              Save line
            </Button>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading billing…
        </Typography>
      ) : entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No billing lines yet for this discipline.
        </Typography>
      ) : (
        <List dense>
          {entries.map((e) => (
            <ListItem
              key={e.id}
              divider
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {e.entryType !== 'TIME' && (
                    <IconButton size="small" component="label" disabled={busy} title="Attach receipt">
                      <ReceiptLongIcon fontSize="small" color={e.receiptUrl ? 'primary' : 'inherit'} />
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          void attachReceipt(e.id, f);
                          ev.target.value = '';
                        }}
                      />
                    </IconButton>
                  )}
                  <IconButton edge="end" size="small" disabled={busy} onClick={() => void remove(e.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{ pr: 10 }}
            >
              <ListItemText
                primary={primaryLine(e)}
                secondary={
                  <span>
                    {`${String(e.workDate).slice(0, 10)} · ${e.user?.name || e.user?.email || ''}${
                      e.billable ? '' : ' · non-billable'
                    }${e.description ? ` · ${e.description}` : ''}`}
                    {e.receiptUrl ? (
                      <>
                        {' · '}
                        <a href={e.receiptUrl} target="_blank" rel="noreferrer">
                          {e.receiptName || 'Receipt'}
                        </a>
                      </>
                    ) : e.entryType !== 'TIME' ? (
                      ' · no receipt'
                    ) : null}
                  </span>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
