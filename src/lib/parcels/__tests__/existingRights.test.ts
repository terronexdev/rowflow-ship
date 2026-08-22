import { normalizeInstrumentNumber, parseRestrictionFlags } from '../existingRights';

describe('existingRights helpers', () => {
  it('normalizes instrument numbers for same-# matching', () => {
    expect(normalizeInstrumentNumber(' 2018-4412 ')).toBe('2018-4412');
    expect(normalizeInstrumentNumber('2018–4412')).toBe('2018-4412'); // en-dash
    expect(normalizeInstrumentNumber('ab 12')).toBe('AB12');
    expect(normalizeInstrumentNumber('')).toBeNull();
    expect(normalizeInstrumentNumber(null)).toBeNull();
  });

  it('parses restriction flags', () => {
    expect(parseRestrictionFlags(['HERBICIDE', 'POLE'])).toEqual(['HERBICIDE', 'POLE']);
    expect(parseRestrictionFlags(null)).toEqual([]);
    expect(parseRestrictionFlags('x')).toEqual([]);
  });
});
