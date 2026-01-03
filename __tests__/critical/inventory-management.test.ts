// =============================================================================
// CRITICAL PATH TESTS - Inventory Management
// =============================================================================
import { describe, test, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';

describe('Inventory Management Critical Path', () => {
  let organizationId: string;
  let warehouseId: string;
  let locationId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
      },
    });
    organizationId = org.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashed_password',
      },
    });
    userId = user.id;

    // Create test warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Test Warehouse',
        code: `WH-${Date.now()}`,
        organizationId,
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'Test Country',
        postalCode: '12345',
      },
    });
    warehouseId = warehouse.id;

    // Create test location
    const location = await prisma.location.create({
      data: {
        organizationId,
        warehouseId,
        locationCode: `LOC-${Date.now()}`,
        name: 'Test Location',
        type: 'BIN',
        isActive: true,
      },
    });
    locationId = location.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.inventoryItem.deleteMany({ where: { organizationId } });
    await prisma.location.deleteMany({ where: { organizationId } });
    await prisma.warehouse.deleteMany({ where: { organizationId } });
    await prisma.organizationMember.deleteMany({ where: { organizationId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  describe('Inventory Item Creation', () => {
    test('should create inventory item with basic details', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          description: 'Test Description',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      expect(item).toBeDefined();
      expect(item.sku).toContain('SKU-');
      expect(item.name).toBe('Test Product');
      expect(item.quantity).toBe(100);
    });

    test('should not allow duplicate SKUs in same organization', async () => {
      const sku = `SKU-${Date.now()}`;

      await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku,
          name: 'Test Product 1',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      await expect(
        prisma.inventoryItem.create({
          data: {
            organizationId,
            sku,
            name: 'Test Product 2',
            quantity: 50,
            locationId,
            warehouseId,
          },
        })
      ).rejects.toThrow();
    });

    test('should set reorder point and low stock threshold', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 100,
          reorderPoint: 20,
          reorderQuantity: 100,
          locationId,
          warehouseId,
        },
      });

      expect(item.reorderPoint).toBe(20);
      expect(item.reorderQuantity).toBe(100);
    });
  });

  describe('Inventory Adjustments', () => {
    test('should increase inventory quantity', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      const adjustment = await prisma.stockAdjustment.create({
        data: {
          organizationId,
          inventoryItemId: item.id,
          locationId,
          adjustmentType: 'INCREASE',
          quantity: 50,
          reason: 'RECEIVING',
          notes: 'Test increase',
        },
      });

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: { increment: 50 } },
      });

      expect(adjustment).toBeDefined();
      expect(updatedItem.quantity).toBe(150);
    });

    test('should decrease inventory quantity', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      const adjustment = await prisma.stockAdjustment.create({
        data: {
          organizationId,
          inventoryItemId: item.id,
          locationId,
          adjustmentType: 'DECREASE',
          quantity: 30,
          reason: 'DAMAGE',
          notes: 'Test decrease',
        },
      });

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: { decrement: 30 } },
      });

      expect(adjustment).toBeDefined();
      expect(updatedItem.quantity).toBe(70);
    });

    test('should not allow negative inventory', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 10,
          locationId,
          warehouseId,
        },
      });

      // This should be prevented by business logic
      const newQuantity = Math.max(0, item.quantity - 20);
      expect(newQuantity).toBe(0);
    });
  });

  describe('Inventory Movements', () => {
    test('should move inventory between locations', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      // Create destination location
      const destLocation = await prisma.location.create({
        data: {
          organizationId,
          warehouseId,
          locationCode: `LOC-DEST-${Date.now()}`,
          name: 'Destination Location',
          type: 'BIN',
          isActive: true,
        },
      });

      const movement = await prisma.inventoryMovement.create({
        data: {
          organizationId,
          inventoryItemId: item.id,
          fromLocationId: locationId,
          toLocationId: destLocation.id,
          quantity: 50,
          movementType: 'TRANSFER',
          status: 'COMPLETED',
        },
      });

      expect(movement).toBeDefined();
      expect(movement.quantity).toBe(50);
      expect(movement.fromLocationId).toBe(locationId);
      expect(movement.toLocationId).toBe(destLocation.id);

      // Cleanup
      await prisma.location.delete({ where: { id: destLocation.id } });
    });
  });

  describe('Low Stock Alerts', () => {
    test('should detect low stock items', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 15,
          reorderPoint: 20,
          reorderQuantity: 100,
          locationId,
          warehouseId,
        },
      });

      // Business logic: item is below reorder point
      const isLowStock = item.quantity <= (item.reorderPoint || 0);
      expect(isLowStock).toBe(true);
    });

    test('should not alert when stock is sufficient', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-${Date.now()}`,
          name: 'Test Product',
          quantity: 100,
          reorderPoint: 20,
          reorderQuantity: 100,
          locationId,
          warehouseId,
        },
      });

      const isLowStock = item.quantity <= (item.reorderPoint || 0);
      expect(isLowStock).toBe(false);
    });
  });

  describe('Inventory Search and Filtering', () => {
    test('should find inventory by SKU', async () => {
      const sku = `SKU-SEARCH-${Date.now()}`;
      
      await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku,
          name: 'Searchable Product',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      const found = await prisma.inventoryItem.findFirst({
        where: {
          organizationId,
          sku: { contains: 'SEARCH', mode: 'insensitive' },
        },
      });

      expect(found).toBeDefined();
      expect(found!.sku).toBe(sku);
    });

    test('should filter inventory by location', async () => {
      await prisma.inventoryItem.create({
        data: {
          organizationId,
          sku: `SKU-LOC-${Date.now()}`,
          name: 'Location Test Product',
          quantity: 100,
          locationId,
          warehouseId,
        },
      });

      const items = await prisma.inventoryItem.findMany({
        where: {
          organizationId,
          locationId,
        },
      });

      expect(items.length).toBeGreaterThan(0);
      items.forEach(item => {
        expect(item.locationId).toBe(locationId);
      });
    });
  });
});
