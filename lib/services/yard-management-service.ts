/**
 * Yard Management Service
 * Comprehensive yard and dock management
 * Handles dock scheduling, gate security, trailer tracking,
 * appointment management, and yard optimization
 */

import {
  PrismaClient,
  YardStatus,
  AppointmentStatus,
  Prisma,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateAppointmentRequest {
  carrierName: string;
  driverName: string;
  driverPhone?: string;
  vehicleNumber: string;
  trailerNumber?: string;
  appointmentType: "INBOUND" | "OUTBOUND" | "LIVE_LOAD" | "LIVE_UNLOAD";
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration?: number; // minutes
  poNumber?: string;
  soNumber?: string;
  notes?: string;
}

export interface GateEntry {
  appointmentId?: string;
  carrierName: string;
  driverName: string;
  vehicleNumber: string;
  trailerNumber?: string;
  gateInTime: Date;
  gateOutTime?: Date;
  dockAssignment?: string;
  yardLocation?: string;
  securityCheckPassed: boolean;
  notes?: string;
}

export interface YardMetrics {
  totalAppointments: number;
  activeTrailers: number;
  availableDocks: number;
  utilizedDocks: number;
  dockUtilization: number; // percentage
  averageTurnaroundTime: number; // minutes
  onTimePerformance: number; // percentage
  appointmentsByType: Array<{
    type: string;
    count: number;
  }>;
  dockPerformance: Array<{
    dockId: string;
    dockName: string;
    totalAppointments: number;
    avgTurnaroundTime: number;
    utilization: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    carrierName: string;
    dockName?: string;
    timestamp: Date;
    status: string;
  }>;
}

export interface TrailerTracking {
  trailerId: string;
  trailerNumber: string;
  status: YardStatus;
  location: string;
  carrierName: string;
  appointmentId?: string;
  gateInTime?: Date;
  dockAssignedTime?: Date;
  dockCompletedTime?: Date;
  gateOutTime?: Date;
  totalYardTime?: number; // minutes
  notes?: string;
}

/**
 * Yard Management Service Class
 */
export class YardManagementService {
  /**
   * Create dock appointment
   */
  async createAppointment(
    organizationId: string,
    userId: string,
    request: CreateAppointmentRequest,
  ): Promise<any> {
    // Check dock availability
    const availableDock = await this.findAvailableDock(
      organizationId,
      request.appointmentType,
      request.scheduledDate,
      request.scheduledTime,
      request.estimatedDuration || 60,
    );

    if (!availableDock) {
      throw new Error("No dock available at requested time");
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        organizationId,
        carrierName: request.carrierName,
        driverName: request.driverName,
        driverPhone: request.driverPhone,
        vehicleNumber: request.vehicleNumber,
        trailerNumber: request.trailerNumber,
        appointmentType: request.appointmentType,
        scheduledDate: request.scheduledDate,
        scheduledTime: request.scheduledTime,
        estimatedDuration: request.estimatedDuration || 60,
        dockId: availableDock.id,
        poNumber: request.poNumber,
        soNumber: request.soNumber,
        status: "SCHEDULED",
        notes: request.notes,
        createdById: userId,
      },
      include: {
        dock: true,
      },
    });

    return appointment;
  }

  /**
   * Find available dock
   */
  private async findAvailableDock(
    organizationId: string,
    type: string,
    date: Date,
    time: string,
    duration: number,
  ): Promise<any | null> {
    // Get all docks suitable for type
    const docks = await prisma.dock.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(type.includes("INBOUND") && { supportsInbound: true }),
        ...(type.includes("OUTBOUND") && { supportsOutbound: true }),
      },
    });

    // Check each dock for availability
    for (const dock of docks) {
      const isAvailable = await this.isDockAvailable(
        dock.id,
        date,
        time,
        duration,
      );
      if (isAvailable) {
        return dock;
      }
    }

    return null;
  }

  /**
   * Check if dock is available
   */
  private async isDockAvailable(
    dockId: string,
    date: Date,
    time: string,
    duration: number,
  ): Promise<boolean> {
    // Parse time
    const [hours, minutes] = time.split(":").map(Number);
    const requestedStart = new Date(date);
    requestedStart.setHours(hours, minutes, 0, 0);

    const requestedEnd = new Date(requestedStart);
    requestedEnd.setMinutes(requestedEnd.getMinutes() + duration);

    // Get existing appointments for this dock
    const appointments = await prisma.appointment.findMany({
      where: {
        dockId,
        scheduledDate: date,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    });

    // Check for conflicts
    for (const appt of appointments) {
      const [apptHours, apptMinutes] = appt.scheduledTime
        .split(":")
        .map(Number);
      const apptStart = new Date(appt.scheduledDate);
      apptStart.setHours(apptHours, apptMinutes, 0, 0);

      const apptEnd = new Date(apptStart);
      apptEnd.setMinutes(apptEnd.getMinutes() + appt.estimatedDuration);

      // Check overlap
      if (requestedStart < apptEnd && requestedEnd > apptStart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gate check-in
   */
  async gateCheckIn(
    organizationId: string,
    userId: string,
    data: GateEntry,
  ): Promise<any> {
    let appointment = null;

    // Find appointment if provided
    if (data.appointmentId) {
      appointment = await prisma.appointment.findFirst({
        where: {
          id: data.appointmentId,
          organizationId,
        },
      });

      if (appointment) {
        // Update appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "CHECKED_IN",
            actualArrivalTime: data.gateInTime,
          },
        });
      }
    }

    // Create gate entry
    const entry = await prisma.gateEntry.create({
      data: {
        organizationId,
        appointmentId: data.appointmentId,
        carrierName: data.carrierName,
        driverName: data.driverName,
        vehicleNumber: data.vehicleNumber,
        trailerNumber: data.trailerNumber,
        gateInTime: data.gateInTime,
        securityCheckPassed: data.securityCheckPassed,
        notes: data.notes,
        createdById: userId,
      },
      include: {
        appointment: {
          include: {
            dock: true,
          },
        },
      },
    });

    // Create trailer tracking
    if (data.trailerNumber) {
      await prisma.trailer.upsert({
        where: {
          organizationId_trailerNumber: {
            organizationId,
            trailerNumber: data.trailerNumber,
          },
        },
        create: {
          organizationId,
          trailerNumber: data.trailerNumber,
          carrierName: data.carrierName,
          status: "AT_GATE",
          currentLocation: "Gate",
          gateInTime: data.gateInTime,
        },
        update: {
          status: "AT_GATE",
          currentLocation: "Gate",
          gateInTime: data.gateInTime,
        },
      });
    }

    return entry;
  }

  /**
   * Gate check-out
   */
  async gateCheckOut(
    organizationId: string,
    gateEntryId: string,
    userId: string,
  ): Promise<any> {
    const entry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId,
      },
      include: {
        appointment: true,
      },
    });

    if (!entry) {
      throw new Error("Gate entry not found");
    }

    const gateOutTime = new Date();
    const totalTime =
      (gateOutTime.getTime() - entry.gateInTime.getTime()) / (1000 * 60);

    // Update gate entry
    const updatedEntry = await prisma.gateEntry.update({
      where: { id: gateEntryId },
      data: {
        gateOutTime,
        totalYardTime: totalTime,
      },
    });

    // Update appointment
    if (entry.appointmentId) {
      await prisma.appointment.update({
        where: { id: entry.appointmentId },
        data: {
          status: "COMPLETED",
          actualDepartureTime: gateOutTime,
        },
      });
    }

    // Update trailer
    if (entry.trailerNumber) {
      await prisma.trailer.updateMany({
        where: {
          organizationId,
          trailerNumber: entry.trailerNumber,
        },
        data: {
          status: "DEPARTED",
          gateOutTime,
        },
      });
    }

    return updatedEntry;
  }

  /**
   * Assign trailer to dock
   */
  async assignTrailerToDock(
    organizationId: string,
    trailerNumber: string,
    dockId: string,
    userId: string,
  ): Promise<any> {
    // Get dock
    const dock = await prisma.dock.findFirst({
      where: {
        id: dockId,
        organizationId,
      },
    });

    if (!dock) {
      throw new Error("Dock not found");
    }

    // Update trailer
    const trailer = await prisma.trailer.updateMany({
      where: {
        organizationId,
        trailerNumber,
      },
      data: {
        status: "AT_DOCK",
        currentLocation: dock.name,
        dockId,
        dockAssignedTime: new Date(),
      },
    });

    return trailer;
  }

  /**
   * Move trailer to yard
   */
  async moveTrailerToYard(
    organizationId: string,
    trailerNumber: string,
    yardLocation: string,
  ): Promise<any> {
    return await prisma.trailer.updateMany({
      where: {
        organizationId,
        trailerNumber,
      },
      data: {
        status: "IN_YARD",
        currentLocation: yardLocation,
        dockId: null,
      },
    });
  }

  /**
   * Track trailer
   */
  async trackTrailer(
    organizationId: string,
    trailerNumber: string,
  ): Promise<TrailerTracking> {
    const trailer = await prisma.trailer.findFirst({
      where: {
        organizationId,
        trailerNumber,
      },
      include: {
        appointment: true,
      },
    });

    if (!trailer) {
      throw new Error("Trailer not found");
    }

    let totalYardTime = undefined;
    if (trailer.gateInTime) {
      const endTime = trailer.gateOutTime || new Date();
      totalYardTime =
        (endTime.getTime() - trailer.gateInTime.getTime()) / (1000 * 60);
    }

    return {
      trailerId: trailer.id,
      trailerNumber: trailer.trailerNumber,
      status: trailer.status as YardStatus,
      location: trailer.currentLocation || "Unknown",
      carrierName: trailer.carrierName,
      appointmentId: trailer.appointmentId || undefined,
      gateInTime: trailer.gateInTime || undefined,
      dockAssignedTime: trailer.dockAssignedTime || undefined,
      dockCompletedTime: trailer.dockCompletedTime || undefined,
      gateOutTime: trailer.gateOutTime || undefined,
      totalYardTime,
      notes: trailer.notes || undefined,
    };
  }

  /**
   * Get yard metrics
   */
  async getYardMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<YardMetrics> {
    const dateFilter: any = { organizationId };

    if (startDate || endDate) {
      dateFilter.scheduledDate = {};
      if (startDate) dateFilter.scheduledDate.gte = startDate;
      if (endDate) dateFilter.scheduledDate.lte = endDate;
    }

    // Total appointments
    const totalAppointments = await prisma.appointment.count({
      where: dateFilter,
    });

    // Active trailers
    const activeTrailers = await prisma.trailer.count({
      where: {
        organizationId,
        status: { in: ["AT_GATE", "AT_DOCK", "IN_YARD"] },
      },
    });

    // Dock statistics
    const docks = await prisma.dock.findMany({
      where: { organizationId },
    });

    const totalDocks = docks.length;
    const activeDocks = await prisma.trailer.count({
      where: {
        organizationId,
        status: "AT_DOCK",
        dockId: { not: null },
      },
    });

    const availableDocks = totalDocks - activeDocks;
    const dockUtilization =
      totalDocks > 0 ? (activeDocks / totalDocks) * 100 : 0;

    // Appointments
    const appointments = await prisma.appointment.findMany({
      where: dateFilter,
      include: {
        dock: true,
      },
    });

    // Average turnaround time
    const completedAppts = appointments.filter(
      (a) =>
        a.status === "COMPLETED" &&
        a.actualArrivalTime &&
        a.actualDepartureTime,
    );

    const totalTurnaround = completedAppts.reduce((sum, a) => {
      const arrival = a.actualArrivalTime!.getTime();
      const departure = a.actualDepartureTime!.getTime();
      return sum + (departure - arrival) / (1000 * 60);
    }, 0);

    const averageTurnaroundTime =
      completedAppts.length > 0 ? totalTurnaround / completedAppts.length : 0;

    // On-time performance
    const scheduledAppts = appointments.filter((a) => a.actualArrivalTime);
    const onTimeAppts = scheduledAppts.filter((a) => {
      const [hours, minutes] = a.scheduledTime.split(":").map(Number);
      const scheduled = new Date(a.scheduledDate);
      scheduled.setHours(hours, minutes, 0, 0);

      const actual = a.actualArrivalTime!;
      const diffMinutes =
        (actual.getTime() - scheduled.getTime()) / (1000 * 60);

      return Math.abs(diffMinutes) <= 15; // Within 15 minutes
    });

    const onTimePerformance =
      scheduledAppts.length > 0
        ? (onTimeAppts.length / scheduledAppts.length) * 100
        : 0;

    // Appointments by type
    const typeGroups = appointments.reduce((acc: any, appt) => {
      const type = appt.appointmentType || "OTHER";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const appointmentsByType = Object.entries(typeGroups).map(
      ([type, count]) => ({
        type,
        count: count as number,
      }),
    );

    // Dock performance
    const dockPerformance = docks.map((dock) => {
      const dockAppts = appointments.filter((a) => a.dockId === dock.id);
      const dockCompleted = dockAppts.filter(
        (a) =>
          a.status === "COMPLETED" &&
          a.actualArrivalTime &&
          a.actualDepartureTime,
      );

      const dockTurnaround = dockCompleted.reduce((sum, a) => {
        const arrival = a.actualArrivalTime!.getTime();
        const departure = a.actualDepartureTime!.getTime();
        return sum + (departure - arrival) / (1000 * 60);
      }, 0);

      const avgTurnaroundTime =
        dockCompleted.length > 0 ? dockTurnaround / dockCompleted.length : 0;

      return {
        dockId: dock.id,
        dockName: dock.name,
        totalAppointments: dockAppts.length,
        avgTurnaroundTime,
        utilization: 75, // Placeholder
      };
    });

    // Recent activity
    const recentGateEntries = await prisma.gateEntry.findMany({
      where: { organizationId },
      orderBy: { gateInTime: "desc" },
      take: 5,
      include: {
        appointment: {
          include: {
            dock: true,
          },
        },
      },
    });

    const recentActivity = recentGateEntries.map((entry) => ({
      id: entry.id,
      type: entry.gateOutTime ? "GATE_OUT" : "GATE_IN",
      carrierName: entry.carrierName,
      dockName: entry.appointment?.dock?.name,
      timestamp: entry.gateOutTime || entry.gateInTime,
      status: entry.gateOutTime ? "DEPARTED" : "ARRIVED",
    }));

    return {
      totalAppointments,
      activeTrailers,
      availableDocks,
      utilizedDocks: activeDocks,
      dockUtilization,
      averageTurnaroundTime,
      onTimePerformance,
      appointmentsByType,
      dockPerformance,
      recentActivity,
    };
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(
    appointmentId: string,
    organizationId: string,
  ): Promise<any> {
    return await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        organizationId,
      },
      include: {
        dock: true,
        createdBy: true,
      },
    });
  }

  /**
   * List appointments
   */
  async listAppointments(
    organizationId: string,
    filters: {
      status?: AppointmentStatus;
      type?: string;
      date?: Date;
      dockId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    appointments: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.appointmentType = filters.type;
    if (filters.date) where.scheduledDate = filters.date;
    if (filters.dockId) where.dockId = filters.dockId;

    if (filters.search) {
      where.OR = [
        { carrierName: { contains: filters.search, mode: "insensitive" } },
        { driverName: { contains: filters.search, mode: "insensitive" } },
        { vehicleNumber: { contains: filters.search, mode: "insensitive" } },
        { trailerNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          dock: true,
        },
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      appointments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    organizationId: string,
    reason: string,
  ): Promise<any> {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        organizationId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "COMPLETED") {
      throw new Error("Cannot cancel completed appointment");
    }

    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        notes: `Cancelled: ${reason}`,
      },
    });
  }

  /**
   * Get all trailers in yard
   */
  async getAllTrailers(organizationId: string): Promise<TrailerTracking[]> {
    const trailers = await prisma.trailer.findMany({
      where: {
        organizationId,
        status: { in: ["AT_GATE", "AT_DOCK", "IN_YARD"] },
      },
      include: {
        appointment: true,
      },
    });

    return trailers.map((trailer) => {
      let totalYardTime = undefined;
      if (trailer.gateInTime) {
        const endTime = trailer.gateOutTime || new Date();
        totalYardTime =
          (endTime.getTime() - trailer.gateInTime.getTime()) / (1000 * 60);
      }

      return {
        trailerId: trailer.id,
        trailerNumber: trailer.trailerNumber,
        status: trailer.status as YardStatus,
        location: trailer.currentLocation || "Unknown",
        carrierName: trailer.carrierName,
        appointmentId: trailer.appointmentId || undefined,
        gateInTime: trailer.gateInTime || undefined,
        dockAssignedTime: trailer.dockAssignedTime || undefined,
        dockCompletedTime: trailer.dockCompletedTime || undefined,
        gateOutTime: trailer.gateOutTime || undefined,
        totalYardTime,
        notes: trailer.notes || undefined,
      };
    });
  }
}

export default YardManagementService;
