export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  predictChurn,
  segmentCustomers,
  type CustomerBehavior,
} from "@/lib/ai/customer-analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Fetch customers (simplified - would include real purchase data)
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Transform to analytics format (in production, fetch real purchase data)
    const customerBehaviors: CustomerBehavior[] = customers.map((c: any) => ({
      customerId: c.id,
      customerName: c.name,
      totalPurchases: 0, // Would calculate from real data
      totalSpent: 0,
      averageOrderValue: 0,
      lastPurchaseDate: new Date(),
      daysSinceLastPurchase: 30,
      purchaseFrequency: 0,
      categoryPreferences: [],
      riskScore: Math.random(), // Would calculate from real data
      segment: "Regular" as const,
    }));

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
