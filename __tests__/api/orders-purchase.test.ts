/**
 * API Route Tests - Purchase Orders
 */

import { GET, POST } from '@/app/api/orders/purchase/route';
import { createAuthenticatedRequest, parseResponse, assertSuccessResponse, assertErrorResponse } from '@/lib/test-utils/api-test-utils';
import { mockPrisma } from '@/lib/test-utils/api-test-utils';

describe('API: /api/orders/purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders/purchase', () => {
    it('should return paginated purchase orders', async () => {
      const mockOrders = [
        {
          id: '1',
          poNumber: 'PO-20240101-001',
          supplierId: 'sup-1',
          supplier: { name: 'Test Supplier' },
          status: 'DRAFT',
          orderDate: new Date(),
        },
      ];

      mockPrisma.purchaseOrder.findMany.mockResolvedValue(mockOrders);
      mockPrisma.purchaseOrder.count.mockResolvedValue(1);

      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/purchase',
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.orders).toEqual(mockOrders);
      expect(data.data.total).toBe(1);
    });

    it('should filter by status', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/purchase?status=CONFIRMED',
      });

      await GET(request);

      expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CONFIRMED',
          }),
        })
      );
    });

    it('should filter by supplier', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/purchase?supplierId=sup-1',
      });

      await GET(request);

      expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supplierId: 'sup-1',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/orders/purchase?dateFrom=2024-01-01&dateTo=2024-01-31',
      });

      await GET(request);

      expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderDate: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      );
    });
  });

  describe('POST /api/orders/purchase', () => {
    it('should create purchase order with line items', async () => {
      const mockOrder = {
        id: '1',
        poNumber: 'PO-20240101-001',
        supplierId: 'sup-1',
        status: 'DRAFT',
        lineItems: [
          { id: '1', inventoryItemId: 'item-1', quantity: 10, unitPrice: 9.99 },
        ],
      };

      mockPrisma.purchaseOrder.create.mockResolvedValue(mockOrder);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/orders/purchase',
        body: {
          supplierId: 'sup-1',
          expectedDeliveryDate: '2024-01-15',
          lineItems: [
            { inventoryItemId: 'item-1', quantity: 10, unitPrice: 9.99 },
          ],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data).toEqual(mockOrder);
    });

    it('should validate line items exist', async () => {
      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/orders/purchase',
        body: {
          supplierId: 'sup-1',
          lineItems: [],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertErrorResponse(data);
      expect(response.status).toBe(400);
    });

    it('should auto-generate PO number', async () => {
      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/orders/purchase',
        body: {
          supplierId: 'sup-1',
          lineItems: [
            { inventoryItemId: 'item-1', quantity: 10, unitPrice: 9.99 },
          ],
        },
      });

      await POST(request);

      expect(mockPrisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            poNumber: expect.stringMatching(/^PO-\d{8}-\d{3}$/),
          }),
        })
      );
    });
  });
});
