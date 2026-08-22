'use client';

import { Alert, List, ListItem, ListItemText, Paper, Typography, Box, Chip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export type AlertsData = {
  outsideRangeOffers: number;
  pastDuePhases: number;
  projectsMissingManager: number;
  projectsMissingLead: number;
  highLaborVarianceProjects: number;
};

export default function AlertsList({
  alerts,
  lateSamples,
}: {
  alerts: AlertsData;
  lateSamples?: Array<{ projectName: string; label: string; endDate: string | null }>;
}) {
  const items: string[] = [];
  if (alerts.outsideRangeOffers > 0) {
    items.push(`${alerts.outsideRangeOffers} outside-range compensation offer(s)`);
  }
  if (alerts.pastDuePhases > 0) {
    items.push(`${alerts.pastDuePhases} schedule phase(s) past end date`);
  }
  if (alerts.projectsMissingManager > 0) {
    items.push(`${alerts.projectsMissingManager} project(s) missing Manager`);
  }
  if (alerts.projectsMissingLead > 0) {
    items.push(`${alerts.projectsMissingLead} project(s) missing Lead Agent`);
  }
  if (alerts.highLaborVarianceProjects > 0) {
    items.push(
      `${alerts.highLaborVarianceProjects} project(s) over labor budget (>25%)`
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <WarningAmberIcon color={items.length ? 'warning' : 'disabled'} fontSize="small" />
        <Typography variant="h6">Attention</Typography>
        {items.length > 0 && <Chip size="small" color="warning" label={items.length} />}
      </Box>
      {items.length === 0 ? (
        <Alert severity="success" variant="outlined">
          No operational alerts right now.
        </Alert>
      ) : (
        <>
          <List dense>
            {items.map((text) => (
              <ListItem key={text} sx={{ py: 0.25 }}>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          {lateSamples && lateSamples.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Past-due samples
              </Typography>
              {lateSamples.slice(0, 5).map((s, i) => (
                <Typography key={i} variant="body2" color="warning.main">
                  {s.projectName}: {s.label}
                  {s.endDate ? ` (ended ${new Date(s.endDate).toLocaleDateString()})` : ''}
                </Typography>
              ))}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
