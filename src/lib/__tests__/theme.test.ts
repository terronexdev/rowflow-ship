import { createLandTheme, land, MAP_ACCENT } from '../theme';

describe('createLandTheme', () => {
  it('uses land teal as the brand primary in light and dark', () => {
    expect(createLandTheme('light').palette.primary.main).toBe(land.teal);
    expect(createLandTheme('dark').palette.primary.main).toBe(land.teal);
    expect(land.teal).toBe('#0F766E');
    expect(MAP_ACCENT).toBe(land.teal);
  });

  it('does not use the former blue brand primary', () => {
    expect(createLandTheme('light').palette.primary.main).not.toBe('#3b82f6');
    expect(createLandTheme('dark').palette.primary.main).not.toBe('#3b82f6');
  });

  it('uses Source Sans 3 — Inter is not required', () => {
    const font = createLandTheme('light').typography.fontFamily as string;
    expect(font).toMatch(/Source Sans 3/);
    expect(font).not.toMatch(/Inter/);
  });

  it('uses an 8px radius and charcoal-family dark paper', () => {
    expect(createLandTheme('light').shape.borderRadius).toBe(8);
    expect(land.charcoal).toBe('#15202B');
    expect(land.darkBg).toBe('#0B1220');
  });
});
