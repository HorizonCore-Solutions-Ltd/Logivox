/**
 * Order Fulfillment Tests
 * Test complete order fulfillment flow from order creation to shipment
 */

import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";

describe("Order Fulfillment Flow", () => {
  let testOrg: any;
  let testWarehouse: any;
  let testUser: any;
  let testCustomer: any;
  let testItem: any;
  let testOrder: any;

  beforeAll(async () => {
    // Create test data
    testOrg = await prisma.organization.create({
      data: {
        name: `Test Org ${Date.now()}`,
        slug: `test-org-${Date.now()}`,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `test-order-${Date.now()}@example.com`,
        name: "Test Order User",
        password: "hashed",
        role: "USER",
        organizationId: testOrg.id,
      },
    });

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

    testCustomer = await prisma.customer.create({
      data: {
        name: "Test Customer",
        email: `customer-${Date.now()}@example.com`,
        organizationId: testOrg.id,
      },
    });

    testItem = await prisma.inventoryItem.create({
      data: {
        sku: `SKU-${Date.now()}`,
        name: "Test Product",
        organizationId: testOrg.id,
        unitPrice: 29.99,
        quantity: 1000,
        createdBy: testUser.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testOrder) {
      await prisma.salesOrderItem.deleteMany({
        where: { orderId: testOrder.id },
      });
      await prisma.salesOrder.delete({ where: { id: testOrder.id } });
    }
    if (testItem) {
      await prisma.inventoryItem.delete({ where: { id: testItem.id } });
    }
    if (testCustomer) {
      await prisma.customer.delete({ where: { id: testCustomer.id } });
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

  describe("Order Creation", () => {
    test("should create a sales order with items", async () => {
      testOrder = await prisma.salesOrder.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          customerId: testCustomer.id,
          organizationId: testOrg.id,
          warehouseId: testWarehouse.id,
          status: "PENDING",
          orderDate: new Date(),
          totalAmount: 59.98,
          createdBy: testUser.id,
          items: {
            create: [
              {
                itemId: testItem.id,
                quantity: 2,
                unitPrice: 29.99,
                totalPrice: 59.98,
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });

      expect(testOrder).toBeDefined();
      expect(testOrder.status).toBe("PENDING");
      expect(testOrder.items.length).toBe(1);
      expect(testOrder.items[0].quantity).toBe(2);
    });

    test("should calculate total amount correctly", async () => {
      expect(testOrder.totalAmount).toBe(59.98);
      expect(testOrder.items[0].totalPrice).toBe(59.98);
    });
  });

  describe("Order Processing", () => {
    test("should update order status to processing", async () => {
      const updatedOrder = await prisma.salesOrder.update({
        where: { id: testOrder.id },
        data: { status: "PROCESSING" },
      });

      expect(updatedOrder.status).toBe("PROCESSING");
    });

    test("should reserve inventory for order", async () => {
      const orderQuantity = testOrder.items[0].quantity;
      const currentQuantity = testItem.quantity;

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: testItem.id },
        data: {
          quantity: currentQuantity - orderQuantity,
          reservedQuantity: orderQuantity,
        },
      });

      expect(updatedItem.reservedQuantity).toBe(orderQuantity);
      expect(updatedItem.quantity).toBe(currentQuantity - orderQuantity);
    });
  });

  describe("Pick List Generation", () => {
    test("should create a pick list for the order", async () => {
      const pickList = await prisma.pickList.create({
        data: {
          pickNumber: `PICK-${Date.now()}`,
          orderId: testOrder.id,
          warehouseId: testWarehouse.id,
          status: "PENDING",
          assignedTo: testUser.id,
          organizationId: testOrg.id,
        },
      });

      expect(pickList).toBeDefined();
      expect(pickList.status).toBe("PENDING");
      expect(pickList.orderId).toBe(testOrder.id);

      // Cleanup
      await prisma.pickList.delete({ where: { id: pickList.id } });
    });
  });

  describe("Order Shipment", () => {
    test("should create shipment for order", async () => {
      const shipment = await prisma.shipment.create({
        data: {
          shipmentNumber: `SHIP-${Date.now()}`,
          orderId: testOrder.id,
          warehouseId: testWarehouse.id,
          status: "PENDING",
          trackingNumber: `TRACK-${Date.now()}`,
          organizationId: testOrg.id,
          createdBy: testUser.id,
        },
      });

      expect(shipment).toBeDefined();
      expect(shipment.orderId).toBe(testOrder.id);
      expect(shipment.trackingNumber).toContain("TRACK-");

      // Cleanup
      await prisma.shipment.delete({ where: { id: shipment.id } });
    });

    test("should update order status to shipped", async () => {
      const updatedOrder = await prisma.salesOrder.update({
        where: { id: testOrder.id },
        data: {
          status: "SHIPPED",
          shippedAt: new Date(),
        },
      });

      expect(updatedOrder.status).toBe("SHIPPED");
      expect(updatedOrder.shippedAt).toBeDefined();
    });
  });

  describe("Order Completion", () => {
    test("should mark order as completed", async () => {
      const completedOrder = await prisma.salesOrder.update({
        where: { id: testOrder.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      expect(completedOrder.status).toBe("COMPLETED");
      expect(completedOrder.completedAt).toBeDefined();
    });

    test("should track order lifecycle timestamps", async () => {
      const order = await prisma.salesOrder.findUnique({
        where: { id: testOrder.id },
      });

      expect(order?.orderDate).toBeDefined();
      expect(order?.shippedAt).toBeDefined();
      expect(order?.completedAt).toBeDefined();
    });
  });

  describe("Order Cancellation", () => {
    test("should allow cancellation of pending orders", async () => {
      const cancelOrder = await prisma.salesOrder.create({
        data: {
          orderNumber: `ORD-CANCEL-${Date.now()}`,
          customerId: testCustomer.id,
          organizationId: testOrg.id,
          warehouseId: testWarehouse.id,
          status: "PENDING",
          orderDate: new Date(),
          totalAmount: 29.99,
          createdBy: testUser.id,
        },
      });

      const cancelledOrder = await prisma.salesOrder.update({
        where: { id: cancelOrder.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      expect(cancelledOrder.status).toBe("CANCELLED");
      expect(cancelledOrder.cancelledAt).toBeDefined();

      // Cleanup
      await prisma.salesOrder.delete({ where: { id: cancelOrder.id } });
    });
  });
});
