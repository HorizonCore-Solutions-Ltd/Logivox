export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/dashboard
 * Get dashboard statistics for customer portal
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only allow CUSTOMER, SUPPLIER, CARRIER
    if (!["CUSTOMER", "SUPPLIER", "CARRIER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return role info to help frontend decide what to show
    const baseResponse = { role: user.role };

    if (user.role !== "CUSTOMER") {
        return NextResponse.json(baseResponse);
    }

    // Get customer record
    const customer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true },
    });

    if (!customer?.customerId) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Get statistics
    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      completedOrders,
      recentOrders,
    ] = await Promise.all([
      // Total orders
      prisma.salesOrder.count({
        where: { customerId: customer.customerId },
      }),
      // Pending orders
      prisma.salesOrder.count({
        where: {
          customerId: customer.customerId,
          status: { in: ["PENDING", "PENDING_APPROVAL", "APPROVED"] },
        },
      }),
      // Shipped orders
      prisma.salesOrder.count({
        where: {
          customerId: customer.customerId,
          status: "SHIPPED",
        },
      }),
      // Completed orders
      prisma.salesOrder.count({
        where: {
          customerId: customer.customerId,
          status: "DELIVERED",
        },
      }),
      // Recent orders (last 10)
      prisma.salesOrder.findMany({
        where: { customerId: customer.customerId },
        orderBy: { orderDate: "desc" },
        take: 10,
        select: {
          id: true,
          soNumber: true,
          orderDate: true,
          status: true,
          total: true,
          items: {
            select: {
              id: true,
            },
          },
        },
      }),
    ]);

    const recentOrdersFormatted = recentOrders.map((order) => ({
      id: order.id,
      soNumber: order.soNumber,
      orderDate: order.orderDate,
      status: order.status,
      total: Number(order.total),
      itemCount: order.items.length,
    }));

    return NextResponse.json({
      role: user.role,
      totalOrders,
      pendingOrders,
      shippedOrders,
      completedOrders,
      recentOrders: recentOrdersFormatted,
    });
  } catch (error: any) {
    console.error("Portal dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
