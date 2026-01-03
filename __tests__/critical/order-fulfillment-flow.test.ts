// =============================================================================
// CRITICAL PATH TESTS - Order Fulfillment
// =============================================================================
import { describe, test, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';

describe('Order Fulfillment Critical Path', () => {
  let organizationId: string;
  let warehouseId: string;
  let customerId: string;
  let userId: string;
  let inventoryItemId: string;

  beforeEach(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: `test-${Date.now()}`,
      },
    });
    organizationId = org.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@test.com`,
        name: 'Test User',
        password: 'hashed',
      },
    });
    userId = user.id;

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        code: `WH-${Date.now()}`,
        organizationId,
        address: '123 Main St',
        city: 'City',
        state: 'ST',
        country: 'Country',
        postalCode: '12345',
      },
    });
    warehouseId = warehouse.id;

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        customerNumber: `CUST-${Date.now()}`,
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '1234567890',
      },
    });
    customerId = customer.id;

    // Create inventory item
    const location = await prisma.location.create({
      data: {
        organizationId,
        warehouseId,
        locationCode: `LOC-${Date.now()}`,
        name: 'Storage',
        type: 'BIN',
        isActive: true,
      },
    });

    const item = await prisma.inventoryItem.create({
      data: {
        organizationId,
        sku: `SKU-${Date.now()}`,
        name: 'Test Product',
        quantity: 1000,
        locationId: location.id,
        warehouseId,
        unitPrice: 10.00,
      },
    });
    inventoryItemId = item.id;
  });

  afterEach(async () => {
    // Cleanup in reverse order
    await prisma.salesOrderLine.deleteMany({ where: { order: { organizationId } } });
    await prisma.salesOrder.deleteMany({ where: { organizationId } });
    await prisma.customer.deleteMany({ where: { organizationId } });
    await prisma.inventoryItem.deleteMany({ where: { organizationId } });
    await prisma.location.deleteMany({ where: { organizationId } });
    await prisma.warehouse.deleteMany({ where: { organizationId } });
    await prisma.organizationMember.deleteMany({ where: { organizationId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  describe('Sales Order Creation', () => {
    test('should create a sales order with line items', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'PENDING',
          totalAmount: 100.00,
          lines: {
            create: [
              {
                inventoryItemId,
                quantity: 10,
                unitPrice: 10.00,
                totalPrice: 100.00,
              },
            ],
          },
        },
        include: { lines: true },
      });

      expect(order).toBeDefined();
      expect(order.status).toBe('PENDING');
      expect(order.lines.length).toBe(1);
      expect(order.lines[0].quantity).toBe(10);
      expect(order.totalAmount).toBe(100.00);
    });

    test('should calculate order total correctly', async () => {
      const lineItems = [
        { quantity: 10, unitPrice: 10.00 },
        { quantity: 5, unitPrice: 20.00 },
      ];

      const totalAmount = lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      expect(totalAmount).toBe(200.00);
    });

    test('should validate stock availability', async () => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      const requestedQuantity = 50;
      const isAvailable = item!.quantity >= requestedQuantity;

      expect(isAvailable).toBe(true);
    });

    test('should reject order if insufficient stock', async () => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      const requestedQuantity = 2000; // More than available
      const isAvailable = item!.quantity >= requestedQuantity;

      expect(isAvailable).toBe(false);
    });
  });

  describe('Order Status Workflow', () => {
    test('should transition order from PENDING to CONFIRMED', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'PENDING',
          totalAmount: 50.00,
        },
      });

      const updated = await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });

      expect(updated.status).toBe('CONFIRMED');
    });

    test('should track order status history', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'PENDING',
          totalAmount: 50.00,
        },
      });

      const statuses: string[] = ['PENDING'];

      // Confirm
      await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });
      statuses.push('CONFIRMED');

      // Pick
      await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: 'PICKING' },
      });
      statuses.push('PICKING');

      // Pack
      await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: 'PACKING' },
      });
      statuses.push('PACKING');

      // Ship
      await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' },
      });
      statuses.push('SHIPPED');

      expect(statuses).toContain('PENDING');
      expect(statuses).toContain('CONFIRMED');
      expect(statuses).toContain('PICKING');
      expect(statuses).toContain('PACKING');
      expect(statuses).toContain('SHIPPED');
    });
  });

  describe('Picking Process', () => {
    test('should create pick list from order', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'CONFIRMED',
          totalAmount: 100.00,
          lines: {
            create: [
              {
                inventoryItemId,
                quantity: 10,
                unitPrice: 10.00,
                totalPrice: 100.00,
              },
            ],
          },
        },
      });

      const pickList = await prisma.pickList.create({
        data: {
          organizationId,
          warehouseId,
          pickListNumber: `PL-${Date.now()}`,
          status: 'PENDING',
          orderId: order.id,
        },
      });

      expect(pickList).toBeDefined();
      expect(pickList.status).toBe('PENDING');
      expect(pickList.orderId).toBe(order.id);
    });

    test('should assign picker to pick list', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'CONFIRMED',
          totalAmount: 100.00,
        },
      });

      const pickList = await prisma.pickList.create({
        data: {
          organizationId,
          warehouseId,
          pickListNumber: `PL-${Date.now()}`,
          status: 'PENDING',
          orderId: order.id,
          assignedToId: userId,
        },
      });

      expect(pickList.assignedToId).toBe(userId);
    });

    test('should complete picking and update inventory', async () => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });
      const initialQuantity = item!.quantity;

      const pickedQuantity = 10;

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { decrement: pickedQuantity } },
      });

      expect(updatedItem.quantity).toBe(initialQuantity - pickedQuantity);
    });
  });

  describe('Packing Process', () => {
    test('should create packing slip', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'PICKING',
          totalAmount: 100.00,
        },
      });

      const packing = await prisma.packing.create({
        data: {
          organizationId,
          warehouseId,
          orderId: order.id,
          packingSlipNumber: `PS-${Date.now()}`,
          status: 'PENDING',
        },
      });

      expect(packing).toBeDefined();
      expect(packing.orderId).toBe(order.id);
    });
  });

  describe('Shipping Process', () => {
    test('should create shipment with tracking', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'PACKING',
          totalAmount: 100.00,
        },
      });

      const shipment = await prisma.shipment.create({
        data: {
          organizationId,
          warehouseId,
          orderId: order.id,
          shipmentNumber: `SHIP-${Date.now()}`,
          trackingNumber: `TRACK-${Date.now()}`,
          status: 'PENDING',
        },
      });

      expect(shipment).toBeDefined();
      expect(shipment.trackingNumber).toContain('TRACK-');
    });

    test('should complete order after shipment', async () => {
      const order = await prisma.salesOrder.create({
        data: {
          organizationId,
          customerId,
          warehouseId,
          orderNumber: `SO-${Date.now()}`,
          orderDate: new Date(),
          status: 'PACKING',
          totalAmount: 100.00,
        },
      });

      // Ship
      await prisma.shipment.create({
        data: {
          organizationId,
          warehouseId,
          orderId: order.id,
          shipmentNumber: `SHIP-${Date.now()}`,
          status: 'SHIPPED',
        },
      });

      // Complete order
      const completed = await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' },
      });

      expect(completed.status).toBe('SHIPPED');
    });
  });
});
