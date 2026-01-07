import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const gateEntrySchema = z.object({
  entryType: z.enum(["VEHICLE", "VISITOR", "EMPLOYEE", "DELIVERY", "OTHER"]),
  direction: z.enum(["IN", "OUT"]),
  vehicleType: z
    .enum(["TRUCK", "VAN", "CAR", "TRAILER", "CONTAINER", "FORKLIFT", "OTHER"])
    .optional(),
  vehicleNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  trailerNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverLicense: z.string().optional(),
  driverPhone: z.string().optional(),
  carrierName: z.string().optional(),
  appointmentId: z.string().optional(),
  securityPersonnelId: z.string().optional(),
  securityCheckPassed: z.boolean().default(false),
  securityCheckNotes: z.string().optional(),
  cargoInspected: z.boolean().default(false),
  cargoDetails: z.string().optional(),
  sealNumber: z.string().optional(),
  sealVerified: z.boolean().default(false),
  entryTime: z.string().datetime(),
  exitTime: z.string().datetime().optional(),
  parkingLocation: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
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

    // Filters
    const entryType = searchParams.get("entryType");
    const direction = searchParams.get("direction");
    const licensePlate = searchParams.get("licensePlate");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const securityPersonnelId = searchParams.get("securityPersonnelId");
    const securityCheckPassed = searchParams.get("securityCheckPassed");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (entryType) where.entryType = entryType;
    if (direction) where.direction = direction;
    if (licensePlate)
      where.licensePlate = { contains: licensePlate, mode: "insensitive" };
    if (securityPersonnelId) where.securityPersonnelId = securityPersonnelId;
    if (securityCheckPassed !== null)
      where.securityCheckPassed = securityCheckPassed === "true";

    if (startDate || endDate) {
      where.entryTime = {};
      if (startDate) where.entryTime.gte = new Date(startDate);
      if (endDate) where.entryTime.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.gateEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entryTime: "desc" },
        include: {
          securityPersonnel: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              badgeNumber: true,
            },
          },
          appointment: {
            select: {
              id: true,
              appointmentNumber: true,
              type: true,
              status: true,
            },
          },
        },
      }),
      prisma.gateEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching gate entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch gate entries" },
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
    const validatedData = gateEntrySchema.parse(body);

    // Generate entry number
    const lastEntry = await prisma.gateEntry.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      select: { entryNumber: true },
    });

    const lastNumber = lastEntry?.entryNumber
      ? parseInt(lastEntry.entryNumber.replace(/\D/g, ""))
      : 0;
    const entryNumber = `GE${String(lastNumber + 1).padStart(6, "0")}`;

    const entry = await prisma.gateEntry.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        entryNumber,
        entryTime: new Date(validatedData.entryTime),
        exitTime: validatedData.exitTime
          ? new Date(validatedData.exitTime)
          : null,
      },
      include: {
        securityPersonnel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentNumber: true,
            type: true,
            status: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CREATE",
        entity: "GATE_ENTRY",
        entityId: entry.id,
        description: `Created gate entry ${entryNumber} for ${validatedData.entryType}`,
        metadata: {
          licensePlate: validatedData.licensePlate,
          direction: validatedData.direction,
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating gate entry:", error);
    return NextResponse.json(
      { error: "Failed to create gate entry" },
      { status: 500 },
    );
  }
}
