export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NCRService } from "@/lib/services/qc/ncr-service";

const createAdjustmentSchema = z.object({
  inventoryId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().optional(),
  quantityChange: z.number().int("Quantity change must be an integer"),
  reason: z.enum([
    "DAMAGE",
    "LOSS",
    "FOUND",
    "CORRECTION",
    "RECOUNT",
    "RETURN_TO_VENDOR",
    "SAMPLE",
    "THEFT",
    "EXPIRY",
    "OTHER",
  ]),
  reasonNotes: z.string().optional(),
  requiresApproval: z.boolean().optional(),
  unitCost: z.number().optional(),
});

// GET /api/stock-adjustments - List adjustments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");
    const locationId = searchParams.get("locationId");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      organizationId: membership.organizationId,
    };

    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (locationId) where.locationId = locationId;

    if (search) {
      where.OR = [
        { adjustmentNumber: { contains: search, mode: "insensitive" } },
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
    const total = await prisma.stockAdjustment.count({ where });

    // Get adjustments
    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
        location: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
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
      adjustments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Error fetching adjustments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch adjustments" },
      { status: 500 },
    );
  }
}

// POST /api/stock-adjustments - Create adjustment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validatedData = createAdjustmentSchema.parse(body);

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
        { status: 404 },
      );
    }

    // Calculate new quantity
    const quantityBefore = inventoryItem.quantity;
    const quantityAfter = quantityBefore + validatedData.quantityChange;

    // Validate new quantity is not negative
    if (quantityAfter < 0) {
      return NextResponse.json(
        { error: "Adjustment would result in negative inventory" },
        { status: 400 },
      );
    }

    // If location specified, validate it
    if (validatedData.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: validatedData.locationId,
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

    // Generate adjustment number (ADJ-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = (today.toISOString().split("T")[0] || "").replace(/-/g, "");
    const prefix = `ADJ-${dateStr}`;

    const lastAdjustment = await prisma.stockAdjustment.findFirst({
      where: {
        organizationId: membership.organizationId,
        adjustmentNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { adjustmentNumber: "desc" },
    });

    let sequence = 1;
    if (lastAdjustment) {
      const lastSequence = parseInt(
        lastAdjustment.adjustmentNumber.split("-")[2] || "0" || "0",
      );
      sequence = lastSequence + 1;
    }

    const adjustmentNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    // Calculate total cost
    const unitCost =
      validatedData.unitCost || inventoryItem.costPrice
        ? parseFloat(inventoryItem.costPrice.toString())
        : 0;
    const totalCost = Math.abs(validatedData.quantityChange) * unitCost;

    // Determine if requires approval (large adjustments or specific reasons)
    const requiresApproval =
      validatedData.requiresApproval !== undefined
        ? validatedData.requiresApproval
        : Math.abs(validatedData.quantityChange) > 100 ||
          ["THEFT", "LOSS", "DAMAGE"].includes(validatedData.reason);

    // Create adjustment
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        organizationId: membership.organizationId,
        adjustmentNumber,
        inventoryId: validatedData.inventoryId,
        locationId: validatedData.locationId,
        quantityBefore,
        quantityAfter,
        quantityChange: validatedData.quantityChange,
        reason: validatedData.reason,
        reasonNotes: validatedData.reasonNotes,
        requiresApproval,
        unitCost,
        totalCost,
        createdById: session.user.id,
        // If no approval required, auto-approve and complete
        status: requiresApproval ? "PENDING" : "COMPLETED",
        approvedById: requiresApproval ? undefined : session.user.id,
        approvedDate: requiresApproval ? undefined : new Date(),
        completedById: requiresApproval ? undefined : session.user.id,
        completedDate: requiresApproval ? undefined : new Date(),
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
        location: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            type: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If auto-approved, update inventory immediately
    if (!requiresApproval) {
      await prisma.inventoryItem.update({
        where: { id: validatedData.inventoryId },
        data: {
          quantity: quantityAfter,
          availableQty: quantityAfter - inventoryItem.reservedQty,
        },
      });
    }

    // Auto-create NCR for stock loss/damage adjustments (best-effort)
    if (
      ["DAMAGE", "THEFT", "LOSS", "EXPIRY"].includes(validatedData.reason) &&
      validatedData.quantityChange < 0
    ) {
      const absQty = Math.abs(validatedData.quantityChange);
      NCRService.createNCR({
        organizationId: membership.organizationId,
        title: `Stock ${validatedData.reason}: ${inventoryItem.name} — ${absQty} units (${adjustment.adjustmentNumber})`,
        description: `${absQty} unit(s) written off via stock adjustment ${adjustment.adjustmentNumber}. Reason: ${validatedData.reason}. Notes: ${validatedData.reasonNotes ?? "None provided."}`,
        discoveredBy: session.user.id,
        discoveryLocation: "Warehouse",
        sourceType: "PRODUCTION",
        sourceId: adjustment.id,
        productSku: inventoryItem.sku ?? undefined,
        productDescription: inventoryItem.name,
        quantityAffected: absQty,
        nonConformanceType:
          validatedData.reason === "DAMAGE" ? "DAMAGE" : "LOSS",
        severity: absQty > 50 ? "HIGH" : "MEDIUM",
        category: "INVENTORY_ADJUSTMENT",
        disposition: validatedData.reason === "DAMAGE" ? "SCRAP" : "QUARANTINE",
        capaRequired: absQty > 50,
        priority: absQty > 50 ? "HIGH" : "MEDIUM",
        createdBy: session.user.id,
      }).catch((e: any) => console.error("Auto-NCR for adjustment failed:", e));
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "ADJUSTMENT_CREATED",
        entityType: "STOCK_ADJUSTMENT",
        entityId: adjustment.id,
        metadata: {
          adjustmentNumber: adjustment.adjustmentNumber,
          item: inventoryItem.name,
          quantityChange: validatedData.quantityChange,
          reason: validatedData.reason,
          requiresApproval,
        },
      },
    });

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating adjustment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create adjustment" },
      { status: 500 },
    );
  }
}
