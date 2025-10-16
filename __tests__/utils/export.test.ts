/**
 * Utility Tests - Export Utilities
 */

import {
  exportToCSV,
  exportToExcel,
  generateCSV,
  generateExcel,
  downloadFile,
} from '@/lib/utils/export';

describe('Export Utilities', () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
    HTMLAnchorElement.prototype.remove = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateCSV', () => {
    it('should generate CSV from array of objects', () => {
      const data = [
        { sku: 'SKU-001', name: 'Product 1', price: 9.99 },
        { sku: 'SKU-002', name: 'Product 2', price: 19.99 },
      ];

      const csv = generateCSV(data);

      expect(csv).toContain('sku,name,price');
      expect(csv).toContain('SKU-001,Product 1,9.99');
      expect(csv).toContain('SKU-002,Product 2,19.99');
    });

    it('should handle special characters', () => {
      const data = [
        { name: 'Product, with comma', description: '"Quoted text"' },
      ];

      const csv = generateCSV(data);

      expect(csv).toContain('"Product, with comma"');
      expect(csv).toContain('"""Quoted text"""');
    });

    it('should handle empty array', () => {
      const csv = generateCSV([]);
      expect(csv).toBe('');
    });

    it('should respect custom headers', () => {
      const data = [
        { sku: 'SKU-001', name: 'Product 1' },
      ];

      const csv = generateCSV(data, ['SKU', 'Product Name']);

      expect(csv).toContain('SKU,Product Name');
    });

    it('should handle nested objects', () => {
      const data = [
        { 
          sku: 'SKU-001',
          category: { name: 'Electronics' },
        },
      ];

      const csv = generateCSV(data);

      expect(csv).toContain('[object Object]'); // Default behavior
    });
  });

  describe('exportToCSV', () => {
    it('should trigger download with correct filename', () => {
      const data = [
        { sku: 'SKU-001', name: 'Product 1' },
      ];

      exportToCSV(data, 'inventory');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should use default filename', () => {
      const data = [{ sku: 'SKU-001' }];
      
      exportToCSV(data);

      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should clean up blob URL', () => {
      const data = [{ sku: 'SKU-001' }];
      
      exportToCSV(data, 'test');

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('generateExcel', () => {
    it('should generate Excel workbook', async () => {
      const data = [
        { sku: 'SKU-001', name: 'Product 1', price: 9.99 },
      ];

      const workbook = await generateExcel(data);

      expect(workbook).toBeDefined();
      expect(workbook.SheetNames).toContain('Sheet1');
    });

    it('should support multiple sheets', async () => {
      const sheets = {
        'Inventory': [{ sku: 'SKU-001' }],
        'Orders': [{ orderNumber: 'SO-001' }],
      };

      const workbook = await generateExcel(sheets);

      expect(workbook.SheetNames).toContain('Inventory');
      expect(workbook.SheetNames).toContain('Orders');
    });

    it('should handle empty data', async () => {
      const workbook = await generateExcel([]);

      expect(workbook.SheetNames.length).toBe(1);
    });
  });

  describe('exportToExcel', () => {
    it('should trigger Excel download', async () => {
      const data = [
        { sku: 'SKU-001', name: 'Product 1' },
      ];

      await exportToExcel(data, 'inventory');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should use .xlsx extension', async () => {
      const data = [{ sku: 'SKU-001' }];
      
      await exportToExcel(data, 'test');

      const anchor = document.querySelector('a');
      expect(anchor?.download).toContain('.xlsx');
    });
  });

  describe('downloadFile', () => {
    it('should download blob with filename', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      
      downloadFile(blob, 'test.txt');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should clean up after download', () => {
      const blob = new Blob(['test']);
      
      downloadFile(blob, 'test.txt');

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should remove anchor element', () => {
      const blob = new Blob(['test']);
      
      downloadFile(blob, 'test.txt');

      expect(HTMLAnchorElement.prototype.remove).toHaveBeenCalled();
    });
  });
});
