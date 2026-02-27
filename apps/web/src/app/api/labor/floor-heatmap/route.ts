/**
 * Floor Heatmap API
 * Returns zone-level worker distribution and congestion data
 * Used by /dashboard/floor-heatmap
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get warehouse locations grouped by aisle/zone
    const locations = await prisma.location.findMany({
      where: { ...(warehouseId ? { warehouseId } : {}), isActive: true },
      select: {
        id: true,
        code: true,
        aisle: true,
        bay: true,
        level: true,
        locationType: true,
      },
    });

    // Get active picking tasks today
    const activeTasks = await prisma.pickingTask.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ["IN_PROGRESS", "ASSIGNED"] },
        ...(warehouseId ? { warehouseId } : {}),
      },
      select: {
        id: true,
        status: true,
        locationId: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Get recent wave pick lines (last 2 hours) to see pick activity per zone
    const recentCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentWaveLines = await prisma.wavePickLine.findMany({
      where: {
        createdAt: { gte: recentCutoff },
        status: { in: ["PICKED", "ASSIGNED"] },
      },
      select: {
        id: true,
        status: true,
        locationId: true,
        pickedAt: true,
      },
    });

    // Build zone map: group by aisle
    const zoneMap = new Map<
      string,
      {
        aisle: string;
        locationCount: number;
        activeWorkers: number;
        activeTasks: number;
        picksLastHour: number;
        congestionLevel: "low" | "medium" | "high" | "critical";
        workers: string[];
      }
    >();

    for (const loc of locations) {
      const aisle = loc.aisle ?? "UNKNOWN";
      if (!zoneMap.has(aisle)) {
        zoneMap.set(aisle, {
          aisle,
          locationCount: 0,
          activeWorkers: 0,
          activeTasks: 0,
          picksLastHour: 0,
          congestionLevel: "low",
          workers: [],
        });
      }
      const zone = zoneMap.get(aisle)!;
      zone.locationCount++;
    }

    // Count active tasks per aisle
    for (const task of activeTasks) {
      const loc = locations.find((l) => l.id === task.locationId);
      if (!loc) continue;
      const aisle = loc.aisle ?? "UNKNOWN";
      const zone = zoneMap.get(aisle);
      if (!zone) continue;
      zone.activeTasks++;
      if (task.assignedTo) {
        const workerName = `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
        if (!zone.workers.includes(workerName)) {
          zone.workers.push(workerName);
          zone.activeWorkers++;
        }
      }
    }

    // Count picks last hour per aisle
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const line of recentWaveLines) {
      if (!line.pickedAt || line.pickedAt < oneHourAgo) continue;
      const loc = locations.find((l) => l.id === line.locationId);
      if (!loc) continue;
      const aisle = loc.aisle ?? "UNKNOWN";
      const zone = zoneMap.get(aisle);
      if (!zone) continue;
      zone.picksLastHour++;
    }

    // Determine congestion level
    for (const zone of zoneMap.values()) {
      if (zone.activeWorkers >= 5 || zone.activeTasks >= 10) {
        zone.congestionLevel = "critical";
      } else if (zone.activeWorkers >= 3 || zone.activeTasks >= 6) {
        zone.congestionLevel = "high";
      } else if (zone.activeWorkers >= 2 || zone.activeTasks >= 3) {
        zone.congestionLevel = "medium";
      } else {
        zone.congestionLevel = "low";
      }
    }

    const zones = Array.from(zoneMap.values()).sort((a, b) =>
      a.aisle.localeCompare(b.aisle),
    );

    // Summary stats
    const totalActive = activeTasks.length;
    const criticalZones = zones.filter(
      (z) => z.congestionLevel === "critical",
    ).length;
    const highZones = zones.filter((z) => z.congestionLevel === "high").length;
    const totalWorkers = zones.reduce((s, z) => s + z.activeWorkers, 0);

    return NextResponse.json({
      summary: {
        totalZones: zones.length,
        totalActiveTasks: totalActive,
        totalActiveWorkers: totalWorkers,
        criticalZones,
        highCongestionZones: highZones,
        picksLastHour: recentWaveLines.filter(
          (l) => l.pickedAt && l.pickedAt >= oneHourAgo,
        ).length,
        lastUpdated: new Date().toISOString(),
      },
      zones,
    });
  } catch (error) {
    console.error("Error fetching floor heatmap:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
