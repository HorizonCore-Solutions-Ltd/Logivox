/**
 * API Route Tests - Wave Picking
 */

import { GET, POST } from "@/app/api/waves/route";
import {
  createAuthenticatedRequest,
  parseResponse,
  assertSuccessResponse,
} from "@/lib/test-utils/api-test-utils";
import { mockPrisma } from "@/lib/test-utils/api-test-utils";

describe("API: /api/waves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/waves", () => {
    it("should return paginated waves", async () => {
      const mockWaves = [
        {
          id: "wave-1",
          waveNumber: "WAVE-20240115-001",
          status: "PENDING",
          warehouseId: "wh-1",
          createdAt: new Date(),
          orders: [],
        },
      ];

      mockPrisma.pickingWave.findMany.mockResolvedValue(mockWaves);
      mockPrisma.pickingWave.count.mockResolvedValue(1);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/waves",
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(data.data.waves).toEqual(mockWaves);
    });

    it("should filter by status", async () => {
      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/waves?status=IN_PROGRESS",
      });

      await GET(request);

      expect(mockPrisma.pickingWave.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "IN_PROGRESS",
          }),
        }),
      );
    });
  });

  describe("POST /api/waves", () => {
    it("should create wave from order selection", async () => {
      const mockWave = {
        id: "wave-1",
        waveNumber: "WAVE-20240115-001",
        status: "PENDING",
        orders: [{ id: "order-1" }, { id: "order-2" }],
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.pickingWave.create.mockResolvedValue(mockWave);

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/waves",
        body: {
          warehouseId: "wh-1",
          orderIds: ["order-1", "order-2"],
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should auto-generate wave number", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/waves",
        body: {
          warehouseId: "wh-1",
          orderIds: ["order-1"],
        },
      });

      await POST(request);

      expect(mockPrisma.pickingWave.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            waveNumber: expect.stringMatching(/^WAVE-\d{8}-\d{3}$/),
          }),
        }),
      );
    });

    it("should create picking tasks for wave", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/waves",
        body: {
          warehouseId: "wh-1",
          orderIds: ["order-1"],
        },
      });

      await POST(request);

      expect(mockPrisma.pickingTask.createMany).toHaveBeenCalled();
    });
  });
});
