/**
 * Labor Management Service
 *
 * Simplified labor management based on actual schema:
 * - TimeEntry model (employeeId, startTime, endTime, duration)
 * - ProductivityRecord model (employeeId, tasksCompleted, etc)
 * - Employee model (not User)
 */

import { prisma } from "@/lib/prisma";
import { TimeEntryType, TimeEntryStatus } from "@prisma/client";

export class LaborManagementService {
  /**
   * Clock in - create time entry
   */
  static async clockIn(params: {
    employeeId: string;
    organizationId: string;
    warehouseId?: string;
    zoneId?: string;
    entryType?: TimeEntryType;
  }) {
    // Check if already clocked in
    const active = await prisma.timeEntry.findFirst({
      where: {
        employeeId: params.employeeId,
        endTime: null,
      },
    });

    if (active) {
      throw new Error("Employee already clocked in");
    }

    return prisma.timeEntry.create({
      data: {
        organizationId: params.organizationId,
        employeeId: params.employeeId,
        warehouseId: params.warehouseId,
        zoneId: params.zoneId,
        startTime: new Date(),
        entryType: params.entryType || "CLOCK_IN_OUT",
        status: TimeEntryStatus.PENDING,
      },
      include: {
        employee: true,
      },
    });
  }

  /**
   * Clock out - end time entry
   */
  static async clockOut(params: {
    employeeId: string;
    breakDuration?: number;
    notes?: string;
  }) {
    const entry = await prisma.timeEntry.findFirst({
      where: {
        employeeId: params.employeeId,
        endTime: null,
      },
    });

    if (!entry) {
      throw new Error("No active time entry");
    }

    const endTime = new Date();
    const durationHours =
      (endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60);
    const breakHours = params.breakDuration || 0;
    const netHours = durationHours - breakHours;

    // Calculate pay
    const hourlyRate = Number(entry.hourlyRate || 0);
    const payMultiplier = entry.payMultiplier || 1.0;
    const totalPay = netHours * hourlyRate * payMultiplier;

    return prisma.timeEntry.update({
      where: { id: entry.id },
      data: {
        endTime,
        duration: netHours,
        breakDuration: breakHours,
        totalPay,
        notes: params.notes,
      },
    });
  }

  /**
   * Get time entries
   */
  static async getTimeEntries(params: {
    employeeId?: string;
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    if (params.startDate || params.endDate) {
      where.startTime = {};
      if (params.startDate) where.startTime.gte = params.startDate;
      if (params.endDate) where.startTime.lte = params.endDate;
    }

    return prisma.timeEntry.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });
  }

  /**
   * Approve time entry
   */
  static async approveTimeEntry(timeEntryId: string, approvedBy: string) {
    return prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        status: TimeEntryStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Record productivity
   */
  static async recordProductivity(params: {
    employeeId: string;
    organizationId: string;
    recordDate: Date;
    tasksAssigned?: number;
    tasksCompleted?: number;
    metadata?: any;
  }) {
    return prisma.productivityRecord.create({
      data: {
        organizationId: params.organizationId,
        employeeId: params.employeeId,
        recordDate: params.recordDate,
        tasksAssigned: params.tasksAssigned || 0,
        tasksCompleted: params.tasksCompleted || 0,
        metadata: params.metadata,
      },
    });
  }

  /**
   * Get productivity metrics
   */
  static async getProductivityMetrics(params: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const records = await prisma.productivityRecord.findMany({
      where: {
        employeeId: params.employeeId,
        recordDate: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const tasksCompleted = records.reduce(
      (sum, r) => sum + r.tasksCompleted,
      0,
    );
    const tasksAssigned = records.reduce((sum, r) => sum + r.tasksAssigned, 0);
    const completionRate =
      tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;

    return {
      employeeId: params.employeeId,
      period: { startDate: params.startDate, endDate: params.endDate },
      tasksAssigned,
      tasksCompleted,
      completionRate: completionRate.toFixed(2),
    };
  }

  /**
   * Get warehouse metrics
   */
  static async getWarehouseMetrics(params: {
    warehouseId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const start =
      params.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = params.endDate || new Date();

    const entries = await prisma.timeEntry.findMany({
      where: {
        warehouseId: params.warehouseId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalHours = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalPay = entries.reduce(
      (sum, e) => sum + Number(e.totalPay || 0),
      0,
    );
    const workers = new Set(entries.map((e) => e.employeeId)).size;

    return {
      warehouseId: params.warehouseId,
      period: { startDate: start, endDate: end },
      totalWorkers: workers,
      totalHours: totalHours.toFixed(2),
      totalPay: totalPay.toFixed(2),
      averageHours: workers > 0 ? (totalHours / workers).toFixed(2) : 0,
      costPerHour: totalHours > 0 ? (totalPay / totalHours).toFixed(2) : 0,
    };
  }

  /**
   * Get active workers
   */
  static async getActiveWorkers(warehouseId: string) {
    const active = await prisma.timeEntry.findMany({
      where: {
        warehouseId,
        endTime: null,
      },
      include: {
        employee: true,
      },
    });

    return active.map((entry) => ({
      employeeId: entry.employeeId,
      employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`,
      startTime: entry.startTime,
      hoursWorked: (
        (new Date().getTime() - entry.startTime.getTime()) /
        (1000 * 60 * 60)
      ).toFixed(1),
    }));
  }

  /**
   * Calculate labor cost
   */
  static async calculateLaborCost(params: {
    warehouseId?: string;
    employeeId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const where: any = {
      startTime: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.employeeId) where.employeeId = params.employeeId;

    const entries = await prisma.timeEntry.findMany({ where });

    const totalCost = entries.reduce(
      (sum, e) => sum + Number(e.totalPay || 0),
      0,
    );
    const totalHours = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      totalCost: totalCost.toFixed(2),
      totalHours: totalHours.toFixed(2),
      averageRate: totalHours > 0 ? (totalCost / totalHours).toFixed(2) : 0,
    };
  }

  /**
   * Get attendance summary
   */
  static async getAttendanceSummary(params: {
    warehouseId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const entries = await prisma.timeEntry.findMany({
      where: {
        warehouseId: params.warehouseId,
        startTime: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      include: {
        employee: true,
      },
    });

    // Group by employee
    const attendance: Record<string, any> = {};

    for (const entry of entries) {
      const empId = entry.employeeId;

      if (!attendance[empId]) {
        attendance[empId] = {
          employeeId: empId,
          employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`,
          daysWorked: 0,
          totalHours: 0,
        };
      }

      attendance[empId].daysWorked++;
      attendance[empId].totalHours += entry.duration || 0;
    }

    // Add averages
    for (const empId in attendance) {
      const att = attendance[empId];
      att.averageHours =
        att.daysWorked > 0 ? (att.totalHours / att.daysWorked).toFixed(2) : 0;
    }

    return {
      period: { startDate: params.startDate, endDate: params.endDate },
      attendance: Object.values(attendance),
    };
  }
}
