/**
 * API Route Tests - Stock Adjustments
 */

import { GET, POST } from '@/app/api/inventory/adjustments/route';
import { createAuthenticatedRequest, parseResponse, assertSuccessResponse } from '@/lib/test-utils/api-test-utils';
import { mockPrisma } from '@/lib/test-utils/api-test-utils';

describe('API: /api/inventory/adjustments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/inventory/adjustments', () => {
    it('should return paginated adjustments', async () => {
      const mockAdjustments = [
        {
          id: '1',
          adjustmentNumber: 'ADJ-20240101-001',
          inventoryItemId: 'item-1',
          locationId: 'loc-1',
          adjustmentType: 'COUNT',
          quantityChange: -5,
          reason: 'Cycle count discrepancy',
          createdAt: new Date(),
        },
      ];

      mockPrisma.stockAdjustment.findMany.mockResolvedValue(mockAdjustments);
      mockPrisma.stockAdjustment.count.mockResolvedValue(1);

      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/inventory/adjustments',
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.adjustments).toEqual(mockAdjustments);
    });

    it('should filter by adjustment type', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/inventory/adjustments?type=COUNT',
      });

      await GET(request);

      expect(mockPrisma.stockAdjustment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            adjustmentType: 'COUNT',
          }),
        })
      );
    });

    it('should filter by inventory item', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/inventory/adjustments?inventoryItemId=item-1',
      });

      await GET(request);

      expect(mockPrisma.stockAdjustment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            inventoryItemId: 'item-1',
          }),
        })
      );
    });
  });

  describe('POST /api/inventory/adjustments', () => {
    it('should create stock adjustment and update stock levels', async () => {
      const mockAdjustment = {
        id: '1',
        adjustmentNumber: 'ADJ-20240101-001',
        inventoryItemId: 'item-1',
        locationId: 'loc-1',
        adjustmentType: 'COUNT',
        quantityChange: 10,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.stockAdjustment.create.mockResolvedValue(mockAdjustment);
      mockPrisma.stockLevel.upsert.mockResolvedValue({});

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/inventory/adjustments',
        body: {
          inventoryItemId: 'item-1',
          locationId: 'loc-1',
          adjustmentType: 'COUNT',
          quantityChange: 10,
          reason: 'Cycle count adjustment',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/inventory/adjustments',
        body: {
          inventoryItemId: 'item-1',
          // Missing locationId, adjustmentType, quantityChange
        },
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    it('should auto-generate adjustment number', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/inventory/adjustments',
        body: {
          inventoryItemId: 'item-1',
          locationId: 'loc-1',
          adjustmentType: 'COUNT',
          quantityChange: 10,
          reason: 'Test',
        },
      });

      await POST(request);

      expect(mockPrisma.stockAdjustment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adjustmentNumber: expect.stringMatching(/^ADJ-\d{8}-\d{3}$/),
          }),
        })
      );
    });

    it('should handle different adjustment types', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const types = ['COUNT', 'DAMAGE', 'LOSS', 'FOUND', 'TRANSFER'];

      for (const type of types) {
        const request = createAuthenticatedRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/inventory/adjustments',
          body: {
            inventoryItemId: 'item-1',
            locationId: 'loc-1',
            adjustmentType: type,
            quantityChange: 1,
            reason: `Test ${type}`,
          },
        });

        await POST(request);

        expect(mockPrisma.stockAdjustment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              adjustmentType: type,
            }),
          })
        );

        jest.clearAllMocks();
      }
    });
  });
});
