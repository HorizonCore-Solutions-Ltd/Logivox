import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await (prisma as any).automationTask.findMany({
      where: {
        status: {
          in: ["QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED"],
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        device: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    const formattedTasks = tasks.map((t: any) => ({
      id: t.id,
      taskType: t.taskType,
      deviceId: t.deviceId,
      deviceName: t.device.name,
      status: t.status,
      priority: t.priority,
      startTime: t.startedAt?.toISOString(),
      completedTime: t.completedAt?.toISOString(),
      estimatedDuration: t.estimatedDuration,
      actualDuration: t.actualDuration || undefined,
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error("Error fetching automation tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
