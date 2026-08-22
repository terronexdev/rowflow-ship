import { createTheme } from '@mui/material/styles';

/** Terronex suite tokens — aligned with Tractsource app chrome */
export const terronex = {
  bg: '#050505',
  panel: '#0a0f1d',
  panelAlt: '#070b14',
  border: 'rgba(255,255,255,0.08)',
  text: '#e4e4e7',
  muted: '#a1a1aa',
  faint: '#52525b',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  ok: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
} as const;

export const terronexTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: terronex.accent,
      light: '#60a5fa',
      dark: terronex.accentHover,
      contrastText: '#ffffff',
    },
    secondary: {
      main: terronex.ok,
      contrastText: '#04110c',
    },
    error: { main: terronex.danger },
    warning: { main: terronex.warn },
    success: { main: terronex.ok },
    info: { main: terronex.accent },
    background: {
      default: terronex.bg,
      paper: terronex.panel,
    },
    text: {
      primary: terronex.text,
      secondary: terronex.muted,
      disabled: terronex.faint,
    },
    divider: terronex.border,
    action: {
      hover: 'rgba(59,130,246,0.08)',
      selected: 'rgba(59,130,246,0.16)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 650, letterSpacing: '-0.02em' },
    h5: { fontWeight: 650, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: {
      letterSpacing: '0.06em',
      fontSize: '0.7rem',
      color: terronex.muted,
    },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: terronex.bg,
          color: terronex.text,
        },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: terronex.panelAlt },
        '::-webkit-scrollbar-thumb': {
          background: '#2a3548',
          borderRadius: 4,
        },
        '::-webkit-scrollbar-thumb:hover': { background: '#3b4a63' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${terronex.border}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: terronex.panel,
          borderBottom: `1px solid ${terronex.border}`,
          color: terronex.text,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: terronex.panel,
          borderRight: `1px solid ${terronex.border}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 36,
          px: 1.5,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: terronex.border,
        },
      },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiFormControl: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        select: {
          py: 1,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(59,130,246,0.16)',
            '&:hover': { backgroundColor: 'rgba(59,130,246,0.22)' },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 42,
          fontWeight: 600,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 56,
          gap: 8,
          flexWrap: 'wrap',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          border: `1px solid ${terronex.border}`,
        },
      },
    },
  },
});
