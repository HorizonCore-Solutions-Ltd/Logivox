// apps/web/src/app/api/operations/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    // 1. Summary Counts
    const [
      activePickers,
      activeReplen,
      activePutaway,
      wavesReleased,
      wavesPending,
      loadSheetsReady,
      inboundDoors,
      outboundDoors,
      activeUsers,
    ] = await Promise.all([
      prisma.pickingTask.count({
        where: {
          organizationId,
          taskType: "PICK",
          status: "IN_PROGRESS",
        },
      }),
      prisma.replenishmentTask.count({
        where: {
          organizationId,
          status: "IN_PROGRESS",
        },
      }),
      prisma.pickingTask.count({
        where: {
          organizationId,
          taskType: "PUTAWAY",
          status: "IN_PROGRESS",
        },
      }),
      prisma.wavePick.count({ where: { organizationId, status: "RELEASED" } }),
      prisma.wavePick.count({
        where: { organizationId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
      }),
      prisma.loadSheet.count({
        where: {
          organizationId,
          status: { in: ["APPROVED", "CONFIRMED", "LOADING"] },
        },
      }),
      prisma.bayDoor.findMany({
        where: { organizationId, doorType: "INBOUND" },
      }),
      prisma.bayDoor.findMany({
        where: { organizationId, doorType: "OUTBOUND" },
      }),
      prisma.user.findMany({
        where: { organizationMemberships: { some: { organizationId } }, isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
          image: true,
          assignedTasks: {
            where: { status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] } },
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: {
              fromLocation: { select: { name: true } },
              toLocation: { select: { name: true } },
            },
          },
        },
        take: 50,
      }),
    ]);

    // Calculate Dock Utilization
    const inboundOccupied = inboundDoors.filter(
      (d) => d.status === "OCCUPIED",
    ).length;
    const outboundOccupied = outboundDoors.filter(
      (d) => d.status === "OCCUPIED",
    ).length;

    const summary = {
      activePickers,
      activeReplen,
      activePutaway,
      wavesReleased,
      wavesPending,
      loadSheetsReady,
      congestionZones: 0,
    };

    const dockStatus = {
      inboundTotal: inboundDoors.length,
      inboundOccupied: inboundDoors.filter((d) => d.status === "OCCUPIED")
        .length,
      outboundTotal: outboundDoors.length,
      outboundOccupied: outboundDoors.filter((d) => d.status === "OCCUPIED")
        .length,
    };

    const doors = [
      ...inboundDoors.map((d) => ({ ...d, type: "INBOUND" })),
      ...outboundDoors.map((d) => ({ ...d, type: "OUTBOUND" })),
    ];

    const usersWithLocation = activeUsers.map((u) => ({
      ...u,
      currentZone:
        u.assignedTasks?.[0]?.toLocation?.name ||
        u.assignedTasks?.[0]?.fromLocation?.name ||
        "UNASSIGNED",
    }));

    // 2. Fetch Waves Progress
    const wavesProgressRaw = await prisma.wavePick.findMany({
      where: { organizationId, status: { in: ["RELEASED", "IN_PROGRESS"] } },
      select: {
        id: true,
        waveNumber: true,
        status: true,
        progress: true,
        totalLines: true,
        pickedLines: true,
      },
      take: 5,
    });

    const waveProgress = wavesProgressRaw.map((w) => ({
      id: w.id,
      name: w.waveNumber,
      status: w.status,
      progress: Number(w.progress),
      totalTasks: w.totalLines,
      completedTasks: w.pickedLines,
    }));

    // 3. Alerts derived from current operating conditions
    const alerts = [];
    if (wavesPending > 10) {
      alerts.push({
        id: "alert-1",
        type: "SLA",
        message: "High pending wave count",
        severity: "MEDIUM",
        timestamp: new Date().toISOString(),
      });
    }
    const maintenanceDoors = doors.filter((d) => d.status === "MAINTENANCE");
    if (maintenanceDoors.length > 0) {
      alerts.push({
        id: "alert-maint",
        type: "EQUIPMENT",
        message: `${maintenanceDoors.length} Bay Doors in Maintenance`,
        severity: "LOW",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Labor Leaderboard from completed picking performance (last 24h)
    const completedSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const completedByUser = await prisma.pickingTask.groupBy({
      by: ["completedById"],
      where: {
        organizationId,
        taskType: "PICK",
        status: "COMPLETED",
        completedById: { not: null },
        completedAt: { gte: completedSince },
      },
      _count: { _all: true },
    });

    const usersById = new Map(activeUsers.map((u) => [u.id, u]));
    const leaderboard = completedByUser
      .map((entry) => {
        const userId = entry.completedById as string;
        const user = usersById.get(userId);
        const completed = entry._count._all;
        const picksPerHour = Math.round(completed / 24);
        return {
          id: userId,
          name: user?.name || `User ${userId.substring(0, 6)}`,
          role: user?.role || "USER",
          image: user?.image || null,
          score: completed,
          picksPerHour,
          accuracy: null,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 5. Reverse Logistics & Assets (DB-backed)
    const [pendingTrailers, tippedCount, containerSummary] = await Promise.all([
      prisma.dockAppointment.count({
        where: {
          organizationId,
          status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "DELAYED"] },
        },
      }),
      prisma.loadSheet.count({
        where: {
          organizationId,
          actualDeparture: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.container.groupBy({
        by: ["containerType", "status"],
        where: { organizationId },
        _count: { _all: true },
      }),
    ]);

    const getContainerCount = (type: string, statuses: string[]) =>
      containerSummary
        .filter(
          (row) =>
            String(row.containerType).toUpperCase() === type &&
            statuses.includes(String(row.status).toUpperCase()),
        )
        .reduce((sum, row) => sum + row._count._all, 0);

    const returnsStats = {
      pendingTrailers,
      tippedCount,
      reusables: {
        pallets: {
          onHand: getContainerCount("PALLET", ["BUILDING", "READY"]),
          dispatched: getContainerCount("PALLET", ["SHIPPED"]),
          damaged: 0,
        },
        totes: {
          onHand: getContainerCount("TOTE", ["BUILDING", "READY"]),
          dispatched: getContainerCount("TOTE", ["SHIPPED"]),
          damaged: 0,
        },
        cages: {
          onHand: getContainerCount("CAGE", ["BUILDING", "READY"]),
          dispatched: getContainerCount("CAGE", ["SHIPPED"]),
          damaged: 0,
        },
      },
    };

    return NextResponse.json({
      summary,
      alerts,
      waveProgress: waveProgress || [],
      dockStatus,
      doors,
      laborMap: usersWithLocation,
      leaderboard,
      returns: returnsStats,
    });
  } catch (error) {
    console.error("GET /api/operations/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations dashboard" },
      { status: 500 },
    );
  }
}
