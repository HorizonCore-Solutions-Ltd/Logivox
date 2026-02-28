/**
 * IoT Weight / Scale Telemetry API
 * Per packing-station scale readings, weight verification pass/fail, shift summary
 * Used by /dashboard/iot/weight-scale
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch weight/scale IoT devices
    const scaleDevices = await prisma.ioTDevice.findMany({
      where: {
        deviceType: { in: ["WEIGHT_SCALE", "SCALE", "FLOOR_SCALE"] },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        warehouse: { select: { name: true } },
      },
    });

    const deviceIds = scaleDevices.map((d) => d.id);

    // Fetch weight readings
    const weightReadings = await prisma.ioTSensorReading.findMany({
      where: {
        deviceId: { in: deviceIds },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
      take: 500,
    });

    // Fetch active alerts for scales
    const scaleAlerts = await prisma.ioTAlert.findMany({
      where: {
        deviceId: { in: deviceIds },
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
      orderBy: { triggeredAt: "desc" },
      take: 30,
    });

    // Also try to get weight readings from dedicated weight route (if exists)
    // Additional readings from the inventory IoT weight endpoint
    const inventoryWeightReadings =
      (await (prisma as any).ioTReading
        ?.findMany({
          where: {
            deviceType: "WEIGHT",
            createdAt: { gte: since },
            ...(warehouseId ? { warehouseId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
        .catch(() => [])) ?? [];

    // Build per-scale summary
    const scaleSummaries = scaleDevices.map((device) => {
      const deviceReadings = weightReadings.filter(
        (r) => r.deviceId === device.id,
      );
      const latest = deviceReadings[0];
      const currentWeight = latest?.weight ?? (latest as any)?.rawData ?? null;

      // Calculate pass/fail: reading needs to be within ±5% of expected
      const readings24h = deviceReadings.map((r) => ({
        timestamp: r.timestamp.toISOString(),
        weight: r.weight ?? null,
        verified: (r as any).verified ?? null,
        passed: (r as any).passed ?? null,
      }));

      const passCount = readings24h.filter((r) => r.passed === true).length;
      const failCount = readings24h.filter((r) => r.passed === false).length;
      const passRate =
        readings24h.length > 0
          ? +((passCount / readings24h.length) * 100).toFixed(1)
          : 0;

      return {
        id: device.id,
        name: device.name,
        deviceId: device.deviceId,
        location: device.location ?? "Packing Station",
        warehouseName: device.warehouse?.name ?? "Unknown",
        status: device.status,
        lastHeartbeat: device.lastHeartbeat?.toISOString() ?? null,
        currentWeightKg: currentWeight,
        totalReadings: deviceReadings.length,
        passCount,
        failCount,
        passRate,
        activeAlerts: scaleAlerts.filter((a) => a.deviceId === device.id)
          .length,
        lastReadingAt: latest?.timestamp.toISOString() ?? null,
        recentReadings: readings24h.slice(0, 10),
      };
    });

    // Overall summary
    const totalReadings =
      weightReadings.length + inventoryWeightReadings.length;
    const totalPassed = scaleSummaries.reduce((s, d) => s + d.passCount, 0);
    const totalFailed = scaleSummaries.reduce((s, d) => s + d.failCount, 0);
    const overallPassRate =
      totalPassed + totalFailed > 0
        ? +((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
        : 0;

    // Recent verification feed
    const verificationFeed = weightReadings
      .filter((r) => (r as any).passed !== undefined)
      .slice(0, 30)
      .map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        scaleName:
          scaleDevices.find((d) => d.id === r.deviceId)?.name ?? r.deviceId,
        weight: r.weight ?? null,
        expectedWeight: (r as any).expectedWeight ?? null,
        passed: (r as any).passed ?? null,
        timestamp: r.timestamp.toISOString(),
      }));

    return NextResponse.json({
      summary: {
        totalScales: scaleDevices.length,
        onlineScales: scaleDevices.filter((d) => d.status === "ONLINE").length,
        offlineScales: scaleDevices.filter((d) => d.status === "OFFLINE")
          .length,
        totalReadingsInWindow: totalReadings,
        totalPassed,
        totalFailed,
        overallPassRate,
        activeAlerts: scaleAlerts.filter((a) => a.status === "ACTIVE").length,
        windowHours: hours,
        lastUpdated: new Date().toISOString(),
      },
      scales: scaleSummaries,
      verificationFeed,
    });
  } catch (error) {
    console.error("Error fetching weight/scale data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
