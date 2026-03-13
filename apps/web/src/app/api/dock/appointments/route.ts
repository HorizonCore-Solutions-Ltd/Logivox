import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const appointmentSchema = z.object({
  appointmentType: z.enum([
    "INBOUND",
    "OUTBOUND",
    "CROSS_DOCK",
    "MAINTENANCE",
    "OTHER",
  ]),
  warehouseId: z.string().optional(),
  yardLocationId: z.string().optional(),
  scheduledDate: z.string().datetime(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  duration: z.number().positive(),
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleNumber: z.string().optional(),
  trailerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  referenceNumber: z.string().optional(),
  expectedPallets: z.number().int().positive().optional(),
  expectedWeight: z.number().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const appointmentType = searchParams.get("appointmentType");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const carrierName = searchParams.get("carrierName");
    const yardLocationId = searchParams.get("yardLocationId");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (appointmentType) where.appointmentType = appointmentType;
    if (status) where.status = status;
    if (carrierName)
      where.carrierName = { contains: carrierName, mode: "insensitive" };
    if (yardLocationId) where.yardLocationId = yardLocationId;

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const [appointments, total] = await Promise.all([
      prisma.dockAppointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledStart: "asc" },
        include: {
          yardLocation: {
            select: {
              id: true,
              locationCode: true,
              locationName: true,
              locationType: true,
            },
          },
          gateEntries: {
            select: {
              id: true,
              entryNumber: true,
              entryTime: true,
              exitTime: true,
              status: true,
            },
            take: 1,
            orderBy: { entryTime: "desc" },
          },
        },
      }),
      prisma.dockAppointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);

    // Generate appointment number
    const lastAppointment = await prisma.dockAppointment.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { appointmentNumber: "desc" },
      select: { appointmentNumber: true },
    });

    const lastNumber = lastAppointment?.appointmentNumber
      ? parseInt(lastAppointment.appointmentNumber.replace(/\D/g, ""))
      : 0;
    const appointmentNumber = `APPT${String(lastNumber + 1).padStart(6, "0")}`;

    // Check for dock conflicts if yardLocationId is provided
    if (validatedData.yardLocationId) {
      const conflicts = await prisma.dockAppointment.findMany({
        where: {
          organizationId: session.user.organizationId,
          yardLocationId: validatedData.yardLocationId,
          status: {
            not: "CANCELLED",
          },
          OR: [
            {
              AND: [
                {
                  scheduledStart: {
                    lte: new Date(validatedData.scheduledStart),
                  },
                },
                {
                  scheduledEnd: { gte: new Date(validatedData.scheduledStart) },
                },
              ],
            },
            {
              AND: [
                {
                  scheduledStart: { lte: new Date(validatedData.scheduledEnd) },
                },
                { scheduledEnd: { gte: new Date(validatedData.scheduledEnd) } },
              ],
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Dock conflict detected",
            message: "Another appointment is scheduled during this time slot",
            conflicts,
          },
          { status: 409 },
        );
      }
    }

    const appointment = await prisma.dockAppointment.create({
      data: {
        organizationId: session.user.organizationId,
        appointmentNumber,
        ...validatedData,
        scheduledDate: new Date(validatedData.scheduledDate),
        scheduledStart: new Date(validatedData.scheduledStart),
        scheduledEnd: new Date(validatedData.scheduledEnd),
        status: "SCHEDULED",
      },
      include: {
        yardLocation: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CREATE",
        entityType: "DOCK_APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          appointmentNumber: appointmentNumber,
          appointmentType: validatedData.appointmentType,
          scheduledStart: validatedData.scheduledStart,
          carrierName: validatedData.carrierName,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        appointment,
        message: "Dock appointment created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}
