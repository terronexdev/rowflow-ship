export const COLOR_SCHEME_STORAGE_KEY = 'rowflow-color-scheme';

export type ColorSchemePreference = 'light' | 'dark' | 'system';
export type ResolvedColorScheme = 'light' | 'dark';

export function parseColorSchemePreference(
  value: string | null | undefined
): ColorSchemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export function resolveColorScheme(
  preference: ColorSchemePreference,
  prefersDark: boolean
): ResolvedColorScheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

export function readStoredColorScheme(): ColorSchemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    return parseColorSchemePreference(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function persistColorScheme(preference: ColorSchemePreference) {
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, preference);
  } catch {
    /* ignore quota / private mode */
  }
}

export function applyResolvedColorScheme(theme: ResolvedColorScheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

/** Inline bootstrap — runs before paint so CSS vars match stored / system preference. */
export const COLOR_SCHEME_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(
  COLOR_SCHEME_STORAGE_KEY
)};var v=localStorage.getItem(k);var pref=(v==='light'||v==='dark'||v==='system')?v:'system';var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=pref==='system'?(dark?'dark':'light'):pref;var r=document.documentElement;r.setAttribute('data-theme',theme);r.style.colorScheme=theme;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
