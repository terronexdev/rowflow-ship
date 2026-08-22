'use client';

import { type ReactNode } from 'react';
import { Box, Chip } from '@mui/material';

/** Humanize ENUM_STATUS → Enum status */
export function fmtStatus(value?: string | null) {
  if (!value) return 'Not started';
  return value.replaceAll('_', ' ');
}

/** Chip color hint from common status tokens */
export function statusChipColor(
  value?: string | null
): 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' {
  const v = (value || 'NOT_STARTED').toUpperCase();
  if (v === 'NOT_STARTED') return 'default';
  if (
    v === 'COMPLETE' ||
    v === 'FINAL' ||
    v === 'ACQUIRED' ||
    v === 'GRANTED' ||
    v === 'POSSESSION_GRANTED'
  )
    return 'success';
  if (v === 'HOLD' || v === 'ON_HOLD' || v === 'CURATIVE' || v === 'PENDING_REVIEW') return 'warning';
  if (v === 'DENIED' || v === 'CONDEMNED' || v === 'REJECTED') return 'error';
  if (v === 'IN_PROGRESS' || v === 'NEGOTIATING' || v === 'ORDERED' || v === 'FIELD_WORK')
    return 'info';
  return 'primary';
}

type SChipProps = {
  label: string;
  /** Emphasize primary status */
  statusValue?: string | null;
  filled?: boolean;
  /** Grow to fill remaining header width */
  fill?: boolean;
};

/** Compact summary chip for collapsible section headers */
export function SChip({ label, statusValue, filled, fill }: SChipProps) {
  const color = statusValue != null ? statusChipColor(statusValue) : 'default';
  const isIdle = !statusValue || statusValue === 'NOT_STARTED';
  return (
    <Chip
      size="small"
      label={label}
      color={filled || (!isIdle && statusValue) ? color : 'default'}
      variant={filled || (!isIdle && statusValue && color !== 'default') ? 'filled' : 'outlined'}
      sx={{
        flex: fill ? '1 1 auto' : '0 1 auto',
        minWidth: fill ? 80 : 0,
        maxWidth: fill ? 'none' : 320,
        height: 24,
        '& .MuiChip-label': {
          px: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem',
        },
      }}
    />
  );
}

/** Full-width one-line (or wrapping) summary row under section title */
export function SummaryLine({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        width: '100%',
        alignItems: 'center',
        // Prefer single visual row; wrap only if needed
        rowGap: 0.5,
      }}
    >
      {children}
    </Box>
  );
}

export function dash(v?: string | number | null) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
