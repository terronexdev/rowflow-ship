'use client';

import { Box, Typography, Card, CardContent, Button, TextField, Divider } from '@mui/material';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>
      <Card sx={{ minWidth: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>Sign In</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => handleOAuthSignIn('google')}
            >
              Sign in with Google
            </Button>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => handleOAuthSignIn('github')}
            >
              Sign in with GitHub
            </Button>
          </Box>
          <Divider sx={{ my: 2 }}>OR</Divider>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email" type="email" required />
            <TextField label="Password" type="password" required />
            <Button type="submit" variant="contained" color="primary">Sign In</Button>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        By continuing you agree to our{' '}
        <Link href="/terms" style={{ color: 'var(--tx-accent)' }}>Terms of Service</Link> and{' '}
        <Link href="/privacy" style={{ color: 'var(--tx-accent)' }}>Privacy Policy</Link>.
      </Typography>

          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Don't have an account? <Link href="/register" style={{ color: 'var(--tx-accent)' }}>Sign Up</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
