import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile API - Sync
 * Offline sync support for mobile app
 */

interface SyncRequest {
  lastSyncAt?: string;
  pendingChanges?: Array<{
    entity: string;
    action: string;
    data: any;
    localId: string;
    timestamp: string;
  }>;
}

// POST /api/mobile/sync - Sync data for offline support
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const body: SyncRequest = await request.json();
    const { lastSyncAt, pendingChanges } = body;

    const syncResults = {
      serverChanges: {} as any,
      conflicts: [] as any[],
      appliedChanges: [] as any[],
      failedChanges: [] as any[],
    };

    // Apply pending changes from mobile
    if (pendingChanges && pendingChanges.length > 0) {
      for (const change of pendingChanges) {
        try {
          // Process each change based on entity type
          switch (change.entity) {
            case "task_completion":
              await handleTaskCompletion(change, session.user.id);
              syncResults.appliedChanges.push({
                localId: change.localId,
                serverId: change.data.taskId,
              });
              break;

            case "inventory_count":
              await handleInventoryCount(change, session.user.id);
              syncResults.appliedChanges.push({
                localId: change.localId,
                serverId: change.data.countId,
              });
              break;

            default:
              syncResults.failedChanges.push({
                localId: change.localId,
                error: "Unknown entity type",
              });
          }
        } catch (error) {
          syncResults.failedChanges.push({
            localId: change.localId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    // Get server changes since last sync
    const lastSync = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

    // Get updated tasks
    const updatedTasks = await prisma.pickingTask.findMany({
      where: {
        organizationId: session.user.organizationId,
        assignedToId: session.user.id,
        updatedAt: {
          gte: lastSync,
        },
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
      },
    });

    syncResults.serverChanges.tasks = updatedTasks;

    // Get updated inventory items (that user might need)
    const updatedItems = await prisma.inventoryItem.findMany({
      where: {
        organizationId: session.user.organizationId,
        updatedAt: {
          gte: lastSync,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        barcode: true,
        stockOnHand: true,
        stockAvailable: true,
        updatedAt: true,
      },
      take: 100,
    });

    syncResults.serverChanges.items = updatedItems;

    return NextResponse.json({
      success: true,
      data: {
        syncTimestamp: new Date().toISOString(),
        ...syncResults,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SYNC_FAILED",
          message: "Failed to sync data",
        },
      },
      { status: 500 }
    );
  }
}

// Helper: Handle task completion from mobile
async function handleTaskCompletion(change: any, userId: string) {
  const { taskId, completionNotes, timestamp } = change.data;

  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, startedAt: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.status !== "IN_PROGRESS") {
    throw new Error("Task must be in progress to complete");
  }

  const completedAt = new Date(timestamp);
  const duration = task.startedAt
    ? Math.floor((completedAt.getTime() - task.startedAt.getTime()) / 1000)
    : null;

  await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt,
      completedById: userId,
      duration,
      progress: 100,
      completionNotes,
    },
  });
}

// Helper: Handle inventory count from mobile
async function handleInventoryCount(change: any, userId: string) {
  const { locationId, inventoryItemId, countedQuantity, notes } = change.data;

  // Create cycle count record
  // This would integrate with existing cycle count functionality
  // For now, just log it
  console.log("Inventory count:", {
    locationId,
    inventoryItemId,
    countedQuantity,
    countedBy: userId,
    notes,
  });
}
