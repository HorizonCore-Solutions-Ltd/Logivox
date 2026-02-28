/**
 * RFID Portal Integration API
 * Per dock-door RFID reader status, scan feed, inventory auto-update log
 * Used by /dashboard/iot/rfid-portal
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId") ?? undefined;
    const hours = parseInt(searchParams.get("hours") ?? "8", 10);

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Fetch RFID reader devices
    const rfidDevices = await prisma.ioTDevice.findMany({
      where: {
        deviceType: { in: ["RFID_READER", "RFID"] },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        warehouse: { select: { name: true } },
      },
    });

    const deviceIds = rfidDevices.map((d) => d.id);

    // Fetch RFID scan readings
    const rfidReadings = await prisma.ioTSensorReading.findMany({
      where: {
        deviceId: { in: deviceIds },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    // Fetch active alerts
    const rfidAlerts = await prisma.ioTAlert.findMany({
      where: {
        deviceId: { in: deviceIds },
        status: "ACTIVE",
      },
      orderBy: { triggeredAt: "desc" },
      take: 20,
    });

    // Build per-reader summary
    const readerSummaries = rfidDevices.map((device) => {
      const deviceReadings = rfidReadings.filter(
        (r) => r.deviceId === device.id,
      );
      const scansInWindow = deviceReadings.length;
      const latest = deviceReadings[0];

      // Scan rate: scans per hour in last window
      const scanRate = hours > 0 ? +(scansInWindow / hours).toFixed(1) : 0;

      // Hourly scan trend last 8 data points
      const trend = Array.from({ length: 8 }, (_, i) => {
        const windowStart = new Date(Date.now() - (8 - i) * 60 * 60 * 1000);
        const windowEnd = new Date(Date.now() - (7 - i) * 60 * 60 * 1000);
        const count = deviceReadings.filter(
          (r) => r.timestamp >= windowStart && r.timestamp < windowEnd,
        ).length;
        return {
          hour: windowStart.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          scans: count,
        };
      });

      return {
        id: device.id,
        name: device.name,
        deviceId: device.deviceId,
        location: device.location ?? "Unassigned",
        warehouseName: device.warehouse?.name ?? "Unknown",
        status: device.status,
        lastHeartbeat: device.lastHeartbeat?.toISOString() ?? null,
        totalScansInWindow: scansInWindow,
        scanRate,
        lastScanAt: latest?.timestamp.toISOString() ?? null,
        activeAlerts: rfidAlerts.filter((a) => a.deviceId === device.id).length,
        trend,
      };
    });

    // Latest scan events feed
    const scanFeed = rfidReadings.slice(0, 50).map((r) => ({
      id: r.id,
      deviceId: r.deviceId,
      readerName:
        rfidDevices.find((d) => d.id === r.deviceId)?.name ?? r.deviceId,
      scannedTag: (r as any).scannedTag ?? (r as any).rawData ?? "Unknown",
      timestamp: r.timestamp.toISOString(),
      inventoryUpdated: (r as any).inventoryUpdated ?? false,
    }));

    const totalScans = rfidReadings.length;
    const onlineReaders = rfidDevices.filter(
      (d) => d.status === "ONLINE",
    ).length;

    return NextResponse.json({
      summary: {
        totalReaders: rfidDevices.length,
        onlineReaders,
        offlineReaders: rfidDevices.length - onlineReaders,
        totalScansInWindow: totalScans,
        avgScanRate:
          rfidDevices.length > 0
            ? +(totalScans / rfidDevices.length / hours).toFixed(1)
            : 0,
        activeAlerts: rfidAlerts.length,
        windowHours: hours,
        lastUpdated: new Date().toISOString(),
      },
      readers: readerSummaries,
      scanFeed,
    });
  } catch (error) {
    console.error("Error fetching RFID portal data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
