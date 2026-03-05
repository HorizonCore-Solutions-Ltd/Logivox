import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const grnId = params.id;

    // Fetch GRN and Warehouse
    const grn = await prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: {
          include: { inventoryItem: true },
        },
        warehouse: true,
      },
    });

    if (!grn) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    if (grn.putAwayCompleted) {
      return NextResponse.json(
        { error: "Putaway tasks already generated" },
        { status: 400 },
      );
    }

    // Ensure Receiving Location exists or create it
    let receivingLoc = await prisma.location.findFirst({
      where: {
        organizationId,
        warehouseId: grn.warehouseId,
        OR: [{ name: "Receiving" }, { type: "RECEIVING" }],
      },
    });

    if (!receivingLoc && grn.warehouseId) {
      receivingLoc = await prisma.location.create({
        data: {
          organizationId,
          warehouseId: grn.warehouseId!,
          name: "Receiving",
          locationCode: "REC-01",
          type: "RECEIVING",
          isPutaway: false,
          isPickable: false,
        },
      });
    }

    // Ensure Default Storage Location exists
    let defaultStorage = await prisma.location.findFirst({
      where: {
        organizationId,
        warehouseId: grn.warehouseId,
        isPutaway: true,
        isActive: true,
      },
    });

    if (!defaultStorage && grn.warehouseId) {
      defaultStorage = await prisma.location.create({
        data: {
          organizationId,
          warehouseId: grn.warehouseId!,
          name: "General Storage",
          locationCode: "GEN-01",
          type: "STORAGE",
          isPutaway: true,
          isPickable: true,
        },
      });
    }

    // Generate tasks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let taskCount = 0;
      const count = await tx.pickingTask.count({
        where: { organizationId },
      });
      let currentSeq = count;

      for (const item of grn.items) {
        if (item.acceptedQuantity <= 0) continue;

        // Resolve Target Location
        let targetLocId = defaultStorage?.id;

        if (item.binLocation) {
          // Check if binLocation is an ID first (standard for Brain)
          const locById = await tx.location.findUnique({
            where: { id: item.binLocation },
          });

          if (locById) {
            targetLocId = locById.id;
          } else {
            // Fallback for legacy (Name/Code)
            const specificLoc = await tx.location.findFirst({
              where: {
                organizationId,
                warehouseId: grn.warehouseId,
                OR: [
                  { locationCode: item.binLocation },
                  { name: item.binLocation },
                ],
              },
            });
            if (specificLoc) targetLocId = specificLoc.id;
          }
        }

        if (!targetLocId) continue;

        currentSeq++;
        const taskNumber = `PUT-${(grn.grnNumber || "GRN").split("-")[1] || "GEN"}-${String(
          currentSeq,
        ).padStart(4, "0")}`;

        await tx.pickingTask.create({
          data: {
            organizationId,
            warehouseId: grn.warehouseId!,
            taskNumber,
            taskType: "PUT",
            priority: "NORMAL",
            title: `Putaway: ${item.inventoryItem.name}`,
            description: `Move ${item.acceptedQuantity} units from Receiving to ${
              targetLocId === defaultStorage?.id
                ? "General Storage"
                : item.binLocation
            }`,
            sourceType: "GRN",
            sourceId: grn.id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.acceptedQuantity,
            fromLocationId: receivingLoc?.id,
            toLocationId: targetLocId,
            status: "PENDING",
            createdById: session.user.id,
          },
        });
        taskCount++;
      }

      // Mark GRN as having putaway generated
      await tx.goodsReceiptNote.update({
        where: { id: grnId },
        data: { putAwayCompleted: true },
      });

      return taskCount;
    });

    return NextResponse.json({ success: true, count: result });
  } catch (error: any) {
    console.error("Error generating putaway:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate putaway tasks" },
      { status: 500 },
    );
  }
}
