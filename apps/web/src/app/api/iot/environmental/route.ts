/**
 * IoT Environmental Monitoring API
 * Temperature, humidity, cold-chain compliance per zone
 * Used by /dashboard/iot/environmental
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
    const hours = parseInt(searchParams.get("hours") ?? "24", 10);

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Fetch environmental/temp/humidity IoT devices
    const envDevices = await prisma.ioTDevice.findMany({
      where: {
        deviceType: {
          in: ["TEMPERATURE_SENSOR", "HUMIDITY_SENSOR", "ENVIRONMENTAL"],
        },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        warehouse: { select: { name: true } },
      },
    });

    // Fetch recent sensor readings for these devices
    const deviceIds = envDevices.map((d) => d.id);

    const readings = await prisma.ioTSensorReading.findMany({
      where: {
        deviceId: { in: deviceIds },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
    });

    // Fetch active IoT alerts for these devices
    const alerts = await prisma.ioTAlert.findMany({
      where: {
        deviceId: { in: deviceIds },
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
      orderBy: { triggeredAt: "desc" },
      take: 50,
    });

    // Build per-device summary
    const deviceSummaries = envDevices.map((device) => {
      const deviceReadings = readings.filter((r) => r.deviceId === device.id);
      const latest = deviceReadings[0];
      const deviceAlerts = alerts.filter((a) => a.deviceId === device.id);

      // Trend: last 12 readings for this device
      const trend = deviceReadings
        .slice(0, 12)
        .reverse()
        .map((r) => ({
          timestamp: r.timestamp.toISOString(),
          temperature: r.temperature ?? null,
          humidity: r.humidity ?? null,
        }));

      // Cold-chain compliance: temp must be 2-8°C for cold, or per device threshold
      const minTemp = (device as any).minTemperature ?? null;
      const maxTemp = (device as any).maxTemperature ?? null;
      const currentTemp = latest?.temperature ?? null;
      const currentHumidity = latest?.humidity ?? null;

      let complianceStatus: "compliant" | "breach" | "warning" | "unknown" =
        "unknown";
      if (currentTemp !== null && minTemp !== null && maxTemp !== null) {
        if (currentTemp < minTemp || currentTemp > maxTemp) {
          complianceStatus = "breach";
        } else if (currentTemp < minTemp + 0.5 || currentTemp > maxTemp - 0.5) {
          complianceStatus = "warning";
        } else {
          complianceStatus = "compliant";
        }
      } else if (currentTemp !== null) {
        complianceStatus = "compliant";
      }

      return {
        id: device.id,
        name: device.name,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        location: device.location ?? "Unassigned",
        warehouseName: device.warehouse?.name ?? "Unknown",
        status: device.status,
        lastHeartbeat: device.lastHeartbeat?.toISOString() ?? null,
        currentTemperature: currentTemp,
        currentHumidity: currentHumidity,
        minTemperature: minTemp,
        maxTemperature: maxTemp,
        complianceStatus,
        activeAlerts: deviceAlerts.filter((a) => a.status === "ACTIVE").length,
        trend,
        lastReadingAt: latest?.timestamp.toISOString() ?? null,
      };
    });

    // Overall stats
    const breaches = deviceSummaries.filter(
      (d) => d.complianceStatus === "breach",
    ).length;
    const warnings = deviceSummaries.filter(
      (d) => d.complianceStatus === "warning",
    ).length;
    const compliant = deviceSummaries.filter(
      (d) => d.complianceStatus === "compliant",
    ).length;
    const activeAlertCount = alerts.filter((a) => a.status === "ACTIVE").length;

    return NextResponse.json({
      summary: {
        totalSensors: envDevices.length,
        onlineSensors: envDevices.filter((d) => d.status === "ONLINE").length,
        offlineSensors: envDevices.filter((d) => d.status === "OFFLINE").length,
        complianceBreaches: breaches,
        complianceWarnings: warnings,
        compliantSensors: compliant,
        activeAlerts: activeAlertCount,
        lastUpdated: new Date().toISOString(),
      },
      devices: deviceSummaries,
      recentAlerts: alerts.slice(0, 20).map((a) => ({
        id: a.id,
        deviceId: a.deviceId,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message,
        status: a.status,
        triggeredAt: a.triggeredAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching environmental data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
