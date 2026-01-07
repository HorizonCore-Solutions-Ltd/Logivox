export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const processItemSchema = z.object({
  itemId: z.string(),
  quantityAccepted: z.number().int().min(0),
  quantityRejected: z.number().int().min(0),
  action: z.enum(["REFUND", "EXCHANGE", "STORE_CREDIT", "REPAIR", "DISPOSE"]),
  restockLocationId: z.string().optional(),
  restockingFee: z.number().optional(),
  notes: z.string().optional(),
});

const processRMASchema = z.object({
  items: z.array(processItemSchema).min(1),
  qcNotes: z.string().optional(),
});

// POST /api/rmas/[id]/process - Process RMA (restock + refunds)
export async function POST(
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

    const rma = await prisma.rMA.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
        returnReason: true,
      },
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    if (rma.status !== "RECEIVED" && rma.status !== "INSPECTING") {
      return NextResponse.json(
        { error: "RMA must be received or inspecting to process" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data = processRMASchema.parse(body);

    // Validate items
    for (const item of data.items) {
      const rmaItem = rma.items.find((i: any) => i.id === item.itemId);
      if (!rmaItem) {
        return NextResponse.json(
          { error: `Item ${item.itemId} not found in RMA` },
          { status: 404 },
        );
      }

      const totalProcessed = item.quantityAccepted + item.quantityRejected;
      if (totalProcessed !== (rmaItem.quantityReceived || 0)) {
        return NextResponse.json(
          {
            error: `Accepted + rejected quantities must equal received quantity for item ${item.itemId}`,
          },
          { status: 400 },
        );
      }

      // Validate restock location if restocking
      if (
        item.action !== "DISPOSE" &&
        item.quantityAccepted > 0 &&
        rma.returnReason.restockable
      ) {
        if (item.restockLocationId) {
          const location = await prisma.location.findFirst({
            where: {
              id: item.restockLocationId,
              organizationId: membership.organizationId,
            },
          });

          if (!location) {
            return NextResponse.json(
              { error: `Restock location ${item.restockLocationId} not found` },
              { status: 404 },
            );
          }
        }
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Process each item
      for (const item of data.items) {
        const rmaItem = rma.items.find((i: any) => i.id === item.itemId);
        if (!rmaItem) continue;

        // Calculate refund amount (after restocking fee)
        const refundAmount =
          item.action === "REFUND"
            ? rmaItem.unitPrice.toNumber() * item.quantityAccepted -
              (item.restockingFee || 0)
            : 0;

        // Update RMA item
        await tx.rMAItem.update({
          where: { id: item.itemId },
          data: {
            quantityAccepted: item.quantityAccepted,
            quantityRejected: item.quantityRejected,
            action: item.action,
            refundAmount,
            restockingFee: item.restockingFee,
            restockLocationId: item.restockLocationId,
            isInspected: true,
            inspectionNotes: item.notes,
          },
        });

        // Restock inventory if applicable
        if (
          item.action !== "DISPOSE" &&
          item.quantityAccepted > 0 &&
          rma.returnReason.restockable
        ) {
          await tx.inventoryItem.update({
            where: { id: rmaItem.inventoryId },
            data: {
              quantity: {
                increment: item.quantityAccepted,
              },
              availableQty: {
                increment: item.quantityAccepted,
              },
            },
          });

          // Mark as restocked
          await tx.rMAItem.update({
            where: { id: item.itemId },
            data: {
              isRestocked: true,
              restockedDate: new Date(),
              restockedById: session.user.id,
            },
          });
        }
      }

      // Update RMA
      await tx.rMA.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          completedDate: new Date(),
          inspectedById: session.user.id,
          inspectedDate: new Date(),
          qcNotes: data.qcNotes,
        },
      });
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "RMA_PROCESSED",
        entityType: "RMA",
        entityId: rma.id,
        metadata: {
          rmaNumber: rma.rmaNumber,
          itemsProcessed: data.items.length,
        },
      },
    });

    const updated = await prisma.rMA.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        returnReason: true,
        inspectedBy: {
          select: {
            id: true,
            name: true,
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
            restockLocation: {
              select: {
                locationCode: true,
                name: true,
              },
            },
          },
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

    console.error("Error processing RMA:", error);
    return NextResponse.json(
      { error: "Failed to process RMA" },
      { status: 500 },
    );
  }
}
