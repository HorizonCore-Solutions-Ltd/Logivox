/**
 * Cross-Docking Scheduling Service
 * Manages cross-docking appointments and scheduling
 */

import { prisma } from '@/lib/prisma';
import { CrossDockType, CrossDockStatus, SortingMethod } from '@prisma/client';

interface CreateAppointmentInput {
  organizationId: string;
  warehouseId: string;
  type: CrossDockType;
  priority?: string;
  
  // Inbound details
  inboundCarrier?: string;
  inboundVehicleId?: string;
  expectedArrival: Date;
  
  // Outbound details
  targetShipDate: Date;
  
  // Operational
  sortingMethod?: SortingMethod;
  sortingAreaId?: string;
  maxDwellTime?: number;
  
  notes?: string;
  specialInstructions?: string;
}

interface UpdateStatusInput {
  appointmentId: string;
  status: CrossDockStatus;
  userId?: string;
  notes?: string;
}

/**
 * Generate unique appointment number
 * Format: XD-YYYYMMDD-NNN
 */
export async function generateAppointmentNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]?.replace(/-/g, '') || '';
  const prefix = `XD-${dateStr}`;

  const lastAppointment = await prisma.crossDockingAppointment.findFirst({
    where: {
      organizationId,
      appointmentNumber: { startsWith: prefix },
    },
    orderBy: { appointmentNumber: 'desc' },
  });

  let sequence = 1;
  if (lastAppointment) {
    const lastNumber = lastAppointment.appointmentNumber.split('-')[2];
    sequence = parseInt(lastNumber || '0') + 1;
  }

  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
}

/**
 * Create new cross-docking appointment
 */
export async function createAppointment(input: CreateAppointmentInput) {
  const appointmentNumber = await generateAppointmentNumber(input.organizationId);

  const appointment = await prisma.crossDockingAppointment.create({
    data: {
      appointmentNumber,
      organizationId: input.organizationId,
      warehouseId: input.warehouseId,
      type: input.type,
      priority: input.priority || 'MEDIUM',
      inboundCarrier: input.inboundCarrier,
      inboundVehicleId: input.inboundVehicleId,
      expectedArrival: input.expectedArrival,
      targetShipDate: input.targetShipDate,
      sortingMethod: input.sortingMethod || SortingMethod.MANUAL,
      sortingAreaId: input.sortingAreaId,
      maxDwellTime: input.maxDwellTime || 4,
      notes: input.notes,
      specialInstructions: input.specialInstructions,
      status: CrossDockStatus.SCHEDULED,
    },
    include: {
      warehouse: true,
      sortingArea: true,
    },
  });

  // Log activity
  await logActivity({
    appointmentId: appointment.id,
    organizationId: input.organizationId,
    action: 'CREATED',
    description: `Cross-dock appointment ${appointmentNumber} created`,
  });

  return appointment;
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(input: UpdateStatusInput) {
  const { appointmentId, status, userId, notes } = input;

  const appointment = await prisma.crossDockingAppointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  // Update timestamps based on status
  if (status === CrossDockStatus.RECEIVING && !appointment.actualArrival) {
    updateData.actualArrival = new Date();
  }

  if (status === CrossDockStatus.COMPLETED) {
    updateData.completedAt = new Date();
    
    // Calculate dwell time
    if (appointment.actualArrival) {
      const dwellMinutes = Math.floor(
        (new Date().getTime() - appointment.actualArrival.getTime()) / (1000 * 60)
      );
      updateData.dwellTimeMinutes = dwellMinutes;
    }

    updateData.actualShipDate = new Date();
  }

  const updated = await prisma.crossDockingAppointment.update({
    where: { id: appointmentId },
    data: updateData,
    include: {
      warehouse: true,
      receipts: true,
      shipments: true,
    },
  });

  // Log activity
  await logActivity({
    appointmentId,
    organizationId: appointment.organizationId,
    action: 'STATUS_CHANGED',
    description: `Status changed from ${appointment.status} to ${status}`,
    performedBy: userId,
    metadata: { previousStatus: appointment.status, newStatus: status, notes },
  });

  return updated;
}

/**
 * Assign door to appointment
 */
export async function assignDoor(
  appointmentId: string,
  doorId: string,
  doorType: 'INBOUND' | 'OUTBOUND'
) {
  const appointment = await prisma.crossDockingAppointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const updateData: any = {};

  if (doorType === 'INBOUND') {
    updateData.inboundDoorId = doorId;
  } else {
    // Add to outbound doors array
    const currentDoors = appointment.outboundDoorIds || [];
    if (!currentDoors.includes(doorId)) {
      updateData.outboundDoorIds = [...currentDoors, doorId];
    }
  }

  const updated = await prisma.crossDockingAppointment.update({
    where: { id: appointmentId },
    data: updateData,
  });

  await logActivity({
    appointmentId,
    organizationId: appointment.organizationId,
    action: 'DOOR_ASSIGNED',
    description: `${doorType} door assigned`,
    metadata: { doorId, doorType },
  });

  return updated;
}

/**
 * Get appointment details
 */
export async function getAppointment(appointmentId: string) {
  return await prisma.crossDockingAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      warehouse: true,
      inboundDoor: true,
      sortingArea: true,
      receipts: {
        include: {
          supplier: true,
          items: {
            include: {
              inventory: true,
            },
          },
        },
      },
      shipments: {
        include: {
          customer: true,
          salesOrder: true,
          allocations: {
            include: {
              receiptItem: true,
            },
          },
        },
      },
      sortingTasks: true,
      activities: {
        orderBy: { performedAt: 'desc' },
        take: 50,
      },
    },
  });
}

