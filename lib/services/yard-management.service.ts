/**
 * Yard Management Service
 * 
 * Handles yard operations including:
 * - Dock appointment scheduling
 * - Yard location management
 * - Gate entry/exit tracking
 * - Trailer/container tracking
 * - Dock door assignment
 * - Yard utilization metrics
 */

import { prisma } from '@/lib/prisma';
import { YardLocationType, DockAppointmentType, AppointmentStatus } from '@prisma/client';

interface CreateAppointmentParams {
  organizationId: string;
  appointmentType: DockAppointmentType;
  warehouseId?: string;
  scheduledDate: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  trailerNumber?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  expectedPallets?: number;
  expectedWeight?: number;
}

interface YardLocationParams {
  organizationId: string;
  warehouseId?: string;
  locationCode: string;
  locationName: string;
  locationType: YardLocationType;
  capacity?: number;
  length?: number;
  width?: number;
}

export class YardManagementService {
  
  /**
   * Create dock appointment
   */
  static async createAppointment(params: CreateAppointmentParams) {
    const appointmentNumber = await this.generateAppointmentNumber(params.organizationId);

    // Calculate duration in hours
    const duration = (params.scheduledEnd.getTime() - params.scheduledStart.getTime()) / (1000 * 60 * 60);

    const appointment = await prisma.dockAppointment.create({
      data: {
        organizationId: params.organizationId,
        appointmentNumber,
        appointmentType: params.appointmentType,
        warehouseId: params.warehouseId,
        scheduledDate: params.scheduledDate,
        scheduledStart: params.scheduledStart,
        scheduledEnd: params.scheduledEnd,
        duration,
        carrierName: params.carrierName,
        driverName: params.driverName,
        driverPhone: params.driverPhone,
        vehicleNumber: params.vehicleNumber,
        trailerNumber: params.trailerNumber,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        referenceNumber: params.referenceNumber,
        expectedPallets: params.expectedPallets,
        expectedWeight: params.expectedWeight,
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        yardLocation: true,
      },
    });

    return appointment;
  }

  /**
   * Assign yard location to appointment
   */
  static async assignYardLocation(params: {
    appointmentId: string;
    yardLocationId: string;
  }) {
    // Check if location is available
    const location = await prisma.yardLocation.findUnique({
      where: { id: params.yardLocationId },
    });

    if (!location) {
      throw new Error('Yard location not found');
    }

    if (location.isOccupied) {
      throw new Error('Yard location is already occupied');
    }

    // Assign location
    const appointment = await prisma.dockAppointment.update({
      where: { id: params.appointmentId },
      data: {
        yardLocationId: params.yardLocationId,
      },
      include: {
        yardLocation: true,
      },
    });

    // Mark location as occupied
    await prisma.yardLocation.update({
      where: { id: params.yardLocationId },
      data: {
        isOccupied: true,
      },
    });

    return appointment;
  }

  /**
   * Check in appointment (vehicle arrives)
   */
  static async checkIn(params: {
    appointmentId: string;
    checkedInBy: string;
    actualArrival?: Date;
    sealNumber?: string;
  }) {
    const appointment = await prisma.dockAppointment.findUnique({
      where: { id: params.appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const actualArrival = params.actualArrival || new Date();

    const updated = await prisma.dockAppointment.update({
      where: { id: params.appointmentId },
      data: {
        status: AppointmentStatus.CHECKED_IN,
        actualArrival,
        checkedInBy: params.checkedInBy,
        checkedInAt: new Date(),
        sealNumber: params.sealNumber,
      },
      include: {
        yardLocation: true,
      },
    });

    // Create gate entry record
    await prisma.gateEntry.create({
      data: {
        organizationId: appointment.organizationId,
        entryNumber: `ENTRY-${Date.now()}`,
        appointmentId: params.appointmentId,
        entryType: 'DELIVERY',
        direction: 'INBOUND',
        entryTime: actualArrival,
        vehicleNumber: appointment.vehicleNumber,
        driverName: appointment.driverName,
        carrierName: appointment.carrierName,
      },
    });

    return updated;
  }

  /**
   * Start appointment (begin loading/unloading)
   */
  static async startAppointment(appointmentId: string) {
    return prisma.dockAppointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.IN_PROGRESS,
        actualStart: new Date(),
      },
    });
  }

