export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  predictChurn,
  segmentCustomer,
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

    // Fetch customers with real order history
    const customers = await prisma.customer.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        salesOrders: {
          select: {
            orderDate: true,
            total: true,
            status: true,
            items: {
              select: {
                inventoryItem: {
                  select: {
                    category: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const customerBehaviors: CustomerBehavior[] = customers.map((customer) => {
      const completedOrders = customer.salesOrders.filter((order) =>
        [
          "APPROVED",
          "PICKING",
          "PICKED",
          "PACKING",
          "SHIPPED",
          "DELIVERED",
        ].includes(String(order.status)),
      );

      const totalPurchases = completedOrders.length;
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      );
      const averageOrderValue =
        totalPurchases > 0 ? totalSpent / totalPurchases : 0;

      const lastPurchaseDate = completedOrders.length
        ? completedOrders.reduce(
            (latest, order) =>
              order.orderDate > latest ? order.orderDate : latest,
            completedOrders[0].orderDate,
          )
        : customer.createdAt;

      const daysSinceLastPurchase = Math.max(
        0,
        Math.floor(
          (now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const activeMonths = Math.max(
        1,
        (now.getTime() - customer.createdAt.getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      );
      const purchaseFrequency = totalPurchases / activeMonths;

      const categoryCounts = new Map<string, number>();
      let totalCategoryHits = 0;
      for (const order of completedOrders) {
        for (const item of order.items) {
          const category =
            item.inventoryItem?.category?.name || "Uncategorized";
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
          totalCategoryHits += 1;
        }
      }

      const categoryPreferences = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({
          category,
          percentage:
            totalCategoryHits > 0
              ? Number(((count / totalCategoryHits) * 100).toFixed(1))
              : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      const riskScore = Math.max(
        0,
        Math.min(
          1,
          (daysSinceLastPurchase / 180) * 0.5 +
            (purchaseFrequency < 1 ? 0.25 : 0) +
            (averageOrderValue < 100 ? 0.15 : 0) +
            (totalPurchases < 3 ? 0.1 : 0),
        ),
      );

      const segment = segmentCustomer({
        recency: daysSinceLastPurchase,
        frequency: totalPurchases,
        monetary: totalSpent,
      });

      return {
        customerId: customer.id,
        customerName: customer.name,
        totalPurchases,
        totalSpent,
        averageOrderValue,
        lastPurchaseDate,
        daysSinceLastPurchase,
        purchaseFrequency,
        categoryPreferences,
        riskScore,
        segment,
      } as CustomerBehavior;
    });

    // Predict churn for each customer
    const churnPredictions = await Promise.all(
      customerBehaviors.map(async (customer) => {
        const prediction = await predictChurn(customer);
        return {
          customerName: customer.customerName,
          ...prediction,
        };
      }),
    );

    // Filter by risk level if specified
    const searchParams = request.nextUrl.searchParams;
    const riskLevel = searchParams.get("risk");

    let filteredPredictions = churnPredictions;
    if (riskLevel) {
      filteredPredictions = churnPredictions.filter(
        (p) => p.riskLevel === riskLevel,
      );
    }

    // Sort by churn probability (highest first)
    filteredPredictions.sort((a, b) => b.churnProbability - a.churnProbability);

    return NextResponse.json({
      predictions: filteredPredictions,
      total: filteredPredictions.length,
      segments: segmentCustomers(customerBehaviors),
      summary: {
        critical: churnPredictions.filter((p) => p.riskLevel === "critical")
          .length,
        high: churnPredictions.filter((p) => p.riskLevel === "high").length,
        medium: churnPredictions.filter((p) => p.riskLevel === "medium").length,
        low: churnPredictions.filter((p) => p.riskLevel === "low").length,
      },
    });
  } catch (error) {
    console.error("Error predicting churn:", error);
    return NextResponse.json(
      { error: "Failed to predict churn" },
      { status: 500 },
    );
  }
}
