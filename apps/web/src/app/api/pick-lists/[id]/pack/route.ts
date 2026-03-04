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
    const pickListId = params.id;

    // Fetch PickList with items
    const pickList = await prisma.pickList.findUnique({
      where: { id: pickListId },
      include: {
        items: true,
        salesOrder: true,
      },
    });

    if (!pickList) {
      return NextResponse.json(
        { error: "PickList not found" },
        { status: 404 },
      );
    }

    if (pickList.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PickList must be COMPLETED before packing" },
        { status: 400 },
      );
    }

    // Check if Pack already exists
    const existingPack = await prisma.pack.findFirst({
      where: { pickListId },
    });

    if (existingPack) {
      return NextResponse.json({
        message: "Pack already exists",
        pack: existingPack,
      });
    }

    // Generate Pack Number
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const count = await prisma.pack.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    const packNumber = `PK-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Create Pack, Package, and PackageItems in a transaction
    const pack = await prisma.$transaction(async (tx) => {
      // 1. Create Pack
      const newPack = await tx.pack.create({
        data: {
          organizationId,
          packNumber,
          pickListId,
          salesOrderId: pickList.salesOrderId,
          warehouseId: pickList.warehouseId,
          status: "COMPLETED", // Auto-complete for turnkey simplicity
          totalPackages: 1,
          createdById: session.user.id,
          packedById: session.user.id,
          startedDate: new Date(),
          completedDate: new Date(),
        },
      });

      // 2. Create Default Package (Box 1)
      const newPackage = await tx.package.create({
        data: {
          packId: newPack.id,
          packageNumber: `${packNumber}-001`,
          weight: 0,
          weightUnit: "kg",
        },
      });

      // 3. Add Items to Package
      for (const item of pickList.items) {
        if (item.quantityPicked > 0) {
          await tx.packageItem.create({
            data: {
              packageId: newPackage.id,
              salesOrderItemId: item.salesOrderItemId,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantityPicked,
            },
          });
        }
      }

      // 4. Update Sales Order Status
      await tx.salesOrder.update({
        where: { id: pickList.salesOrderId },
        data: {
          status: "PACKED",
          packedById: session.user.id,
          packedDate: new Date(),
        },
      });

      return newPack;
    });

    return NextResponse.json({ success: true, pack });
  } catch (error: any) {
    console.error("Error creating pack:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create pack" },
      { status: 500 },
    );
  }
}
