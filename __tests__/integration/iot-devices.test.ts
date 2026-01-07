import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";

describe("IoT Device Management Tests", () => {
  let testOrganizationId: string;
  let testWarehouseId: string;
  let testDeviceId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: "Test IoT Org", code: "TIOT" },
    });
    testOrganizationId = org.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        name: "Test IoT Warehouse",
        code: "TIOT01",
        organizationId: testOrganizationId,
      },
    });
    testWarehouseId = warehouse.id;
  });

  afterAll(async () => {
    await prisma.ioTAlert.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.ioTDevice.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.warehouse.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.organization.delete({ where: { id: testOrganizationId } });
  });

  test("should register IoT device", async () => {
    const device = await prisma.ioTDevice.create({
      data: {
        organizationId: testOrganizationId,
        warehouseId: testWarehouseId,
        deviceId: "SCANNER-001",
        name: "Handheld Scanner 1",
        deviceType: "SCANNER",
        manufacturer: "Zebra",
        model: "TC52",
        firmwareVersion: "1.2.3",
        status: "ONLINE",
        lastSeen: new Date(),
      },
    });

    testDeviceId = device.id;
    expect(device.deviceId).toBe("SCANNER-001");
    expect(device.status).toBe("ONLINE");
  });

  test("should update device heartbeat", async () => {
    const updated = await prisma.ioTDevice.update({
      where: { id: testDeviceId },
      data: {
        lastSeen: new Date(),
        status: "ONLINE",
        metrics: {
          batteryLevel: 85,
          signalStrength: -45,
          temperature: 22,
        },
      },
    });

    expect(updated.status).toBe("ONLINE");
    expect(updated.metrics).toHaveProperty("batteryLevel", 85);
  });

  test("should create device alert", async () => {
    const alert = await prisma.ioTAlert.create({
      data: {
        organizationId: testOrganizationId,
        deviceId: testDeviceId,
        alertType: "WARNING",
        message: "Low battery warning",
        severity: 3,
        timestamp: new Date(),
        isResolved: false,
      },
    });

    expect(alert.alertType).toBe("WARNING");
    expect(alert.isResolved).toBe(false);
  });

  test("should mark alert as resolved", async () => {
    const alert = await prisma.ioTAlert.findFirst({
      where: { deviceId: testDeviceId },
    });

    const updated = await prisma.ioTAlert.update({
      where: { id: alert!.id },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    expect(updated.isResolved).toBe(true);
    expect(updated.resolvedAt).toBeTruthy();
  });

  test("should list devices by status", async () => {
    const onlineDevices = await prisma.ioTDevice.findMany({
      where: {
        organizationId: testOrganizationId,
        status: "ONLINE",
      },
    });

    expect(onlineDevices.length).toBeGreaterThan(0);
  });

  test("should detect offline devices", async () => {
    // Simulate device going offline (no heartbeat for 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    await prisma.ioTDevice.update({
      where: { id: testDeviceId },
      data: { lastSeen: fiveMinutesAgo },
    });

    const device = await prisma.ioTDevice.findUnique({
      where: { id: testDeviceId },
    });

    const timeSinceLastSeen = Date.now() - device!.lastSeen.getTime();
    const isOffline = timeSinceLastSeen > 3 * 60 * 1000; // 3 minutes threshold

    expect(isOffline).toBe(true);
  });

  test("should count unresolved alerts per device", async () => {
    const alertCount = await prisma.ioTAlert.count({
      where: {
        deviceId: testDeviceId,
        isResolved: false,
      },
    });

    expect(alertCount).toBeGreaterThanOrEqual(0);
  });
});
