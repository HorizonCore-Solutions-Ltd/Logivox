export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @route GET /api/pick-lists/:id
 * @desc Get pick list details with all items and relations
 * @access Private
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pickListId = params.id;

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

    // Get pick list with full details
    const pickList = await prisma.pickList.findFirst({
      where: {
        id: pickListId,
        organizationId
      },
      include: {
        salesOrder: {
          include: {
            customer: true
          }
        },
        warehouse: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                binLocation: true,
                availableQty: true,
                reservedQty: true
              }
            },
            salesOrderItem: {
              select: {
                id: true,
                quantity: true,
                quantityPicked: true
              }
            }
          },
          orderBy: {
            inventoryItem: {
              binLocation: 'asc'
            }
          }
        }
      }
    });

    if (!pickList) {
      return NextResponse.json(
        { error: "Pick list not found" },
        { status: 404 }
      );
    }

    // Calculate picking statistics
    const totalItems = pickList.items.length;
    const totalQuantityToPick = pickList.items.reduce(
      (sum: number, item: any) => sum + item.quantityToPick, 
      0
    );
    const totalQuantityPicked = pickList.items.reduce(
      (sum: number, item: any) => sum + item.quantityPicked, 
      0
    );
    const completedItems = pickList.items.filter(
      (item: any) => item.quantityPicked >= item.quantityToPick
    ).length;
    const progressPercent = totalQuantityToPick > 0 
      ? Math.round((totalQuantityPicked / totalQuantityToPick) * 100)
      : 0;

    return NextResponse.json({
      ...pickList,
      statistics: {
        totalItems,
        completedItems,
        totalQuantityToPick,
        totalQuantityPicked,
        progressPercent
      }
    });

  } catch (error: any) {
    console.error("Error fetching pick list:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pick list" },
      { status: 500 }
    );
  }
}
