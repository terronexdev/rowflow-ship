'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';

export default function KpiStatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ color: color || 'primary.main', fontWeight: 700, my: 0.5 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
