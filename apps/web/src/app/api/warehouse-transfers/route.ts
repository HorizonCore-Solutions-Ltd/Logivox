export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTransferSchema = z.object({
  fromLocationId: z.string().min(1, "From location is required"),
  toLocationId: z.string().min(1, "To location is required"),
  inventoryId: z.string().min(1, "Inventory item is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  scheduledDate: z.string().optional(),
});

// GET /api/warehouse-transfers - List transfers
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const fromLocationId = searchParams.get("fromLocationId");
    const toLocationId = searchParams.get("toLocationId");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      organizationId: membership.organizationId,
    };

    if (status) where.status = status;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: "insensitive" } },
        {
          inventoryItem: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          inventoryItem: {
            sku: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.warehouseTransfer.count({ where });

    // Get transfers
    const transfers = await prisma.warehouseTransfer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        fromLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
        requestedBy: {
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
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      transfers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

// POST /api/warehouse-transfers - Create transfer
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
    const validatedData = createTransferSchema.parse(body);

    // Validate locations exist and belong to organization
    const [fromLocation, toLocation] = await Promise.all([
      prisma.location.findFirst({
        where: {
          id: validatedData.fromLocationId,
          organizationId: membership.organizationId,
        },
      }),
      prisma.location.findFirst({
        where: {
          id: validatedData.toLocationId,
          organizationId: membership.organizationId,
        },
      }),
    ]);

    if (!fromLocation || !toLocation) {
      return NextResponse.json(
        { error: "Invalid location(s)" },
        { status: 400 }
      );
    }

    // Validate same location
    if (validatedData.fromLocationId === validatedData.toLocationId) {
      return NextResponse.json(
        { error: "From and To locations must be different" },
        { status: 400 }
      );
    }

    // Validate inventory item exists
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: validatedData.inventoryId,
        organizationId: membership.organizationId,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Generate transfer number (TRF-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = (today.toISOString().split("T")[0] || "").replace(/-/g, "");
    const prefix = `TRF-${dateStr}`;

    const lastTransfer = await prisma.warehouseTransfer.findFirst({
      where: {
        organizationId: membership.organizationId,
        transferNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { transferNumber: "desc" },
    });

    let sequence = 1;
    if (lastTransfer) {
      const lastSequence = parseInt(
        (lastTransfer.transferNumber.split("-")[2] || "0") || "0"
      );
      sequence = lastSequence + 1;
    }

    const transferNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    // Create transfer
    const transfer = await prisma.warehouseTransfer.create({
      data: {
        organizationId: membership.organizationId,
        transferNumber,
        fromLocationId: validatedData.fromLocationId,
        toLocationId: validatedData.toLocationId,
        inventoryId: validatedData.inventoryId,
        quantity: validatedData.quantity,
        reason: validatedData.reason,
        notes: validatedData.notes,
        priority: validatedData.priority || "MEDIUM",
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : undefined,
        requestedById: session.user.id,
      },
      include: {
        fromLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "TRANSFER_CREATED",
        entityType: "WAREHOUSE_TRANSFER",
        entityId: transfer.id,
        metadata: {
          transferNumber: transfer.transferNumber,
          from: fromLocation.locationCode,
          to: toLocation.locationCode,
          item: inventoryItem.name,
          quantity: validatedData.quantity,
        },
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transfer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create transfer" },
      { status: 500 }
    );
  }
}
