import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Shunter tasks are derived from: pending DockAppointments that need a trailer
// moved from a yard parking spot to a loading dock (or vice versa).

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [yardLocations, pendingAppointments, checkedInAppointments] =
      await Promise.all([
        prisma.yardLocation.findMany({
          where: { isActive: true },
          include: {
            appointments: {
              where: {
                status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] },
              },
              select: {
                id: true,
                appointmentNumber: true,
                appointmentType: true,
                status: true,
                scheduledStart: true,
                carrierName: true,
                vehicleNumber: true,
                trailerNumber: true,
              },
              take: 1,
            },
          },
          orderBy: { locationCode: "asc" },
        }),
        // Appointments in parking spots that need to move to a dock
        prisma.dockAppointment.findMany({
          where: {
            status: "CHECKED_IN",
            yardLocation: { locationType: "PARKING_SPOT" },
            scheduledStart: {
              lte: new Date(Date.now() + 60 * 60 * 1000), // starting within 1 hour
            },
          },
          include: {
            yardLocation: {
              select: { locationCode: true, locationName: true, locationType: true },
            },
          },
          orderBy: { scheduledStart: "asc" },
          take: 20,
        }),
        // Appointments completed — trailer needs to move out
        prisma.dockAppointment.findMany({
          where: {
            status: "COMPLETED",
            actualEnd: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            yardLocation: { isNot: undefined },
          },
          include: {
            yardLocation: {
              select: { locationCode: true, locationName: true, locationType: true },
            },
          },
          orderBy: { actualEnd: "desc" },
          take: 10,
        }),
      ]);

    // Build shunter tasks from pending appointments
    const pullTasks = pendingAppointments.map((apt) => ({
      id: `PULL-${apt.id}`,
      type: "PULL_TO_DOCK",
      priority:
        apt.scheduledStart < new Date(Date.now() + 15 * 60 * 1000)
          ? "URGENT"
          : "NORMAL",
      appointmentId: apt.id,
      appointmentNumber: apt.appointmentNumber,
      appointmentType: apt.appointmentType,
      carrier: apt.carrierName,
      vehicleNumber: apt.vehicleNumber,
      trailerNumber: apt.trailerNumber,
      fromLocation: apt.yardLocation?.locationCode ?? "YARD",
      toLocation: "DOCK",
      scheduledStart: apt.scheduledStart.toISOString(),
      status: "PENDING",
    }));

    const spotTasks = checkedInAppointments.map((apt) => ({
      id: `SPOT-${apt.id}`,
      type: "SPOT_TRAILER",
      priority: "NORMAL",
      appointmentId: apt.id,
      appointmentNumber: apt.appointmentNumber,
      appointmentType: apt.appointmentType,
      carrier: apt.carrierName,
      vehicleNumber: apt.vehicleNumber,
      trailerNumber: apt.trailerNumber,
      fromLocation: apt.yardLocation?.locationCode ?? "DOCK",
      toLocation: "PARKING",
      scheduledStart: apt.actualEnd?.toISOString() ?? new Date().toISOString(),
      status: "PENDING",
    }));

    const allTasks = [...pullTasks, ...spotTasks];

    return NextResponse.json({
      summary: {
        totalYardLocations: yardLocations.length,
        occupiedSpots: yardLocations.filter((l) => l.isOccupied).length,
        availableSpots: yardLocations.filter((l) => !l.isOccupied).length,
        pendingShunterTasks: allTasks.length,
        urgentTasks: allTasks.filter((t) => t.priority === "URGENT").length,
      },
      yardLocations: yardLocations.map((loc) => ({
        id: loc.id,
        locationCode: loc.locationCode,
        locationName: loc.locationName,
        locationType: loc.locationType,
        isOccupied: loc.isOccupied,
        capacity: loc.capacity,
        activeAppointment: loc.appointments[0] ?? null,
      })),
      shunterTasks: allTasks,
    });
  } catch (error) {
    console.error("Error fetching shunter data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, taskType, fromLocation, toLocation, assignedTo } =
      body;

    if (!appointmentId || !taskType) {
      return NextResponse.json(
        { error: "appointmentId and taskType are required" },
        { status: 400 },
      );
    }

    // Find a free parking spot if spotting a trailer
    let targetLocationId: string | null = null;
    if (taskType === "SPOT_TRAILER" && !toLocation) {
      const freeSpot = await prisma.yardLocation.findFirst({
        where: { locationType: "PARKING_SPOT", isOccupied: false, isActive: true },
        orderBy: { locationCode: "asc" },
      });
      targetLocationId = freeSpot?.id ?? null;

      if (freeSpot) {
        await prisma.yardLocation.update({
          where: { id: freeSpot.id },
          data: { isOccupied: true },
        });
      }
    }

    // Move appointment to target yard location
    if (targetLocationId) {
      await prisma.dockAppointment.update({
        where: { id: appointmentId },
        data: { yardLocationId: targetLocationId },
      });
    }

    return NextResponse.json({
      success: true,
      taskType,
      appointmentId,
      assignedTo: assignedTo ?? "unassigned",
      targetLocation: toLocation ?? targetLocationId ?? "TBD",
      dispatchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error dispatching shunter:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