  /**
   * Complete appointment
   */
  static async completeAppointment(params: {
    appointmentId: string;
    actualPallets?: number;
    actualWeight?: number;
    notes?: string;
  }) {
    const appointment = await prisma.dockAppointment.findUnique({
      where: { id: params.appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const actualEnd = new Date();
    let actualDuration = 0;

    if (appointment.actualStart) {
      actualDuration = (actualEnd.getTime() - appointment.actualStart.getTime()) / (1000 * 60 * 60);
    }

    const updated = await prisma.dockAppointment.update({
      where: { id: params.appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        actualEnd,
        actualDuration,
        actualPallets: params.actualPallets,
        actualWeight: params.actualWeight,
      },
      include: {
        yardLocation: true,
      },
    });

    // Free up yard location
    if (appointment.yardLocationId) {
      await prisma.yardLocation.update({
        where: { id: appointment.yardLocationId },
        data: {
          isOccupied: false,
        },
      });
    }

    return updated;
  }

  /**
   * Check out appointment (vehicle departs)
   */
  static async checkOut(params: {
    appointmentId: string;
    checkedOutBy: string;
  }) {
    const appointment = await prisma.dockAppointment.findUnique({
      where: { id: params.appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updated = await prisma.dockAppointment.update({
      where: { id: params.appointmentId },
      data: {
        checkedOutBy: params.checkedOutBy,
        checkedOutAt: new Date(),
      },
    });

    // Create gate exit record
    await prisma.gateEntry.create({
      data: {
        organizationId: appointment.organizationId,
        entryNumber: `EXIT-${Date.now()}`,
        appointmentId: params.appointmentId,
        entryType: 'DELIVERY',
        direction: 'OUTBOUND',
        entryTime: new Date(),
        vehicleNumber: appointment.vehicleNumber,
        driverName: appointment.driverName,
        carrierName: appointment.carrierName,
      },
    });

    return updated;
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(params: {
    appointmentId: string;
    reason: string;
  }) {
    const appointment = await prisma.dockAppointment.findUnique({
      where: { id: params.appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const updated = await prisma.dockAppointment.update({
      where: { id: params.appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    // Free up yard location if assigned
    if (appointment.yardLocationId) {
      await prisma.yardLocation.update({
        where: { id: appointment.yardLocationId },
        data: {
          isOccupied: false,
        },
      });
    }

    return updated;
  }

  /**
   * Get appointments
   */
  static async getAppointments(params: {
    warehouseId?: string;
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
    carrierName?: string;
  }) {
    const where: any = {};

    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;
    if (params.carrierName) where.carrierName = { contains: params.carrierName };

    if (params.startDate || params.endDate) {
      where.scheduledDate = {};
      if (params.startDate) where.scheduledDate.gte = params.startDate;
      if (params.endDate) where.scheduledDate.lte = params.endDate;
    }

    return prisma.dockAppointment.findMany({
      where,
      include: {
        yardLocation: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });
  }

  /**
   * Get appointment by ID
   */
  static async getAppointmentById(appointmentId: string) {
    return prisma.dockAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        yardLocation: true,
        gateEntries: true,
      },
    });
  }

  /**
   * Create yard location
   */
  static async createYardLocation(params: YardLocationParams) {
    return prisma.yardLocation.create({
      data: {
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        locationCode: params.locationCode,
        locationName: params.locationName,
        locationType: params.locationType,
        capacity: params.capacity,
        length: params.length,
        width: params.width,
        isActive: true,
        isOccupied: false,
      },
    });
  }

  /**
   * Get yard locations
   */
  static async getYardLocations(params: {
    warehouseId?: string;
    locationType?: YardLocationType;
    isOccupied?: boolean;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.locationType) where.locationType = params.locationType;
    if (params.isOccupied !== undefined) where.isOccupied = params.isOccupied;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return prisma.yardLocation.findMany({
      where,
      include: {
        appointments: {
          where: {
            status: {
              in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS],
            },
          },
        },
      },
      orderBy: {
        locationCode: 'asc',
      },
    });
  }

  /**
   * Update yard location
   */
  static async updateYardLocation(params: {
    locationId: string;
    locationName?: string;
    capacity?: number;
    isActive?: boolean;
  }) {
    const data: any = {};

    if (params.locationName) data.locationName = params.locationName;
    if (params.capacity !== undefined) data.capacity = params.capacity;
    if (params.isActive !== undefined) data.isActive = params.isActive;

    return prisma.yardLocation.update({
      where: { id: params.locationId },
      data,
    });
  }

  /**
   * Get available yard locations
   */
  static async getAvailableLocations(params: {
    warehouseId?: string;
    locationType?: YardLocationType;
    requiredCapacity?: number;
  }) {
    const where: any = {
      isActive: true,
      isOccupied: false,
    };

    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.locationType) where.locationType = params.locationType;

    if (params.requiredCapacity) {
      where.capacity = {
        gte: params.requiredCapacity,
      };
    }

    return prisma.yardLocation.findMany({
      where,
      orderBy: {
        locationCode: 'asc',
      },
    });
  }

  /**
   * Get yard utilization metrics
   */
  static async getYardUtilization(params: {
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (params.warehouseId) where.warehouseId = params.warehouseId;

    // Get all locations
    const locations = await prisma.yardLocation.findMany({
      where,
    });

    const totalLocations = locations.length;
    const occupiedLocations = locations.filter(l => l.isOccupied).length;
    const availableLocations = totalLocations - occupiedLocations;
    const utilizationRate = totalLocations > 0 ? (occupiedLocations / totalLocations) * 100 : 0;

    // Get appointments in period
    const appointmentWhere: any = {};
    if (params.warehouseId) appointmentWhere.warehouseId = params.warehouseId;

    if (params.startDate || params.endDate) {
      appointmentWhere.scheduledDate = {};
      if (params.startDate) appointmentWhere.scheduledDate.gte = params.startDate;
      if (params.endDate) appointmentWhere.scheduledDate.lte = params.endDate;
    }

    const appointments = await prisma.dockAppointment.findMany({
      where: appointmentWhere,
    });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;

    // Calculate average turnaround time
    const completedWithDuration = appointments.filter(a => a.actualDuration && a.actualDuration > 0);
    const avgTurnaround = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, a) => sum + (a.actualDuration || 0), 0) / completedWithDuration.length
      : 0;

    return {
      warehouseId: params.warehouseId,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalLocations,
      occupiedLocations,
      availableLocations,
      utilizationRate: utilizationRate.toFixed(2) + '%',
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) + '%' : '0%',
      averageTurnaroundHours: avgTurnaround.toFixed(2),
    };
  }

  /**
   * Get dock schedule for specific date
   */
  static async getDockSchedule(params: {
    warehouseId?: string;
    date: Date;
  }) {
    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.dockAppointment.findMany({
      where: {
        warehouseId: params.warehouseId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        yardLocation: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    // Group by hour
    const schedule: Record<string, any[]> = {};

    for (const appointment of appointments) {
      const hour = appointment.scheduledStart.getHours();
      const key = `${hour.toString().padStart(2, '0')}:00`;

      if (!schedule[key]) {
        schedule[key] = [];
      }

      schedule[key].push({
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        appointmentType: appointment.appointmentType,
        carrierName: appointment.carrierName,
        scheduledStart: appointment.scheduledStart,
        scheduledEnd: appointment.scheduledEnd,
        duration: appointment.duration,
        status: appointment.status,
        yardLocation: appointment.yardLocation?.locationCode,
      });
    }

    return {
      date: params.date,
      warehouseId: params.warehouseId,
      totalAppointments: appointments.length,
      schedule,
    };
  }

  /**
   * Get carrier performance metrics
   */
  static async getCarrierPerformance(params: {
    carrierName: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      carrierName: params.carrierName,
    };

    if (params.startDate || params.endDate) {
      where.scheduledDate = {};
      if (params.startDate) where.scheduledDate.gte = params.startDate;
      if (params.endDate) where.scheduledDate.lte = params.endDate;
    }

    const appointments = await prisma.dockAppointment.findMany({
      where,
    });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
    const lateArrivals = appointments.filter(a => 
      a.actualArrival && a.scheduledStart && a.actualArrival > a.scheduledStart
    ).length;

    // Calculate on-time rate
    const onTimeRate = totalAppointments > 0 
      ? ((totalAppointments - lateArrivals) / totalAppointments) * 100 
      : 100;

    // Calculate average delay
    const delays = appointments
      .filter(a => a.actualArrival && a.scheduledStart && a.actualArrival > a.scheduledStart)
      .map(a => (a.actualArrival!.getTime() - a.scheduledStart.getTime()) / (1000 * 60)); // minutes

    const avgDelay = delays.length > 0
      ? delays.reduce((sum, d) => sum + d, 0) / delays.length
      : 0;

    return {
      carrierName: params.carrierName,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalAppointments,
      completedAppointments: completedAppointments.length,
      lateArrivals,
      onTimeRate: onTimeRate.toFixed(2) + '%',
      averageDelayMinutes: avgDelay.toFixed(0),
    };
  }

  /**
   * Get gate activity log
   */
  static async getGateActivity(params: {
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
    entryType?: 'ENTRY' | 'EXIT';
  }) {
    const where: any = {};

    if (params.entryType) where.entryType = params.entryType;

    if (params.startDate || params.endDate) {
      where.entryTime = {};
      if (params.startDate) where.entryTime.gte = params.startDate;
      if (params.endDate) where.entryTime.lte = params.endDate;
    }

    const entries = await prisma.gateEntry.findMany({
      where,
      include: {
        appointment: true,
      },
      orderBy: {
        entryTime: 'desc',
      },
    });

    return entries;
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private static async generateAppointmentNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const count = await prisma.dockAppointment.count({
      where: {
        organizationId,
        scheduledDate: {
          gte: startOfDay,
        },
      },
    });

    return `APPT-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}
