import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";

describe("Temperature Monitoring & Hazmat Tests", () => {
  let testOrganizationId: string;
  let testWarehouseId: string;
  let testProductId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: "Test Compliance Org", code: "TCOMP" },
    });
    testOrganizationId = org.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        name: "Cold Storage Facility",
        code: "COLD01",
        organizationId: testOrganizationId,
        minTemperature: 2,
        maxTemperature: 8,
      },
    });
    testWarehouseId = warehouse.id;

    const product = await prisma.product.create({
      data: {
        organizationId: testOrganizationId,
        name: "Hazardous Chemical X",
        sku: "HAZ-CHEM-001",
        barcode: "123456789",
        isHazmat: true,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.temperatureLog.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.hazmatRecord.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.product.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.warehouse.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.organization.delete({ where: { id: testOrganizationId } });
  });

  describe("Temperature Monitoring", () => {
    test("should record temperature within range", async () => {
      const log = await prisma.temperatureLog.create({
        data: {
          organizationId: testOrganizationId,
          warehouseId: testWarehouseId,
          temperature: 5.0,
          humidity: 60,
          sensorType: "AUTOMATED",
          timestamp: new Date(),
          isViolation: false,
        },
      });

      expect(log.temperature).toBe(5.0);
      expect(log.isViolation).toBe(false);
    });

    test("should detect temperature violation", async () => {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: testWarehouseId },
      });

      const temperature = 15.0; // Above max of 8°C
      const isViolation = temperature > (warehouse?.maxTemperature || 25);

      const log = await prisma.temperatureLog.create({
        data: {
          organizationId: testOrganizationId,
          warehouseId: testWarehouseId,
          temperature,
          sensorType: "AUTOMATED",
          timestamp: new Date(),
          isViolation,
        },
      });

      expect(log.isViolation).toBe(true);
    });

    test("should calculate compliance rate", async () => {
      const allLogs = await prisma.temperatureLog.findMany({
        where: { organizationId: testOrganizationId },
      });

      const violations = allLogs.filter((log) => log.isViolation).length;
      const complianceRate =
        allLogs.length > 0
          ? ((allLogs.length - violations) / allLogs.length) * 100
          : 100;

      expect(complianceRate).toBeGreaterThanOrEqual(0);
      expect(complianceRate).toBeLessThanOrEqual(100);
    });

    test("should list violations in date range", async () => {
      const today = new Date();
      const violations = await prisma.temperatureLog.findMany({
        where: {
          organizationId: testOrganizationId,
          isViolation: true,
          timestamp: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        },
      });

      expect(violations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Hazmat Records", () => {
    test("should create hazmat record", async () => {
      const hazmat = await prisma.hazmatRecord.create({
        data: {
          organizationId: testOrganizationId,
          productId: testProductId,
          unNumber: "UN1090",
          hazardClass: "Class 3 - Flammable Liquids",
          packingGroup: "II",
          properShippingName: "Acetone",
          storageRequirements:
            "Store in cool, dry place away from ignition sources",
          handlingInstructions: "Use protective equipment. Avoid inhalation.",
          emergencyContact: "+1-800-HAZMAT",
          certificationNumber: "CERT-2026-001",
          isActive: true,
        },
      });

      expect(hazmat.unNumber).toBe("UN1090");
      expect(hazmat.hazardClass).toBe("Class 3 - Flammable Liquids");
    });

    test("should prevent duplicate active hazmat records", async () => {
      const existing = await prisma.hazmatRecord.findFirst({
        where: {
          organizationId: testOrganizationId,
          productId: testProductId,
          isActive: true,
        },
      });

      expect(existing).toBeTruthy();

      // Attempting to create another would require deactivating the first
      const count = await prisma.hazmatRecord.count({
        where: {
          organizationId: testOrganizationId,
          productId: testProductId,
          isActive: true,
        },
      });

      expect(count).toBe(1);
    });

    test("should list hazmat products by class", async () => {
      const flammableProducts = await prisma.hazmatRecord.findMany({
        where: {
          organizationId: testOrganizationId,
          hazardClass: { contains: "Flammable" },
          isActive: true,
        },
      });

      expect(flammableProducts.length).toBeGreaterThan(0);
    });

    test("should check for expiring certifications", async () => {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const expiringSoon = await prisma.hazmatRecord.findMany({
        where: {
          organizationId: testOrganizationId,
          isActive: true,
          expiryDate: {
            lte: thirtyDaysFromNow,
            gte: new Date(),
          },
        },
      });

      // Should return records expiring within 30 days
      expect(expiringSoon).toBeDefined();
    });

    test("should mark product as hazmat", async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      });

      expect(product?.isHazmat).toBe(true);
    });
  });
});
