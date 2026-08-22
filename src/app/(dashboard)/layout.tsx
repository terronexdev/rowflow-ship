"use client";

import { useEffect, useRef, useState } from 'react';
import { Box, useMediaQuery, Theme } from '@mui/material';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

const SIDEBAR_PREF_KEY = 'rowflow.sidebarOpen';

/** Project map workbench: /projects/{id} (not list, new, edit, report, import, …) */
function isProjectMapPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  // ['projects', '{id}']
  return parts.length === 2 && parts[0] === 'projects' && parts[1] !== 'new';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const pathname = usePathname() || '/';
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  const prefBeforeMap = useRef<boolean | null>(null);
  const lastMapPath = useRef(false);

  // Hydrate desktop preference once
  useEffect(() => {
    if (isMobile) return;
    try {
      const v = localStorage.getItem(SIDEBAR_PREF_KEY);
      if (v === '0') setSidebarOpen(false);
      if (v === '1') setSidebarOpen(true);
    } catch {
      /* ignore */
    }
  }, [isMobile]);

  // Auto-collapse nav on project map for max map width; restore when leaving
  useEffect(() => {
    if (isMobile) return;
    const onMap = isProjectMapPath(pathname);
    if (onMap && !lastMapPath.current) {
      prefBeforeMap.current = isSidebarOpen;
      setSidebarOpen(false);
    } else if (!onMap && lastMapPath.current) {
      if (prefBeforeMap.current !== null) {
        setSidebarOpen(prefBeforeMap.current);
      }
      prefBeforeMap.current = null;
    }
    lastMapPath.current = onMap;
    // only react to route / mobile — not to isSidebarOpen (would fight user toggle on map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (!isMobile) {
        try {
          localStorage.setItem(SIDEBAR_PREF_KEY, next ? '1' : '0');
        } catch {
          /* ignore */
        }
        // If user opens nav while on map, treat that as intentional override
        if (isProjectMapPath(pathname)) {
          prefBeforeMap.current = next;
        }
      }
      return next;
    });
  };

  const mapMode = !isMobile && isProjectMapPath(pathname);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarToggle} isMobile={isMobile} />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          // When sidebar collapses, main must reclaim width immediately
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Header onSidebarToggle={handleSidebarToggle} sidebarOpen={isSidebarOpen} mapMode={mapMode} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: mapMode ? 0 : { xs: 1.5, sm: 2 },
            overflowY: mapMode ? 'hidden' : 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
