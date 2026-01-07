/**
 * Unit Tests - Barcode Service
 */

import { BarcodeService } from "@/lib/services/barcode.service";

describe("BarcodeService", () => {
  describe("generateItemBarcode", () => {
    it("should generate valid EAN-13 barcode", () => {
      const barcode = BarcodeService.generateItemBarcode(
        "123456789",
        "SKU-001",
      );

      expect(barcode).toHaveLength(13);
      expect(BarcodeService.validateEAN13(barcode)).toBe(true);
    });

    it("should generate different barcodes for different items", () => {
      const barcode1 = BarcodeService.generateItemBarcode("1", "SKU-001");
      const barcode2 = BarcodeService.generateItemBarcode("2", "SKU-002");

      expect(barcode1).not.toBe(barcode2);
    });
  });

  describe("generateLocationBarcode", () => {
    it("should generate location barcode with correct format", () => {
      const barcode = BarcodeService.generateLocationBarcode(
        "A",
        "01",
        "02",
        "03",
      );

      expect(barcode).toBe("LOC-A-01-02-03");
    });

    it("should pad aisle, rack, and bin with zeros", () => {
      const barcode = BarcodeService.generateLocationBarcode(
        "B",
        "5",
        "7",
        "9",
      );

      expect(barcode).toBe("LOC-B-05-07-09");
    });
  });

  describe("validateEAN13", () => {
    it("should validate correct EAN-13 barcodes", () => {
      expect(BarcodeService.validateEAN13("5901234123457")).toBe(true);
      expect(BarcodeService.validateEAN13("0000000000000")).toBe(true);
    });

    it("should reject invalid EAN-13 barcodes", () => {
      expect(BarcodeService.validateEAN13("1234567890123")).toBe(false);
      expect(BarcodeService.validateEAN13("123")).toBe(false);
      expect(BarcodeService.validateEAN13("abcdefghijklm")).toBe(false);
    });
  });

  describe("parseBarcode", () => {
    it("should parse location barcode", () => {
      const result = BarcodeService.parseBarcode("LOC-A-01-02-03");

      expect(result).toEqual({
        type: "LOCATION",
        data: {
          zone: "A",
          aisle: "01",
          rack: "02",
          bin: "03",
        },
      });
    });

    it("should parse sales order barcode", () => {
      const result = BarcodeService.parseBarcode("SO-20251016-0001");

      expect(result).toEqual({
        type: "ORDER",
        data: {
          orderNumber: "SO-20251016-0001",
          orderType: "SALES",
        },
      });
    });

    it("should parse purchase order barcode", () => {
      const result = BarcodeService.parseBarcode("PO-20251016-0001");

      expect(result).toEqual({
        type: "ORDER",
        data: {
          orderNumber: "PO-20251016-0001",
          orderType: "PURCHASE",
        },
      });
    });

    it("should parse wave barcode", () => {
      const result = BarcodeService.parseBarcode("WAVE-20251016-0001");

      expect(result).toEqual({
        type: "WAVE",
        data: {
          waveNumber: "WAVE-20251016-0001",
        },
      });
    });

    it("should parse task barcode", () => {
      const result = BarcodeService.parseBarcode("TASK-20251016-0001");

      expect(result).toEqual({
        type: "TASK",
        data: {
          taskNumber: "TASK-20251016-0001",
        },
      });
    });

    it("should return null for unrecognized barcode", () => {
      const result = BarcodeService.parseBarcode("INVALID-BARCODE");

      expect(result).toBeNull();
    });
  });

  describe("formatBarcode", () => {
    it("should format EAN-13 barcode with separators", () => {
      const formatted = BarcodeService.formatBarcode("1234567890123");

      expect(formatted).toBe("123-456-789-012-3");
    });

    it("should return unchanged for non-EAN-13 barcodes", () => {
      const barcode = "LOC-A-01-02-03";
      const formatted = BarcodeService.formatBarcode(barcode);

      expect(formatted).toBe(barcode);
    });
  });

  describe("generateBatchBarcodes", () => {
    it("should generate specified number of barcodes", () => {
      const barcodes = BarcodeService.generateBatchBarcodes(1, 10);

      expect(barcodes).toHaveLength(10);
    });

    it("should generate sequential barcodes", () => {
      const barcodes = BarcodeService.generateBatchBarcodes(1, 5);

      // Each should be unique
      const uniqueBarcodes = new Set(barcodes);
      expect(uniqueBarcodes.size).toBe(5);

      // All should be valid EAN-13
      barcodes.forEach((barcode) => {
        expect(BarcodeService.validateEAN13(barcode)).toBe(true);
      });
    });
  });
});
