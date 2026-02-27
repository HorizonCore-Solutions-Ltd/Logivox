import { z } from "zod";

import { prisma } from "@/lib/prisma";

const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const scopedEmployeeSchema = z.object({
  employeeId: z.string().min(1),
});

const clockPayload = z.object({
  employeeId: z.string().min(1),
  organizationId: z.string().min(1),
  warehouseId: z.string().min(1),
});

export class LaborManagementService {
  static async getProductivityMetrics(input: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const payload = scopedEmployeeSchema
      .merge(dateRangeSchema)
      .safeParse(input);

    if (!payload.success) {
      throw new Error("Invalid productivity metrics request");
    }

    const { employeeId, startDate, endDate } = payload.data;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    const productivityRecords = await prisma.productivityRecord.findMany({
      where: {
        employeeId,
        recordDate: { gte: startDate, lte: endDate },
      },
      orderBy: { recordDate: "asc" },
    });

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId,
        startTime: { gte: startDate, lte: endDate },
      },
    });

    const hoursWorked = timeEntries.reduce((acc, entry) => {
      if (typeof entry.duration === "number") {
        return acc + entry.duration;
      }
      const end = entry.endTime ?? new Date();
      const ms = end.getTime() - entry.startTime.getTime();
      const hours = ms / 3_600_000 - (entry.breakDuration ?? 0);
      return acc + Math.max(hours, 0);
    }, 0);

    const totals = productivityRecords.reduce(
      (acc, record) => {
        acc.tasksCompleted += record.tasksCompleted ?? 0;
        acc.linesProcessed += record.linesProcessed ?? 0;
        acc.unitsPicked += record.unitsPicked ?? 0;
        acc.unitsPacked += record.unitsPacked ?? 0;
        acc.hoursWorked += record.hoursWorked ?? 0;
        return acc;
      },
      {
        tasksCompleted: 0,
        linesProcessed: 0,
        unitsPicked: 0,
        unitsPacked: 0,
        hoursWorked: 0,
      },
    );

    return {
      employeeId,
      organizationId: employee.organizationId,
      range: { startDate, endDate },
      totals: {
        ...totals,
        hoursWorked: totals.hoursWorked || hoursWorked,
        unitsPerHour:
          totals.hoursWorked && totals.hoursWorked > 0
            ? Number(
                (totals.unitsPicked + totals.unitsPacked) / totals.hoursWorked,
              )
            : hoursWorked > 0
              ? Number((totals.unitsPicked + totals.unitsPacked) / hoursWorked)
              : null,
      },
      productivityRecords,
      timeEntries,
    };
  }

  static async calculateLaborCost(input: {
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const payload = dateRangeSchema.safeParse(input);

    if (!payload.success) {
      throw new Error("Invalid labor cost request");
    }

    const { warehouseId, startDate, endDate } = input;

    const entries = await prisma.timeEntry.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        employee: { select: { organizationId: true, hourlyRate: true } },
      },
    });

    const summary = entries.reduce(
      (acc, entry) => {
        const end = entry.endTime ?? new Date();
        const hours =
          entry.duration ??
          Math.max(
            0,
            (end.getTime() - entry.startTime.getTime()) / 3_600_000 -
              (entry.breakDuration ?? 0),
          );
        const rate = entry.hourlyRate ?? entry.employee.hourlyRate ?? 0;
        const multiplier = entry.payMultiplier ?? 1;
        const cost = Number(rate) * hours * multiplier;

        acc.totalCost += cost;
        acc.totalHours += hours;
        acc.entries += 1;
        return acc;
      },
      { totalCost: 0, totalHours: 0, entries: 0 },
    );

    return {
      warehouseId: warehouseId ?? null,
      range: { startDate, endDate },
      totals: {
        totalCost: Number(summary.totalCost.toFixed(2)),
        totalHours: Number(summary.totalHours.toFixed(2)),
        entries: summary.entries,
        averageCostPerHour:
          summary.totalHours > 0
            ? Number((summary.totalCost / summary.totalHours).toFixed(2))
            : null,
      },
      entries,
    };
  }

  static async getAttendance(input: {
    employeeId: string;
    month: number; // 1-12
    year: number;
  }) {
    const schema = z.object({
      employeeId: z.string().min(1),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2000).max(2100),
    });

    const payload = schema.safeParse(input);
    if (!payload.success) {
      throw new Error("Invalid attendance request");
    }

    const { employeeId, month, year } = payload.data;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        employeeId,
        startTime: { gte: startDate, lte: endDate },
        entryType: "CLOCK_IN_OUT",
      },
      orderBy: { startTime: "asc" },
    });

    // Group by date
    const byDate: Record<
      string,
      {
        date: string;
        clockIn: Date;
        clockOut: Date | null;
        hours: number | null;
      }
    > = {};

    for (const entry of entries) {
      const date = entry.startTime.toISOString().split("T")[0] as string;
      const hours =
        entry.duration ??
        (entry.endTime
          ? Math.max(
              0,
              (entry.endTime.getTime() - entry.startTime.getTime()) /
                3_600_000 -
                (entry.breakDuration ?? 0),
            )
          : null);

      if (!byDate[date]) {
        byDate[date] = {
          date,
          clockIn: entry.startTime,
          clockOut: entry.endTime ?? null,
          hours,
        };
      } else {
        if (entry.endTime) byDate[date].clockOut = entry.endTime;
        if (hours !== null) byDate[date].hours = hours;
      }
    }

    const days = Object.values(byDate);
    const daysPresent = days.filter(
      (d) => d.hours !== null && d.hours > 0,
    ).length;
    const totalHours = days.reduce((acc, d) => acc + (d.hours ?? 0), 0);

    return {
      employeeId,
      organizationId: employee.organizationId,
      period: { month, year },
      summary: {
        daysPresent,
        totalHours: Number(totalHours.toFixed(2)),
        averageHoursPerDay:
          daysPresent > 0 ? Number((totalHours / daysPresent).toFixed(2)) : 0,
      },
      days,
    };
  }

  static async clockIn(input: {
    employeeId: string;
    organizationId: string;
    warehouseId: string;
  }) {
    const payload = clockPayload.safeParse(input);

    if (!payload.success) {
      throw new Error("Invalid clock-in request");
    }

    const { employeeId, organizationId, warehouseId } = payload.data;

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true, hourlyRate: true },
    });

    if (!employee) {
      throw new Error("Employee not found in organization");
    }

    // Check for an existing open entry
    const openEntry = await prisma.timeEntry.findFirst({
      where: { employeeId, organizationId, endTime: null },
      orderBy: { startTime: "desc" },
    });

    if (openEntry) {
      throw new Error(
        `Employee is already clocked in (entry ${openEntry.id} since ${openEntry.startTime.toISOString()})`,
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        organizationId,
        employeeId,
        warehouseId,
        startTime: new Date(),
        entryType: "CLOCK_IN_OUT",
        status: "PENDING",
        hourlyRate: employee.hourlyRate,
        payMultiplier: 1.0,
      },
    });

    return {
      entryId: entry.id,
      employeeId,
      clockedInAt: entry.startTime,
      warehouseId,
    };
  }

  static async clockOut(input: { employeeId: string }) {
    const schema = z.object({ employeeId: z.string().min(1) });

    const payload = schema.safeParse(input);

    if (!payload.success) {
      throw new Error("Invalid clock-out request");
    }

    const { employeeId } = payload.data;

    const openEntry = await prisma.timeEntry.findFirst({
      where: { employeeId, endTime: null, entryType: "CLOCK_IN_OUT" },
      orderBy: { startTime: "desc" },
    });

    if (!openEntry) {
      throw new Error("No active clock-in found for this employee");
    }

    const now = new Date();
    const rawHours =
      (now.getTime() - openEntry.startTime.getTime()) / 3_600_000;
    const hours = Math.max(0, rawHours - (openEntry.breakDuration ?? 0));
    const rate = Number(openEntry.hourlyRate ?? 0);
    const multiplier = openEntry.payMultiplier ?? 1;
    const totalPay = rate * hours * multiplier;

    const updated = await prisma.timeEntry.update({
      where: { id: openEntry.id },
      data: {
        endTime: now,
        duration: Number(hours.toFixed(4)),
        totalPay: totalPay > 0 ? totalPay : undefined,
      },
    });

    return {
      entryId: updated.id,
      employeeId,
      clockedInAt: updated.startTime,
      clockedOutAt: updated.endTime,
      hoursWorked: Number(hours.toFixed(4)),
      totalPay: Number(totalPay.toFixed(2)),
    };
  }

  static async recordActivity(input: {
    employeeId: string;
    activityType: string;
    quantity?: number;
    duration?: number;
  }) {
    const schema = z.object({
      employeeId: z.string().min(1),
      activityType: z.string().min(1),
      quantity: z.number().nonnegative().optional(),
      duration: z.number().nonnegative().optional(),
    });

    const payload = schema.safeParse(input);

    if (!payload.success) {
      throw new Error("Invalid activity record request");
    }

    const { employeeId, activityType, quantity, duration } = payload.data;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, organizationId: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Upsert the daily productivity record for this employee
    const record = await prisma.productivityRecord.upsert({
      where: {
        employeeId_recordDate: {
          employeeId,
          recordDate: today,
        },
      },
      update: {
        ...(quantity && activityType === "PICK"
          ? { unitsPicked: { increment: quantity } }
          : {}),
        ...(quantity && activityType === "PACK"
          ? { unitsPacked: { increment: quantity } }
          : {}),
        ...(activityType === "TASK_COMPLETE"
          ? { tasksCompleted: { increment: 1 } }
          : {}),
        ...(activityType === "LINE_PROCESSED"
          ? { linesProcessed: { increment: 1 } }
          : {}),
        ...(duration ? { hoursWorked: { increment: duration / 60 } } : {}),
      },
      create: {
        organizationId: employee.organizationId,
        employeeId,
        recordDate: today,
        tasksCompleted: activityType === "TASK_COMPLETE" ? 1 : 0,
        linesProcessed: activityType === "LINE_PROCESSED" ? 1 : 0,
        unitsPicked: quantity && activityType === "PICK" ? quantity : 0,
        unitsPacked: quantity && activityType === "PACK" ? quantity : 0,
        hoursWorked: duration ? duration / 60 : 0,
      },
    });

    return {
      employeeId,
      organizationId: employee.organizationId,
      activityType,
      quantity,
      duration,
      recordDate: today,
      dailyRecord: record,
    };
  }
}
