/**
 * Cross-Dock Sorting & Allocation Service
 * Manages sorting operations, worker assignments, and progress tracking
 */

import { prisma } from '@/lib/prisma';
import type { SortingMethod } from '@prisma/client';

interface CreateSortingTaskInput {
  organizationId: string;
  appointmentId: string;
  sortingMethod: SortingMethod;
  sortingAreaId?: string;
  assignedWorkerId?: string;
  teamSize?: number;
}

interface UpdateSortingProgressInput {
  sortingId: string;
  sortedUnits: number;
  unitsPerHour?: number;
  accuracy?: number;
  notes?: string;
}

interface AssignWorkerInput {
  sortingId: string;
  workerId: string;
}

interface PickingUpdateInput {
  allocationId: string;
  quantityPicked: number;
  userId: string;
  locationId?: string;
}

/**
 * Create a sorting task for an appointment
 */
export async function createSortingTask(input: CreateSortingTaskInput) {
  const { organizationId, appointmentId, sortingMethod, sortingAreaId, assignedWorkerId, teamSize } = input;

  // Get appointment details
  const appointment = await prisma.crossDockingAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      receipts: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Calculate total units to sort
  const totalUnits = appointment.receipts.reduce(
    (sum, receipt) => sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantityReceived, 0),
    0
  );

  // Create sorting task
  const sorting = await prisma.crossDockSorting.create({
    data: {
      organizationId,
      appointmentId,
      sortingMethod,
      sortingAreaId,
      assignedWorkerId,
      teamSize: teamSize || 1,
      totalUnits,
      sortedUnits: 0,
      status: 'PENDING',
    },
  });

  return sorting;
}

/**
 * Update sorting progress
 */
export async function updateSortingProgress(input: UpdateSortingProgressInput) {
  const { sortingId, sortedUnits, unitsPerHour, accuracy, notes } = input;

  const sorting = await prisma.crossDockSorting.findUnique({
    where: { id: sortingId },
  });

  if (!sorting) {
    throw new Error('Sorting task not found');
  }

  const updateData: any = {
    sortedUnits: Math.min(sortedUnits, sorting.totalUnits),
    status: sortedUnits >= sorting.totalUnits ? 'COMPLETED' : 'IN_PROGRESS',
  };

  if (sorting.status === 'PENDING' && sortedUnits > 0) {
    updateData.startedAt = new Date();
  }

  if (sortedUnits >= sorting.totalUnits) {
    updateData.completedAt = new Date();
    
    // Calculate actual duration
    if (sorting.startedAt) {
      const duration = (new Date().getTime() - sorting.startedAt.getTime()) / (1000 * 60 * 60); // hours
      if (duration > 0) {
        updateData.unitsPerHour = Math.round(sorting.totalUnits / duration);
      }
    }
  } else if (unitsPerHour) {
    updateData.unitsPerHour = unitsPerHour;
  }

  if (accuracy !== undefined) {
    updateData.accuracy = accuracy;
  }

  const updated = await prisma.crossDockSorting.update({
    where: { id: sortingId },
    data: updateData,
  });

  return updated;
}

/**
 * Assign worker to sorting task
 */
export async function assignWorkerToSorting(input: AssignWorkerInput) {
  const { sortingId, workerId } = input;

  return await prisma.crossDockSorting.update({
    where: { id: sortingId },
    data: {
      assignedWorkerId: workerId,
    },
  });
}

/**
 * Get sorting tasks
 */
