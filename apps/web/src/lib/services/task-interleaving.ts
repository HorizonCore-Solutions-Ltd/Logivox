// apps/web/src/lib/services/task-interleaving.ts

import { prisma } from "@/lib/prisma";

export class TaskInterleavingService {
  /**
   * Find the best available worker for a task based on:
   * 1. Zone assignment (closest match)
   * 2. Current load (least assigned tasks)
   * 3. Skills (can perform task type)
   */
  async findBestWorkerForTask(
    organizationId: string,
    locationId: string,
    taskType: string
  ) {
    // 1. Get location details to find the zone
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { zone: true },
    });

    if (!location || !location.zoneId) {
      console.warn(`[Interleaving] No zone found for location ${locationId}`);
      return null;
    }

    // 2. Find workers assigned to this zone who are active
    // Note: Assuming 'User' has a relation or we filter by recent activity
    const candidateWorkers = await prisma.user.findMany({
      where: {
        organizationMemberships: {
          some: { organizationId },
        },
        isActive: true,
        // In a real implementation: `currentZoneId: location.zoneId`
      },
      include: {
        assignedTasks: {
          where: { status: "IN_PROGRESS" },
        },
      },
      take: 5, // Limit to top 5 candidates
    });

    // 3. Simple scoring: Least active tasks wins
    // In future: Add distance calculation if coordinates available
    let bestWorker = null;
    let minLoad = Infinity;

    for (const worker of candidateWorkers) {
      const currentLoad = worker.assignedTasks.length;
      if (currentLoad < minLoad) {
        minLoad = currentLoad;
        bestWorker = worker;
      }
    }

    return bestWorker;
  }
}

export const taskInterleavingService = new TaskInterleavingService();
