import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const startProductionSchema = z.object({
  actualStart: z.string().optional(),
});

const completeProductionSchema = z.object({
  producedQuantity: z.number().int().min(0),
  scrapQuantity: z.number().int().min(0).default(0),
  actualEnd: z.string().optional(),
  qcStatus: z.string().optional(),
  qcNotes: z.string().optional(),
  notes: z.string().optional(),
});

const issueComponentsSchema = z.object({
  components: z.array(z.object({
    bomComponentId: z.string().optional(),
    componentId: z.string(),
    requiredQuantity: z.number(),
    issuedQuantity: z.number(),
    lotId: z.string().optional(),
    fromLocationId: z.string().optional(),
  })),
});

// GET /api/assembly-orders/[id] - Get assembly order details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.assemblyOrder.findUnique({
      where: { id: params.id },
      include: {
        bom: {
          include: {
            components: {
              include: {
                component: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    quantity: true,
                    availableQty: true,
                    costPrice: true,
                  },
                },
              },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        product: true,
        warehouse: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        salesOrder: {
          select: {
            id: true,
            soNumber: true,
          },
        },
        componentIssues: {
          include: {
            component: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
            lot: {
              select: {
                id: true,
                lotNumber: true,
              },
            },
            issuedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        productionLogs: {
          include: {
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Assembly order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching assembly order:", error);
    return NextResponse.json(
      { error: "Failed to fetch assembly order" },
      { status: 500 }
    );
  }
}

// POST /api/assembly-orders/[id]/start - Start production
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "start") {
      const body = await request.json();
      const validatedData = startProductionSchema.parse(body);

      const order = await prisma.assemblyOrder.update({
        where: { id: params.id },
        data: {
          status: 'IN_PROGRESS',
          actualStart: validatedData.actualStart ? new Date(validatedData.actualStart) : new Date(),
          productionLogs: {
            create: {
              eventType: 'START',
              eventDate: new Date(),
              operatorId: session.user.id,
            },
          },
        },
        include: {
          bom: true,
          product: true,
        },
      });

      return NextResponse.json(order);
    }

    if (action === "complete") {
      const body = await request.json();
      const validatedData = completeProductionSchema.parse(body);

      const order = await prisma.assemblyOrder.findUnique({
        where: { id: params.id },
        include: {
          bom: true,
          componentIssues: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Assembly order not found" },
          { status: 404 }
        );
      }

      // Calculate actual yield
      const actualYield = order.plannedQuantity > 0 
        ? (validatedData.producedQuantity / order.plannedQuantity) * 100 
        : 0;

      const yieldVariance = actualYield - Number(order.bom.standardYield);

      // Update order
      const updatedOrder = await prisma.assemblyOrder.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          producedQuantity: validatedData.producedQuantity,
          scrapQuantity: validatedData.scrapQuantity,
          actualYield,
          yieldVariance,
          actualEnd: validatedData.actualEnd ? new Date(validatedData.actualEnd) : new Date(),
          qcStatus: validatedData.qcStatus,
          qcNotes: validatedData.qcNotes,
          notes: validatedData.notes,
          productionLogs: {
            create: {
              eventType: 'COMPLETE',
              eventDate: new Date(),
              quantityProduced: validatedData.producedQuantity,
              quantityScrapped: validatedData.scrapQuantity,
              yieldPercentage: actualYield,
              operatorId: session.user.id,
              notes: validatedData.notes,
            },
          },
        },
      });

      // Auto-deduct components if enabled
      if (order.autoDeduct) {
        for (const issue of order.componentIssues) {
          await prisma.inventoryItem.update({
            where: { id: issue.componentId },
            data: {
              quantity: {
                decrement: Number(issue.issuedQuantity),
              },
              availableQty: {
                decrement: Number(issue.issuedQuantity),
              },
            },
          });

          // Create inventory movement
          await prisma.inventoryMovement.create({
            data: {
              inventoryItemId: issue.componentId,
              type: 'SALE', // Using SALE type for component consumption
              quantity: -Number(issue.issuedQuantity),
              reason: `Assembly order ${order.orderNumber} completed`,
            },
          });
        }

        // Add produced quantity to finished product
        await prisma.inventoryItem.update({
          where: { id: order.productId },
          data: {
            quantity: {
              increment: validatedData.producedQuantity,
            },
            availableQty: {
              increment: validatedData.producedQuantity,
            },
          },
        });

        // Create inventory movement for produced items
        await prisma.inventoryMovement.create({
          data: {
            inventoryItemId: order.productId,
            type: 'PURCHASE', // Using PURCHASE type for production
            quantity: validatedData.producedQuantity,
            reason: `Assembly order ${order.orderNumber} produced ${validatedData.producedQuantity} units`,
          },
        });
      }

      return NextResponse.json(updatedOrder);
    }

    if (action === "issue-components") {
      const body = await request.json();
      const validatedData = issueComponentsSchema.parse(body);

      const issues = await Promise.all(
        validatedData.components.map((comp) =>
          prisma.assemblyComponentIssue.create({
            data: {
              assemblyOrderId: params.id,
              bomComponentId: comp.bomComponentId,
              componentId: comp.componentId,
              requiredQuantity: comp.requiredQuantity,
              issuedQuantity: comp.issuedQuantity,
              lotId: comp.lotId,
              fromLocationId: comp.fromLocationId,
              issuedById: session.user.id,
              status: 'ISSUED',
            },
            include: {
              component: true,
              lot: true,
            },
          })
        )
      );

      // Update order status
      await prisma.assemblyOrder.update({
        where: { id: params.id },
        data: {
          componentsIssued: true,
          status: 'READY',
        },
      });

      return NextResponse.json({ issues });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error processing assembly order action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
