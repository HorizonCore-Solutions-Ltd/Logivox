export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const clockInSchema = z.object({
  employeeId: z.string(),
  warehouseId: z.string(),
  notes: z.string().optional(),
});

const clockOutSchema = z.object({
  timeEntryId: z.string(),
  notes: z.string().optional(),
});

/**
 * GET /api/time-entries
 * List time entries
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const warehouseId = searchParams.get("warehouseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId,
        ...(employeeId && { employeeId }),
        ...(warehouseId && { warehouseId }),
        ...(startDate && { clockIn: { gte: new Date(startDate) } }),
        ...(endDate && { clockIn: { lte: new Date(endDate) } }),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: { clockIn: "desc" },
    });

    return NextResponse.json(timeEntries);
  } catch (error: any) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/time-entries/clock-in
 * Clock in employee
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();

    // Check if it's clock-in or clock-out
    if (body.timeEntryId) {
      // Clock out
      const { timeEntryId, notes } = clockOutSchema.parse(body);

      const timeEntry = await prisma.timeEntry.findFirst({
        where: {
          id: timeEntryId,
          organizationId,
          clockOut: null, // Ensure not already clocked out
        },
      });

      if (!timeEntry) {
        return NextResponse.json(
          { error: "Time entry not found or already clocked out" },
          { status: 404 },
        );
      }

      const clockOutTime = new Date();
      const hoursWorked =
        (clockOutTime.getTime() - timeEntry.clockIn.getTime()) /
        (1000 * 60 * 60);

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: timeEntryId },
        data: {
          clockOut: clockOutTime,
          hoursWorked,
          notes: notes || timeEntry.notes,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "TIME_ENTRY_CLOCK_OUT",
          entityType: "TimeEntry",
          entityId: updatedEntry.id,
          metadata: {
            employeeNumber: updatedEntry.employee.employeeNumber,
            hoursWorked,
          },
        },
      });

      return NextResponse.json(updatedEntry);
    } else {
      // Clock in
      const { employeeId, warehouseId, notes } = clockInSchema.parse(body);

      // Check if employee already has an active clock-in
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          employeeId,
          organizationId,
          clockOut: null,
        },
      });

      if (activeEntry) {
        return NextResponse.json(
          { error: "Employee already clocked in. Must clock out first." },
          { status: 400 },
        );
      }

      const timeEntry = await prisma.timeEntry.create({
        data: {
          organizationId,
          employeeId,
          warehouseId,
          clockIn: new Date(),
          notes,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
          warehouse: { select: { name: true, code: true } },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "TIME_ENTRY_CLOCK_IN",
          entityType: "TimeEntry",
          entityId: timeEntry.id,
          metadata: {
            employeeNumber: timeEntry.employee.employeeNumber,
          },
        },
      });

      return NextResponse.json(timeEntry, { status: 201 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error with time entry:", error);
    return NextResponse.json(
      { error: "Failed to process time entry" },
      { status: 500 },
    );
  }
}
