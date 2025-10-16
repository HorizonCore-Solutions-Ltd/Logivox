/**
 * API Route Tests - Locations Management
 */

import { GET, POST } from '@/app/api/locations/route';
import { createAuthenticatedRequest, parseResponse, assertSuccessResponse } from '@/lib/test-utils/api-test-utils';
import { mockPrisma } from '@/lib/test-utils/api-test-utils';

describe('API: /api/locations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/locations', () => {
    it('should return paginated locations', async () => {
      const mockLocations = [
        {
          id: 'loc-1',
          barcode: 'LOC-A-01-01-01',
          zone: 'A',
          aisle: '01',
          rack: '01',
          bin: '01',
          warehouse: { name: 'Main Warehouse' },
          stockLevels: [],
        },
      ];

      mockPrisma.location.findMany.mockResolvedValue(mockLocations);
      mockPrisma.location.count.mockResolvedValue(1);

      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/locations',
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.locations).toEqual(mockLocations);
    });

    it('should filter by warehouse', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/locations?warehouseId=wh-1',
      });

      await GET(request);

      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            warehouseId: 'wh-1',
          }),
        })
      );
    });

    it('should filter by zone', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/locations?zone=A',
      });

      await GET(request);

      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            zone: 'A',
          }),
        })
      );
    });

    it('should search by barcode', async () => {
      const request = createAuthenticatedRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/locations?search=LOC-A',
      });

      await GET(request);

      expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            barcode: expect.objectContaining({
              contains: 'LOC-A',
            }),
          }),
        })
      );
    });
  });

  describe('POST /api/locations', () => {
    it('should create location with auto-generated barcode', async () => {
      const mockLocation = {
        id: 'loc-1',
        barcode: 'LOC-A-01-01-01',
        zone: 'A',
        aisle: '01',
        rack: '01',
        bin: '01',
        warehouseId: 'wh-1',
      };

      mockPrisma.location.create.mockResolvedValue(mockLocation);

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/locations',
        body: {
          warehouseId: 'wh-1',
          zone: 'A',
          aisle: '01',
          rack: '01',
          bin: '01',
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.barcode).toMatch(/^LOC-A-01-01-01$/);
    });

    it('should validate required fields', async () => {
      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/locations',
        body: {
          warehouseId: 'wh-1',
          // Missing zone, aisle, rack, bin
        },
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    it('should prevent duplicate locations', async () => {
      mockPrisma.location.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['warehouseId', 'zone', 'aisle', 'rack', 'bin'] },
      });

      const request = createAuthenticatedRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/locations',
        body: {
          warehouseId: 'wh-1',
          zone: 'A',
          aisle: '01',
          rack: '01',
          bin: '01',
        },
      });

      const response = await POST(request);
      
      expect(response.status).toBe(409);
    });
  });
});
