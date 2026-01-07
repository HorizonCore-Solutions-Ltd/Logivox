export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * @route GET /api/shipments/:id
 * @desc Get shipment details
 * @access Private
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shipmentId = params.id;

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

    // Get shipment with full details
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
      include: {
        salesOrder: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                code: true,
                email: true,
                phone: true,
              },
            },
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
        },
        pack: {
          include: {
            packages: {
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
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(shipment);
  } catch (error: any) {
    console.error("Error fetching shipment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shipment" },
      { status: 500 },
    );
  }
}

/**
 * @route PUT /api/shipments/:id
 * @desc Update shipment details
 * @access Private
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shipmentId = params.id;
    const body = await req.json();

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

    // Update shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    // Cannot update if already delivered
    if (shipment.status === "DELIVERED") {
      return NextResponse.json(
        { error: "Cannot update delivered shipment" },
        { status: 400 },
      );
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedShipment);
  } catch (error: any) {
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update shipment" },
      { status: 500 },
    );
  }
}
