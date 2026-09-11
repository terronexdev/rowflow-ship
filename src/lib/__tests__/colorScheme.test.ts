import {
  parseColorSchemePreference,
  resolveColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
} from '../colorScheme';

describe('colorScheme', () => {
  it('stores the documented localStorage key', () => {
    expect(COLOR_SCHEME_STORAGE_KEY).toBe('rowflow-color-scheme');
  });

  it('treats unset / unknown values as system', () => {
    expect(parseColorSchemePreference(null)).toBe('system');
    expect(parseColorSchemePreference(undefined)).toBe('system');
    expect(parseColorSchemePreference('navy')).toBe('system');
  });

  it('accepts light, dark, and system', () => {
    expect(parseColorSchemePreference('light')).toBe('light');
    expect(parseColorSchemePreference('dark')).toBe('dark');
    expect(parseColorSchemePreference('system')).toBe('system');
  });

  it('respects prefers-color-scheme when preference is system', () => {
    expect(resolveColorScheme('system', true)).toBe('dark');
    expect(resolveColorScheme('system', false)).toBe('light');
  });

  it('honors an explicit stored preference over the system setting', () => {
    expect(resolveColorScheme('light', true)).toBe('light');
    expect(resolveColorScheme('dark', false)).toBe('dark');
  });
});
