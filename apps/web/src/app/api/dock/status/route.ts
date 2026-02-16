import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    // Get all dock locations with current appointments
    const dockLocations = await prisma.yardLocation.findMany({
      where: {
        ...where,
        locationType: {
          in: ["LOADING_DOCK", "UNLOADING_DOCK"],
        },
        isActive: true,
      },
      include: {
        appointments: {
          where: {
            status: {
              in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"],
            },
            scheduledEnd: {
              gte: new Date(),
            },
          },
          orderBy: {
            scheduledStart: "asc",
          },
          take: 1,
          include: {
            gateEntries: {
              select: {
                id: true,
                entryTime: true,
                vehicleNumber: true,
                driverName: true,
              },
              take: 1,
              orderBy: { entryTime: "desc" },
            },
          },
        },
      },
      orderBy: {
        locationCode: "asc",
      },
    });

    // Calculate dock statistics
    const totalDocks = dockLocations.length;
    const occupiedDocks = dockLocations.filter(
      (dock) => dock.appointments.length > 0,
    ).length;
    const availableDocks = totalDocks - occupiedDocks;

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await prisma.dockAppointment.count({
      where: {
        organizationId: session.user.organizationId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: "CANCELLED",
        },
      },
    });

    // Get in-progress count
    const inProgress = await prisma.dockAppointment.count({
      where: {
        organizationId: session.user.organizationId,
        status: "IN_PROGRESS",
      },
    });

    // Get overdue appointments (past scheduled end time but not completed)
    const now = new Date();
    const overdue = await prisma.dockAppointment.count({
      where: {
        organizationId: session.user.organizationId,
        scheduledEnd: {
          lt: now,
        },
        status: {
          in: ["CHECKED_IN", "IN_PROGRESS"],
        },
      },
    });

    // Calculate average dwell time for completed appointments today
    const completedToday = await prisma.dockAppointment.findMany({
      where: {
        organizationId: session.user.organizationId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: "COMPLETED",
        actualDuration: {
          not: null,
        },
      },
      select: {
        actualDuration: true,
      },
    });

    const avgDwellTime =
      completedToday.length > 0
        ? completedToday.reduce(
            (sum, apt) => sum + (apt.actualDuration || 0),
            0,
          ) / completedToday.length
        : 0;

    return NextResponse.json({
      dockLocations,
      statistics: {
        totalDocks,
        occupiedDocks,
        availableDocks,
        utilizationRate:
          totalDocks > 0 ? (occupiedDocks / totalDocks) * 100 : 0,
        todaysAppointments,
        inProgress,
        overdue,
        avgDwellTime: Math.round(avgDwellTime),
      },
    });
  } catch (error) {
    console.error("Error fetching dock status:", error);
    return NextResponse.json(
      { error: "Failed to fetch dock status" },
      { status: 500 },
    );
  }
}
