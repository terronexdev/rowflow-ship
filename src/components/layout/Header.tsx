'use client';

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen?: boolean;
  /** Project map workbench — slightly denser chrome */
  mapMode?: boolean;
}

function titleFromPath(pathname: string): string {
  if (pathname.startsWith('/activity')) return 'Activity';
  if (pathname.startsWith('/projects/') && pathname.includes('/report')) return 'Project report';
  if (pathname.startsWith('/projects/') && pathname.includes('/import')) return 'Import';
  if (pathname.startsWith('/projects/') && pathname.includes('/export')) return 'Export';
  if (pathname.startsWith('/projects/') && pathname.includes('/parcels')) return 'Parcel';
  if (pathname.startsWith('/projects/') && pathname.includes('/edit')) return 'Edit project';
  if (pathname.startsWith('/projects/') && pathname !== '/projects' && pathname !== '/projects/new')
    return 'Project map';
  if (pathname.startsWith('/projects/new')) return 'New project';
  if (pathname.startsWith('/projects')) return 'Projects';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  return 'ROWFlow';
}

export default function Header({
  onSidebarToggle,
  sidebarOpen = true,
  mapMode = false,
}: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname() || '/';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const toggleLabel = sidebarOpen ? 'Collapse navigation' : 'Expand navigation';

  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar
        sx={{
          gap: 1,
          minHeight: { xs: 52, sm: mapMode ? 48 : 56 },
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Tooltip title={toggleLabel}>
          <IconButton
            color="inherit"
            aria-label={toggleLabel}
            edge="start"
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 650 }}>
            {titleFromPath(pathname)}
          </Typography>
          {mapMode && !sidebarOpen && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
              Nav collapsed for map — click ☰ to restore
            </Typography>
          )}
        </Box>
        <Chip
          size="small"
          label="Terronex"
          variant="outlined"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            borderColor: 'divider',
            color: 'text.secondary',
            height: 26,
          }}
        />
        <Box sx={{ flexGrow: 0 }}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.25 }}>
            <Avatar
              alt={session?.user?.name || 'User'}
              src={session?.user?.image || ''}
              sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}
            >
              {(session?.user?.name || session?.user?.email || 'U').slice(0, 1).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ opacity: 1, fontSize: 13 }}>
              {session?.user?.email || 'Signed in'}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                signOut({ callbackUrl: '/' });
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
