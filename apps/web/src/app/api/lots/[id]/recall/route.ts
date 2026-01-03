export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const recallSchema = z.object({
  reason: z.string().min(1),
  notes: z.string().optional(),
  notifyCustomers: z.boolean().default(true),
});

// POST /api/lots/[id]/recall - Issue a recall for a lot
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { status: 403 }
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
          },
        },
        serialNumbers: {
          where: {
            status: "SOLD",
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    if (lot.isRecalled) {
      return NextResponse.json(
        { error: "Lot is already recalled" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = recallSchema.parse(body);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update lot status
      await tx.lot.update({
        where: { id: params.id },
        data: {
          isRecalled: true,
          recallDate: new Date(),
          recallReason: data.reason,
          recallNotes: data.notes,
          status: "RECALLED",
        },
      });

      // Update all serial numbers from this lot
      await tx.serialNumber.updateMany({
        where: {
          lotId: params.id,
        },
        data: {
          status: "RETURNED",
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: "LOT_RECALLED",
          entityType: "LOT",
          entityId: lot.id,
          metadata: {
            lotNumber: lot.lotNumber,
            reason: data.reason,
            affectedSerialNumbers: lot.serialNumbers.length,
            affectedCustomers: new Set(
              lot.serialNumbers
                .filter((sn: any) => sn.customer)
                .map((sn: any) => sn.customer?.id)
            ).size,
          },
        },
      });
    });

    // Get affected customers
    const affectedCustomers = lot.serialNumbers
      .filter((sn: any) => sn.customer)
      .map((sn: any) => sn.customer!);

    return NextResponse.json({
      success: true,
      lotNumber: lot.lotNumber,
      affectedSerialNumbers: lot.serialNumbers.length,
      affectedCustomers: affectedCustomers.length,
      customers: data.notifyCustomers ? affectedCustomers : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error recalling lot:", error);
    return NextResponse.json(
      { error: "Failed to recall lot" },
      { status: 500 }
    );
  }
}

// GET /api/lots/[id]/recall - Get recall details and impact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { status: 403 }
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
        isRecalled: true,
      },
      include: {
        inventoryItem: {
          select: {
            sku: true,
            name: true,
          },
        },
        serialNumbers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            salesOrder: {
              select: {
                soNumber: true,
                orderDate: true,
              },
            },
          },
        },
        genealogyChildren: {
          include: {
            childLot: {
              select: {
                id: true,
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
      return NextResponse.json({ error: "Recalled lot not found" }, { status: 404 });
    }

    // Get downstream affected lots (lots created using this lot as ingredient)
    const downstreamLots = lot.genealogyChildren.map((g: any) => g.childLot);

    return NextResponse.json({
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        inventoryItem: lot.inventoryItem,
        recallDate: lot.recallDate,
        recallReason: lot.recallReason,
        recallNotes: lot.recallNotes,
      },
      impact: {
        totalSerialNumbers: lot.serialNumbers.length,
        soldSerialNumbers: lot.serialNumbers.filter((sn: any) => sn.status === "RETURNED")
          .length,
        affectedCustomers: [
          ...new Map(
            lot.serialNumbers
              .filter((sn: any) => sn.customer)
              .map((sn: any) => [sn.customer!.id, sn.customer!])
          ).values(),
        ],
        downstreamLots,
      },
      serialNumbers: lot.serialNumbers,
    });
  } catch (error) {
    console.error("Error fetching recall details:", error);
    return NextResponse.json(
      { error: "Failed to fetch recall details" },
      { status: 500 }
    );
  }
}
