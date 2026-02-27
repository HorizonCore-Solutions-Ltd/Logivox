export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });

    const organizationId = user?.organizationMemberships?.[0]?.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    // Fetch booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        customer: true,
        items: {
          include: {
            inventoryItem: {
              include: {
                warehouse: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });

    const organizationId = user?.organizationMemberships?.[0]?.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    // Verify booking exists and belongs to organization
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status transition
    const validStatuses = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    // If status is changing to FULFILLED, reserve inventory
    if (status === "FULFILLED" && existingBooking.status !== "FULFILLED") {
      // Update inventory quantities
      for (const item of existingBooking.items) {
        const inventoryItem = item.inventoryItem;

        // Check if enough stock available
        if (inventoryItem.availableQty < item.quantityBooked) {
          return NextResponse.json(
            {
              message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.availableQty}, Required: ${item.quantityBooked}`,
            },
            { status: 400 },
          );
        }

        // Update inventory - reduce available quantity, increase reserved quantity
        await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            availableQty: inventoryItem.availableQty - item.quantityBooked,
            reservedQty: inventoryItem.reservedQty + item.quantityBooked,
          },
        });

        // Create stock movement record
        await prisma.inventoryMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: "BOOKING",
            quantity: item.quantityBooked,
            reason: `Booking #${existingBooking.id.slice(0, 8)} fulfilled`,
          },
        });
      }
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "booking",
        entityId: booking.id,
        organizationId,
        userId: session.user.id,
        metadata: {
          status: booking.status,
          previousStatus: existingBooking.status,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 },
    );
  }
}
