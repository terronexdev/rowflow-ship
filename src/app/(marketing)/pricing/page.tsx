'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { FONT_SERIF, terronex } from '@/lib/theme';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { SUBSCRIPTION_TIERS } from '@/lib/constants/subscription';
import { Suspense } from 'react';

function PricingInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pro = SUBSCRIPTION_TIERS.PRO;
  const enterprise = SUBSCRIPTION_TIERS.ENTERPRISE;

  const startCheckout = async () => {
    setError(null);
    setInfo(null);
    if (status !== 'authenticated') {
      window.location.href = '/register?next=/pricing';
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.comped) {
        setInfo(data.message || 'Your Terronex account includes Pro.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: terronex.bg, color: terronex.text }}>
      <Box sx={{ borderBottom: `1px solid ${terronex.border}` }}>
        <Container maxWidth="lg" sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button component={Link} href="/" color="inherit" sx={{ fontWeight: 700 }}>
            ROWFlow
          </Button>
          <Stack direction="row" spacing={1}>
            <ThemeToggle />
            <Button component={Link} href="/login" color="inherit" size="small">
              Sign in
            </Button>
            <Button component={Link} href="/register" variant="contained" size="small">
              Create account
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          fontWeight={700}
          align="center"
          gutterBottom
          letterSpacing="-0.03em"
          sx={{ fontFamily: FONT_SERIF }}
        >
          Pro. Enterprise.
        </Typography>
        <Typography align="center" sx={{ color: terronex.muted, mb: 4, maxWidth: 560, mx: 'auto' }}>
          One clear Pro seat for ROWFlow plus Tractsource. Enterprise when you need SSO, volume, or a
          custom contract.
        </Typography>

        {canceled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Checkout canceled — you can restart anytime.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
            {info}{' '}
            <Link href="/dashboard" style={{ color: 'inherit' }}>
              Go to dashboard
            </Link>
          </Alert>
        )}

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                height: '100%',
                bgcolor: terronex.panel,
                borderColor: 'primary.main',
                boxShadow: `0 0 0 1px ${terronex.accent}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="overline" color="primary.light">
                  Recommended
                </Typography>
                <Chip size="small" color="primary" label="Suite" />
              </Stack>
              <Typography variant="h4" fontWeight={700}>
                Pro
              </Typography>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                ${pro.price}
                <span style={{ fontSize: 16, color: terronex.muted }}>/month</span>
              </Typography>
              <Typography variant="body2" sx={{ color: terronex.muted, mb: 2 }}>
                Includes Tractsource suite seat for the same email.
              </Typography>
              <List dense>
                {pro.features.map((f) => (
                  <ListItem key={f} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={f} />
                  </ListItem>
                ))}
              </List>
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 2 }}
                disabled={loading}
                onClick={startCheckout}
              >
                {loading
                  ? 'Redirecting…'
                  : status === 'authenticated'
                    ? 'Subscribe with Stripe'
                    : 'Create account · Pro'}
              </Button>
              {session?.user?.email && (
                <Typography variant="caption" display="block" sx={{ mt: 1, color: terronex.faint }}>
                  Signed in as {session.user.email}
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{ p: 3, height: '100%', bgcolor: terronex.panel, borderColor: terronex.border }}
            >
              <Typography variant="overline" color="text.secondary">
                Custom
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                Enterprise
              </Typography>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Contact us
              </Typography>
              <List dense>
                {enterprise.features.map((f) => (
                  <ListItem key={f} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleOutlineIcon fontSize="small" color="disabled" />
                    </ListItemIcon>
                    <ListItemText primary={f} />
                  </ListItem>
                ))}
              </List>
              <Button
                component="a"
                href="mailto:support@terronex.dev?subject=ROWFlow%20Enterprise"
                fullWidth
                variant="outlined"
                color="inherit"
                sx={{ mt: 2 }}
              >
                Email sales
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Typography align="center" variant="body2" sx={{ color: terronex.faint, mt: 4 }}>
          Questions? Email support@terronex.dev ·{' '}
          <Link href="/terms" style={{ color: 'var(--tx-accent)' }}>Terms</Link> ·{' '}
          <Link href="/privacy" style={{ color: 'var(--tx-accent)' }}>Privacy</Link>
        </Typography>
      </Container>
    </Box>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 6, textAlign: 'center' }}>Loading…</Box>}>
      <PricingInner />
    </Suspense>
  );
}
