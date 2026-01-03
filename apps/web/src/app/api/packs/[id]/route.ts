export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @route GET /api/packs/:id
 * @desc Get pack details with all packages and items
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

    const packId = params.id;

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

    // Get pack with full details
    const pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId
      },
      include: {
        salesOrder: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                code: true,
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
                    binLocation: true
                  }
                }
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
            pickListNumber: true,
            status: true,
            completedDate: true
          }
        },
        packedBy: {
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
        packages: {
          include: {
            items: {
              include: {
                inventoryItem: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                },
                salesOrderItem: {
                  select: {
                    id: true,
                    quantity: true,
                    quantityPicked: true,
                    quantityPacked: true
                  }
                }
              }
            }
          },
          orderBy: {
            packageNumber: 'asc'
          }
        }
      }
    });

    if (!pack) {
      return NextResponse.json(
        { error: "Pack not found" },
        { status: 404 }
      );
    }

    // Calculate packing statistics
    const totalItemsToPack = pack.salesOrder.items.reduce(
      (sum: number, item: any) => sum + item.quantityPicked,
      0
    );
    const totalItemsPacked = pack.salesOrder.items.reduce(
      (sum: number, item: any) => sum + item.quantityPacked,
      0
    );
    const progressPercent = totalItemsToPack > 0
      ? Math.round((totalItemsPacked / totalItemsToPack) * 100)
      : 0;

    return NextResponse.json({
      ...pack,
      statistics: {
        totalPackages: pack.packages.length,
        totalItemsToPack,
        totalItemsPacked,
        progressPercent,
        totalWeight: pack.totalWeight,
        weightUnit: pack.weightUnit
      }
    });

  } catch (error: any) {
    console.error("Error fetching pack:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pack" },
      { status: 500 }
    );
  }
}
