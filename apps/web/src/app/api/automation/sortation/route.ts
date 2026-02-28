import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sortation devices are CONVEYOR and SORTER type AutomationDevices
    const [allDevices, recentTasks] = await Promise.all([
      (prisma as any).automationDevice.findMany({
        where: {
          deviceType: { in: ["CONVEYOR", "SORTER", "AS_RS"] },
        },
        orderBy: { name: "asc" },
      }),
      (prisma as any).automationTask.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          device: { deviceType: { in: ["CONVEYOR", "SORTER", "AS_RS"] } },
        },
        include: {
          device: { select: { name: true, deviceType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const online = allDevices.filter((d: any) => d.status === "ACTIVE").length;
    const totalItemsProcessed = recentTasks.filter(
      (t: any) => t.status === "COMPLETED",
    ).length;

    // Throughput per hour — group by hour for last 8 hours
    const now = Date.now();
    const hourlyThroughput = Array.from({ length: 8 }, (_, i) => {
      const hourStart = new Date(now - (7 - i) * 60 * 60 * 1000);
      const hourEnd = new Date(now - (6 - i) * 60 * 60 * 1000);
      const count = recentTasks.filter((t: any) => {
        const created = new Date(t.createdAt).getTime();
        return (
          created >= hourStart.getTime() &&
          created < hourEnd.getTime() &&
          t.status === "COMPLETED"
        );
      }).length;
      return {
        hour: hourStart.getHours().toString().padStart(2, "0") + ":00",
        items: count,
      };
    });

    // Per-device sorter stats
    const deviceStats = allDevices.map((d: any) => {
      const deviceTasks = recentTasks.filter((t: any) => t.deviceId === d.id);
      const completed = deviceTasks.filter(
        (t: any) => t.status === "COMPLETED",
      ).length;
      const failed = deviceTasks.filter(
        (t: any) => t.status === "FAILED",
      ).length;
      return {
        id: d.id,
        name: d.name,
        deviceType: d.deviceType,
        status: d.status,
        currentLocation: d.currentLocation ?? null,
        utilizationPct: Math.round((d.utilizationRate ?? 0) * 100),
        tasksToday: completed + failed,
        successRate:
          completed + failed > 0
            ? Math.round((completed / (completed + failed)) * 100)
            : 100,
        lastMaintenance: d.lastMaintenanceDate?.toISOString() ?? null,
      };
    });

    const avgSuccessRate =
      deviceStats.length > 0
        ? Math.round(
            deviceStats.reduce((s: number, d: any) => s + d.successRate, 0) /
              deviceStats.length,
          )
        : 100;

    return NextResponse.json({
      summary: {
        totalSorters: allDevices.length,
        online,
        offline: allDevices.length - online,
        itemsProcessedToday: totalItemsProcessed,
        avgSystemSuccessRate: avgSuccessRate,
      },
      devices: deviceStats,
      hourlyThroughput,
      recentActivity: recentTasks.slice(0, 10).map((t: any) => ({
        id: t.id,
        taskType: t.taskType,
        device: t.device?.name,
        deviceType: t.device?.deviceType,
        status: t.status,
        createdAt: t.createdAt?.toISOString(),
        completedAt: t.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching sortation data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
