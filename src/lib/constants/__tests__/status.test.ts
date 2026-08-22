import {
  getStatusColor,
  getStatusList,
  getStatusLabel,
  getAllStatuses,
  isValidStatus,
  TITLE_STATUSES,
  ACQUISITION_STATUSES,
  SPECIAL_CONDITIONS_STATUSES,
  DAMAGES_STATUSES,
  STATUS_COLORS,
} from '../status';

describe('Status Constants', () => {
  describe('Status Lists', () => {
    it('should have correct title statuses', () => {
      expect(TITLE_STATUSES).toHaveLength(5);
      expect(TITLE_STATUSES[0].value).toBe('NOT_STARTED');
      expect(TITLE_STATUSES[2].value).toBe('COMPLETE');
    });

    it('should have correct acquisition statuses', () => {
      expect(ACQUISITION_STATUSES).toHaveLength(10);
      expect(ACQUISITION_STATUSES[7].value).toBe('ACQUIRED');
    });

    it('should have correct special conditions statuses', () => {
      expect(SPECIAL_CONDITIONS_STATUSES).toHaveLength(6);
      expect(SPECIAL_CONDITIONS_STATUSES[1].value).toBe('NOTIFICATION_REQUIRED');
    });

    it('should have correct damages statuses', () => {
      expect(DAMAGES_STATUSES).toHaveLength(4);
      expect(DAMAGES_STATUSES[1].value).toBe('INVESTIGATE');
    });
  });

  describe('STATUS_COLORS', () => {
    it('should have colors for all common statuses', () => {
      expect(STATUS_COLORS.NOT_STARTED).toBeDefined();
      expect(STATUS_COLORS.IN_PROGRESS).toBeDefined();
      expect(STATUS_COLORS.DEFAULT).toBeDefined();
    });

    it('should have valid hex colors', () => {
      Object.values(STATUS_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for known status', () => {
      expect(getStatusColor('NOT_STARTED')).toBe('#9e9e9e');
      expect(getStatusColor('IN_PROGRESS')).toBe('#2196f3');
      expect(getStatusColor('ACQUIRED')).toBe('#4caf50');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('UNKNOWN_STATUS')).toBe(STATUS_COLORS.DEFAULT);
    });
  });

  describe('getStatusList', () => {
    it('should return title statuses', () => {
      const statuses = getStatusList('title');
      expect(statuses).toEqual(TITLE_STATUSES);
      expect(statuses).toHaveLength(5);
    });

    it('should return acquisition statuses', () => {
      const statuses = getStatusList('acquisition');
      expect(statuses).toEqual(ACQUISITION_STATUSES);
    });

    it('should return special conditions statuses', () => {
      const statuses = getStatusList('special_conditions');
      expect(statuses).toEqual(SPECIAL_CONDITIONS_STATUSES);
    });

    it('should return damages statuses', () => {
      const statuses = getStatusList('damages');
      expect(statuses).toEqual(DAMAGES_STATUSES);
    });

    it('should return empty array for unknown tab', () => {
      const statuses = getStatusList('unknown' as any);
      expect(statuses).toEqual([]);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for title status', () => {
      expect(getStatusLabel('NOT_STARTED', 'title')).toBe('Not Started');
      expect(getStatusLabel('COMPLETE', 'title')).toBe('Complete');
    });

    it('should return correct label for acquisition status', () => {
      expect(getStatusLabel('ACQUIRED', 'acquisition')).toBe('Acquired');
    });

    it('should return original status if not found', () => {
      expect(getStatusLabel('UNKNOWN', 'title')).toBe('UNKNOWN');
    });
  });

  describe('getAllStatuses', () => {
    it('should return all unique statuses', () => {
      const allStatuses = getAllStatuses();
      expect(allStatuses.length).toBeGreaterThan(0);

      // Should have no duplicates
      const uniqueStatuses = [...new Set(allStatuses)];
      expect(allStatuses.length).toBe(uniqueStatuses.length);
    });

    it('should include NOT_STARTED only once', () => {
      const allStatuses = getAllStatuses();
      const notStartedCount = allStatuses.filter(s => s === 'NOT_STARTED').length;
      expect(notStartedCount).toBe(1);
    });
  });

  describe('isValidStatus', () => {
    it('should validate title statuses', () => {
      expect(isValidStatus('NOT_STARTED', 'title')).toBe(true);
      expect(isValidStatus('COMPLETE', 'title')).toBe(true);
      expect(isValidStatus('ACQUIRED', 'title')).toBe(false);
    });

    it('should validate acquisition statuses', () => {
      expect(isValidStatus('ACQUIRED', 'acquisition')).toBe(true);
      expect(isValidStatus('COMPLETE', 'acquisition')).toBe(false);
    });

    it('should validate special conditions statuses', () => {
      expect(isValidStatus('LOCKED_GATE', 'special_conditions')).toBe(true);
      expect(isValidStatus('ACQUIRED', 'special_conditions')).toBe(false);
    });

    it('should validate damages statuses', () => {
      expect(isValidStatus('INVESTIGATE', 'damages')).toBe(true);
      expect(isValidStatus('COMPLETE', 'damages')).toBe(false);
    });

    it('should return false for invalid status', () => {
      expect(isValidStatus('INVALID', 'title')).toBe(false);
    });
  });
});
