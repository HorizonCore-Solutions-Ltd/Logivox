export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createLotSchema = z.object({
  inventoryId: z.string(),
  lotNumber: z.string(),
  supplierLotNumber: z.string().optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
  initialQuantity: z.number().int().positive(),
  grnId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  supplierId: z.string().optional(),
  locationId: z.string().optional(),
  storageConditions: z.string().optional(),
  qcStatus: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]).optional(),
  qcNotes: z.string().optional(),
  certificateNumber: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

// GET /api/lots - List lots with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization membership" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const inventoryId = searchParams.get("inventoryId");
    const status = searchParams.get("status");
    const qcStatus = searchParams.get("qcStatus");
    const isExpired = searchParams.get("isExpired") === "true";
    const expiringInDays = searchParams.get("expiringInDays");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: membership.organizationId,
    };

    if (inventoryId) where.inventoryId = inventoryId;
    if (status) where.status = status;
    if (qcStatus) where.qcStatus = qcStatus;
    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: "insensitive" } },
        { supplierLotNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Expiry filters
    if (isExpired) {
      where.expiryDate = { lt: new Date() };
      where.status = "EXPIRED";
    }

    if (expiringInDays) {
      const daysAhead = parseInt(expiringInDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      where.expiryDate = {
        gte: new Date(),
        lte: futureDate,
      };
      where.status = { not: "EXPIRED" };
    }

    const [lots, totalCount] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              sku: true,
              name: true,
            },
          },
          location: {
            select: {
              locationCode: true,
              name: true,
            },
          },
          supplier: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ expiryDate: "asc" }, { receivedDate: "desc" }],
      }),
      prisma.lot.count({ where }),
    ]);

    return NextResponse.json({
      lots,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + lots.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching lots:", error);
    return NextResponse.json(
      { error: "Failed to fetch lots" },
      { status: 500 }
    );
  }
}

// POST /api/lots - Create new lot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createLotSchema.parse(body);

    // Validate inventory item exists
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: data.inventoryId,
        organizationId: membership.organizationId,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Check for duplicate lot number
    const existingLot = await prisma.lot.findFirst({
      where: {
        organizationId: membership.organizationId,
        lotNumber: data.lotNumber,
      },
    });

    if (existingLot) {
      return NextResponse.json(
        { error: "Lot number already exists" },
        { status: 400 }
      );
    }

    // Validate optional references
    if (data.grnId) {
      const grn = await prisma.goodsReceiptNote.findFirst({
        where: {
          id: data.grnId,
          organizationId: membership.organizationId,
        },
      });
      if (!grn) {
        return NextResponse.json(
          { error: "GRN not found" },
          { status: 404 }
        );
      }
    }

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
          { status: 404 }
        );
      }
    }

    // Check if expired
    let status = "AVAILABLE";
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      if (expiryDate < new Date()) {
        status = "EXPIRED";
      }
    }

    const lot = await prisma.lot.create({
      data: {
        organizationId: membership.organizationId,
        inventoryId: data.inventoryId,
        lotNumber: data.lotNumber,
        supplierLotNumber: data.supplierLotNumber,
        manufacturingDate: data.manufacturingDate
          ? new Date(data.manufacturingDate)
          : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        availableQuantity: data.initialQuantity,
        grnId: data.grnId,
        purchaseOrderId: data.purchaseOrderId,
        supplierId: data.supplierId,
        locationId: data.locationId,
        storageConditions: data.storageConditions,
        qcStatus: data.qcStatus || "PENDING",
        qcNotes: data.qcNotes,
        certificateNumber: data.certificateNumber,
        customFields: data.customFields,
        notes: data.notes,
        status,
      },
      include: {
        inventoryItem: {
          select: {
            sku: true,
            name: true,
          },
        },
        location: {
          select: {
            locationCode: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "LOT_CREATED",
        entityType: "LOT",
        entityId: lot.id,
        metadata: {
          lotNumber: lot.lotNumber,
          inventoryItemSku: lot.inventoryItem.sku,
          initialQuantity: lot.initialQuantity,
        },
      },
    });

    return NextResponse.json(lot, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating lot:", error);
    return NextResponse.json(
      { error: "Failed to create lot" },
      { status: 500 }
    );
  }
}
