/**
 * Utility Tests - Number & Date Formatting
 */

import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  parseNumber,
} from '@/lib/utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format GBP amounts', () => {
      expect(formatCurrency(99.99)).toBe('£99.99');
      expect(formatCurrency(1000)).toBe('£1,000.00');
      expect(formatCurrency(0)).toBe('£0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-50)).toBe('-£50.00');
    });

    it('should support different currencies', () => {
      expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
      expect(formatCurrency(99.99, 'EUR')).toBe('€99.99');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('£1,000,000.00');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should respect decimal places', () => {
      expect(formatNumber(99.999, 2)).toBe('99.99');
      expect(formatNumber(99.1, 2)).toBe('99.10');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages', () => {
      expect(formatPercentage(0.75)).toBe('75%');
      expect(formatPercentage(1)).toBe('100%');
      expect(formatPercentage(0)).toBe('0%');
    });

    it('should respect decimal places', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
    });

    it('should handle over 100%', () => {
      expect(formatPercentage(1.5)).toBe('150%');
    });
  });

  describe('formatDate', () => {
    it('should format dates in UK format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('should handle ISO strings', () => {
      expect(formatDate('2024-01-15T00:00:00Z')).toBe('15/01/2024');
    });

    it('should support different formats', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'long')).toBe('15 January 2024');
      expect(formatDate(date, 'short')).toBe('15/01/24');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const dateTime = new Date('2024-01-15T14:30:00Z');
      const result = formatDateTime(dateTime);
      
      expect(result).toContain('15/01/2024');
      expect(result).toContain(':');
    });

    it('should handle ISO strings', () => {
      const result = formatDateTime('2024-01-15T14:30:00Z');
      expect(result).toContain('2024');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent times', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should format hours ago', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should format days ago', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('should handle just now', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should handle future times', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 5 * 60 * 1000);
      
      expect(formatRelativeTime(future)).toBe('in 5 minutes');
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('99.99')).toBe(99.99);
    });

    it('should handle thousand separators', () => {
      expect(parseNumber('1,000')).toBe(1000);
      expect(parseNumber('1,000,000.50')).toBe(1000000.50);
    });

    it('should handle currency symbols', () => {
      expect(parseNumber('£99.99')).toBe(99.99);
      expect(parseNumber('$1,000')).toBe(1000);
    });

    it('should return null for invalid input', () => {
      expect(parseNumber('invalid')).toBeNull();
      expect(parseNumber('')).toBeNull();
    });

    it('should handle negative numbers', () => {
      expect(parseNumber('-50')).toBe(-50);
      expect(parseNumber('(50)')).toBe(-50); // Accounting format
    });
  });
});
