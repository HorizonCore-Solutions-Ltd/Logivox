import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/outbound-forecast
// Returns predictions for completion of current picking waves
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "No organisation context" },
      { status: 403 },
    );
  }

  try {
    // 1. Get Current Backlog (Pending & In-Progress Tasks)
    const pendingTasks = await prisma.pickingTask.findMany({
      where: {
        organizationId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        wave: true,
      },
    });

    // Group by Wave or Destination (to help trailer planning)
    const tasksByWave = pendingTasks.reduce((acc: any, task) => {
      const waveId = task.waveId || "ADHOC";
      if (!acc[waveId])
        acc[waveId] = {
          count: 0,
          items: 0,
          waveName: task.wave?.waveNumber || "Ad-Hoc",
        };
      acc[waveId].count++;
      acc[waveId].items += 1; // Assuming 1 task = 1 item (simplified) or use quantity logic
      return acc;
    }, {});

    // 2. Determine Active Workforce Capacity
    // In a real system, check active sessions or timeclock
    const activePickersCount =
      (await prisma.user.count({
        where: {
          organizationMemberships: { some: { organizationId } },
          role: "PICKER",
          isActive: true, // Simplified "logged in" check
        },
      })) || 5; // Fallback estimate if 0

    const AVG_PICK_RATE_PER_HOUR = 60; // Configurable constant
    const TOTAL_HOURLY_THROUGHPUT = activePickersCount * AVG_PICK_RATE_PER_HOUR;

    // 3. Project Timeline
    const now = new Date();
    const projections = [];

    let cumulativeItems = 0;
    const totalItems = pendingTasks.length;

    // Project for next 4 hours
    for (let i = 1; i <= 4; i++) {
      const capacity = TOTAL_HOURLY_THROUGHPUT * i;
      const projectedDone = Math.min(totalItems, capacity);

      projections.push({
        hour: i,
        timeLabel: new Date(
          now.getTime() + i * 60 * 60 * 1000,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        projectedItemsByUser: projectedDone,
        remainingItems: Math.max(0, totalItems - projectedDone),
        percentComplete: Math.round((projectedDone / totalItems) * 100) || 100,
      });
    }

    // 4. Calculate Estimated Completion Time (ETC) per Wave
    // Use the global throughput to estimate when each wave finishes
    // Sort waves by priority (mock Priority 1)
    const waveEstimates = Object.entries(tasksByWave).map(([id, data]: any) => {
      const hoursToComplete = data.items / TOTAL_HOURLY_THROUGHPUT;
      return {
        waveId: id,
        waveName: data.waveName,
        itemsRemaining: data.items,
        estimatedCompletion: new Date(
          now.getTime() + hoursToComplete * 60 * 60 * 1000,
        ).toISOString(),
        hoursCurrentLoad: hoursToComplete.toFixed(1),
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: now,
      activePickers: activePickersCount,
      hourlyThroughputRate: TOTAL_HOURLY_THROUGHPUT,
      totalBacklog: totalItems,
      projections, // Hourly breakdown for graph
      waveEstimates, // Specific completion times for trailer planning
    });
  } catch (error: any) {
    console.error("Forecast Error:", error);
    return NextResponse.json(
      { error: "Failed to generate outbound forecast" },
      { status: 500 },
    );
  }
}
