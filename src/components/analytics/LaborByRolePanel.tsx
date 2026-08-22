'use client';

import {
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@/components/analytics/KpiStatCard';

export type LaborRoleRow = {
  role: string;
  label: string;
  hours: number;
  amount: number;
  count: number;
  hoursPerAcquired: number;
};

export default function LaborByRolePanel({ rows }: { rows: LaborRoleRow[] }) {
  const hasData = rows.some((r) => r.hours > 0 || r.amount > 0);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Labor by role
      </Typography>
      {!hasData ? (
        <Alert severity="info">No labor entries yet.</Alert>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="h" orientation="left" allowDecimals={false} />
            <YAxis yAxisId="a" orientation="right" tickFormatter={(v) => `$${v}`} width={56} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === 'amount' ? formatMoney(value) : value
              }
            />
            <Legend />
            <Bar yAxisId="h" dataKey="hours" name="Hours" fill="#42a5f5" />
            <Bar yAxisId="a" dataKey="amount" name="Amount $" fill="#ab47bc" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <Table size="small" sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell align="right">Hours</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Entries</TableCell>
            <TableCell align="right">Hrs / acquired</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.role}>
              <TableCell>{r.label}</TableCell>
              <TableCell align="right">{r.hours}</TableCell>
              <TableCell align="right">{formatMoney(r.amount)}</TableCell>
              <TableCell align="right">{r.count}</TableCell>
              <TableCell align="right">{r.hoursPerAcquired}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
