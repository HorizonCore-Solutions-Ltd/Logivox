import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const visitorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  visitorType: z.enum([
    "CONTRACTOR",
    "VENDOR",
    "CUSTOMER",
    "AUDITOR",
    "CANDIDATE",
    "GUEST",
    "OTHER",
  ]),
  purpose: z.string(),
  hostEmployeeId: z.string().optional(),
  hostName: z.string().optional(),
  hostDepartment: z.string().optional(),
  escortRequired: z.boolean().default(false),
  allowedAreas: z.array(z.string()).optional(),
  checkInTime: z.string().datetime(),
  expectedCheckOutTime: z.string().datetime().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  idPhotoUrl: z.string().optional(),
  securityPersonnelId: z.string().optional(),
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
    const status = searchParams.get("status");
    const visitorType = searchParams.get("visitorType");
    const search = searchParams.get("search");
    const date = searchParams.get("date");
    const checkedIn = searchParams.get("checkedIn");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (visitorType) where.visitorType = visitorType;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.checkInTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    if (checkedIn === "true") {
      where.checkInTime = { not: null };
      where.checkOutTime = null;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { badgeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInTime: "desc" },
        include: {
          securityPersonnel: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              badgeNumber: true,
            },
          },
        },
      }),
      prisma.visitor.count({ where }),
    ]);

    return NextResponse.json({
      data: visitors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
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

    // Get organization security settings
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { securitySettings: true },
    });

    const securitySettings = organization?.securitySettings as any;
    const visitorPolicy = securitySettings?.visitorPolicy;

    // Validate based on organization policy
    if (visitorPolicy?.walkInsAllowed === false) {
      return NextResponse.json(
        { error: "Walk-in visitors not allowed. Pre-registration required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = visitorSchema.parse(body);

    // Generate badge number
    const lastVisitor = await prisma.visitor.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      select: { badgeNumber: true },
    });

    const lastNumber = lastVisitor?.badgeNumber
      ? parseInt(lastVisitor.badgeNumber.replace(/\D/g, ""))
      : 0;
    const badgeNumber = `VIS${String(lastNumber + 1).padStart(6, "0")}`;

    const visitor = await prisma.visitor.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        badgeNumber,
        badgeIssued: true,
        status: "CHECKED_IN",
        checkInTime: new Date(validatedData.checkInTime),
        expectedCheckOutTime: validatedData.expectedCheckOutTime
          ? new Date(validatedData.expectedCheckOutTime)
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
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CREATE",
        entity: "VISITOR",
        entityId: visitor.id,
        description: `Checked in visitor ${visitor.firstName} ${visitor.lastName} with badge ${badgeNumber}`,
        metadata: {
          visitorType: validatedData.visitorType,
          purpose: validatedData.purpose,
        },
      },
    });

    return NextResponse.json(visitor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating visitor:", error);
    return NextResponse.json(
      { error: "Failed to create visitor" },
      { status: 500 },
    );
  }
}
