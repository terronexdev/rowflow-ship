'use client';

import {
  Alert,
  Chip,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { formatMoney } from '@/components/analytics/KpiStatCard';

export type OutsideRangeOffer = {
  id: string;
  total: number;
  rangeLow: number;
  rangeHigh: number;
  negotiatedAmount: number;
  decision: string;
  reason: string | null;
  createdAt: string;
  parcelId: string;
  parcelNumber: string | null;
  owner: string | null;
  projectId: string;
  projectName: string;
};

export default function OutsideRangeTable({
  offers,
  ratePct,
  count,
}: {
  offers: OutsideRangeOffer[];
  ratePct?: number;
  count?: number;
}) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Outside-range offers
        {count != null ? ` (${count})` : ''}
        {ratePct != null ? ` · ${ratePct}% of offers` : ''}
      </Typography>
      {offers.length === 0 ? (
        <Alert severity="success" variant="outlined">
          No outside-range offers in scope.
        </Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Parcel</TableCell>
              <TableCell align="right">Range</TableCell>
              <TableCell align="right">Negotiated</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Decision</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell>
                  <MuiLink component={NextLink} href={`/projects/${o.projectId}`} underline="hover">
                    {o.projectName}
                  </MuiLink>
                </TableCell>
                <TableCell>
                  <MuiLink
                    component={NextLink}
                    href={`/projects/${o.projectId}/parcels/${o.parcelId}/edit`}
                    underline="hover"
                  >
                    {o.parcelNumber || o.parcelId.slice(0, 8)}
                  </MuiLink>
                  {o.owner ? (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {o.owner}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell align="right">
                  {formatMoney(o.rangeLow)} – {formatMoney(o.rangeHigh)}
                </TableCell>
                <TableCell align="right">{formatMoney(o.negotiatedAmount)}</TableCell>
                <TableCell align="right">{formatMoney(o.total)}</TableCell>
                <TableCell>
                  <Chip size="small" label={o.decision} variant="outlined" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
