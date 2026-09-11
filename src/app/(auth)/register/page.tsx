'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import ThemeToggle from '@/components/layout/ThemeToggle';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';
  const prefillEmail = searchParams.get('email') || '';
  const next = searchParams.get('next') || '/dashboard';

  const [form, setForm] = useState({
    name: '',
    email: prefillEmail,
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefillEmail) setForm((f) => ({ ...f, email: prefillEmail }));
  }, [prefillEmail]);

  const callbackUrl = inviteToken
    ? `/register?invite=${encodeURIComponent(inviteToken)}${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ''}`
    : next.startsWith('/') ? next : '/dashboard';

  const handleOAuth = (provider: 'google' | 'github') => {
    // After OAuth, pending invites matching this email attach automatically (auth events).
    const after =
      inviteToken || prefillEmail
        ? '/dashboard'
        : next.startsWith('/')
          ? next
          : '/dashboard';
    signIn(provider, { callbackUrl: after });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          inviteToken: inviteToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      const login = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (login?.error) {
        router.push('/login');
        return;
      }
      router.push(next.startsWith('/') ? next : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ minWidth: 360, maxWidth: 440, width: '100%', p: 1 }}>
      <CardContent>
        <Typography variant="h4" align="center" gutterBottom>
          Create account
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Create your ROWFlow account — Google is fastest. Pro is $99/month after signup.
        </Typography>
        {inviteToken && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You&apos;re joining a ROWFlow project invite for{' '}
            <strong>{prefillEmail || 'the invited email'}</strong>. Use Google with that same
            address, or sign up with email/password below.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => handleOAuth('google')}
            fullWidth
          >
            Continue with Google
          </Button>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={() => handleOAuth('github')}
            fullWidth
          >
            Continue with GitHub
          </Button>
          <Divider sx={{ my: 1 }}>OR email</Divider>
        </Box>
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Full Name" name="name" value={form.name} onChange={onChange} required />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            disabled={Boolean(prefillEmail && inviteToken)}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
          />
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            required
          />
          <Button type="submit" variant={inviteToken ? 'contained' : 'outlined'} color="primary" disabled={loading}>
            {loading ? 'Creating…' : inviteToken ? 'Accept invite & sign up' : 'Sign up with email'}
          </Button>
          <Typography variant="caption" color="text.secondary" display="block">
            By continuing you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--tx-accent)' }}>Terms of Service</Link> and{' '}
            <Link href="/privacy" style={{ color: 'var(--tx-accent)' }}>Privacy Policy</Link>.
          </Typography>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--tx-accent)' }}>Sign in</Link>
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>
      <Suspense fallback={<CircularProgress />}>
        <RegisterForm />
      </Suspense>
    </Box>
  );
}