export async function getSortingTasks(filters: {
  organizationId: string;
  appointmentId?: string;
  status?: string;
  workerId?: string;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.appointmentId) where.appointmentId = filters.appointmentId;
  if (filters.status) where.status = filters.status;
  if (filters.workerId) where.assignedWorkerId = filters.workerId;

  return await prisma.crossDockSorting.findMany({
    where,
    include: {
      appointment: {
        include: {
          warehouse: true,
        },
      },
      sortingArea: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update allocation picking status
 */
export async function updateAllocationPicking(input: PickingUpdateInput) {
  const { allocationId, quantityPicked, userId, locationId } = input;

  const allocation = await prisma.crossDockAllocation.findUnique({
    where: { id: allocationId },
    include: {
      receiptItem: true,
      shipment: true,
    },
  });

  if (!allocation) {
    throw new Error('Allocation not found');
  }

  if (quantityPicked > allocation.quantityAllocated - allocation.quantityPicked) {
    throw new Error('Picked quantity exceeds allocated quantity');
  }

  const newQuantityPicked = allocation.quantityPicked + quantityPicked;
  const isFullyPicked = newQuantityPicked >= allocation.quantityAllocated;

  // Update allocation
  const updated = await prisma.crossDockAllocation.update({
    where: { id: allocationId },
    data: {
      quantityPicked: newQuantityPicked,
      status: isFullyPicked ? 'PICKED' : 'PICKING',
      assignedTo: allocation.assignedTo || userId,
    },
  });

  // Update receipt item
  await prisma.crossDockReceiptItem.update({
    where: { id: allocation.receiptItemId },
    data: {
      quantityShipped: { increment: quantityPicked },
      quantityRemaining: { decrement: quantityPicked },
      currentLocationId: locationId,
    },
  });

  return updated;
}

/**
 * Stage allocation (mark as ready for loading)
 */
export async function stageAllocation(allocationId: string, locationId?: string) {
  const allocation = await prisma.crossDockAllocation.findUnique({
    where: { id: allocationId },
  });

  if (!allocation) {
    throw new Error('Allocation not found');
  }

  if (allocation.status !== 'PICKED') {
    throw new Error('Can only stage picked allocations');
  }

  // Update allocation status
  const updated = await prisma.crossDockAllocation.update({
    where: { id: allocationId },
    data: {
      status: 'STAGED',
    },
  });

  // Update receipt item location if provided
  if (locationId) {
    await prisma.crossDockReceiptItem.update({
      where: { id: allocation.receiptItemId },
      data: {
        currentLocationId: locationId,
      },
    });
  }

  return updated;
}

/**
 * Mark allocation as loaded
 */
export async function loadAllocation(allocationId: string) {
  const allocation = await prisma.crossDockAllocation.findUnique({
    where: { id: allocationId },
    include: {
      shipment: true,
    },
  });

  if (!allocation) {
    throw new Error('Allocation not found');
  }

  if (allocation.status !== 'STAGED') {
    throw new Error('Can only load staged allocations');
  }

  // Update allocation
  const updated = await prisma.crossDockAllocation.update({
    where: { id: allocationId },
    data: {
      status: 'LOADED',
    },
  });

  // Update shipment packed units
  await prisma.crossDockShipment.update({
    where: { id: allocation.shipmentId },
    data: {
      packedUnits: { increment: allocation.quantityPicked },
    },
  });

  return updated;
}

/**
 * Ship allocation (mark as shipped)
 */
export async function shipAllocation(allocationId: string) {
  const allocation = await prisma.crossDockAllocation.findUnique({
    where: { id: allocationId },
    include: {
      shipment: true,
    },
  });

  if (!allocation) {
    throw new Error('Allocation not found');
  }

  // Update allocation
  const updated = await prisma.crossDockAllocation.update({
    where: { id: allocationId },
    data: {
      status: 'SHIPPED',
      quantityShipped: allocation.quantityPicked,
    },
  });

  // Check if all allocations for shipment are shipped
  const allAllocations = await prisma.crossDockAllocation.findMany({
    where: { shipmentId: allocation.shipmentId },
  });

  const allShipped = allAllocations.every((alloc) => alloc.status === 'SHIPPED');

  if (allShipped) {
    await prisma.crossDockShipment.update({
      where: { id: allocation.shipmentId },
      data: {
        status: 'SHIPPED',
        actualShipDate: new Date(),
      },
    });
  }

  return updated;
}

/**
 * Bulk update allocations (for batch operations)
 */
export async function bulkUpdateAllocations(
  allocationIds: string[],
  status: string,
  userId?: string
) {
  const updated = await prisma.crossDockAllocation.updateMany({
    where: {
      id: { in: allocationIds },
    },
    data: {
      status: status as any,
      assignedTo: userId,
    },
  });

  return updated;
}

/**
 * Get allocation workflow status
 */
export async function getAllocationWorkflow(shipmentId: string) {
  const shipment = await prisma.crossDockShipment.findUnique({
    where: { id: shipmentId },
    include: {
      allocations: {
        include: {
          receiptItem: {
            include: {
              receipt: true,
              inventory: true,
            },
          },
        },
        orderBy: { allocatedAt: 'asc' },
      },
      appointment: true,
      customer: true,
      salesOrder: {
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      },
    },
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Calculate workflow status
  const totalAllocations = shipment.allocations.length;
  const statusCounts = shipment.allocations.reduce((acc, alloc) => {
    acc[alloc.status] = (acc[alloc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalQuantity = shipment.allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
  const pickedQuantity = shipment.allocations.reduce((sum, a) => sum + a.quantityPicked, 0);
  const shippedQuantity = shipment.allocations.reduce((sum, a) => sum + a.quantityShipped, 0);

  return {
    shipment,
    workflow: {
      totalAllocations,
      statusCounts,
      progress: {
        totalQuantity,
        pickedQuantity,
        shippedQuantity,
        pickingProgress: totalQuantity > 0 ? (pickedQuantity / totalQuantity) * 100 : 0,
        shippingProgress: totalQuantity > 0 ? (shippedQuantity / totalQuantity) * 100 : 0,
      },
    },
  };
}

/**
 * Get worker performance metrics
 */
export async function getWorkerPerformance(filters: {
  organizationId: string;
  workerId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.workerId) where.assignedWorkerId = filters.workerId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const sortingTasks = await prisma.crossDockSorting.findMany({
    where,
    include: {
      appointment: true,
    },
  });

  const allocations = await prisma.crossDockAllocation.findMany({
    where: {
      ...where,
      assignedTo: filters.workerId,
    },
  });

  // Aggregate metrics
  const totalTasksCompleted = sortingTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalUnitsSorted = sortingTasks.reduce((sum, t) => sum + t.sortedUnits, 0);
  const avgUnitsPerHour = sortingTasks.length > 0
    ? sortingTasks.reduce((sum, t) => sum + (t.unitsPerHour || 0), 0) / sortingTasks.length
    : 0;
  const avgAccuracy = sortingTasks.length > 0
    ? sortingTasks.reduce((sum, t) => sum + (t.accuracy || 100), 0) / sortingTasks.length
    : 100;

  const totalAllocationsPicked = allocations.filter((a) => a.status === 'PICKED' || a.status === 'STAGED' || a.status === 'LOADED' || a.status === 'SHIPPED').length;
  const totalUnitsPicked = allocations.reduce((sum, a) => sum + a.quantityPicked, 0);

  return {
    workerId: filters.workerId,
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    sorting: {
      tasksCompleted: totalTasksCompleted,
      totalUnits: totalUnitsSorted,
      avgUnitsPerHour: Math.round(avgUnitsPerHour),
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
    },
    picking: {
      allocationsCompleted: totalAllocationsPicked,
      totalUnits: totalUnitsPicked,
    },
  };
}

/**
 * Get sorting area utilization
 */
export async function getSortingAreaUtilization(filters: {
  organizationId: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.warehouseId) {
    where.appointment = { warehouseId: filters.warehouseId };
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const sortingTasks = await prisma.crossDockSorting.findMany({
    where,
    include: {
      sortingArea: true,
    },
  });

  // Group by sorting area
  const areaStats = sortingTasks.reduce((acc, task) => {
    const areaId = task.sortingAreaId || 'unassigned';
    if (!acc[areaId]) {
      acc[areaId] = {
        areaId,
        areaName: task.sortingArea?.name || 'Unassigned',
        totalTasks: 0,
        completedTasks: 0,
        totalUnits: 0,
        sortedUnits: 0,
        avgUnitsPerHour: 0,
        avgAccuracy: 0,
        taskCount: 0,
      };
    }

    acc[areaId].totalTasks++;
    if (task.status === 'COMPLETED') acc[areaId].completedTasks++;
    acc[areaId].totalUnits += task.totalUnits;
    acc[areaId].sortedUnits += task.sortedUnits;
    if (task.unitsPerHour) {
      acc[areaId].avgUnitsPerHour += task.unitsPerHour;
      acc[areaId].taskCount++;
    }
    if (task.accuracy) {
      acc[areaId].avgAccuracy += task.accuracy;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate averages
  Object.values(areaStats).forEach((area: any) => {
    if (area.taskCount > 0) {
      area.avgUnitsPerHour = Math.round(area.avgUnitsPerHour / area.taskCount);
      area.avgAccuracy = Math.round((area.avgAccuracy / area.totalTasks) * 10) / 10;
    }
    area.utilizationRate = area.totalUnits > 0 ? (area.sortedUnits / area.totalUnits) * 100 : 0;
  });

  return Object.values(areaStats);
}
