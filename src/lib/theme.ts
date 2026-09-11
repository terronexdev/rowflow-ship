import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ResolvedColorScheme } from './colorScheme';

/** Land brand tokens — terronex.land teal / snow / charcoal */
export const land = {
  teal: '#0F766E',
  tealSoft: '#CCFBF1',
  tealHover: '#0D9488',
  charcoal: '#15202B',
  ink: '#0F172A',
  slate: '#475569',
  snow: '#F8FAFC',
  white: '#FFFFFF',
  line: '#E2E8F0',
  lineSoft: '#F1F5F9',
  radius: 8,
  ok: '#059669',
  warn: '#D97706',
  danger: '#DC2626',
  darkBg: '#0B1220',
  darkPanelAlt: '#1E293B',
  darkMuted: '#94A3B8',
  darkBorder: 'rgba(226,232,240,0.12)',
  darkSoft: 'rgba(15,118,110,0.22)',
  darkHover: '#14B8A6',
} as const;

/** Map tool / selection accent — teal retint of the former blue chrome */
export const MAP_ACCENT = land.teal;

export const FONT_SANS =
  'var(--font-sans), "Source Sans 3", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_SERIF = 'var(--font-serif), "Source Serif 4", Georgia, "Times New Roman", serif';

/**
 * CSS-var aliases so marketing / chrome follow `data-theme` without a JS flash.
 * Prefer these in `sx` for surfaces and copy.
 */
export const terronex = {
  bg: 'var(--tx-bg)',
  panel: 'var(--tx-paper)',
  panelAlt: 'var(--tx-panel-alt)',
  sidebar: 'var(--tx-sidebar)',
  border: 'var(--tx-border)',
  text: 'var(--tx-text)',
  muted: 'var(--tx-muted)',
  faint: 'var(--tx-faint)',
  accent: 'var(--tx-accent)',
  accentHover: 'var(--tx-accent-hover)',
  accentSoft: 'var(--tx-accent-soft)',
  ok: 'var(--tx-ok)',
  warn: 'var(--tx-warn)',
  danger: 'var(--tx-danger)',
  shadow: 'var(--tx-shadow)',
} as const;

type ModePalette = {
  bg: string;
  paper: string;
  panelAlt: string;
  sidebar: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  actionHover: string;
  actionSelected: string;
  scrollbar: string;
  scrollbarHover: string;
};

const palettes: Record<ResolvedColorScheme, ModePalette> = {
  light: {
    bg: land.snow,
    paper: land.white,
    panelAlt: land.lineSoft,
    sidebar: land.lineSoft,
    text: land.ink,
    muted: land.slate,
    faint: '#64748B',
    border: land.line,
    accent: land.teal,
    accentHover: land.tealHover,
    accentSoft: land.tealSoft,
    actionHover: 'rgba(15,118,110,0.08)',
    actionSelected: 'rgba(15,118,110,0.16)',
    scrollbar: '#CBD5E1',
    scrollbarHover: '#94A3B8',
  },
  dark: {
    bg: land.darkBg,
    paper: land.charcoal,
    panelAlt: land.darkPanelAlt,
    sidebar: land.charcoal,
    text: land.snow,
    muted: land.darkMuted,
    faint: '#64748B',
    border: land.darkBorder,
    accent: land.teal,
    accentHover: land.darkHover,
    accentSoft: land.darkSoft,
    actionHover: 'rgba(15,118,110,0.12)',
    actionSelected: land.darkSoft,
    scrollbar: '#334155',
    scrollbarHover: '#475569',
  },
};

export function createLandTheme(mode: ResolvedColorScheme): Theme {
  const p = palettes[mode];

  return createTheme({
    palette: {
      mode,
      primary: {
        main: p.accent,
        light: p.accentHover,
        dark: land.teal,
        contrastText: land.white,
      },
      secondary: {
        main: land.ok,
        contrastText: land.white,
      },
      error: { main: land.danger },
      warning: { main: land.warn },
      success: { main: land.ok },
      info: { main: p.accent },
      background: {
        default: p.bg,
        paper: p.paper,
      },
      text: {
        primary: p.text,
        secondary: p.muted,
        disabled: p.faint,
      },
      divider: p.border,
      action: {
        hover: p.actionHover,
        selected: p.actionSelected,
      },
    },
    typography: {
      fontFamily: FONT_SANS,
      h4: { fontWeight: 650, letterSpacing: '-0.02em' },
      h5: { fontWeight: 650, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      button: { textTransform: 'none', fontWeight: 600 },
      overline: {
        letterSpacing: '0.06em',
        fontSize: '0.7rem',
        color: p.muted,
      },
    },
    shape: { borderRadius: land.radius },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: 'var(--tx-bg)',
            color: 'var(--tx-text)',
            fontFamily: FONT_SANS,
          },
          '::-webkit-scrollbar': { width: 8, height: 8 },
          '::-webkit-scrollbar-track': { background: 'var(--tx-panel-alt)' },
          '::-webkit-scrollbar-thumb': {
            background: p.scrollbar,
            borderRadius: 4,
          },
          '::-webkit-scrollbar-thumb:hover': { background: p.scrollbarHover },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'var(--tx-paper)',
            border: '1px solid var(--tx-border)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'var(--tx-paper)',
            borderBottom: '1px solid var(--tx-border)',
            color: 'var(--tx-text)',
            boxShadow: 'var(--tx-shadow)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: 'var(--tx-sidebar)',
            borderRight: '1px solid var(--tx-border)',
          },
        },
      },
      MuiButton: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            borderRadius: land.radius,
            minHeight: 36,
            px: 1.5,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          outlined: {
            borderColor: 'var(--tx-border)',
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
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--tx-accent-hover)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--tx-accent)',
              borderWidth: 2,
            },
          },
        },
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
            borderRadius: land.radius,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor: 'var(--tx-accent-soft)',
              '&:hover': { backgroundColor: 'var(--tx-action-selected)' },
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
            border: '1px solid var(--tx-border)',
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: 'var(--tx-accent)',
          },
        },
      },
    },
  });
}

/** Default (light-first) theme for static imports */
export const terronexTheme = createLandTheme('light');
