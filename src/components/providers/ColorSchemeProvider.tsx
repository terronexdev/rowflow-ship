'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  applyResolvedColorScheme,
  persistColorScheme,
  readStoredColorScheme,
  resolveColorScheme,
  type ColorSchemePreference,
  type ResolvedColorScheme,
} from '@/lib/colorScheme';

type ColorSchemeContextValue = {
  preference: ColorSchemePreference;
  resolved: ResolvedColorScheme;
  setPreference: (next: ColorSchemePreference) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

function prefersDarkMq() {
  return window.matchMedia('(prefers-color-scheme: dark)');
}

export default function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorSchemePreference>('system');
  const [resolved, setResolved] = useState<ResolvedColorScheme>('light');

  useEffect(() => {
    const stored = readStoredColorScheme();
    const dark = prefersDarkMq().matches;
    const next = resolveColorScheme(stored, dark);
    setPreferenceState(stored);
    setResolved(next);
    applyResolvedColorScheme(next);
  }, []);

  useEffect(() => {
    const mq = prefersDarkMq();
    const onChange = () => {
      setPreferenceState((pref) => {
        const next = resolveColorScheme(pref, mq.matches);
        setResolved(next);
        applyResolvedColorScheme(next);
        return pref;
      });
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ColorSchemePreference) => {
    persistColorScheme(next);
    const resolvedNext = resolveColorScheme(next, prefersDarkMq().matches);
    setPreferenceState(next);
    setResolved(resolvedNext);
    applyResolvedColorScheme(resolvedNext);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>;
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider');
  }
  return ctx;
}
