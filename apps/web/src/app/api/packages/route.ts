export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema
const createPackageSchema = z.object({
  packId: z.string(),
  packageType: z.string().optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional().default("kg"),
  dimensions: z
    .object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
      unit: z.string(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        salesOrderItemId: z.string(),
        inventoryItemId: z.string(),
        quantity: z.number().int().min(1),
        binLocation: z.string().optional(),
        batchNumber: z.string().optional(),
        serialNumbers: z.array(z.string()).optional(),
      }),
    )
    .min(1, "At least one item is required"),
  notes: z.string().optional(),
});

/**
 * @route POST /api/packages
 * @desc Create a package within a pack and add items to it
 * @access Private
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createPackageSchema.parse(body);

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to create package
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Verify pack exists and belongs to organization
        const pack = await tx.pack.findFirst({
          where: {
            id: validatedData.packId,
            organizationId,
          },
          include: {
            salesOrder: {
              include: {
                items: true,
              },
            },
            packages: true,
          },
        });

        if (!pack) {
          throw new Error("Pack not found");
        }

        if (pack.status === "PACKED" || pack.status === "CANCELLED") {
          throw new Error(
            `Cannot add package to pack with status: ${pack.status}`,
          );
        }

        // Validate all items belong to the sales order
        for (const item of validatedData.items) {
          const soItem = pack.salesOrder.items.find(
            (si: any) => si.id === item.salesOrderItemId,
          );
          if (!soItem) {
            throw new Error(
              `Sales order item ${item.salesOrderItemId} not found in order`,
            );
          }

          // Check quantity constraints
          const alreadyPacked = await tx.packageItem.aggregate({
            where: {
              salesOrderItemId: item.salesOrderItemId,
            },
            _sum: {
              quantity: true,
            },
          });

          const totalPacked =
            (alreadyPacked._sum.quantity || 0) + item.quantity;
          if (totalPacked > soItem.quantityPicked) {
            throw new Error(
              `Cannot pack ${item.quantity} of item. Only ${soItem.quantityPicked - (alreadyPacked._sum.quantity || 0)} available to pack.`,
            );
          }
        }

        // Generate package number (sequential within pack)
        const packageNumber = (pack.packages.length + 1).toString();

        // Create package
        const packageRecord = await tx.package.create({
          data: {
            packId: validatedData.packId,
            packageNumber,
            packageType: validatedData.packageType,
            weight: validatedData.weight,
            weightUnit: validatedData.weightUnit,
            dimensions: validatedData.dimensions as any,
            notes: validatedData.notes,
            items: {
              create: validatedData.items.map((item: any) => ({
                salesOrderItemId: item.salesOrderItemId,
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
                binLocation: item.binLocation,
                batchNumber: item.batchNumber,
                serialNumbers: item.serialNumbers as any,
              })),
            },
          },
          include: {
            items: {
              include: {
                inventoryItem: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        });

        // Update sales order item packed quantities
        for (const item of validatedData.items) {
          await tx.salesOrderItem.update({
            where: { id: item.salesOrderItemId },
            data: {
              quantityPacked: {
                increment: item.quantity,
              },
            },
          });
        }

        // Update pack with total packages and weight
        const updatedPack = await tx.pack.update({
          where: { id: validatedData.packId },
          data: {
            totalPackages: {
              increment: 1,
            },
            totalWeight: validatedData.weight
              ? { increment: validatedData.weight }
              : undefined,
            status: "IN_PROGRESS",
            ...(!pack.startedDate && { startedDate: new Date() }),
            ...(!pack.packedById && { packedById: session.user.id }),
          },
        });

        // Check if all items are now packed
        const allSalesOrderItems = await tx.salesOrderItem.findMany({
          where: { salesOrderId: pack.salesOrderId },
        });

        const allPacked = allSalesOrderItems.every(
          (item: any) => item.quantityPacked >= item.quantityPicked,
        );

        if (allPacked) {
          // Mark pack as PACKED
          await tx.pack.update({
            where: { id: validatedData.packId },
            data: {
              status: "PACKED",
              completedDate: new Date(),
            },
          });

          // Update sales order status
          await tx.salesOrder.update({
            where: { id: pack.salesOrderId },
            data: {
              status: "PACKED",
              packedById: session.user.id,
              packedDate: new Date(),
            },
          });
        }

        // Create activity log
        await tx.activityLog.create({
          data: {
            organizationId,
            userId: session.user.id,
            action: "PACKAGE_CREATED",
            entityType: "PACKAGE",
            entityId: packageRecord.id,
            metadata: {
              packNumber: pack.packNumber,
              packageNumber,
              itemCount: validatedData.items.length,
              totalQuantity: validatedData.items.reduce(
                (sum: number, item: any) => sum + item.quantity,
                0,
              ),
              packCompleted: allPacked,
            },
          },
        });

        return {
          package: packageRecord,
          pack: updatedPack,
          allItemsPacked: allPacked,
        };
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating package:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create package" },
      { status: 500 },
    );
  }
}
