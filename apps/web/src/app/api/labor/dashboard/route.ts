/**
 * Labor Dashboard API
 * Returns real-time shift summary, worker statuses, throughput vs. standard metrics
 * Used by /dashboard/labor
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId") ?? undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Fetch all active/recent time entries for today (workers currently clocked in)
    const activeTimeEntries = await prisma.timeEntry.findMany({
      where: {
        startTime: { gte: today },
        endTime: null, // still clocked in
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            hourlyRate: true,
          },
        },
      },
    });

    // Fetch today's productivity records
    const productivityRecords = await prisma.productivityRecord.findMany({
      where: {
        recordDate: { gte: today },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    // Fetch shift assignments for today
    const shiftAssignments = await prisma.shiftAssignment.findMany({
      where: {
        assignedDate: { gte: today },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        shift: { select: { name: true, startTime: true, endTime: true } },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });

    // Compute summary metrics
    const totalWorkersScheduled = shiftAssignments.length;
    const totalWorkersClocked = activeTimeEntries.length;

    const totalUnitsPicked = productivityRecords.reduce(
      (s, r) => s + (r.unitsPicked ?? 0),
      0,
    );
    const totalUnitsPacked = productivityRecords.reduce(
      (s, r) => s + (r.unitsPacked ?? 0),
      0,
    );
    const totalLinesProcessed = productivityRecords.reduce(
      (s, r) => s + (r.linesProcessed ?? 0),
      0,
    );
    const totalHoursWorked = productivityRecords.reduce(
      (s, r) => s + (r.hoursWorked ?? 0),
      0,
    );

    const unitsPerHour =
      totalHoursWorked > 0
        ? +((totalUnitsPicked + totalUnitsPacked) / totalHoursWorked).toFixed(1)
        : 0;

    // Engineered standard: 120 units/hr — adjust per org later
    const STANDARD_UNITS_PER_HOUR = 120;
    const performanceToStandard =
      STANDARD_UNITS_PER_HOUR > 0
        ? +((unitsPerHour / STANDARD_UNITS_PER_HOUR) * 100).toFixed(1)
        : 0;

    // Build per-worker metrics for leaderboard
    const workerMap = new Map<string, any>();

    for (const entry of activeTimeEntries) {
      const emp = entry.employee;
      workerMap.set(emp.id, {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department ?? "General",
        position: emp.position ?? "Warehouse Associate",
        status: "ACTIVE",
        clockedInAt: entry.startTime.toISOString(),
        hoursToday: 0,
        unitsPicked: 0,
        unitsPacked: 0,
        linesProcessed: 0,
        unitsPerHour: 0,
        pts: 0,
      });
    }

    for (const rec of productivityRecords) {
      const emp = rec.employee;
      const existing = workerMap.get(emp.id) ?? {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department ?? "General",
        position: emp.position ?? "Warehouse Associate",
        status: "SCHEDULED",
        clockedInAt: null,
        hoursToday: 0,
        unitsPicked: 0,
        unitsPacked: 0,
        linesProcessed: 0,
        unitsPerHour: 0,
        pts: 0,
      };

      existing.hoursToday += rec.hoursWorked ?? 0;
      existing.unitsPicked += rec.unitsPicked ?? 0;
      existing.unitsPacked += rec.unitsPacked ?? 0;
      existing.linesProcessed += rec.linesProcessed ?? 0;

      const hours = existing.hoursToday;
      const units = existing.unitsPicked + existing.unitsPacked;
      existing.unitsPerHour = hours > 0 ? +(units / hours).toFixed(1) : 0;
      existing.pts = +(
        (existing.unitsPerHour / STANDARD_UNITS_PER_HOUR) *
        100
      ).toFixed(1);

      workerMap.set(emp.id, existing);
    }

    // Add scheduled workers not yet clocked in
    for (const sa of shiftAssignments) {
      const emp = sa.employee;
      if (!workerMap.has(emp.id)) {
        workerMap.set(emp.id, {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department ?? "General",
          position: "Warehouse Associate",
          status: "SCHEDULED",
          clockedInAt: null,
          hoursToday: 0,
          unitsPicked: 0,
          unitsPacked: 0,
          linesProcessed: 0,
          unitsPerHour: 0,
          pts: 0,
        });
      }
    }

    const workers = Array.from(workerMap.values()).sort(
      (a, b) => b.pts - a.pts,
    );

    // Departments summary
    const deptMap = new Map<string, { workers: number; pts: number }>();
    for (const w of workers) {
      const dept = w.department;
      const cur = deptMap.get(dept) ?? { workers: 0, pts: 0 };
      cur.workers++;
      cur.pts += w.pts;
      deptMap.set(dept, cur);
    }
    const departments = Array.from(deptMap.entries()).map(([name, d]) => ({
      name,
      workers: d.workers,
      avgPts: d.workers > 0 ? +(d.pts / d.workers).toFixed(1) : 0,
    }));

    return NextResponse.json({
      summary: {
        totalWorkersScheduled,
        totalWorkersClocked,
        totalUnitsPicked,
        totalUnitsPacked,
        totalLinesProcessed,
        totalHoursWorked: +totalHoursWorked.toFixed(1),
        unitsPerHour,
        performanceToStandard,
        standardUnitsPerHour: STANDARD_UNITS_PER_HOUR,
        timestamp: now.toISOString(),
      },
      workers,
      departments,
    });
  } catch (error) {
    console.error("Error fetching labor dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
