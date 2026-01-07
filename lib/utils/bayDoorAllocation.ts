/**
 * Bay Door Auto-Allocation Algorithm
 * Intelligently assign load sheets to optimal bay doors
 */

import { prisma } from "@/lib/prisma";

interface AllocationCriteria {
  loadSheetId: string;
  warehouseId: string;
  shipmentDate: Date;
  totalWeight: number;
  totalVolume: number;
  carrierName?: string;
  priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  preferredDoorType?: "LOADING" | "UNLOADING" | "CROSS_DOCK" | "RETURN";
}

interface AllocationResult {
  success: boolean;
  bayDoorId?: string;
  bayDoor?: any;
  reason?: string;
  alternatives?: any[];
}

/**
 * Auto-allocate load sheet to optimal bay door
 */
export async function allocateBayDoor(
  criteria: AllocationCriteria,
): Promise<AllocationResult> {
  try {
    const {
      loadSheetId,
      warehouseId,
      shipmentDate,
      totalWeight,
      totalVolume,
      carrierName,
      priority = "NORMAL",
      preferredDoorType = "LOADING",
    } = criteria;

    // Get all available bay doors in warehouse
    const availableDoors = await prisma.bayDoor.findMany({
      where: {
        warehouseId,
        status: "AVAILABLE",
        currentLoadSheetId: null,
      },
      include: {
        warehouse: true,
        events: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    if (availableDoors.length === 0) {
      return {
        success: false,
        reason: "No available bay doors in warehouse",
      };
    }

    // Score each door
    const scoredDoors = availableDoors.map((door) => {
      let score = 0;

      // Type match (30 points)
      if (door.doorType === preferredDoorType) {
        score += 30;
      }

      // Capacity match (25 points)
      const weightUtilization = (totalWeight / door.maxWeight) * 100;
      const volumeUtilization = (totalVolume / door.maxVolume) * 100;

      // Prefer 70-95% utilization
      if (weightUtilization >= 70 && weightUtilization <= 95) {
        score += 15;
      } else if (weightUtilization < 70) {
        score += 10; // Underutilized but acceptable
      }

      if (volumeUtilization >= 70 && volumeUtilization <= 95) {
        score += 10;
      } else if (volumeUtilization < 70) {
        score += 5;
      }

      // Proximity to warehouse entrance (15 points)
      // Assume door numbers closer to 1 are closer to entrance
      const doorNum = parseInt(door.doorNumber.replace(/\D/g, "")) || 999;
      const proximityScore = Math.max(0, 15 - doorNum);
      score += proximityScore;

      // Recent activity (15 points)
      // Prefer doors used recently (warmed up, staff familiar)
      if (door.events.length > 0) {
        const lastEvent = door.events[0];
        const hoursSinceLastUse =
          (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastUse < 2) {
          score += 15; // Very recently used
        } else if (hoursSinceLastUse < 6) {
          score += 10; // Recently used
        } else if (hoursSinceLastUse < 24) {
          score += 5; // Used today
        }
      }

      // IoT sensor availability (10 points)
      if (door.iotSensorId) {
        score += 10; // Real-time monitoring available
      }

      // Priority boost (5 points)
      if (priority === "URGENT") {
        score += 5;
      }

      return {
        ...door,
        score,
        weightUtilization,
        volumeUtilization,
      };
    });

    // Sort by score (highest first)
    scoredDoors.sort((a, b) => b.score - a.score);

    const bestDoor = scoredDoors[0];

    // Validate capacity
    if (totalWeight > bestDoor.maxWeight) {
      return {
        success: false,
        reason: `Load weight (${totalWeight}kg) exceeds max capacity of all available doors`,
        alternatives: scoredDoors.slice(0, 3),
      };
    }

    if (totalVolume > bestDoor.maxVolume) {
      return {
        success: false,
        reason: `Load volume (${totalVolume}m³) exceeds max capacity of all available doors`,
        alternatives: scoredDoors.slice(0, 3),
      };
    }

    // Assign door to load sheet
    const [updatedLoadSheet, updatedDoor] = await prisma.$transaction([
      prisma.loadSheet.update({
        where: { id: loadSheetId },
        data: { bayDoorId: bestDoor.id },
      }),
      prisma.bayDoor.update({
        where: { id: bestDoor.id },
        data: {
          status: "OCCUPIED",
          currentLoadSheetId: loadSheetId,
        },
        include: {
          warehouse: true,
        },
      }),
    ]);

    // Log allocation event
    await prisma.bayDoorEvent.create({
      data: {
        bayDoorId: bestDoor.id,
        eventType: "ASSIGNED",
        description: `Auto-allocated load sheet ${loadSheetId} (score: ${bestDoor.score})`,
        metadata: {
          algorithm: "auto-allocation-v1",
          score: bestDoor.score,
          weightUtilization: bestDoor.weightUtilization,
          volumeUtilization: bestDoor.volumeUtilization,
          alternativesConsidered: scoredDoors.length,
        },
      },
    });

    return {
      success: true,
      bayDoorId: bestDoor.id,
      bayDoor: updatedDoor,
      alternatives: scoredDoors.slice(1, 4), // Top 3 alternatives
    };
  } catch (error) {
    console.error("Bay door allocation error:", error);
    return {
      success: false,
      reason: "Failed to allocate bay door",
    };
  }
}

/**
 * Release bay door and make available
 */
export async function releaseBayDoor(
  bayDoorId: string,
  reason?: string,
): Promise<boolean> {
  try {
    const door = await prisma.bayDoor.findUnique({
      where: { id: bayDoorId },
    });

    if (!door) {
      return false;
    }

    await prisma.$transaction([
      prisma.bayDoor.update({
        where: { id: bayDoorId },
        data: {
          status: "AVAILABLE",
          currentLoadSheetId: null,
        },
      }),
      prisma.bayDoorEvent.create({
        data: {
          bayDoorId,
          eventType: "RELEASED",
          description: reason || `Bay door ${door.doorNumber} released`,
        },
      }),
    ]);

    return true;
  } catch (error) {
    console.error("Bay door release error:", error);
    return false;
  }
}

/**
 * Get door utilization statistics
 */
export async function getDoorUtilization(
  warehouseId: string,
  startDate: Date,
  endDate: Date,
) {
  const doors = await prisma.bayDoor.findMany({
    where: { warehouseId },
    include: {
      events: {
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: "asc" },
      },
      loadSheets: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  const stats = doors.map((door) => {
    const assignments = door.events.filter((e) => e.eventType === "ASSIGNED");
    const releases = door.events.filter((e) => e.eventType === "RELEASED");

    // Calculate occupied time
    let occupiedMinutes = 0;
    let currentOccupiedStart: Date | null = null;

    for (const event of door.events) {
      if (event.eventType === "ASSIGNED") {
        currentOccupiedStart = event.timestamp;
      } else if (event.eventType === "RELEASED" && currentOccupiedStart) {
        const duration =
          (event.timestamp.getTime() - currentOccupiedStart.getTime()) /
          (1000 * 60);
        occupiedMinutes += duration;
        currentOccupiedStart = null;
      }
    }

    // If still occupied, count until endDate
    if (currentOccupiedStart) {
      const duration =
        (endDate.getTime() - currentOccupiedStart.getTime()) / (1000 * 60);
      occupiedMinutes += duration;
    }

    const totalMinutes =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const utilizationPercent = (occupiedMinutes / totalMinutes) * 100;

    return {
      doorNumber: door.doorNumber,
      doorType: door.doorType,
      totalAssignments: assignments.length,
      totalReleases: releases.length,
      occupiedMinutes: Math.round(occupiedMinutes),
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
      loadSheetsProcessed: door.loadSheets.length,
    };
  });

  return stats;
}

/**
 * Suggest optimal doors for load sheet
 */
export async function suggestDoors(criteria: AllocationCriteria) {
  const {
    warehouseId,
    totalWeight,
    totalVolume,
    preferredDoorType = "LOADING",
  } = criteria;

  const availableDoors = await prisma.bayDoor.findMany({
    where: {
      warehouseId,
      status: "AVAILABLE",
      currentLoadSheetId: null,
      maxWeight: { gte: totalWeight },
      maxVolume: { gte: totalVolume },
    },
    include: {
      warehouse: true,
      events: {
        orderBy: { timestamp: "desc" },
        take: 5,
      },
    },
    orderBy: { doorNumber: "asc" },
  });

  return availableDoors.map((door) => ({
    id: door.id,
    doorNumber: door.doorNumber,
    doorType: door.doorType,
    weightUtilization: ((totalWeight / door.maxWeight) * 100).toFixed(1),
    volumeUtilization: ((totalVolume / door.maxVolume) * 100).toFixed(1),
    hasIotSensor: !!door.iotSensorId,
    recentActivity: door.events.length,
    recommended: door.doorType === preferredDoorType,
  }));
}
