import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET /api/automation/fleet — full fleet dashboard summary + dispatch queue
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [devices, tasks] = await Promise.all([
      (prisma as any).automationDevice.findMany({
        orderBy: { name: "asc" },
      }),
      (prisma as any).automationTask.findMany({
        where: {
          status: { in: ["QUEUED", "IN_PROGRESS"] },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 50,
      }),
    ]);

    const active = devices.filter((d: any) => d.status === "ACTIVE").length;
    const idle = devices.filter((d: any) => d.status === "IDLE").length;
    const charging = devices.filter((d: any) => d.status === "CHARGING").length;
    const maintenance = devices.filter((d: any) =>
      ["MAINTENANCE", "ERROR", "OFFLINE"].includes(d.status),
    ).length;

    const avgUtilization =
      devices.length > 0
        ? Math.round(
            (devices.reduce((s: number, d: any) => s + (d.utilizationRate ?? 0), 0) /
              devices.length) *
              100,
          )
        : 0;

    const totalTasksToday = devices.reduce(
      (s: number, d: any) => s + (d.tasksCompletedToday ?? 0),
      0,
    );

    // Match pending tasks to best available device by device type
    const pendingTasks = tasks.filter((t: any) => t.status === "QUEUED");
    const suggestions = pendingTasks.slice(0, 5).map((task: any) => {
      const compatibleDevices = devices.filter(
        (d: any) =>
          d.status === "IDLE" &&
          (d.deviceType === task.deviceType ||
            (task.deviceType === "PICK" && ["AGV", "AMR"].includes(d.deviceType))),
      );
      return {
        taskId: task.id,
        taskType: task.taskType,
        priority: task.priority,
        sourceLocation: task.sourceLocation,
        destinationLocation: task.destinationLocation,
        suggestedDeviceId: compatibleDevices[0]?.id ?? null,
        suggestedDeviceName: compatibleDevices[0]?.name ?? "No idle device available",
      };
    });

    return NextResponse.json({
      summary: {
        totalDevices: devices.length,
        active,
        idle,
        charging,
        maintenance,
        avgUtilizationPct: avgUtilization,
        totalTasksToday,
        queuedTasks: pendingTasks.length,
        activeTasks: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
      },
      devices: devices.map((d: any) => ({
        id: d.id,
        name: d.name,
        deviceType: d.deviceType,
        status: d.status,
        batteryLevel: d.batteryLevel ?? null,
        currentLocation: d.currentLocation ?? null,
        utilizationPct: Math.round((d.utilizationRate ?? 0) * 100),
        tasksCompletedToday: d.tasksCompletedToday ?? 0,
        uptimeHours: Math.round((d.uptimeToday ?? 0) / 60 * 10) / 10,
      })),
      pendingTasks: tasks.map((t: any) => ({
        id: t.id,
        taskType: t.taskType,
        priority: t.priority,
        status: t.status,
        deviceId: t.deviceId ?? null,
        deviceName: t.device?.name ?? null,
        sourceLocation: t.sourceLocation ?? null,
        destinationLocation: t.destinationLocation ?? null,
        estimatedDuration: t.estimatedDuration ?? null,
        createdAt: t.createdAt?.toISOString(),
      })),
      dispatchSuggestions: suggestions,
    });
  } catch (error) {
    console.error("Error fetching fleet data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/automation/fleet — dispatch a task to a device
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      deviceId,
      taskType,
      sourceLocation,
      destinationLocation,
      priority = 5,
    } = body;

    if (!deviceId || !taskType) {
      return NextResponse.json(
        { error: "deviceId and taskType are required" },
        { status: 400 },
      );
    }

    // Update device to ACTIVE
    await (prisma as any).automationDevice.update({
      where: { id: deviceId },
      data: { status: "ACTIVE" },
    });

    const task = await (prisma as any).automationTask.create({
      data: {
        taskType,
        deviceId,
        sourceLocation: sourceLocation ?? null,
        destinationLocation: destinationLocation ?? null,
        priority,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        estimatedDuration: 10,
      },
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      deviceId,
      taskType,
      dispatchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error dispatching fleet task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
