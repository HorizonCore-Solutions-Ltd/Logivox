import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Internal Inventory Check Helper
async function checkInternalInventory(orderId: string) {
  // Get all items in the order with their current inventory status
  const orderItems = await prisma.salesOrderItem.findMany({
    where: { salesOrderId: orderId },
    include: {
      inventoryItem: true,
    },
  });

  const shortages: string[] = [];
  let totalAvailable = true;

  for (const item of orderItems) {
    if (!item.inventoryItem) continue;

    const available = item.inventoryItem.availableQty || 0;
    const required = item.quantity;

    // Simple check: Is available stock less than required?
    if (available < required) {
      totalAvailable = false;
      shortages.push(
        `${item.inventoryItem.name} (Req: ${required}, Avail: ${available})`,
      );
    }
  }

  return {
    hasStock: totalAvailable,
    details: shortages.length > 0 ? shortages.join(", ") : "Stock Sufficient",
  };
}

const cutOrderSchema = z.object({
  salesOrderId: z.string(),
  reason: z.enum(["TRAILER_FULL", "NO_STOCK", "OTHER"]),
  reasonDetails: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const { salesOrderId, reason, reasonDetails } = cutOrderSchema.parse(json);

    // 1. Get Current Order
    const order = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Determine New Status & Note
    let newStatus: any = "ON_HOLD";
    let statusNote = "";
    let verificationResult = "";

    if (reason === "TRAILER_FULL") {
      newStatus = "ON_HOLD";
      statusNote = `Cut from Load Plan: Trailer Full. ${reasonDetails || ""}`;
    } else if (reason === "NO_STOCK") {
      newStatus = "BACKORDERED";

      // Perform REAL check against Internal Inventory
      const stockCheck = await checkInternalInventory(salesOrderId);

      if (stockCheck.hasStock) {
        // Contradiction: User said no stock, but system says we have it.
        // We still cut the order, but flag it for review.
        statusNote = `Cut from Load Plan: User reported NO_STOCK, but internal system shows availability. Review required.`;
        verificationResult =
          "Internal Inventory: Stock Available (Discrepancy)";
      } else {
        statusNote = `Cut from Load Plan: Inventory Shortage confirmed. Missing: ${stockCheck.details}`;
        verificationResult = `Internal Inventory: Shortage Confirmed (${stockCheck.details})`;
      }
    } else {
      newStatus = "ON_HOLD";
      statusNote = `Cut from Load Plan: ${reasonDetails || "Other functionality"}`;
    }

    // 3. Update Order
    // Transaction: Remove from Load Plan (if exists) -> Update Status -> Add Note history
    await prisma.$transaction(async (tx) => {
      // Remove connection to any Load Plan
      // Based on schema `loadPlanItems LoadPlanItem[]`
      await tx.loadPlanItem.deleteMany({
        where: { salesOrderId },
      });

      // Append to existing notes
      const updatedNote =
        (order.internalNotes ? order.internalNotes + "\n" : "") +
        `[${new Date().toISOString()}] ${statusNote}`;

      await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: {
          status: newStatus,
          internalNotes: updatedNote,
        },
      });
    });

    return NextResponse.json({
      success: true,
      newStatus,
      verificationCallback: verificationResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).errors },
        { status: 400 },
      );
    }
    console.error("Cut Order Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
