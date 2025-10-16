/**
 * API Route Tests - Mobile Barcode Scan
 */

import { POST } from '@/app/api/mobile/barcode/scan/route';
import { createAuthenticatedRequest, parseResponse, factories, assertSuccessResponse } from '@/lib/test-utils/api-test-utils';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    inventoryItem: {
      findFirst: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
    salesOrder: {
      findFirst: jest.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

describe('API: /api/mobile/barcode/scan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/mobile/barcode/scan', () => {
    it('should scan inventory item by barcode', async () => {
      const mockItem = factories.inventoryItem({ barcode: '1234567890123' });
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockItem);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {
          barcode: '1234567890123',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.entityType).toBe('INVENTORY_ITEM');
      expect(data.data.entity).toMatchObject({
        barcode: '1234567890123',
      });
    });

    it('should scan inventory item by SKU', async () => {
      const mockItem = factories.inventoryItem({ sku: 'TEST-SKU-001' });
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockItem);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {
          barcode: 'TEST-SKU-001',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(data.data.entityType).toBe('INVENTORY_ITEM');
    });

    it('should scan location by barcode', async () => {
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(null);
      
      const mockLocation = factories.location({ barcode: 'LOC-A-01-02-03' });
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(mockLocation);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {
          barcode: 'LOC-A-01-02-03',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(data.data.entityType).toBe('LOCATION');
      expect(data.data.entity.barcode).toBe('LOC-A-01-02-03');
    });

    it('should scan sales order', async () => {
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(null);

      const mockOrder = factories.salesOrder({ soNumber: 'SO-20251016-0001' });
      (prisma.salesOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {
          barcode: 'SO-20251016-0001',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(data.data.entityType).toBe('SALES_ORDER');
      expect(data.data.entity.soNumber).toBe('SO-20251016-0001');
    });

    it('should return 404 for unrecognized barcode', async () => {
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.location.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.salesOrder.findFirst as jest.Mock).mockResolvedValue(null);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {
          barcode: 'UNKNOWN-BARCODE',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it('should require barcode in request', async () => {
      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {},
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should include context in scan result', async () => {
      const mockItem = factories.inventoryItem();
      (prisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockItem);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/mobile/barcode/scan',
        body: {
          barcode: '1234567890123',
          context: 'PICKING',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      // Context can be used for workflow optimization
    });
  });
});
