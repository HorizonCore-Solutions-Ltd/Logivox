export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for creating a cycle count
const createCycleCountSchema = z.object({
  type: z.enum(["SCHEDULED", "ADHOC", "FULL", "SPOT"]),
  scheduledDate: z.string().transform((val) => new Date(val)),
  locationId: z.string().optional(),
  categoryId: z.string().optional(),
  includeZeroQty: z.boolean().optional().default(false),
  assignedToId: z.string().optional(),
  requiresApproval: z.boolean().optional().default(true),
  autoAdjust: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

// GET /api/cycle-counts - List cycle counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const locationId = searchParams.get("locationId") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId: membership.organizationId,
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (locationId) where.locationId = locationId;
    if (search) {
      where.OR = [
        { countNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [cycleCounts, total] = await Promise.all([
      prisma.cycleCount.findMany({
        where,
        skip,
        take: limit,
        include: {
          location: {
            select: {
              id: true,
              locationCode: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { scheduledDate: "desc" },
      }),
      prisma.cycleCount.count({ where }),
    ]);

    return NextResponse.json({
      cycleCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching cycle counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle counts" },
      { status: 500 },
    );
  }
}

// POST /api/cycle-counts - Create a new cycle count
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = createCycleCountSchema.parse(body);

    // Validate location if provided
    if (data.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: data.locationId,
          organizationId: membership.organizationId,
        },
      });

      if (!location) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 },
        );
      }
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          organizationId: membership.organizationId,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }
    }

    // Generate count number: CC-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = (today.toISOString().split("T")[0] || "").replace(/-/g, "");
    const prefix = `CC-${dateStr}`;

    const lastCount = await prisma.cycleCount.findFirst({
      where: {
        organizationId: membership.organizationId,
        countNumber: { startsWith: prefix },
      },
      orderBy: { countNumber: "desc" },
    });

    let sequence = 1;
    if (lastCount) {
      const lastSeq = parseInt(
        lastCount.countNumber.split("-")[2] || "0" || "0",
      );
      sequence = lastSeq + 1;
    }

    const countNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    // Build where clause for inventory items to count
    const inventoryWhere: any = {
      organizationId: membership.organizationId,
      isActive: true,
    };

    if (data.locationId) {
      // For location-based counts, we'd need inventory location tracking
      // For now, just filter by warehouse/category
    }

    if (data.categoryId) {
      inventoryWhere.categoryId = data.categoryId;
    }

    if (!data.includeZeroQty) {
      inventoryWhere.quantity = { gt: 0 };
    }

    // Get inventory items to count
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: inventoryWhere,
      select: {
        id: true,
        quantity: true,
        costPrice: true,
      },
    });

    // Create cycle count with items
    const cycleCount = await prisma.cycleCount.create({
      data: {
        organizationId: membership.organizationId,
        countNumber,
        type: data.type,
        scheduledDate: data.scheduledDate,
        locationId: data.locationId,
        categoryId: data.categoryId,
        includeZeroQty: data.includeZeroQty,
        assignedToId: data.assignedToId,
        requiresApproval: data.requiresApproval,
        autoAdjust: data.autoAdjust,
        notes: data.notes,
        totalItems: inventoryItems.length,
        items: {
          create: inventoryItems.map((item: any) => ({
            inventoryId: item.id,
            expectedQty: item.quantity,
            unitCost: item.costPrice,
            locationId: data.locationId,
          })),
        },
      },
      include: {
        location: true,
        category: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "CYCLE_COUNT_CREATED",
        entityType: "CycleCount",
        entityId: cycleCount.id,
        metadata: {
          countNumber: cycleCount.countNumber,
          type: cycleCount.type,
          totalItems: cycleCount.totalItems,
        },
      },
    });

    return NextResponse.json(cycleCount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating cycle count:", error);
    return NextResponse.json(
      { error: "Failed to create cycle count" },
      { status: 500 },
    );
  }
}
