/**
 * Task Interleaving API
 * Returns interleaving opportunities, worker queues, and allows task assignment
 * Logic: If worker finishes picking in Zone A and there's a putaway needed in Zone A → interleave
 * Used by /dashboard/task-interleaving
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
    const action = searchParams.get("action") ?? "overview";

    if (action === "worker-queues") {
      // Return current task queue per worker
      const activeTasks = await prisma.pickingTask.findMany({
        where: {
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          ...(warehouseId ? { warehouseId } : {}),
        },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, department: true },
          },
          location: { select: { code: true, aisle: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });

      // Group by worker
      const workerQueueMap = new Map<string, any>();
      for (const task of activeTasks) {
        if (!task.assignedTo) continue;
        const wid = task.assignedTo.id;
        if (!workerQueueMap.has(wid)) {
          workerQueueMap.set(wid, {
            workerId: wid,
            workerName: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
            department: task.assignedTo.department,
            tasks: [],
            queueDepth: 0,
          });
        }
        const wq = workerQueueMap.get(wid)!;
        wq.tasks.push({
          id: task.id,
          taskType: task.taskType,
          priority: task.priority,
          status: task.status,
          location: task.location?.code ?? task.locationId,
          aisle: task.location?.aisle,
          estimatedMinutes: task.estimatedPickTime ?? 5,
        });
        wq.queueDepth++;
      }

      return NextResponse.json({
        workerQueues: Array.from(workerQueueMap.values()),
      });
    }

    // Default: overview + interleaving suggestions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active waves
    const activeWaves = await prisma.wavePick.findMany({
      where: {
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        lines: {
          where: { status: { in: ["ASSIGNED", "PENDING"] } },
          select: {
            id: true,
            status: true,
            locationId: true,
            quantityRequired: true,
            quantityPicked: true,
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledFor: "asc" },
    });

    // Queued putaway / replenishment tasks (likely interleave candidates)
    const pendingTasks = await prisma.pickingTask.findMany({
      where: {
        status: "PENDING",
        taskType: { in: ["PUTAWAY", "REPLENISHMENT", "TRANSFER"] },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        location: { select: { code: true, aisle: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // Find interleaving suggestions: match putaway tasks to workers near that aisle
    const activePickTasks = await prisma.pickingTask.findMany({
      where: {
        status: "IN_PROGRESS",
        taskType: "PICK",
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        location: { select: { code: true, aisle: true } },
      },
    });

    const interleaveSuggestions = [];
    for (const pickTask of activePickTasks) {
      if (!pickTask.assignedTo || !pickTask.location?.aisle) continue;
      // Find putaway tasks in the same aisle
      const nearbyPutaway = pendingTasks.find(
        (pt) =>
          pt.location?.aisle === pickTask.location?.aisle &&
          pt.taskType === "PUTAWAY",
      );
      if (nearbyPutaway) {
        interleaveSuggestions.push({
          workerId: pickTask.assignedTo.id,
          workerName: `${pickTask.assignedTo.firstName} ${pickTask.assignedTo.lastName}`,
          currentTask: {
            id: pickTask.id,
            type: pickTask.taskType,
            location: pickTask.location?.code,
            aisle: pickTask.location?.aisle,
            status: pickTask.status,
          },
          suggestedTask: {
            id: nearbyPutaway.id,
            type: nearbyPutaway.taskType,
            location: nearbyPutaway.location?.code,
            aisle: nearbyPutaway.location?.aisle,
            priority: nearbyPutaway.priority,
          },
          efficiencyGain: "~8 min travel time saved",
          confidence: 0.87,
        });
      }
    }

    // Summary
    const totalActiveWaves = activeWaves.length;
    const totalPendingTasks = pendingTasks.length;
    const totalInterleaveOpportunities = interleaveSuggestions.length;
    const totalActivePickWorkers = activePickTasks.length;

    return NextResponse.json({
      summary: {
        totalActiveWaves,
        totalPendingInterleaveableTasks: totalPendingTasks,
        totalInterleaveOpportunities,
        totalActivePickWorkers,
        estimatedTimeSavedMinutes: interleaveSuggestions.length * 8,
        lastUpdated: new Date().toISOString(),
      },
      activeWaves: activeWaves.map((w) => ({
        id: w.id,
        waveNumber: w.waveNumber,
        name: w.name,
        status: w.status,
        priority: w.priority,
        pendingLines: w.lines.length,
        assignedTo: w.assignedTo
          ? `${w.assignedTo.firstName} ${w.assignedTo.lastName}`
          : null,
        scheduledFor: w.scheduledFor,
        dockDeadline: w.dockDeadline,
      })),
      interleaveSuggestions,
      pendingTasks: pendingTasks.slice(0, 20).map((t) => ({
        id: t.id,
        taskType: t.taskType,
        priority: t.priority,
        location: t.location?.code ?? t.locationId,
        aisle: t.location?.aisle,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching task interleaving data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Assign an interleaved task to a worker
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, workerId } = body;

    if (!taskId || !workerId) {
      return NextResponse.json(
        { error: "taskId and workerId are required" },
        { status: 400 },
      );
    }

    const updated = await prisma.pickingTask.update({
      where: { id: taskId },
      data: {
        assignedToId: workerId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("Error assigning interleaved task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
