import { formatAttribution, personLabel, formatWhen } from '@/lib/attribution';

describe('attribution', () => {
  it('personLabel prefers name then email', () => {
    expect(personLabel({ name: 'Jason', email: 'a@b.com' })).toBe('Jason');
    expect(personLabel({ name: null, email: 'a@b.com' })).toBe('a@b.com');
    expect(personLabel(null)).toBe('Unknown');
  });

  it('formatAttribution joins person and time', () => {
    const s = formatAttribution(
      { name: 'Ada' },
      '2026-03-06T14:00:00.000Z'
    );
    expect(s.startsWith('Ada · ')).toBe(true);
    expect(formatWhen(null)).toBe('—');
  });
});
