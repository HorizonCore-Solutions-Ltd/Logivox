/**
 * Cross-Dock Auto-Matching Service
 * Intelligently matches inbound receipts to outbound shipments
 */

import { prisma } from '@/lib/prisma';

interface MatchingCriteria {
  appointmentId?: string;
  organizationId: string;
  warehouseId?: string;
  receiptId?: string;
  strategy?: 'FIFO' | 'LIFO' | 'CLOSEST_DUE_DATE' | 'PRIORITY' | 'CUSTOMER_PRIORITY';
}

interface MatchResult {
  success: boolean;
  allocationsCreated: number;
  unitsAllocated: number;
  details: any[];
  unmatched?: {
    receiptItems: any[];
    shipments: any[];
  };
}

/**
 * Auto-match inbound receipts to outbound shipments
 */
export async function autoMatchReceiptsToShipments(
  criteria: MatchingCriteria
): Promise<MatchResult> {
  const { appointmentId, organizationId, warehouseId, receiptId, strategy = 'FIFO' } = criteria;

  // Get available receipt items (not fully allocated)
  const receiptItemsQuery: any = {
    organizationId,
  };

  if (appointmentId) {
    receiptItemsQuery.receipt = { appointmentId };
  } else if (receiptId) {
    receiptItemsQuery.receiptId = receiptId;
  }

  const receiptItems = await prisma.crossDockReceiptItem.findMany({
    where: {
      ...receiptItemsQuery,
      quantityRemaining: { gt: 0 },
    },
    include: {
      receipt: {
        include: {
          appointment: true,
        },
      },
      inventory: true,
    },
    orderBy: { receivedAt: strategy === 'LIFO' ? 'desc' : 'asc' },
  });

  if (receiptItems.length === 0) {
    return {
      success: true,
      allocationsCreated: 0,
      unitsAllocated: 0,
      details: [],
      unmatched: { receiptItems: [], shipments: [] },
    };
  }

  // Get pending outbound shipments
  const shipmentsQuery: any = {
    organizationId,
    status: { in: ['PLANNED', 'PICKING'] },
  };

  if (appointmentId) {
    shipmentsQuery.appointmentId = appointmentId;
  } else if (warehouseId) {
    shipmentsQuery.appointment = { warehouseId };
  }

  let shipments = await prisma.crossDockShipment.findMany({
    where: shipmentsQuery,
    include: {
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
      allocations: true,
    },
  });

  // Sort shipments by strategy
  shipments = sortShipmentsByStrategy(shipments, strategy);

  const allocationsCreated: any[] = [];
  let totalUnitsAllocated = 0;
  const unmatched = {
    receiptItems: [] as any[],
    shipments: [] as any[],
  };

  // Match receipt items to shipments
  for (const receiptItem of receiptItems) {
    let remainingQty = receiptItem.quantityRemaining;

    // Find matching shipments (same SKU)
    const matchingShipments = shipments.filter((shipment) => {
      if (!shipment.salesOrder) return false;

      // Check if sales order has this SKU
      const hasMatchingSKU = shipment.salesOrder.items.some(
        (soItem) => soItem.inventoryItem.sku === receiptItem.sku
      );

      if (!hasMatchingSKU) return false;

      // Check if shipment needs more units
      const soItem = shipment.salesOrder.items.find(
        (item) => item.inventoryItem.sku === receiptItem.sku
      );

      if (!soItem) return false;

      const existingAllocations = shipment.allocations
        .filter((alloc) => alloc.receiptItem.sku === receiptItem.sku)
        .reduce((sum, alloc) => sum + alloc.quantityAllocated, 0);

      return soItem.quantity > existingAllocations;
    });

    if (matchingShipments.length === 0) {
      unmatched.receiptItems.push({
        sku: receiptItem.sku,
        quantity: remainingQty,
        receiptNumber: receiptItem.receipt.receiptNumber,
      });
      continue;
    }

    // Allocate to matching shipments
    for (const shipment of matchingShipments) {
      if (remainingQty <= 0) break;

      const soItem = shipment.salesOrder!.items.find(
        (item) => item.inventoryItem.sku === receiptItem.sku
      );

      if (!soItem) continue;

      const existingAllocations = shipment.allocations
        .filter((alloc) => alloc.receiptItem.sku === receiptItem.sku)
        .reduce((sum, alloc) => sum + alloc.quantityAllocated, 0);

      const needed = soItem.quantity - existingAllocations;
      const allocateQty = Math.min(remainingQty, needed);

      if (allocateQty > 0) {
        const allocation = await prisma.crossDockAllocation.create({
          data: {
            organizationId,
            receiptItemId: receiptItem.id,
            shipmentId: shipment.id,
            quantityAllocated: allocateQty,
            status: 'ALLOCATED',
          },
        });

        // Update receipt item remaining quantity
        await prisma.crossDockReceiptItem.update({
          where: { id: receiptItem.id },
          data: {
            quantityAllocated: receiptItem.quantityAllocated + allocateQty,
            quantityRemaining: receiptItem.quantityRemaining - allocateQty,
          },
        });

        // Update shipment metrics
        await prisma.crossDockShipment.update({
          where: { id: shipment.id },
          data: {
            totalUnits: { increment: allocateQty },
          },
        });

        allocationsCreated.push({
          allocationId: allocation.id,
          sku: receiptItem.sku,
          quantity: allocateQty,
          from: receiptItem.receipt.receiptNumber,
          to: shipment.shipmentNumber,
        });

        remainingQty -= allocateQty;
        totalUnitsAllocated += allocateQty;
      }
    }

    if (remainingQty > 0) {
      unmatched.receiptItems.push({
        sku: receiptItem.sku,
        quantity: remainingQty,
        receiptNumber: receiptItem.receipt.receiptNumber,
      });
    }
  }

  // Find shipments that still need units
  for (const shipment of shipments) {
    if (!shipment.salesOrder) continue;

    for (const soItem of shipment.salesOrder.items) {
      const existingAllocations = shipment.allocations
        .filter((alloc) => alloc.receiptItem.sku === soItem.inventoryItem.sku)
        .reduce((sum, alloc) => sum + alloc.quantityAllocated, 0);

      const needed = soItem.quantity - existingAllocations;

      if (needed > 0) {
        unmatched.shipments.push({
          shipmentNumber: shipment.shipmentNumber,
          sku: soItem.inventoryItem.sku,
          quantityNeeded: needed,
          customer: shipment.customer?.name,
        });
      }
    }
  }

  return {
    success: true,
    allocationsCreated: allocationsCreated.length,
    unitsAllocated: totalUnitsAllocated,
    details: allocationsCreated,
    unmatched,
  };
}

