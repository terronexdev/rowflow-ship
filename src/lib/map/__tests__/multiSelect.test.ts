import {
  toggleSelection,
  mergeUnique,
  rangeSelect,
  isMultiModifier,
  isRangeModifier,
} from '../multiSelect';

describe('multiSelect helpers', () => {
  const ordered = ['a', 'b', 'c', 'd', 'e'];

  describe('toggleSelection', () => {
    it('adds id when missing', () => {
      expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b']);
    });
    it('removes id when present', () => {
      expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b']);
    });
    it('ignores empty id', () => {
      expect(toggleSelection(['a'], '')).toEqual(['a']);
    });
  });

  describe('mergeUnique', () => {
    it('merges without dupes', () => {
      expect(mergeUnique(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
    });
    it('handles empty sides', () => {
      expect(mergeUnique([], ['a'])).toEqual(['a']);
      expect(mergeUnique(['a'], [])).toEqual(['a']);
    });
  });

  describe('rangeSelect', () => {
    it('selects inclusive range forward', () => {
      expect(rangeSelect(ordered, 'b', 'd')).toEqual(['b', 'c', 'd']);
    });
    it('selects inclusive range backward', () => {
      expect(rangeSelect(ordered, 'd', 'b')).toEqual(['b', 'c', 'd']);
    });
    it('single when no anchor', () => {
      expect(rangeSelect(ordered, null, 'c')).toEqual(['c']);
    });
    it('single when anchor === target', () => {
      expect(rangeSelect(ordered, 'c', 'c')).toEqual(['c']);
    });
    it('falls back when anchor missing from list', () => {
      expect(rangeSelect(ordered, 'z', 'c')).toEqual(['c']);
    });
  });

  describe('modifiers', () => {
    it('isMultiModifier true for shift/ctrl/meta', () => {
      expect(isMultiModifier({ shiftKey: true })).toBe(true);
      expect(isMultiModifier({ ctrlKey: true })).toBe(true);
      expect(isMultiModifier({ metaKey: true })).toBe(true);
      expect(isMultiModifier({})).toBe(false);
      expect(isMultiModifier(null)).toBe(false);
    });
    it('isRangeModifier only bare shift', () => {
      expect(isRangeModifier({ shiftKey: true })).toBe(true);
      expect(isRangeModifier({ shiftKey: true, ctrlKey: true })).toBe(false);
      expect(isRangeModifier({ ctrlKey: true })).toBe(false);
    });
  });
});
