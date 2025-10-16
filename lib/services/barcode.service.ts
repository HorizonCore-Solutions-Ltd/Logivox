/**
 * Barcode Service
 * Handle barcode generation and validation
 */

export interface BarcodeFormat {
  type: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'QR';
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export class BarcodeService {
  /**
   * Generate barcode for inventory item
   */
  static generateItemBarcode(itemId: string, sku: string): string {
    // Generate EAN-13 compatible barcode
    // Format: Country(3) + Manufacturer(6) + Product(3) + Check digit(1)
    const prefix = '000'; // Internal use prefix
    const itemCode = this.padNumber(parseInt(itemId.slice(-9)), 9);
    const checkDigit = this.calculateEAN13CheckDigit(prefix + itemCode);
    
    return `${prefix}${itemCode}${checkDigit}`;
  }

  /**
   * Generate barcode for location
   */
  static generateLocationBarcode(
    zone: string,
    aisle: string,
    rack: string,
    bin: string
  ): string {
    // Format: LOC-{ZONE}-{AISLE}-{RACK}-{BIN}
    return `LOC-${zone}-${aisle.padStart(2, '0')}-${rack.padStart(2, '0')}-${bin.padStart(2, '0')}`;
  }

  /**
   * Generate barcode for sales order
   */
  static generateOrderBarcode(orderNumber: string): string {
    // Use order number as-is (e.g., SO-20251016-0001)
    return orderNumber;
  }

  /**
   * Generate QR code data for complex information
   */
  static generateQRData(data: Record<string, any>): string {
    // Convert to JSON for QR code
    return JSON.stringify(data);
  }

  /**
   * Validate barcode format
   */
  static validateBarcode(barcode: string, format: string): boolean {
    switch (format) {
      case 'EAN13':
        return this.validateEAN13(barcode);
      case 'CODE128':
        return /^[A-Za-z0-9-]+$/.test(barcode);
      case 'QR':
        return barcode.length > 0;
      default:
        return false;
    }
  }

  /**
   * Validate EAN-13 barcode
   */
  static validateEAN13(barcode: string): boolean {
    if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
      return false;
    }

    const checkDigit = parseInt(barcode[12]);
    const calculatedCheckDigit = this.calculateEAN13CheckDigit(barcode.slice(0, 12));
    
    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Calculate EAN-13 check digit
   */
  private static calculateEAN13CheckDigit(barcode: string): number {
    const digits = barcode.split('').map(Number);
    const sum = digits.reduce((acc, digit, index) => {
      const weight = index % 2 === 0 ? 1 : 3;
      return acc + digit * weight;
    }, 0);
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
  }

  /**
   * Parse barcode to extract information
   */
  static parseBarcode(barcode: string): {
    type: string;
    data: Record<string, any>;
  } | null {
    // Location barcode
    if (barcode.startsWith('LOC-')) {
      const parts = barcode.split('-');
      if (parts.length === 5) {
        return {
          type: 'LOCATION',
          data: {
            zone: parts[1],
            aisle: parts[2],
            rack: parts[3],
            bin: parts[4],
          },
        };
      }
    }

    // Order barcode
    if (barcode.startsWith('SO-') || barcode.startsWith('PO-')) {
      return {
        type: 'ORDER',
        data: {
          orderNumber: barcode,
          orderType: barcode.startsWith('SO-') ? 'SALES' : 'PURCHASE',
        },
      };
    }

    // Wave barcode
    if (barcode.startsWith('WAVE-')) {
      return {
        type: 'WAVE',
        data: {
          waveNumber: barcode,
        },
      };
    }

    // Task barcode
    if (barcode.startsWith('TASK-')) {
      return {
        type: 'TASK',
        data: {
          taskNumber: barcode,
        },
      };
    }

    // EAN-13 (likely inventory item)
    if (this.validateEAN13(barcode)) {
      return {
        type: 'INVENTORY_ITEM',
        data: {
          barcode,
        },
      };
    }

    // Try to parse as QR code JSON
    try {
      const data = JSON.parse(barcode);
      return {
        type: 'QR_CODE',
        data,
      };
    } catch {
      // Not JSON
    }

    return null;
  }

  /**
   * Generate batch barcodes
   */
  static generateBatchBarcodes(
    startId: number,
    count: number,
    prefix: string = '000'
  ): string[] {
    const barcodes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const itemCode = this.padNumber(startId + i, 9);
      const checkDigit = this.calculateEAN13CheckDigit(prefix + itemCode);
      barcodes.push(`${prefix}${itemCode}${checkDigit}`);
    }
    
    return barcodes;
  }

  /**
   * Helper: Pad number with zeros
   */
  private static padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }

  /**
   * Format barcode for display
   */
  static formatBarcode(barcode: string, separator: string = '-'): string {
    // Add separators for readability
    // Example: 1234567890123 -> 123-456-789-012-3
    if (barcode.length === 13) {
      return `${barcode.slice(0, 3)}${separator}${barcode.slice(3, 6)}${separator}${barcode.slice(6, 9)}${separator}${barcode.slice(9, 12)}${separator}${barcode.slice(12)}`;
    }
    
    return barcode;
  }

  /**
   * Get barcode image URL (using external service or library)
   */
  static getBarcodeImageUrl(barcode: string, format: BarcodeFormat): string {
    const params = new URLSearchParams({
      code: barcode,
      format: format.type,
      width: (format.width || 200).toString(),
      height: (format.height || 100).toString(),
      displayValue: (format.displayValue !== false).toString(),
    });
    
    // This would use a barcode generation library or service
    // For example: https://barcode.tec-it.com/
    return `/api/barcode/generate?${params.toString()}`;
  }
}

/**
 * Barcode Scanner Interface
 * For mobile app barcode scanning
 */
export interface BarcodeScanResult {
  data: string;
  format: string;
  timestamp: Date;
}

export interface BarcodeScannerOptions {
  formats?: string[];
  cameraFacing?: 'front' | 'back';
  showFlipCameraButton?: boolean;
  showTorchButton?: boolean;
  torchOn?: boolean;
  prompt?: string;
}

export class BarcodeScannerService {
  /**
   * Initialize barcode scanner (for mobile app)
   */
  static async initScanner(
    options: BarcodeScannerOptions = {}
  ): Promise<void> {
    // This would initialize the device camera and barcode scanning library
    // Using libraries like:
    // - @capacitor/barcode-scanner (for Capacitor apps)
    // - react-native-camera (for React Native)
    // - @zxing/browser (for web PWA)
    
    console.log('Initializing barcode scanner with options:', options);
  }

  /**
   * Scan barcode
   */
  static async scan(
    options: BarcodeScannerOptions = {}
  ): Promise<BarcodeScanResult | null> {
    // This would trigger the camera and scan barcode
    // Implementation depends on the mobile framework
    
    console.log('Scanning barcode...');
    
    // Mock result for demonstration
    return {
      data: '1234567890123',
      format: 'EAN13',
      timestamp: new Date(),
    };
  }

  /**
   * Stop scanner
   */
  static async stopScanner(): Promise<void> {
    console.log('Stopping barcode scanner');
  }

  /**
   * Check scanner permissions
   */
  static async checkPermissions(): Promise<{
    camera: boolean;
  }> {
    // Check if camera permission is granted
    return {
      camera: true,
    };
  }

  /**
   * Request scanner permissions
   */
  static async requestPermissions(): Promise<{
    camera: boolean;
  }> {
    // Request camera permission
    return {
      camera: true,
    };
  }
}
