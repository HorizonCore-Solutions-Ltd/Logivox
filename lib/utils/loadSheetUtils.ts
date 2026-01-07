/**
 * Load Sheet Utilities
 * Helper functions for load sheet operations
 */

import { prisma } from "@/lib/prisma";

/**
 * Generate unique load sheet number
 * Format: LS-YYYY-NNNN (e.g., LS-2026-0001)
 */
export async function generateLoadSheetNumber(
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LS-${year}-`;

  // Get the last load sheet number for this year
  const lastLoadSheet = await prisma.loadSheet.findFirst({
    where: {
      organizationId,
      loadSheetNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      loadSheetNumber: "desc",
    },
  });

  let sequence = 1;

  if (lastLoadSheet) {
    const lastNumber = lastLoadSheet.loadSheetNumber.split("-")[2];
    sequence = parseInt(lastNumber || "0") + 1;
  }

  const paddedSequence = sequence.toString().padStart(4, "0");

  return `${prefix}${paddedSequence}`;
}

/**
 * Generate unique container number
 * Format: T#### or user-specified format
 */
export async function generateContainerNumber(
  organizationId: string,
  prefix: string = "T",
): Promise<string> {
  // Get the last container number with this prefix
  const lastContainer = await prisma.container.findFirst({
    where: {
      organizationId,
      containerNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      containerNumber: "desc",
    },
  });

  let sequence = 1;

  if (lastContainer) {
    const numberPart = lastContainer.containerNumber.replace(/\D/g, "");
    sequence = parseInt(numberPart || "0") + 1;
  }

  const paddedSequence = sequence.toString().padStart(4, "0");

  return `${prefix}${paddedSequence}`;
}

/**
 * Auto-group containers by destination, customer, branch, route
 */
export interface AutoGroupingCriteria {
  destination?: boolean;
  customer?: boolean;
  branch?: boolean;
  route?: boolean;
  carrier?: boolean;
  priority?: boolean;
}

export async function autoGroupContainers(
  containers: any[],
  criteria: AutoGroupingCriteria = { destination: true, customer: true },
): Promise<Record<string, any[]>> {
  const groups: Record<string, any[]> = {};

  for (const container of containers) {
    const groupKey: string[] = [];

    if (criteria.customer && container.customerId) {
      groupKey.push(`customer:${container.customerId}`);
    }

    if (criteria.destination && container.destinationAddress) {
      // Use address as grouping key (simplified)
      const addressKey = JSON.stringify(container.destinationAddress);
      groupKey.push(`dest:${addressKey}`);
    }

    if (criteria.branch && container.destinationBranch) {
      groupKey.push(`branch:${container.destinationBranch}`);
    }

    if (criteria.route && container.routeCode) {
      groupKey.push(`route:${container.routeCode}`);
    }

    if (criteria.carrier && container.carrierCode) {
      groupKey.push(`carrier:${container.carrierCode}`);
    }

    if (criteria.priority && container.priority) {
      groupKey.push(`priority:${container.priority}`);
    }

    const key = groupKey.join("|") || "ungrouped";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(container);
  }

  return groups;
}

/**
 * Calculate load sheet statistics
 */
export function calculateLoadSheetStats(loadSheet: any) {
  const containers = loadSheet.containers || [];

  const stats = {
    totalContainers: containers.length,
    totalWeight: 0,
    totalVolume: 0,
    totalItems: 0,
    totalOrders: new Set(),
    containerTypes: {} as Record<string, number>,
    statusBreakdown: {} as Record<string, number>,
    pickersInvolved: new Set(),
    customersInvolved: new Set(),
  };

  for (const container of containers) {
    stats.totalWeight += container.weight || 0;
    stats.totalVolume += container.volume || 0;

    // Container types
    const type = container.containerType || "UNKNOWN";
    stats.containerTypes[type] = (stats.containerTypes[type] || 0) + 1;

    // Status
    stats.statusBreakdown[container.status] =
      (stats.statusBreakdown[container.status] || 0) + 1;

    // Items
    if (container.containerItems) {
      stats.totalItems += container.containerItems.length;

      for (const item of container.containerItems) {
        if (item.salesOrderId) {
          stats.totalOrders.add(item.salesOrderId);
        }
        if (item.pickedBy) {
          stats.pickersInvolved.add(item.pickedBy);
        }
      }
    }

    // Customers
    if (container.customerId) {
      stats.customersInvolved.add(container.customerId);
    }
  }

  return {
    ...stats,
    totalOrders: stats.totalOrders.size,
    pickersInvolved: stats.pickersInvolved.size,
    customersInvolved: stats.customersInvolved.size,
  };
}

/**
 * Validate load sheet before approval
 */
export interface LoadSheetValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLoadSheet(loadSheet: any): LoadSheetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!loadSheet.shipmentDate) {
    errors.push("Shipment date is required");
  }

  if (!loadSheet.containers || loadSheet.containers.length === 0) {
    errors.push("Load sheet must have at least one container");
  }

  // Check containers
  if (loadSheet.containers) {
    for (const container of loadSheet.containers) {
      if (!container.containerItems || container.containerItems.length === 0) {
        warnings.push(`Container ${container.containerNumber} has no items`);
      }

      if (container.maxWeight && container.weight > container.maxWeight) {
        errors.push(
          `Container ${container.containerNumber} exceeds weight limit`,
        );
      }

      if (container.status !== "READY" && container.status !== "IN_PROGRESS") {
        warnings.push(
          `Container ${container.containerNumber} status is ${container.status}`,
        );
      }
    }
  }

  // Check transport details
  if (!loadSheet.carrierName && !loadSheet.carrierCode) {
    warnings.push("No carrier information specified");
  }

  if (!loadSheet.driverName) {
    warnings.push("No driver assigned");
  }

  // Check destination
  if (!loadSheet.customerId && !loadSheet.destinationAddress) {
    warnings.push("No destination specified");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Suggest optimal container for new item based on current load sheets
 */
export async function suggestContainer(
  itemDetails: {
    customerId?: string;
    destinationAddress?: any;
    destinationBranch?: string;
    routeCode?: string;
    weight?: number;
    volume?: number;
  },
  organizationId: string,
  warehouseId?: string,
): Promise<{
  suggested: any | null;
  reason: string;
  createNew: boolean;
}> {
  // Find containers in progress that match criteria
  const matchingContainers = await prisma.container.findMany({
    where: {
      organizationId,
      warehouseId,
      status: "IN_PROGRESS",
      customerId: itemDetails.customerId,
      destinationBranch: itemDetails.destinationBranch,
      routeCode: itemDetails.routeCode,
    },
    include: {
      containerItems: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  });

  // Check if any container has space
  for (const container of matchingContainers) {
    const availableWeight =
      (container.maxWeight || Infinity) - (container.weight || 0);
    const availableVolume =
      (container.maxVolume || Infinity) - (container.volume || 0);

    if (
      (!itemDetails.weight || availableWeight >= itemDetails.weight) &&
      (!itemDetails.volume || availableVolume >= itemDetails.volume)
    ) {
      return {
        suggested: container,
        reason: `Container ${container.containerNumber} matches destination and has capacity`,
        createNew: false,
      };
    }
  }

  // Suggest creating new container
  return {
    suggested: null,
    reason: "No matching container with available capacity found",
    createNew: true,
  };
}
