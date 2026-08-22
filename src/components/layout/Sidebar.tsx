'use client';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import Link from 'next/link';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const drawerWidth = 232;

const navItems = [
  { text: 'Dashboard', href: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { text: 'Projects', href: '/projects', icon: <FolderIcon fontSize="small" /> },
  { text: 'Activity', href: '/activity', icon: <NotificationsActiveIcon fontSize="small" />, badge: true },
  { text: 'Analytics', href: '/analytics', icon: <BarChartIcon fontSize="small" /> },
  { text: 'Settings', href: '/settings', icon: <SettingsIcon fontSize="small" /> },
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { status } = useSession();

  const { data: unread } = useQuery({
    queryKey: ['activity-unread'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/activity/unread', { credentials: 'same-origin' });
        if (!res.ok) return { count: 0 };
        const data = await res.json();
        const count = Number(data?.count);
        return { count: Number.isFinite(count) ? count : 0 };
      } catch {
        return { count: 0 };
      }
    },
    enabled: status === 'authenticated',
    refetchInterval: 60_000,
  });

  const unreadCount = Math.max(0, Number(unread?.count) || 0);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 2.25 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.2 }}
        >
          ROWFlow
        </Typography>
        <Typography variant="caption" color="text.secondary">
          by Terronex
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          const selected =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const icon =
            item.badge && unreadCount > 0 ? (
              <Badge
                color="error"
                badgeContent={unreadCount > 99 ? '99+' : unreadCount}
                max={99}
              >
                {item.icon}
              </Badge>
            ) : (
              item.icon
            );
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={selected}
                onClick={isMobile ? onClose : undefined}
              >
                <ListItemIcon sx={{ minWidth: 36, color: selected ? 'primary.main' : 'text.secondary' }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Suite
        </Typography>
        <Typography
          component="a"
          href="https://tractsource.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          variant="caption"
          sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
        >
          Tractsource ↗
        </Typography>
      </Box>
    </Box>
  );

  // Persistent drawer must not keep reserving width when closed (map needs the space)
  const openWidth = isOpen ? drawerWidth : 0;

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isOpen}
      onClose={onClose}
      sx={{
        width: isMobile ? drawerWidth : openWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: (theme) =>
            theme.transitions.create('transform', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
