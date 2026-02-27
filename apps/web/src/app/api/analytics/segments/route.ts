export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  segmentCustomers,
  type CustomerBehavior,
} from "@/lib/ai/customer-analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Fetch customers and their order behavior
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const orderAgg = await prisma.salesOrder.groupBy({
      by: ["customerId"],
      where: { organizationId },
      _count: { customerId: true },
      _sum: { total: true },
      _avg: { total: true },
      _max: { orderDate: true },
      _min: { orderDate: true },
    });

    const orderMap = new Map(orderAgg.map((row) => [row.customerId, row]));
    const now = Date.now();

    // Transform to analytics format
    const customerBehaviors: CustomerBehavior[] = customers.map((c: any) => {
      const metrics = orderMap.get(c.id);
      const totalPurchases = metrics?._count.customerId || 0;
      const totalSpent = Number(metrics?._sum.total || 0);
      const averageOrderValue = Number(metrics?._avg.total || 0);
      const lastPurchaseDate = metrics?._max.orderDate || c.createdAt;
      const daysSinceLastPurchase = Math.max(
        0,
        Math.floor((now - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)),
      );
      const activeDays = metrics?._min.orderDate
        ? Math.max(
            1,
            Math.ceil(
              (new Date(lastPurchaseDate).getTime() -
                new Date(metrics._min.orderDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 1;
      const purchaseFrequency = totalPurchases / activeDays;
      const riskScore = Math.min(1, daysSinceLastPurchase / 180);

      return {
        customerId: c.id,
        customerName: c.name,
        totalPurchases,
        totalSpent,
        averageOrderValue,
        lastPurchaseDate,
        daysSinceLastPurchase,
        purchaseFrequency,
        categoryPreferences: [],
        riskScore,
        segment: "Regular" as const,
      };
    });

    // Segment customers
    const segments = await segmentCustomers(customerBehaviors);

    return NextResponse.json({
      segments,
      summary: {
        total: customerBehaviors.length,
        vip: segments.find((s) => s.segment === "VIP")?.count || 0,
        loyal: segments.find((s) => s.segment === "Loyal")?.count || 0,
        regular: segments.find((s) => s.segment === "Regular")?.count || 0,
        atRisk: segments.find((s) => s.segment === "At-Risk")?.count || 0,
        churned: segments.find((s) => s.segment === "Churned")?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error segmenting customers:", error);
    return NextResponse.json(
      { error: "Failed to segment customers" },
      { status: 500 },
    );
  }
}
