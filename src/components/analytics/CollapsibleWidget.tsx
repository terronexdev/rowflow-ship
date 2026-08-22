'use client';

import { useState } from 'react';
import { Box, Collapse, IconButton, Paper, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

type Props = {
  id: string;
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
  hidden?: boolean;
  onToggleCollapse: (id: string) => void;
  onHide?: (id: string) => void;
  /** optional border accent */
  borderColor?: string;
};

/** Lightweight collapsible dashboard panel (no full drag grid yet). */
export default function CollapsibleWidget({
  id,
  title,
  children,
  collapsed,
  hidden,
  onToggleCollapse,
  onHide,
  borderColor,
}: Props) {
  if (hidden) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 0,
        height: collapsed ? 'auto' : '100%',
        borderColor: borderColor || 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderBottom: collapsed ? 0 : 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography fontWeight={700} variant="subtitle2">
          {title}
        </Typography>
        <Box>
          {onHide && (
            <IconButton size="small" aria-label="Hide widget" onClick={() => onHide(id)} title="Hide">
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
            onClick={() => onToggleCollapse(id)}
          >
            {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={!collapsed}>
        <Box sx={{ p: 2 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}

const PREFS_KEY = 'rowflow.dashboardWidgets';

export type DashboardWidgetPrefs = {
  collapsed: Record<string, boolean>;
  hidden: Record<string, boolean>;
};

export const DEFAULT_WIDGET_PREFS: DashboardWidgetPrefs = {
  collapsed: {},
  hidden: {},
};

export function loadWidgetPrefs(): DashboardWidgetPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { collapsed: {}, hidden: {} };
    const parsed = JSON.parse(raw);
    return {
      collapsed: parsed.collapsed || {},
      hidden: parsed.hidden || {},
    };
  } catch {
    return { collapsed: {}, hidden: {} };
  }
}

export function saveWidgetPrefs(prefs: DashboardWidgetPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
