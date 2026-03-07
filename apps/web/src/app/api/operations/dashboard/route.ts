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
      // Assuming mock user count for now unless we query UserShift or TaskExecution assignments
      prisma.user.count({ where: { organizationId, role: "USER" } }), // Placeholder for pickers
      prisma.taskExecution.count({
        where: { organizationId, type: "REPLENISHMENT", status: "IN_PROGRESS" },
      }),
      prisma.taskExecution.count({
        where: { organizationId, type: "PUTAWAY", status: "IN_PROGRESS" },
      }),
      prisma.wavePick.count({ where: { organizationId, status: "RELEASED" } }),
      prisma.wavePick.count({
        where: { organizationId, status: { in: ["PLANNED", "READY"] } },
      }),
      prisma.loadSheet.count({ where: { organizationId, status: "APPROVED" } }),
      prisma.bayDoor.findMany({
        where: { organizationId, doorType: "INBOUND" },
      }),
      prisma.bayDoor.findMany({
        where: { organizationId, doorType: "OUTBOUND" },
      }),
      prisma.user.findMany({
        where: { organizationId, role: { in: ["USER", "MANAGER"] } },
        select: { id: true, name: true, role: true, image: true },
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
      congestionZones: 0, // Placeholder
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

    // Simulate user locations (random zone assignment for now as we don't have RTLS)
    const availableZones = [
      "ZONE-A",
      "ZONE-B",
      "PACKING",
      "RECEIVING",
      "MARSHALLING",
    ];
    const usersWithLocation = activeUsers.map((u) => ({
      ...u,
      currentZone:
        availableZones[Math.floor(Math.random() * availableZones.length)],
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

    // 3. Alerts (Mock or derived from real data)
    // For now returning empty or creating alerts if SLAs breached
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

    // Simulate "Live Issues" (Andon) from the picker floor
    const andonEvents = [
      {
        id: "ev-1",
        type: "LABOR",
        message: "Picker #42 blocked in Aisle 4 (Dropped Pallet)",
        severity: "HIGH",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: "ev-2",
        type: "EQUIPMENT",
        message: "Scanner #08 battery low",
        severity: "LOW",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "ev-3",
        type: "INVENTORY",
        message: "SKU-992 marked missing during pick",
        severity: "MEDIUM",
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
    ];
    alerts.push(...andonEvents);

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

    // 4. Labor Leaderboard (Gamification)
    // In a real app, this would aggregate `PickingTask` completion times and errors.
    const leaderboard = activeUsers
      .slice(0, 5)
      .map((u, i) => ({
        id: u.id,
        name: u.name || `User ${u.id.substring(0, 4)}`,
        role: u.role,
        image: u.image,
        score: 950 - i * 50 + Math.floor(Math.random() * 40), // Mock score
        picksPerHour: 120 - i * 10 + Math.floor(Math.random() * 15),
        accuracy: 99.9 - i * 0.2,
      }))
      .sort((a, b) => b.score - a.score);

    // 5. Reverse Logistics & Assets (Returns)
    const returnsStats = {
      pendingTrailers: Math.floor(Math.random() * 3),
      tippedCount: 145 + Math.floor(Math.random() * 20), // units tipped today
      reusables: {
        pallets: { onHand: 450, dispatched: 120, damaged: 15 },
        totes: { onHand: 1200, dispatched: 350, damaged: 5 },
        cages: { onHand: 45, dispatched: 10, damaged: 1 },
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
