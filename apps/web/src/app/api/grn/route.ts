export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InboundBrain } from "@/lib/services/inbound-brain";

// Validation schema for creating GRN
const createGRNSchema = z.object({
  purchaseOrderId: z.string(),
  warehouseId: z.string().optional(),
  receivingDock: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(
    z.object({
      purchaseOrderItemId: z.string().optional(),
      inventoryItemId: z.string(),
      orderedQuantity: z.number().int().positive(),
      receivedQuantity: z.number().int().min(0),
      acceptedQuantity: z.number().int().min(0),
      rejectedQuantity: z.number().int().min(0).default(0),
      unitCost: z.number().optional(),
      binLocation: z.string().optional(),
      batchNumber: z.string().optional(),
      expiryDate: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

// GET /api/grn - List all GRNs with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizations[0]?.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const purchaseOrderId = searchParams.get("purchaseOrderId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    if (search) {
      where.OR = [
        { grnNumber: { contains: search, mode: "insensitive" } },
        {
          purchaseOrder: {
            poNumber: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.goodsReceiptNote.count({ where });

    // Get GRNs with relations
    const grns = await prisma.goodsReceiptNote.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            supplier: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        warehouse: {
          select: {
            name: true,
            code: true,
          },
        },
        receivedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        receivedDate: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      grns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching GRNs:", error);
    return NextResponse.json(
      { error: "Failed to fetch GRNs" },
      { status: 500 },
    );
  }
}

// POST /api/grn - Create new GRN
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizations[0]?.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createGRNSchema.parse(body);

    // Check if PO exists and belongs to organization
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id: validatedData.purchaseOrderId,
        organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    // Generate GRN number (format: GRN-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]!.replace(/-/g, "");
    const count = await prisma.goodsReceiptNote.count({
      where: {
        organizationId,
        grnNumber: {
          startsWith: `GRN-${dateStr}`,
        },
      },
    });
    const grnNumber = `GRN-${dateStr}-${String(count + 1).padStart(3, "0")}`;

    // 1. Process items (Resolve Cost, Brain Logic)
    const processedItems = await Promise.all(
      validatedData.items.map(async (item) => {
        let binLocation = item.binLocation;
        let qcStatus =
          item.receivedQuantity === item.acceptedQuantity
            ? "PENDING"
            : "PENDING";
        let notes = item.notes;
        let unitCost = item.unitCost;
        let poItemId = item.purchaseOrderItemId;

        // Resolve details from PO if missing
        const poItem = purchaseOrder.items.find(
          (pi) =>
            (item.purchaseOrderItemId && pi.id === item.purchaseOrderItemId) ||
            pi.inventoryItemId === item.inventoryItemId,
        );

        if (poItem) {
          if (unitCost === undefined) unitCost = Number(poItem.unitPrice);
          if (!poItemId) poItemId = poItem.id;
        }

        // Default cost to 0 if still missing
        if (unitCost === undefined) unitCost = 0;

        // Inbound Brain Logic
        if (validatedData.warehouseId) {
          try {
            const brainAction = await InboundBrain.determineAction({
              itemId: item.inventoryItemId,
              organizationId,
              warehouseId: validatedData.warehouseId,
              quantity: item.receivedQuantity,
              supplierId: purchaseOrder.supplierId ?? undefined,
            });

            if (!binLocation && brainAction.recommendedLocationId) {
              binLocation = brainAction.recommendedLocationId;
            }

            if (brainAction.isCrossDock) {
              notes =
                (notes ? notes + "; " : "") +
                `[CROSS-DOCK: ${brainAction.notes}]`;
              if (brainAction.recommendedLocationId) {
                binLocation = brainAction.recommendedLocationId;
              }
            }

            if (brainAction.qcStatus === "PENDING_QC") {
              qcStatus = "PENDING";
              notes =
                (notes ? notes + "; " : "") + `[QC: ${brainAction.notes}]`;
            }
          } catch (error) {
            console.error(
              "InboundBrain error for item",
              item.inventoryItemId,
              error,
            );
          }
        }

        return {
          ...item,
          unitCost,
          purchaseOrderItemId: poItemId,
          binLocation,
          qcStatus,
          notes,
        };
      }),
    );

    // Calculate total received value using processed items
    const totalReceived = processedItems.reduce(
      (sum, item) => sum + item.receivedQuantity * (item.unitCost || 0),
      0,
    );

    // Check for discrepancies
    const hasDiscrepancy = processedItems.some(
      (item) => item.receivedQuantity !== item.orderedQuantity,
    );

    // Create GRN with items in a transaction
    const grn = await prisma.$transaction(async (tx: any) => {
      const newGRN = await tx.goodsReceiptNote.create({
        data: {
          organizationId,
          purchaseOrderId: validatedData.purchaseOrderId,
          warehouseId: validatedData.warehouseId,
          grnNumber,
          status: "DRAFT",
          receivedById: session.user.id,
          receivingDock: validatedData.receivingDock,
          totalReceived,
          hasDiscrepancy,
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          items: {
            create: processedItems.map((item) => ({
              purchaseOrderItemId: item.purchaseOrderItemId,
              inventoryItemId: item.inventoryItemId,
              orderedQuantity: item.orderedQuantity,
              receivedQuantity: item.receivedQuantity,
              acceptedQuantity: item.acceptedQuantity,
              rejectedQuantity: item.rejectedQuantity,
              unitCost: item.unitCost,
              binLocation: item.binLocation,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              notes: item.notes,
              qcStatus: item.qcStatus as any,
            })),
          },
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  sku: true,
                  name: true,
                },
              },
            },
          },
          purchaseOrder: {
            select: {
              poNumber: true,
              supplier: {
                select: {
                  name: true,
                },
              },
            },
          },
          receivedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "CREATE",
          entityType: "GRN",
          entityId: newGRN.id,
          metadata: {
            grnNumber: newGRN.grnNumber,
            poNumber: purchaseOrder.poNumber,
            itemCount: validatedData.items.length,
          },
        },
      });

      return newGRN;
    });

    return NextResponse.json({ grn }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating GRN:", error);
    return NextResponse.json(
      { error: "Failed to create GRN" },
      { status: 500 },
    );
  }
}
