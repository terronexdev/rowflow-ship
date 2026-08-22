'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ASSIGNMENT_ROLE_OPTIONS, ASSIGNMENT_ROLE_VALUES } from '@/lib/constants';

type Role = (typeof ASSIGNMENT_ROLE_VALUES)[number];

type PersonOpt = {
  id?: string;
  email: string;
  name?: string | null;
  reason?: string;
  inputValue?: string;
};

type PeoplePayload = {
  owner: { id: string; name?: string | null; email?: string | null } | null;
  isOwner: boolean;
  members: {
    id: string;
    userId: string;
    role: Role;
    roles?: Role[];
    name?: string | null;
    email?: string | null;
  }[];
  invites: {
    id: string;
    email: string;
    role: Role;
    inviteUrl?: string;
    expiresAt?: string;
  }[];
  rolesByUser?: Record<string, string[]>;
  rates: Record<string, string>;
  suggestions: PersonOpt[];
};

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ASSIGNMENT_ROLE_OPTIONS.map((r) => [r.value, r.label])
);

function roleLabel(r?: string | null) {
  if (!r) return '—';
  return ROLE_LABEL[r] || r.replaceAll('_', ' ');
}

function emptyRates(): Record<string, string> {
  const o: Record<string, string> = {};
  for (const r of ASSIGNMENT_ROLE_VALUES) o[r] = '';
  return o;
}

interface Props {
  projectId: string;
  onMessage?: (msg: string | null, err?: string | null) => void;
}

