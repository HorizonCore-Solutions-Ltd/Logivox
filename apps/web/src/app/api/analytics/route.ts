export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: { take: 1 } },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizations[0].id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

    // Parallel queries for performance
    const [
      totalInventory,
      lowStockItems,
      totalBookings,
      revenueData,
      topCustomers,
      recentActivity,
      inventoryByCategory,
      bookingsByStatus,
      dailyRevenue,
    ] = await Promise.all([
      // Total inventory count and value
      prisma.inventoryItem.aggregate({
        where: { organizationId },
        _count: true,
        _sum: {
          availableQuantity: true,
          reservedQuantity: true,
        },
      }),

      // Low stock items
      prisma.inventoryItem.count({
        where: {
          organizationId,
          availableQuantity: {
            lte: prisma.inventoryItem.fields.lowStockThreshold,
          },
        },
      }),

      // Total bookings
      prisma.booking.aggregate({
        where: { organizationId },
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),

      // Revenue by period
      prisma.booking.findMany({
        where: {
          organizationId,
          status: "FULFILLED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      }),

      // Top customers by revenue
      prisma.customer.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          bookings: {
            where: { status: "FULFILLED" },
            select: {
              totalAmount: true,
            },
          },
        },
        take: 10,
      }),

      // Recent activity logs
      prisma.activityLog.findMany({
        where: {
          user: {
            organizations: {
              some: { id: organizationId },
            },
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Inventory by category
      prisma.category.findMany({
        where: { organizationId },
        select: {
          name: true,
          _count: {
            select: {
              inventoryItems: true,
            },
          },
        },
        orderBy: {
          inventoryItems: {
            _count: "desc",
          },
        },
        take: 5,
      }),

      // Bookings by status
      prisma.booking.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),

      // Daily revenue for chart
      prisma.$queryRaw<Array<{ date: Date; revenue: string }>>`
        SELECT 
          DATE(b."createdAt") as date,
          SUM(CAST(b."totalAmount" AS DECIMAL))::text as revenue
        FROM "Booking" b
        WHERE b."organizationId" = ${organizationId}
          AND b.status = 'FULFILLED'
          AND b."createdAt" >= ${startDate}
          AND b."createdAt" <= ${endDate}
        GROUP BY DATE(b."createdAt")
        ORDER BY date ASC
      `,
    ]);

    // Process top customers
    const topCustomersWithRevenue = topCustomers
      .map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalRevenue: customer.bookings.reduce(
          (sum: number, booking: any) => sum + Number(booking.totalAmount),
          0,
        ),
        bookingsCount: customer.bookings.length,
      }))
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Format daily revenue for chart
    const formattedDailyRevenue = dailyRevenue.map((item: any) => ({
      date: format(new Date(item.date), "MMM dd"),
      revenue: Number(item.revenue),
    }));

    // Build response
    const analytics = {
      overview: {
        totalInventoryItems: totalInventory._count || 0,
        totalInventoryUnits:
          (totalInventory._sum.availableQuantity || 0) +
          (totalInventory._sum.reservedQuantity || 0),
        lowStockItems,
        totalBookings: totalBookings._count || 0,
        totalRevenue: Number(totalBookings._sum.totalAmount || 0),
      },
      charts: {
        dailyRevenue: formattedDailyRevenue,
        inventoryByCategory: inventoryByCategory.map((cat: any) => ({
          name: cat.name,
          value: cat._count.inventoryItems,
        })),
        bookingsByStatus: bookingsByStatus.map((item: any) => ({
          status: item.status,
          count: item._count,
        })),
      },
      topCustomers: topCustomersWithRevenue,
      recentActivity: recentActivity.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        userName: log.user.name || log.user.email,
        createdAt: log.createdAt,
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
