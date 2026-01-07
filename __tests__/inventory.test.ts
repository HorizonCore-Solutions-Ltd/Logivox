/**
 * Inventory Tests
 * Test inventory CRUD operations and business logic
 */

import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";

describe("Inventory Management", () => {
  let testOrg: any;
  let testWarehouse: any;
  let testCategory: any;
  let testItem: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test organization
    testOrg = await prisma.organization.create({
      data: {
        name: `Test Org ${Date.now()}`,
        slug: `test-org-${Date.now()}`,
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-inv-${Date.now()}@example.com`,
        name: "Test Inventory User",
        password: "hashed",
        role: "USER",
        organizationId: testOrg.id,
      },
    });

    // Create test warehouse
    testWarehouse = await prisma.warehouse.create({
      data: {
        name: "Test Warehouse",
        code: `TWH-${Date.now()}`,
        organizationId: testOrg.id,
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        country: "US",
      },
    });

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: "Test Category",
        code: `TCAT-${Date.now()}`,
        organizationId: testOrg.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testItem) {
      await prisma.inventoryItem.delete({ where: { id: testItem.id } });
    }
    if (testCategory) {
      await prisma.category.delete({ where: { id: testCategory.id } });
    }
    if (testWarehouse) {
      await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (testOrg) {
      await prisma.organization.delete({ where: { id: testOrg.id } });
    }
    await prisma.$disconnect();
  });

  describe("Inventory Item Creation", () => {
    test("should create a new inventory item", async () => {
      testItem = await prisma.inventoryItem.create({
        data: {
          sku: `SKU-${Date.now()}`,
          name: "Test Product",
          description: "A test product",
          organizationId: testOrg.id,
          categoryId: testCategory.id,
          unitPrice: 29.99,
          quantity: 100,
          reorderPoint: 20,
          reorderQuantity: 50,
          createdBy: testUser.id,
        },
      });

      expect(testItem).toBeDefined();
      expect(testItem.sku).toContain("SKU-");
      expect(testItem.name).toBe("Test Product");
      expect(testItem.quantity).toBe(100);
    });

    test("should not allow duplicate SKU in same organization", async () => {
      await expect(
        prisma.inventoryItem.create({
          data: {
            sku: testItem.sku,
            name: "Duplicate Product",
            organizationId: testOrg.id,
            categoryId: testCategory.id,
            unitPrice: 19.99,
            quantity: 50,
            createdBy: testUser.id,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Inventory Updates", () => {
    test("should update inventory quantity", async () => {
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: testItem.id },
        data: { quantity: 150 },
      });

      expect(updatedItem.quantity).toBe(150);
    });

    test("should update item price", async () => {
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: testItem.id },
        data: { unitPrice: 34.99 },
      });

      expect(updatedItem.unitPrice).toBe(34.99);
    });
  });

  describe("Inventory Queries", () => {
    test("should find item by SKU", async () => {
      const foundItem = await prisma.inventoryItem.findFirst({
        where: {
          sku: testItem.sku,
          organizationId: testOrg.id,
        },
      });

      expect(foundItem).toBeDefined();
      expect(foundItem?.id).toBe(testItem.id);
    });

    test("should filter items by category", async () => {
      const items = await prisma.inventoryItem.findMany({
        where: {
          organizationId: testOrg.id,
          categoryId: testCategory.id,
        },
      });

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].categoryId).toBe(testCategory.id);
    });

    test("should find low stock items", async () => {
      await prisma.inventoryItem.update({
        where: { id: testItem.id },
        data: { quantity: 10, reorderPoint: 20 },
      });

      const lowStockItems = await prisma.inventoryItem.findMany({
        where: {
          organizationId: testOrg.id,
          quantity: { lte: prisma.inventoryItem.fields.reorderPoint },
        },
      });

      expect(lowStockItems.length).toBeGreaterThan(0);
    });
  });

  describe("Inventory Movement Tracking", () => {
    test("should create inventory movement record", async () => {
      const movement = await prisma.inventoryMovement.create({
        data: {
          itemId: testItem.id,
          warehouseId: testWarehouse.id,
          movementType: "ADJUSTMENT",
          quantityChange: 50,
          quantityBefore: testItem.quantity,
          quantityAfter: testItem.quantity + 50,
          reason: "Stock count adjustment",
          performedBy: testUser.id,
          organizationId: testOrg.id,
        },
      });

      expect(movement).toBeDefined();
      expect(movement.quantityChange).toBe(50);

      // Cleanup
      await prisma.inventoryMovement.delete({ where: { id: movement.id } });
    });
  });

  describe("Multi-Tenant Isolation", () => {
    test("should not find items from different organization", async () => {
      const otherOrg = await prisma.organization.create({
        data: {
          name: `Other Org ${Date.now()}`,
          slug: `other-org-${Date.now()}`,
        },
      });

      const items = await prisma.inventoryItem.findMany({
        where: {
          organizationId: otherOrg.id,
          sku: testItem.sku,
        },
      });

      expect(items.length).toBe(0);

      // Cleanup
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });
  });
});
