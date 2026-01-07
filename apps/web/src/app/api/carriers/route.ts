import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const carrierSchema = z.object({
  name: z.string().min(1, "Carrier name is required"),
  code: z.string().min(1, "Carrier code is required"),
  type: z.enum(["PARCEL", "LTL", "FTL", "COURIER", "POSTAL", "OTHER"]),
  apiProvider: z
    .enum(["FEDEX", "UPS", "USPS", "DHL", "CUSTOM", "NONE"])
    .optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accountNumber: z.string().optional(),
  meterNumber: z.string().optional(),
  serviceLevel: z.string().optional(),
  transitDays: z.number().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  supportedServices: z.array(z.string()).optional(),
  weightLimit: z.number().optional(),
  costPerKg: z.number().optional(),
  costPerMile: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/carriers
 * List all carriers
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const apiProvider = searchParams.get("apiProvider");

    const carriers = await prisma.carrier.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(type && { type: type as any }),
        ...(isActive !== null && { isActive: isActive === "true" }),
        ...(apiProvider && { apiProvider: apiProvider as any }),
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            shipments: true,
          },
        },
      },
    });

    return NextResponse.json(carriers);
  } catch (error: any) {
    console.error("Error fetching carriers:", error);
    return NextResponse.json(
      { error: "Failed to fetch carriers" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/carriers
 * Create a new carrier
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = carrierSchema.parse(body);

    // Check if carrier code already exists in organization
    const existingCarrier = await prisma.carrier.findFirst({
      where: {
        organizationId: session.user.organizationId,
        code: validatedData.code,
      },
    });

    if (existingCarrier) {
      return NextResponse.json(
        { error: "Carrier code already exists in your organization" },
        { status: 400 },
      );
    }

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.carrier.updateMany({
        where: {
          organizationId: session.user.organizationId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create carrier
    const carrier = await prisma.carrier.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CARRIER_CREATED",
        entityType: "Carrier",
        entityId: carrier.id,
        details: {
          carrierName: carrier.name,
          carrierCode: carrier.code,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(carrier, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating carrier:", error);
    return NextResponse.json(
      { error: "Failed to create carrier" },
      { status: 500 },
    );
  }
}