export default function ProjectPeoplePanel({ projectId, onMessage }: Props) {
  const [data, setData] = useState<PeoplePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [addRole, setAddRole] = useState<Role>('AGENT');
  const [addValue, setAddValue] = useState<PersonOpt | string | null>(null);
  const [inputText, setInputText] = useState('');
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [rates, setRates] = useState<Record<string, string>>(emptyRates);
  const [menu, setMenu] = useState<{
    anchor: HTMLElement;
    kind: 'member' | 'invite' | 'owner';
    id: string;
    userId?: string;
    email?: string;
    roles?: Role[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/people`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load people');
      setData(json);
      const next = emptyRates();
      for (const [k, v] of Object.entries(json.rates || {})) {
        next[k] = String(v ?? '');
      }
      setRates(next);
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Failed to load people');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const options: PersonOpt[] = useMemo(() => {
    const list = [...(data?.suggestions || [])];
    const typed = inputText.trim();
    if (typed.includes('@')) {
      const exists = list.some((o) => o.email?.toLowerCase() === typed.toLowerCase());
      if (!exists) {
        list.unshift({
          email: typed,
          name: `Invite ${typed}`,
          reason: 'new_email',
          inputValue: typed,
        });
      }
    }
    return list;
  }, [data?.suggestions, inputText]);

  /** userId → roles[] from API (multi-role) */
  const rolesByUser = useMemo(() => {
    const map = new Map<string, Role[]>();
    const raw = data?.rolesByUser || {};
    for (const [uid, roles] of Object.entries(raw)) {
      map.set(uid, (roles || []) as Role[]);
    }
    // Fallback from member.roles / member.role
    for (const m of data?.members || []) {
      if (!map.has(m.userId)) {
        const r = (m.roles && m.roles.length ? m.roles : m.role ? [m.role] : []) as Role[];
        map.set(m.userId, r);
      }
    }
    return map;
  }, [data]);

  const addPerson = async () => {
    if (!data?.isOwner) {
      onMessage?.(null, 'Only the project owner can add people');
      return;
    }
    const email =
      typeof addValue === 'string'
        ? addValue.trim()
        : (addValue?.inputValue || addValue?.email || inputText).trim();
    if (!email.includes('@')) {
      onMessage?.(null, 'Enter a valid email');
      return;
    }
    setBusy(true);
    onMessage?.(null, null);
    try {
      const res = await fetch(`/api/projects/${projectId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: addRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Add failed');
      onMessage?.(json.message || 'Added', null);
      if (json.emailSent === false && json.invite?.inviteUrl) {
        setLastInviteUrl(json.invite.inviteUrl);
      } else if (json.invite?.inviteUrl) {
        setLastInviteUrl(json.emailSent ? null : json.invite.inviteUrl);
      } else {
        setLastInviteUrl(null);
      }
      if (json.emailSent) {
        onMessage?.(json.message || `Invite emailed`, null);
      }
      setAddValue(null);
      setInputText('');
      await load();
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Add failed');
    } finally {
      setBusy(false);
    }
  };

  const addRoleToUser = async (userId: string, role: Role) => {
    setBusy(true);
    onMessage?.(null, null);
    try {
      const res = await fetch(`/api/projects/${projectId}/people`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, action: 'add' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Role update failed');
      onMessage?.(json.message || 'Role added', null);
      await load();
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Role update failed');
    } finally {
      setBusy(false);
      setMenu(null);
    }
  };

  const removeRoleFromUser = async (userId: string, role: Role) => {
    setBusy(true);
    onMessage?.(null, null);
    try {
      const res = await fetch(`/api/projects/${projectId}/people`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, action: 'remove' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Remove role failed');
      onMessage?.(json.message || 'Role removed', null);
      await load();
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Remove role failed');
    } finally {
      setBusy(false);
      setMenu(null);
    }
  };

  const removeMember = async (memberId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/invites?memberId=${memberId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Remove failed');
      onMessage?.('Member removed', null);
      await load();
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setBusy(false);
      setMenu(null);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/invites?inviteId=${inviteId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Revoke failed');
      onMessage?.('Invite revoked', null);
      await load();
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Revoke failed');
    } finally {
      setBusy(false);
      setMenu(null);
    }
  };

  const saveRates = async () => {
    setBusy(true);
    onMessage?.(null, null);
    try {
      const ratesBody = ASSIGNMENT_ROLE_VALUES.filter(
        (role) => rates[role] !== '' && !Number.isNaN(Number(rates[role]))
      ).map((role) => ({ role, hourlyRate: Number(rates[role]) }));
      const res = await fetch(`/api/projects/${projectId}/role-rates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: ratesBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save rates');
      onMessage?.('Labor rates saved', null);
      await load();
    } catch (e) {
      onMessage?.(null, e instanceof Error ? e.message : 'Failed to save rates');
    } finally {
      setBusy(false);
    }
  };

  const renderRoleChips = (roles: Role[], opts?: { owner?: boolean }) => {
    if (!roles.length) {
      return opts?.owner ? (
        <Chip size="small" label="Owner" color="primary" variant="outlined" />
      ) : (
        <Typography variant="caption" color="text.secondary">
          No roles
        </Typography>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {opts?.owner && <Chip size="small" label="Owner" color="primary" variant="outlined" />}
        {roles.map((r) => (
          <Chip key={r} size="small" label={roleLabel(r)} />
        ))}
      </Box>
    );
  };

  const rateHint = (roles: Role[]) => {
    const withRate = roles.filter((r) => rates[r]);
    if (!withRate.length) return '—';
    if (withRate.length === 1) return `$${rates[withRate[0]]}/hr`;
    return withRate.map((r) => `${roleLabel(r)} $${rates[r]}`).join(' · ');
  };

  if (loading && !data) {
    return (
      <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Paper>
    );
  }

  if (!data) return null;

  const ownerRoles = data.owner ? rolesByUser.get(data.owner.id) || [] : [];
  const menuRoles = menu?.roles || [];
  const rolesNotHeld = ASSIGNMENT_ROLE_OPTIONS.filter((r) => !menuRoles.includes(r.value as Role));

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        People
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Project roster by discipline. One person can hold multiple roles (e.g. ROW Agent + Title +
        Permitting). Records agent and Coordinator are roster/labor only — no parcel edit sections.
        Manager / Lead receive counter-offer emails. Rates feed labor snapshots. Section access
        control comes later.
      </Typography>

      {data.isOwner && (
        <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={options}
              value={addValue}
              inputValue={inputText}
              onInputChange={(_, v) => setInputText(v)}
              onChange={(_, v) => setAddValue(v as PersonOpt | string | null)}
              getOptionLabel={(o) =>
                typeof o === 'string'
                  ? o
                  : o.name && o.reason !== 'new_email'
                    ? `${o.name} (${o.email})`
                    : o.email
              }
              filterOptions={(x) => x}
              renderOption={(props, option) => (
                <li
                  {...props}
                  key={
                    typeof option === 'string' ? option : option.email + (option.id || '')
                  }
                >
                  <Box>
                    <Typography variant="body2">
                      {typeof option === 'string'
                        ? option
                        : option.name && option.reason !== 'new_email'
                          ? option.name
                          : option.email}
                    </Typography>
                    {typeof option !== 'string' && (
                      <Typography variant="caption" color="text.secondary">
                        {option.reason === 'new_email'
                          ? 'New invite'
                          : option.reason === 'shared_project'
                            ? `${option.email} · from your projects`
                            : option.email}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Add by email or pick someone you’ve worked with"
                  placeholder="name or email@company.com"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Initial role"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as Role)}
            >
              {ASSIGNMENT_ROLE_OPTIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              disabled={
                busy ||
                !(
                  inputText.includes('@') ||
                  (typeof addValue === 'object' && !!addValue?.email?.includes('@'))
                )
              }
              onClick={addPerson}
            >
              Add to project
            </Button>
          </Grid>
        </Grid>
      )}

      {lastInviteUrl && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setLastInviteUrl(null)}>
          Share invite link: <code style={{ wordBreak: 'break-all' }}>{lastInviteUrl}</code>
        </Alert>
      )}

      <Table size="small" sx={{ mb: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Person</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell align="right" width={48} />
          </TableRow>
        </TableHead>
        <TableBody>
          {data.owner && (
            <TableRow>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {data.owner.name || data.owner.email || 'Owner'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.owner.email}
                </Typography>
              </TableCell>
              <TableCell>{renderRoleChips(ownerRoles, { owner: true })}</TableCell>
              <TableCell>
                <Chip size="small" label="Owner · active" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="caption">{rateHint(ownerRoles)}</Typography>
              </TableCell>
              <TableCell align="right">
                {data.isOwner && (
                  <IconButton
                    size="small"
                    onClick={(e) =>
                      setMenu({
                        anchor: e.currentTarget,
                        kind: 'owner',
                        id: data.owner!.id,
                        userId: data.owner!.id,
                        roles: ownerRoles,
                      })
                    }
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          )}

          {data.members.map((m) => {
            const roles = rolesByUser.get(m.userId) || [];
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {m.name || m.email || 'Member'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.email}
                  </Typography>
                </TableCell>
                <TableCell>{renderRoleChips(roles)}</TableCell>
                <TableCell>
                  <Chip size="small" color="success" variant="outlined" label="Active" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{rateHint(roles)}</Typography>
                </TableCell>
                <TableCell align="right">
                  {data.isOwner && (
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        setMenu({
                          anchor: e.currentTarget,
                          kind: 'member',
                          id: m.id,
                          userId: m.userId,
                          email: m.email || undefined,
                          roles,
                        })
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {data.invites.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {inv.email}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip size="small" label={roleLabel(inv.role)} variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip size="small" color="warning" variant="outlined" label="Invite pending" />
              </TableCell>
              <TableCell>—</TableCell>
              <TableCell align="right">
                {data.isOwner && (
                  <IconButton
                    size="small"
                    onClick={(e) =>
                      setMenu({
                        anchor: e.currentTarget,
                        kind: 'invite',
                        id: inv.id,
                        email: inv.email,
                        roles: [inv.role],
                      })
                    }
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}

          {data.members.length === 0 && data.invites.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="body2" color="text.secondary">
                  Only the owner has access. Add agents, coordinators, records, survey, appraisal,
                  legal, permitting, or construction support — one person can hold several roles.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Divider sx={{ my: 2 }} />

      <Box
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setRatesOpen((v) => !v)}
      >
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Labor rates by discipline ($/hr)
        </Typography>
        {ratesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      <Collapse in={ratesOpen}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {ASSIGNMENT_ROLE_OPTIONS.map((r) => (
            <Grid item xs={12} sm={6} md={3} key={r.value}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={`${r.label} $/hr`}
                value={rates[r.value] ?? ''}
                disabled={!data.isOwner}
                onChange={(e) => setRates((prev) => ({ ...prev, [r.value]: e.target.value }))}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
          ))}
          {data.isOwner && (
            <Grid item xs={12}>
              <Button variant="outlined" disabled={busy} onClick={saveRates}>
                Save rates
              </Button>
            </Grid>
          )}
        </Grid>
      </Collapse>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu?.kind !== 'invite' && menu?.userId && (
          <>
            {rolesNotHeld.length > 0 && (
              <MenuItem disabled sx={{ opacity: 1, fontWeight: 600, fontSize: 12 }}>
                Add role
              </MenuItem>
            )}
            {rolesNotHeld.map((r) => (
              <MenuItem
                key={`add-${r.value}`}
                onClick={() => addRoleToUser(menu.userId!, r.value as Role)}
              >
                + {r.label}
              </MenuItem>
            ))}
            {menuRoles.length > 0 && (
              <MenuItem disabled sx={{ opacity: 1, fontWeight: 600, fontSize: 12, mt: 0.5 }}>
                Remove role
              </MenuItem>
            )}
            {menuRoles.map((r) => (
              <MenuItem
                key={`rm-${r}`}
                onClick={() => removeRoleFromUser(menu.userId!, r)}
                sx={{ color: 'warning.main' }}
              >
                − {roleLabel(r)}
              </MenuItem>
            ))}
          </>
        )}
        {menu?.kind === 'member' && (
          <MenuItem onClick={() => removeMember(menu.id)} sx={{ color: 'error.main' }}>
            Remove access
          </MenuItem>
        )}
        {menu?.kind === 'invite' && (
          <>
            {data.invites.find((i) => i.id === menu.id)?.inviteUrl && (
              <MenuItem
                onClick={() => {
                  const url = data.invites.find((i) => i.id === menu.id)?.inviteUrl;
                  if (url) {
                    void navigator.clipboard?.writeText(url);
                    setLastInviteUrl(url);
                  }
                  setMenu(null);
                }}
              >
                Copy invite link
              </MenuItem>
            )}
            <MenuItem onClick={() => revokeInvite(menu.id)} sx={{ color: 'error.main' }}>
              Revoke invite
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
}
