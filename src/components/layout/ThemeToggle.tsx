'use client';

import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useColorScheme } from '@/components/providers/ColorSchemeProvider';
import type { ColorSchemePreference } from '@/lib/colorScheme';

const OPTIONS: Array<{ value: ColorSchemePreference; label: string; icon: React.ReactNode }> = [
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> },
];

export default function ThemeToggle({ edge = false }: { edge?: boolean }) {
  const { preference, setPreference } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];

  return (
    <>
      <Tooltip title={`Theme: ${current.label}`}>
        <IconButton
          color="inherit"
          aria-label="Color scheme"
          aria-haspopup="true"
          edge={edge ? 'end' : false}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {current.icon}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {OPTIONS.map((opt) => (
          <MenuItem
            key={opt.value}
            selected={preference === opt.value}
            onClick={() => {
              setPreference(opt.value);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon sx={{ color: preference === opt.value ? 'primary.main' : 'text.secondary' }}>
              {opt.icon}
            </ListItemIcon>
            <ListItemText primary={opt.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
