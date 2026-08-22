import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatFileSize,
  getParcelStatusColor,
  getParcelStatusLabel,
  calculateProgress,
  truncateText,
  generateRandomColor,
  isValidEmail,
  isValidPhone,
  wait,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T12:00:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
    });

    it('should format date string', () => {
      const formatted = formatDate('2024-01-15T12:00:00');
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
    });
  });

  describe('formatDateTime', () => {
    it('should format Date object with time', () => {
      const date = new Date('2024-01-15T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/PM|AM/);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getParcelStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(getParcelStatusColor('NOT_STARTED')).toBe('#bdbdbd');
      expect(getParcelStatusColor('IN_PROGRESS')).toBe('#2196f3');
      expect(getParcelStatusColor('ACQUIRED')).toBe('#4caf50');
      expect(getParcelStatusColor('CONDEMNED')).toBe('#f44336');
      expect(getParcelStatusColor('RELOCATED')).toBe('#ff9800');
    });

    it('should return default color for unknown status', () => {
      expect(getParcelStatusColor('UNKNOWN')).toBe('#bdbdbd');
    });
  });

  describe('getParcelStatusLabel', () => {
    it('should return correct labels for known statuses', () => {
      expect(getParcelStatusLabel('NOT_STARTED')).toBe('Not Started');
      expect(getParcelStatusLabel('IN_PROGRESS')).toBe('In Progress');
      expect(getParcelStatusLabel('ACQUIRED')).toBe('Acquired');
    });

    it('should return original status for unknown status', () => {
      expect(getParcelStatusLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const result = calculateProgress(100, 25);
      expect(result.percentage).toBe(25);
      expect(result.remaining).toBe(75);
    });

    it('should handle zero total', () => {
      const result = calculateProgress(0, 0);
      expect(result.percentage).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it('should handle 100% completion', () => {
      const result = calculateProgress(100, 100);
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(0);
    });

    it('should round percentages', () => {
      const result = calculateProgress(3, 1);
      expect(result.percentage).toBe(33); // Should round
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('should handle exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 5)).toBe('');
    });
  });

  describe('generateRandomColor', () => {
    it('should generate valid hex color', () => {
      const color = generateRandomColor();
      expect(color).toMatch(/^#[0-9a-f]{1,6}$/i);
    });

    it('should generate different colors', () => {
      const color1 = generateRandomColor();
      const color2 = generateRandomColor();
      const color3 = generateRandomColor();

      // Very unlikely to be all the same (not 100% guaranteed but reasonable)
      const allSame = color1 === color2 && color2 === color3;
      expect(allSame).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('invalid @domain.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('+1 123 456 7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false); // Too short
      expect(isValidPhone('abc')).toBe(false); // Letters only
      expect(isValidPhone('12345abc90')).toBe(false); // Letters
    });
  });

  describe('wait', () => {
    it('should wait for specified time', async () => {
      const start = Date.now();
      await wait(100);
      const end = Date.now();

      // Allow some tolerance for timing
      expect(end - start).toBeGreaterThanOrEqual(90);
      expect(end - start).toBeLessThan(200);
    });

    it('should return a promise', () => {
      const result = wait(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