/**
 * List appointments with filters
 */
export async function listAppointments(filters: {
  organizationId: string;
  warehouseId?: string;
  status?: CrossDockStatus;
  type?: CrossDockType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  
  if (filters.startDate || filters.endDate) {
    where.expectedArrival = {};
    if (filters.startDate) where.expectedArrival.gte = filters.startDate;
    if (filters.endDate) where.expectedArrival.lte = filters.endDate;
  }

  const [appointments, total] = await Promise.all([
    prisma.crossDockingAppointment.findMany({
      where,
      include: {
        warehouse: true,
        receipts: { select: { id: true } },
        shipments: { select: { id: true, status: true } },
      },
      orderBy: { expectedArrival: 'asc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.crossDockingAppointment.count({ where }),
  ]);

  return { appointments, total };
}

/**
 * Get appointments for calendar view
 */
export async function getAppointmentCalendar(filters: {
  organizationId: string;
  warehouseId?: string;
  startDate: Date;
  endDate: Date;
}) {
  return await prisma.crossDockingAppointment.findMany({
    where: {
      organizationId: filters.organizationId,
      warehouseId: filters.warehouseId,
      expectedArrival: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    select: {
      id: true,
      appointmentNumber: true,
      type: true,
      status: true,
      priority: true,
      expectedArrival: true,
      targetShipDate: true,
      inboundCarrier: true,
      totalUnits: true,
      receivedUnits: true,
      shippedUnits: true,
      receipts: {
        select: {
          supplier: { select: { name: true } },
        },
      },
      shipments: {
        select: {
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: { expectedArrival: 'asc' },
  });
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats(filters: {
  organizationId: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {
    organizationId: filters.organizationId,
  };

  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  
  if (filters.startDate || filters.endDate) {
    where.expectedArrival = {};
    if (filters.startDate) where.expectedArrival.gte = filters.startDate;
    if (filters.endDate) where.expectedArrival.lte = filters.endDate;
  }

  const appointments = await prisma.crossDockingAppointment.findMany({
    where,
    select: {
      status: true,
      type: true,
      totalUnits: true,
      receivedUnits: true,
      shippedUnits: true,
      dwellTimeMinutes: true,
      maxDwellTime: true,
      expectedArrival: true,
      actualArrival: true,
      targetShipDate: true,
      actualShipDate: true,
    },
  });

  const stats = {
    totalAppointments: appointments.length,
    byStatus: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    totalUnits: 0,
    receivedUnits: 0,
    shippedUnits: 0,
    avgDwellTime: 0,
    onTimePercentage: 0,
    utilizationRate: 0,
  };

  let totalDwellTime = 0;
  let dwellTimeCount = 0;
  let onTimeCount = 0;

  appointments.forEach((apt) => {
    // Count by status
    stats.byStatus[apt.status] = (stats.byStatus[apt.status] || 0) + 1;
    
    // Count by type
    stats.byType[apt.type] = (stats.byType[apt.type] || 0) + 1;
    
    // Unit totals
    stats.totalUnits += apt.totalUnits;
    stats.receivedUnits += apt.receivedUnits;
    stats.shippedUnits += apt.shippedUnits;
    
    // Dwell time
    if (apt.dwellTimeMinutes) {
      totalDwellTime += apt.dwellTimeMinutes;
      dwellTimeCount++;
    }
    
    // On-time performance
    if (apt.actualShipDate && apt.targetShipDate) {
      if (apt.actualShipDate <= apt.targetShipDate) {
        onTimeCount++;
      }
    }
  });

  if (dwellTimeCount > 0) {
    stats.avgDwellTime = Math.round(totalDwellTime / dwellTimeCount);
  }

  if (appointments.length > 0) {
    stats.utilizationRate = Math.round((stats.shippedUnits / stats.totalUnits) * 100);
    stats.onTimePercentage = Math.round((onTimeCount / appointments.length) * 100);
  }

  return stats;
}

/**
 * Log appointment activity
 */
async function logActivity(input: {
  appointmentId: string;
  organizationId: string;
  action: string;
  description: string;
  performedBy?: string;
  metadata?: any;
}) {
  return await prisma.crossDockActivity.create({
    data: {
      appointmentId: input.appointmentId,
      organizationId: input.organizationId,
      action: input.action,
      description: input.description,
      performedBy: input.performedBy,
      metadata: input.metadata,
    },
  });
}

/**
 * Delete appointment (if not started)
 */
export async function deleteAppointment(appointmentId: string) {
  const appointment = await prisma.crossDockingAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      receipts: true,
      shipments: true,
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.status !== CrossDockStatus.SCHEDULED) {
    throw new Error('Can only delete scheduled appointments');
  }

  if (appointment.receipts.length > 0 || appointment.shipments.length > 0) {
    throw new Error('Cannot delete appointment with existing receipts or shipments');
  }

  await prisma.crossDockingAppointment.update({
    where: { id: appointmentId },
    data: { status: CrossDockStatus.CANCELLED },
  });

  await logActivity({
    appointmentId,
    organizationId: appointment.organizationId,
    action: 'CANCELLED',
    description: 'Appointment cancelled',
  });

  return { success: true };
}
