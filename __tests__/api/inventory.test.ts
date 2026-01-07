/**
 * API Route Tests - Inventory Items
 */

import { GET, POST } from "@/app/api/inventory/route";
import {
  createAuthenticatedRequest,
  parseResponse,
  factories,
  assertSuccessResponse,
  assertPaginationResponse,
} from "@/lib/test-utils/api-test-utils";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    inventoryItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) =>
      callback({
        inventoryItem: {
          findMany: jest.fn(),
          count: jest.fn(),
        },
      }),
    ),
  },
}));

import prisma from "@/lib/prisma";

describe("API: /api/inventory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/inventory", () => {
    it("should return paginated inventory items", async () => {
      const mockItems = [
        factories.inventoryItem({ id: "1", sku: "SKU-001" }),
        factories.inventoryItem({ id: "2", sku: "SKU-002" }),
      ];

      (prisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);
      (prisma.inventoryItem.count as jest.Mock).mockResolvedValue(2);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/inventory",
        searchParams: {
          page: "1",
          limit: "10",
        },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      assertPaginationResponse(data);
      expect(data.data.items).toHaveLength(2);
      expect(data.data.total).toBe(2);
    });

    it("should filter by search query", async () => {
      const mockItems = [factories.inventoryItem({ sku: "TEST-001" })];

      (prisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(mockItems);
      (prisma.inventoryItem.count as jest.Mock).mockResolvedValue(1);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/inventory",
        searchParams: {
          search: "TEST",
        },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                sku: expect.objectContaining({ contains: "TEST" }),
              }),
            ]),
          }),
        }),
      );
    });

    it("should filter by category", async () => {
      (prisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inventoryItem.count as jest.Mock).mockResolvedValue(0);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/inventory",
        searchParams: {
          categoryId: "cat-123",
        },
      });

      await GET(request);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: "cat-123",
          }),
        }),
      );
    });

    it("should sort by specified field", async () => {
      (prisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inventoryItem.count as jest.Mock).mockResolvedValue(0);

      const request = createAuthenticatedRequest({
        method: "GET",
        url: "http://localhost:3000/api/inventory",
        searchParams: {
          sortBy: "sku",
          sortOrder: "asc",
        },
      });

      await GET(request);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sku: "asc" },
        }),
      );
    });
  });

  describe("POST /api/inventory", () => {
    it("should create new inventory item", async () => {
      const newItem = factories.inventoryItem();
      (prisma.inventoryItem.create as jest.Mock).mockResolvedValue(newItem);

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/inventory",
        body: {
          sku: "NEW-SKU-001",
          name: "New Product",
          unitPrice: 99.99,
          reorderPoint: 10,
          reorderQuantity: 100,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      assertSuccessResponse(data);
      expect(prisma.inventoryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sku: "NEW-SKU-001",
            name: "New Product",
          }),
        }),
      );
    });

    it("should validate required fields", async () => {
      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/inventory",
        body: {
          // Missing required fields
          name: "Incomplete Item",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should handle duplicate SKU error", async () => {
      (prisma.inventoryItem.create as jest.Mock).mockRejectedValue({
        code: "P2002",
        meta: { target: ["sku"] },
      });

      const request = createAuthenticatedRequest({
        method: "POST",
        url: "http://localhost:3000/api/inventory",
        body: {
          sku: "DUPLICATE-SKU",
          name: "Product",
          unitPrice: 99.99,
          reorderPoint: 10,
          reorderQuantity: 100,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });
  });
});
