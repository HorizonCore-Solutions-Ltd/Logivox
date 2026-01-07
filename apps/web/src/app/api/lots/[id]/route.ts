export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateLotSchema = z.object({
  qcStatus: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]).optional(),
  qcNotes: z.string().optional(),
  certificateNumber: z.string().optional(),
  locationId: z.string().optional(),
  storageConditions: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/lots/[id] - Get lot details with traceability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
        { status: 403 },
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        inventoryItem: {
          select: {
            sku: true,
            name: true,
            barcode: true,
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
            email: true,
          },
        },
        grn: {
          select: {
            grnNumber: true,
            receivedDate: true,
          },
        },
        purchaseOrder: {
          select: {
            poNumber: true,
            orderDate: true,
          },
        },
        serialNumbers: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            soldDate: true,
          },
          orderBy: {
            serialNumber: "asc",
          },
        },
        movements: {
          include: {
            lot: {
              select: {
                lotNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
        genealogyParents: {
          include: {
            parentLot: {
              select: {
                lotNumber: true,
                inventoryItem: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        genealogyChildren: {
          include: {
            childLot: {
              select: {
                lotNumber: true,
                inventoryItem: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    return NextResponse.json(lot);
  } catch (error) {
    console.error("Error fetching lot:", error);
    return NextResponse.json({ error: "Failed to fetch lot" }, { status: 500 });
  }
}

// PATCH /api/lots/[id] - Update lot
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
        { status: 403 },
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateLotSchema.parse(body);

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

    const updated = await prisma.lot.update({
      where: { id: params.id },
      data: {
        qcStatus: data.qcStatus,
        qcNotes: data.qcNotes,
        qcDate: data.qcStatus ? new Date() : undefined,
        certificateNumber: data.certificateNumber,
        locationId: data.locationId,
        storageConditions: data.storageConditions,
        notes: data.notes,
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
        action: "LOT_UPDATED",
        entityType: "LOT",
        entityId: lot.id,
        metadata: {
          lotNumber: lot.lotNumber,
          changes: data,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating lot:", error);
    return NextResponse.json(
      { error: "Failed to update lot" },
      { status: 500 },
    );
  }
}
