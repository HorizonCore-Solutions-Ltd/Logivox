/**
 * Utility Tests - Auto-Numbering
 */

import {
  generateSKU,
  generateOrderNumber,
  generatePONumber,
  generateAdjustmentNumber,
  generateTaskNumber,
  generateLocationCode,
  parseOrderNumber,
  validateOrderNumber,
} from '@/lib/utils/auto-numbering';

describe('Auto-Numbering Utilities', () => {
  describe('generateSKU', () => {
    it('should generate SKU with prefix', () => {
      const sku = generateSKU('ELEC', 1);
      expect(sku).toMatch(/^ELEC-\d{6}$/);
    });

    it('should pad sequence number', () => {
      expect(generateSKU('TEST', 1)).toBe('TEST-000001');
      expect(generateSKU('TEST', 123)).toBe('TEST-000123');
      expect(generateSKU('TEST', 999999)).toBe('TEST-999999');
    });

    it('should generate without prefix', () => {
      const sku = generateSKU(null, 42);
      expect(sku).toBe('000042');
    });

    it('should handle large sequence numbers', () => {
      const sku = generateSKU('PROD', 1000000);
      expect(sku).toBe('PROD-1000000');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate sales order number with date', () => {
      const orderNum = generateOrderNumber('SO', 1);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      expect(orderNum).toMatch(new RegExp(`^SO-${today}-001$`));
    });

    it('should pad sequence to 3 digits', () => {
      const orderNum = generateOrderNumber('SO', 42);
      expect(orderNum).toContain('-042');
    });

    it('should handle different prefixes', () => {
      expect(generateOrderNumber('PO', 1)).toMatch(/^PO-\d{8}-001$/);
      expect(generateOrderNumber('INV', 1)).toMatch(/^INV-\d{8}-001$/);
    });
  });

  describe('generatePONumber', () => {
    it('should generate purchase order number', () => {
      const poNum = generatePONumber(1);
      expect(poNum).toMatch(/^PO-\d{8}-001$/);
    });

    it('should include current date', () => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const poNum = generatePONumber(5);
      
      expect(poNum).toContain(today);
    });
  });

  describe('generateAdjustmentNumber', () => {
    it('should generate adjustment number', () => {
      const adjNum = generateAdjustmentNumber(1);
      expect(adjNum).toMatch(/^ADJ-\d{8}-001$/);
    });
  });

  describe('generateTaskNumber', () => {
    it('should generate task number with type', () => {
      const taskNum = generateTaskNumber('PICK', 1);
      expect(taskNum).toMatch(/^PICK-\d{8}-001$/);
    });

    it('should handle different task types', () => {
      expect(generateTaskNumber('PUT', 1)).toMatch(/^PUT-\d{8}-001$/);
      expect(generateTaskNumber('REP', 1)).toMatch(/^REP-\d{8}-001$/);
    });
  });

  describe('generateLocationCode', () => {
    it('should generate location code from components', () => {
      const code = generateLocationCode('A', '01', '02', '03');
      expect(code).toBe('LOC-A-01-02-03');
    });

    it('should pad numeric components', () => {
      const code = generateLocationCode('B', 1, 2, 3);
      expect(code).toBe('LOC-B-01-02-03');
    });

    it('should handle zone letters', () => {
      expect(generateLocationCode('A', '01', '01', '01')).toContain('LOC-A-');
      expect(generateLocationCode('Z', '99', '99', '99')).toContain('LOC-Z-');
    });

    it('should validate zone format', () => {
      expect(() => generateLocationCode('AA', '01', '01', '01')).toThrow();
      expect(() => generateLocationCode('1', '01', '01', '01')).toThrow();
    });
  });

  describe('parseOrderNumber', () => {
    it('should parse valid order number', () => {
      const result = parseOrderNumber('SO-20240115-042');
      
      expect(result).toEqual({
        prefix: 'SO',
        date: '20240115',
        sequence: 42,
      });
    });

    it('should parse purchase order', () => {
      const result = parseOrderNumber('PO-20240115-001');
      
      expect(result?.prefix).toBe('PO');
    });

    it('should return null for invalid format', () => {
      expect(parseOrderNumber('INVALID')).toBeNull();
      expect(parseOrderNumber('SO-123')).toBeNull();
      expect(parseOrderNumber('')).toBeNull();
    });

    it('should handle different date formats', () => {
      const result = parseOrderNumber('SO-20240101-999');
      expect(result?.date).toBe('20240101');
    });
  });

  describe('validateOrderNumber', () => {
    it('should validate correct order number format', () => {
      expect(validateOrderNumber('SO-20240115-001')).toBe(true);
      expect(validateOrderNumber('PO-20240115-999')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateOrderNumber('INVALID')).toBe(false);
      expect(validateOrderNumber('SO-123-001')).toBe(false);
      expect(validateOrderNumber('SO-20240115')).toBe(false);
      expect(validateOrderNumber('')).toBe(false);
    });

    it('should validate date component', () => {
      expect(validateOrderNumber('SO-99999999-001')).toBe(false);
      expect(validateOrderNumber('SO-20241301-001')).toBe(false); // Invalid month
    });

    it('should validate sequence component', () => {
      expect(validateOrderNumber('SO-20240115-0')).toBe(false);
      expect(validateOrderNumber('SO-20240115-12')).toBe(false);
      expect(validateOrderNumber('SO-20240115-1234')).toBe(false);
    });
  });
});
