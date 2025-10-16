/**
 * API Route Tests - Sales Orders
 */

import { GET, POST } from '@/app/api/orders/sales/route';
import { createAuthenticatedRequest, parseResponse, factories, assertSuccessResponse, assertPaginationResponse } from '@/lib/test-utils/api-test-utils';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    salesOrder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      salesOrder: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      stockLevel: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    })),
  },
}));

import prisma from '@/lib/prisma';

describe('API: /api/orders/sales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders/sales', () => {
    it('should return paginated sales orders', async () => {
      const mockOrders = [
        factories.salesOrder({ id: '1', soNumber: 'SO-001' }),
        factories.salesOrder({ id: '2', soNumber: 'SO-002' }),
      ];

      (prisma.salesOrder.findMany as jest.Mock).mockResolvedValue(mockOrders);
      (prisma.salesOrder.count as jest.Mock).mockResolvedValue(2);

      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/sales',
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertPaginationResponse(data);
      expect(data.data.items).toHaveLength(2);
    });

    it('should filter by status', async () => {
      (prisma.salesOrder.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.salesOrder.count as jest.Mock).mockResolvedValue(0);

      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/sales',
        searchParams: {
          status: 'CONFIRMED',
        },
      });

      await GET(request);

      expect(prisma.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CONFIRMED',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      (prisma.salesOrder.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.salesOrder.count as jest.Mock).mockResolvedValue(0);

      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/sales',
        searchParams: {
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
        },
      });

      await GET(request);

      expect(prisma.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('POST /api/orders/sales', () => {
    it('should create new sales order with lines', async () => {
      const newOrder = factories.salesOrder();
      (prisma.salesOrder.create as jest.Mock).mockResolvedValue(newOrder);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/orders/sales',
        body: {
          customerId: 'cust-1',
          warehouseId: 'wh-1',
          orderDate: new Date().toISOString(),
          lines: [
            {
              inventoryItemId: 'item-1',
              quantity: 10,
              unitPrice: 99.99,
            },
          ],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(prisma.salesOrder.create).toHaveBeenCalled();
    });

    it('should validate line items', async () => {
      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/orders/sales',
        body: {
          customerId: 'cust-1',
          warehouseId: 'wh-1',
          orderDate: new Date().toISOString(),
          lines: [], // Empty lines
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should allocate stock when creating order', async () => {
      const newOrder = factories.salesOrder();
      (prisma.salesOrder.create as jest.Mock).mockResolvedValue(newOrder);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/orders/sales',
        body: {
          customerId: 'cust-1',
          warehouseId: 'wh-1',
          orderDate: new Date().toISOString(),
          lines: [
            {
              inventoryItemId: 'item-1',
              quantity: 10,
              unitPrice: 99.99,
            },
          ],
        },
      });

      await POST(request);

      // Should check stock availability
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
