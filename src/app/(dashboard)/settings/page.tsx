'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  projectLimit: number;
  parcelLimitPerProject: number;
  userLimit: number;
  storageLimit: number;
}

// Fetch subscription
const fetchSubscription = async (): Promise<Subscription> => {
  const res = await fetch('/api/subscription');
  if (!res.ok) throw new Error('Failed to fetch subscription');
  const data = await res.json();
  return data.subscription;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Profile" />
          <Tab label="Password" />
          <Tab label="Subscription" />
          <Tab label="Email" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Profile Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Profile Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                  {message.text}
                </Alert>
              )}

              <Box component="form" onSubmit={handleProfileUpdate}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* Password Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                  {message.text}
                </Alert>
              )}

              {session?.user?.email && !session?.user?.image ? (
                <Box component="form" onSubmit={handlePasswordChange}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info">
                  You are signed in with a third-party provider (Google/GitHub). Password change is
                  not available for OAuth accounts.
                </Alert>
              )}
            </Box>
          )}

          {/* Subscription Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Subscription Plan
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {subscription ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="h5">{subscription.tier} Plan</Typography>
                      <Chip
                        label={subscription.status}
                        color={subscription.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                      {subscription.tier === 'PRO' && (
                        <Chip size="small" label="Includes Tractsource suite seat" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Pro is $49.99/month · Terronex emails are comped Pro
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Project Limit
                      </Typography>
                      <Typography variant="h6">
                        {subscription.projectLimit === -1 ? 'Unlimited' : subscription.projectLimit}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Parcels per Project
                      </Typography>
                      <Typography variant="h6">
                        {subscription.parcelLimitPerProject === -1
                          ? 'Unlimited'
                          : subscription.parcelLimitPerProject}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        User Limit
                      </Typography>
                      <Typography variant="h6">
                        {subscription.userLimit === -1 ? 'Unlimited' : subscription.userLimit}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Storage Limit
                      </Typography>
                      <Typography variant="h6">
                        {subscription.storageLimit === -1
                          ? 'Unlimited'
                          : `${subscription.storageLimit} MB`}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {subscription.tier !== 'PRO' && subscription.tier !== 'ENTERPRISE' && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          const res = await fetch('/api/stripe/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tier: 'PRO' }),
                          });
                          const data = await res.json();
                          if (data.comped) {
                            window.location.reload();
                            return;
                          }
                          if (data.url) window.location.href = data.url;
                          else alert(data.error || 'Checkout unavailable');
                        }}
                      >
                        Upgrade to Pro · $49.99/mo
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        const res = await fetch('/api/stripe/portal', { method: 'POST' });
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                        else alert(data.error || 'Billing portal unavailable (no Stripe customer yet)');
                      }}
                    >
                      Manage billing
                    </Button>
                    <Button variant="text" href="/pricing">
                      View plans
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="warning">No subscription found</Alert>
              )}
            </Box>
          )}

          {tabValue === 3 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Transactional email (Resend)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Used for counter-offer notifications and team invites. Configure env vars on Vercel —
                not in the browser.
              </Typography>
              <EmailStatusPanel />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

function EmailStatusPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['email-status'],
    queryFn: async () => {
      const res = await fetch('/api/system/email-status');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <Typography>Checking…</Typography>;
  if (error || !data) return <Alert severity="error">Could not load email status</Alert>;

  return (
    <Box>
      <Alert severity={data.configured ? 'success' : 'warning'} sx={{ mb: 2 }}>
        {data.configured
          ? `Configured · from ${data.from}`
          : `Not configured. Missing: ${(data.missing || []).join(', ') || 'RESEND_API_KEY'}`}
      </Alert>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {data.hint}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', mb: 2 }}>
        RESEND_API_KEY=re_…{'\n'}
        ROWFLOW_EMAIL_FROM=&quot;ROWFlow &lt;noreply@your-domain&gt;&quot;
      </Typography>
      <Button size="small" variant="outlined" onClick={() => refetch()}>
        Refresh status
      </Button>
    </Box>
  );
}
