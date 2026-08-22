'use client';

import { useCallback, useEffect, useState, type ReactNode, type MouseEvent } from 'react';
import { Box, Collapse, IconButton, Paper, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

function storageKey(id: string, prefix: string) {
  return `${prefix}.${id}`;
}

function readStored(id: string, prefix: string): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(storageKey(id, prefix));
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStored(id: string, prefix: string, open: boolean) {
  try {
    localStorage.setItem(storageKey(id, prefix), open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export type CollapsibleSectionProps = {
  id: string;
  title: string;
  /** Full-width summary strip under the title (chips / key facts) */
  summary?: ReactNode;
  defaultOpen?: boolean;
  storagePrefix?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Collapsible paper section for parcel edit.
 * Header: chevron + title + actions on row 1; summary strip full width on row 2.
 */
export default function CollapsibleSection({
  id,
  title,
  summary,
  defaultOpen = false,
  storagePrefix = 'rowflow.parcelSection',
  actions,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored(id, storagePrefix);
    const hash =
      typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
    if (hash === id) {
      setOpen(true);
    } else if (stored !== null) {
      setOpen(stored);
    } else {
      setOpen(defaultOpen);
    }
    setHydrated(true);
  }, [id, storagePrefix, defaultOpen]);

  useEffect(() => {
    if (!hydrated) return;
    const onToggleAll = (ev: Event) => {
      const next = Boolean((ev as CustomEvent).detail?.open);
      setOpen(next);
      writeStored(id, storagePrefix, next);
    };
    window.addEventListener('rowflow-sections-toggle', onToggleAll);
    return () => window.removeEventListener('rowflow-sections-toggle', onToggleAll);
  }, [hydrated, id, storagePrefix]);

  useEffect(() => {
    if (!hydrated) return;
    const onHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash === id) {
        setOpen(true);
        writeStored(id, storagePrefix, true);
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    };
    window.addEventListener('hashchange', onHash);
    if (window.location.hash.replace(/^#/, '') === id) {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, [hydrated, id, storagePrefix]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      writeStored(id, storagePrefix, next);
      return next;
    });
  }, [id, storagePrefix]);

  const onActionsClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Paper
      id={id}
      sx={{
        mt: 3,
        overflow: 'hidden',
        scrollMarginTop: 72,
      }}
      elevation={1}
    >
      <Box
        onClick={toggle}
        sx={{
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          bgcolor: open ? 'action.hover' : 'background.paper',
          borderBottom: open ? 1 : 0,
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontSize: '1.05rem', lineHeight: 1.3, flex: '0 0 auto' }}
          >
            {title}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {actions ? (
            <Box
              onClick={onActionsClick}
              sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}
            >
              {actions}
            </Box>
          ) : null}
        </Box>
        {summary ? (
          <Box
            sx={{
              pl: 5, // align under title past chevron
              pr: 0.5,
              pt: 0.75,
              width: '100%',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {summary}
          </Box>
        ) : null}
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit={false}>
        <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}

export function openParcelSection(id: string, storagePrefix = 'rowflow.parcelSection') {
  try {
    localStorage.setItem(storageKey(id, storagePrefix), '1');
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.location.hash = id;
  }
}
