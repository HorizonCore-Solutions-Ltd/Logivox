export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating/updating locations
const createLocationSchema = z.object({
  locationCode: z.string().min(1, "Location code is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    "WAREHOUSE",
    "ZONE",
    "AISLE",
    "RACK",
    "SHELF",
    "BIN",
    "STAGING",
    "SHIPPING",
    "RECEIVING",
    "QUARANTINE",
  ]),
  parentId: z.string().optional(),
  warehouseId: z.string().optional(),
  zoneId: z.string().optional(),
  aisleId: z.string().optional(),
  rackId: z.string().optional(),
  shelfId: z.string().optional(),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  capacity: z.number().optional(),
  maxWeight: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isActive: z.boolean().optional(),
  isPickable: z.boolean().optional(),
  isPutaway: z.boolean().optional(),
  temperature: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/locations - List locations with filters and hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");
    const parentId = searchParams.get("parentId");
    const warehouseId = searchParams.get("warehouseId");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {
      organizationId: membership.organizationId,
    };

    if (type) where.type = type;
    if (parentId) where.parentId = parentId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { locationCode: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.location.count({ where });

    // Get locations with pagination
    const locations = await prisma.location.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parent: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            children: true,
            transfersFrom: true,
            transfersTo: true,
            adjustments: true,
          },
        },
      },
      orderBy: { locationCode: "asc" },
    });

    return NextResponse.json({
      locations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);

    // Check if location code already exists
    const existing = await prisma.location.findFirst({
      where: {
        organizationId: membership.organizationId,
        locationCode: validatedData.locationCode,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Location code already exists" },
        { status: 400 }
      );
    }

    // If barcode provided, check uniqueness
    if (validatedData.barcode) {
      const barcodeExists = await prisma.location.findUnique({
        where: { barcode: validatedData.barcode },
      });

      if (barcodeExists) {
        return NextResponse.json(
          { error: "Barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Create location
    const location = await prisma.location.create({
      data: {
        organizationId: membership.organizationId,
        ...validatedData,
      },
      include: {
        parent: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "LOCATION_CREATED",
        entityType: "LOCATION",
        entityId: location.id,
        metadata: {
          locationCode: location.locationCode,
          name: location.name,
          type: location.type,
        },
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    console.error("Error creating location:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create location" },
      { status: 500 }
    );
  }
}
