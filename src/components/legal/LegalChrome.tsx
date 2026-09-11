'use client';

import Link from 'next/link';
import { Box, Container, Typography, Stack, Divider } from '@mui/material';
import { FONT_SERIF, terronex } from '@/lib/theme';
import ThemeToggle from '@/components/layout/ThemeToggle';

export function LegalChrome({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: terronex.bg, color: terronex.text }}>
      <Box sx={{ borderBottom: `1px solid ${terronex.border}` }}>
        <Container
          maxWidth="md"
          sx={{
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography fontWeight={700}>
            Terronex{' '}
            <Typography component="span" sx={{ color: terronex.muted, fontSize: 12, fontWeight: 500 }}>
              legal
            </Typography>
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ fontSize: 13, color: terronex.muted }}>
            <ThemeToggle />
            <Link href="/" style={{ color: 'inherit' }}>
              Home
            </Link>
            <Link href="/terms" style={{ color: 'inherit' }}>
              Terms
            </Link>
            <Link href="/privacy" style={{ color: 'inherit' }}>
              Privacy
            </Link>
            <Link href="/pricing" style={{ color: 'inherit' }}>
              Pricing
            </Link>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 1, fontFamily: FONT_SERIF }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: terronex.faint, mb: 3 }}>
          Effective: August 29, 2026 · Terronex LLC · ROWFlow &amp; Tractsource
        </Typography>
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${terronex.border}`,
            bgcolor: terronex.panel,
            color: terronex.muted,
            fontSize: 14,
          }}
        >
          These pages are the same Terronex suite legal terms used across ROWFlow and Tractsource.
          Contact{' '}
          <a href="mailto:support@terronex.dev" style={{ color: 'var(--tx-accent)' }}>
            support@terronex.dev
          </a>
          .
        </Box>
        <Box
          sx={{
            color: terronex.muted,
            fontSize: 15,
            lineHeight: 1.65,
            '& h2': { color: terronex.text, fontSize: 18, mt: 3.5, mb: 1.25, fontWeight: 700 },
            '& p': { mb: 1.5 },
            '& ul': { pl: 2.5, mb: 1.5 },
            '& li': { mb: 0.75 },
            '& strong': { color: terronex.text, fontWeight: 600 },
            '& a': { color: 'var(--tx-accent)' },
          }}
        >
          {children}
        </Box>
        <Divider sx={{ my: 4, borderColor: terronex.border }} />
        <Typography variant="caption" sx={{ color: terronex.faint }}>
          © {new Date().getFullYear()} Terronex LLC ·{' '}
          <Link href="/terms" style={{ color: 'inherit' }}>
            Terms
          </Link>{' '}
          ·{' '}
          <Link href="/privacy" style={{ color: 'inherit' }}>
            Privacy
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}