/**
 * Manual allocation
 */
export async function manualAllocate(input: {
  organizationId: string;
  receiptItemId: string;
  shipmentId: string;
  quantity: number;
  userId?: string;
}) {
  const { organizationId, receiptItemId, shipmentId, quantity, userId } = input;

  // Validate receipt item
  const receiptItem = await prisma.crossDockReceiptItem.findUnique({
    where: { id: receiptItemId },
    include: { receipt: true },
  });

  if (!receiptItem) {
    throw new Error('Receipt item not found');
  }

  if (receiptItem.quantityRemaining < quantity) {
    throw new Error(`Insufficient quantity. Available: ${receiptItem.quantityRemaining}`);
  }

  // Validate shipment
  const shipment = await prisma.crossDockShipment.findUnique({
    where: { id: shipmentId },
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // Create allocation
  const allocation = await prisma.crossDockAllocation.create({
    data: {
      organizationId,
      receiptItemId,
      shipmentId,
      quantityAllocated: quantity,
      assignedTo: userId,
      status: 'ALLOCATED',
    },
  });

  // Update receipt item
  await prisma.crossDockReceiptItem.update({
    where: { id: receiptItemId },
    data: {
      quantityAllocated: { increment: quantity },
      quantityRemaining: { decrement: quantity },
    },
  });

  // Update shipment
  await prisma.crossDockShipment.update({
    where: { id: shipmentId },
    data: {
      totalUnits: { increment: quantity },
    },
  });

  return allocation;
}

/**
 * Deallocate (remove allocation)
 */
export async function deallocate(allocationId: string) {
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

  if (allocation.status === 'SHIPPED') {
    throw new Error('Cannot deallocate shipped items');
  }

  // Restore receipt item quantities
  await prisma.crossDockReceiptItem.update({
    where: { id: allocation.receiptItemId },
    data: {
      quantityAllocated: { decrement: allocation.quantityAllocated },
      quantityRemaining: { increment: allocation.quantityAllocated },
    },
  });

  // Update shipment
  await prisma.crossDockShipment.update({
    where: { id: allocation.shipmentId },
    data: {
      totalUnits: { decrement: allocation.quantityAllocated },
    },
  });

  // Delete allocation
  await prisma.crossDockAllocation.delete({
    where: { id: allocationId },
  });

  return { success: true };
}

/**
 * Get allocation details
 */
export async function getAllocations(filters: {
  organizationId: string;
  appointmentId?: string;
  receiptItemId?: string;
  shipmentId?: string;
  status?: string;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.receiptItemId) where.receiptItemId = filters.receiptItemId;
  if (filters.shipmentId) where.shipmentId = filters.shipmentId;
  if (filters.status) where.status = filters.status;

  if (filters.appointmentId) {
    where.OR = [
      { receiptItem: { receipt: { appointmentId: filters.appointmentId } } },
      { shipment: { appointmentId: filters.appointmentId } },
    ];
  }

  return await prisma.crossDockAllocation.findMany({
    where,
    include: {
      receiptItem: {
        include: {
          receipt: true,
          inventory: true,
        },
      },
      shipment: {
        include: {
          customer: true,
          salesOrder: true,
        },
      },
    },
    orderBy: { allocatedAt: 'desc' },
  });
}

/**
 * Sort shipments by strategy
 */
function sortShipmentsByStrategy(shipments: any[], strategy: string) {
  switch (strategy) {
    case 'FIFO':
      return shipments.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    
    case 'LIFO':
      return shipments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    
    case 'CLOSEST_DUE_DATE':
      return shipments.sort((a, b) => 
        new Date(a.targetShipDate).getTime() - new Date(b.targetShipDate).getTime()
      );
    
    case 'PRIORITY':
      const priorityOrder: Record<string, number> = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return shipments.sort((a, b) => {
        const aPriority = priorityOrder[a.appointment?.priority || 'MEDIUM'] || 3;
        const bPriority = priorityOrder[b.appointment?.priority || 'MEDIUM'] || 3;
        return aPriority - bPriority;
      });
    
    case 'CUSTOMER_PRIORITY':
      // Could be enhanced with customer tiers/priority flags
      return shipments;
    
    default:
      return shipments;
  }
}

/**
 * Get matching recommendations (preview without creating allocations)
 */
export async function getMatchingRecommendations(criteria: MatchingCriteria) {
  const { organizationId, appointmentId, receiptId, strategy = 'FIFO' } = criteria;

  const receiptItemsQuery: any = { organizationId, quantityRemaining: { gt: 0 } };
  if (appointmentId) receiptItemsQuery.receipt = { appointmentId };
  if (receiptId) receiptItemsQuery.receiptId = receiptId;

  const receiptItems = await prisma.crossDockReceiptItem.findMany({
    where: receiptItemsQuery,
    include: {
      receipt: true,
      inventory: true,
    },
  });

  const shipmentsQuery: any = {
    organizationId,
    status: { in: ['PLANNED', 'PICKING'] },
  };
  if (appointmentId) shipmentsQuery.appointmentId = appointmentId;

  const shipments = await prisma.crossDockShipment.findMany({
    where: shipmentsQuery,
    include: {
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
      allocations: true,
    },
  });

  const recommendations = [];

  for (const receiptItem of receiptItems) {
    const matchingShipments = shipments.filter((shipment) => {
      if (!shipment.salesOrder) return false;
      return shipment.salesOrder.items.some(
        (soItem) => soItem.inventoryItem.sku === receiptItem.sku
      );
    });

    for (const shipment of matchingShipments) {
      const soItem = shipment.salesOrder!.items.find(
        (item) => item.inventoryItem.sku === receiptItem.sku
      );

      if (!soItem) continue;

      const existingAllocations = shipment.allocations
        .filter((alloc) => alloc.receiptItem?.sku === receiptItem.sku)
        .reduce((sum, alloc) => sum + alloc.quantityAllocated, 0);

      const needed = soItem.quantity - existingAllocations;
      const canAllocate = Math.min(receiptItem.quantityRemaining, needed);

      if (canAllocate > 0) {
        recommendations.push({
          receiptItemId: receiptItem.id,
          receiptNumber: receiptItem.receipt.receiptNumber,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
          sku: receiptItem.sku,
          productName: receiptItem.productName,
          quantity: canAllocate,
          customer: shipment.customer?.name,
          targetShipDate: shipment.targetShipDate,
        });
      }
    }
  }

  return recommendations;
}
