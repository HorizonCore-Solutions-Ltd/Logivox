import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schemas
const createPackSchema = z.object({
  salesOrderId: z.string(),
  pickListId: z.string().optional(),
  warehouseId: z.string(),
  notes: z.string().optional()
});

const createPackageSchema = z.object({
  packId: z.string(),
  packageType: z.string().optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.string()
  }).optional(),
  items: z.array(z.object({
    salesOrderItemId: z.string(),
    inventoryItemId: z.string(),
    quantity: z.number().int().min(1),
    binLocation: z.string().optional(),
    batchNumber: z.string().optional(),
    serialNumbers: z.array(z.string()).optional()
  })),
  notes: z.string().optional()
});

/**
 * @route POST /api/packs
 * @desc Create a new pack for a sales order
 * @access Private
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createPackSchema.parse(body);

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to create pack
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify sales order exists and is ready for packing
      const salesOrder = await tx.salesOrder.findFirst({
        where: {
          id: validatedData.salesOrderId,
          organizationId
        }
      });

      if (!salesOrder) {
        throw new Error("Sales order not found");
      }

      if (!["PICKED", "PACKING", "PACKED"].includes(salesOrder.status)) {
        throw new Error(
          `Sales order must be PICKED or in packing state. Current status: ${salesOrder.status}`
        );
      }

      // Generate pack number (PACK-YYYYMMDD-XXX)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const lastPack = await tx.pack.findFirst({
        where: {
          organizationId,
          packNumber: {
            startsWith: `PACK-${dateStr}`
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      let sequence = 1;
      if (lastPack?.packNumber) {
        const lastSeq = parseInt(lastPack.packNumber.split('-')[2]);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }

      const packNumber = `PACK-${dateStr}-${sequence.toString().padStart(3, '0')}`;

      // Create pack
      const pack = await tx.pack.create({
        data: {
          organizationId,
          packNumber,
          salesOrderId: validatedData.salesOrderId,
          pickListId: validatedData.pickListId,
          warehouseId: validatedData.warehouseId,
          status: "PENDING",
          notes: validatedData.notes,
          createdById: session.user.id
        }
      });

      // Update sales order status to PACKING if not already
      if (salesOrder.status === "PICKED") {
        await tx.salesOrder.update({
          where: { id: validatedData.salesOrderId },
          data: { status: "PACKING" }
        });
      }

      // Create activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "PACK_CREATED",
          entityType: "PACK",
          entityId: pack.id,
          metadata: {
            packNumber,
            salesOrderNumber: salesOrder.soNumber,
            warehouseId: validatedData.warehouseId
          }
        }
      });

      return pack;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Error creating pack:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create pack" },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/packs
 * @desc List all packs with filtering
 * @access Private
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const salesOrderId = searchParams.get("salesOrderId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;
    if (salesOrderId) where.salesOrderId = salesOrderId;

    // Fetch packs
    const [packs, total] = await Promise.all([
      prisma.pack.findMany({
        where,
        include: {
          salesOrder: {
            select: {
              id: true,
              soNumber: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          pickList: {
            select: {
              id: true,
              pickListNumber: true
            }
          },
          packedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          packages: {
            select: {
              id: true,
              packageNumber: true,
              packageType: true,
              weight: true,
              trackingNumber: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.pack.count({ where })
    ]);

    return NextResponse.json({
      packs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching packs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch packs" },
      { status: 500 }
    );
  }
}
