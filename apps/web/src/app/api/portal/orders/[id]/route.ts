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

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow CUSTOMER role access to portal
    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden - Customer access only" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customer: true },
    });

    if (!user?.customerId) {
      return NextResponse.json(
        { error: "Customer not linked" },
        { status: 400 },
      );
    }

    // Fetch order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        customerId: user.customerId,
        organizationId: session.user.organizationId,
      },
      include: {
        items: {
          include: {
            inventory: {
              select: {
                sku: true,
                name: true,
                description: true,
              },
            },
          },
        },
        shipments: {
          include: {
            carrier: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch order detail" },
      { status: 500 },
    );
  }
}
