'use client';

import Link from 'next/link';
import { Typography } from '@mui/material';

/** Short in-app GIS / mapping disclaimer. Full text lives on /terms. */
export function GisDisclaimer({ dense = false }: { dense?: boolean }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        color: 'text.secondary',
        lineHeight: 1.4,
        px: dense ? 0 : 1.5,
        py: dense ? 0 : 0.75,
      }}
    >
      GIS, basemaps, and map notes are planning tools — not a survey, title, legal description, or
      agency filing.{' '}
      <Link href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>
        Terms
      </Link>
    </Typography>
  );
}
