'use client';

import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Chip, Paper } from '@mui/material';
import { openParcelSection } from '@/components/parcel/CollapsibleSection';

export type SectionNavItem = {
  id: string;
  label: string;
};

interface Props {
  sections: SectionNavItem[];
  storagePrefix?: string;
}

/**
 * Sticky jump nav for parcel edit sections.
 * Expand all / Collapse all toggles localStorage + reload open state via hash ping.
 */
export default function ParcelSectionNav({
  sections,
  storagePrefix = 'rowflow.parcelSection',
}: Props) {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: [0.1, 0.25, 0.5] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const setAll = (open: boolean) => {
    for (const s of sections) {
      try {
        localStorage.setItem(`${storagePrefix}.${s.id}`, open ? '1' : '0');
      } catch {
        /* ignore */
      }
    }
    // Force sections to re-read: dispatch a custom event
    window.dispatchEvent(new CustomEvent('rowflow-sections-toggle', { detail: { open } }));
    if (!open) {
      // clear hash noise
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        px: 1.5,
        py: 1,
        mb: 1,
        mt: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flex: 1, minWidth: 0 }}>
        {sections.map((s) => (
          <Chip
            key={s.id}
            size="small"
            label={s.label}
            color={active === s.id ? 'primary' : 'default'}
            variant={active === s.id ? 'filled' : 'outlined'}
            onClick={() => openParcelSection(s.id, storagePrefix)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      <ButtonGroup size="small" variant="outlined">
        <Button onClick={() => setAll(true)}>Expand all</Button>
        <Button onClick={() => setAll(false)}>Collapse all</Button>
      </ButtonGroup>
    </Paper>
  );
}
