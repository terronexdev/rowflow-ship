'use client';

import {
  Alert,
  Box,
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

export type BudgetVsActualRow = {
  key: string;
  label: string;
  budget: number;
  actual: number;
  variance: number;
};

export default function BudgetVsActualPanel({
  rows,
  laborBudget,
  laborActual,
  laborVariance,
  note,
}: {
  rows: BudgetVsActualRow[];
  laborBudget?: number;
  laborActual?: number;
  laborVariance?: number;
  note?: string;
}) {
  const chartData = rows.map((r) => ({
    name: r.label,
    Budget: r.budget,
    Actual: r.actual,
  }));

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Budget vs actual
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        {note ||
          'Land actual = accepted offers. Labor cats = billable cost TIME/FEE by discipline. Expenses & mileage from cost ledger.'}
      </Typography>
      {chartData.length === 0 ? (
        <Alert severity="info">No budget lines or actuals yet. Add budget on Project Edit.</Alert>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={56} />
            <YAxis tickFormatter={(v) => `$${v}`} width={64} />
            <Tooltip formatter={(v: number) => formatMoney(v)} />
            <Legend />
            <Bar dataKey="Budget" fill="#64b5f6" />
            <Bar dataKey="Actual" fill="#81c784" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <Table size="small" sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell align="right">Budget</TableCell>
            <TableCell align="right">Actual</TableCell>
            <TableCell align="right">Variance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell>{r.label}</TableCell>
              <TableCell align="right">{formatMoney(r.budget)}</TableCell>
              <TableCell align="right">{formatMoney(r.actual)}</TableCell>
              <TableCell
                align="right"
                sx={{ color: r.variance > 0 ? 'warning.main' : r.variance < 0 ? 'success.main' : undefined }}
              >
                {formatMoney(r.variance)}
              </TableCell>
            </TableRow>
          ))}
          {laborBudget != null && (
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>
                Labor (all discipline labor budgets vs actual)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatMoney(laborBudget)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatMoney(laborActual || 0)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatMoney(laborVariance || 0)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
