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

    // Get tenant ID from first organization
    const tenantId = session.user.organizations[0]?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
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

    // Transform to analytics format
    const customerBehaviors: CustomerBehavior[] = customers.map((c: any) => ({
      customerId: c.id,
      customerName: c.name,
      totalPurchases: Math.floor(Math.random() * 50), // Demo data
      totalSpent: Math.random() * 10000,
      averageOrderValue: Math.random() * 500,
      lastPurchaseDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      daysSinceLastPurchase: Math.floor(Math.random() * 180),
      purchaseFrequency: Math.random() * 5,
      categoryPreferences: [],
      riskScore: Math.random(),
      segment: "Regular" as const,
    }));

    // Segment customers
    const segments = await segmentCustomers(customerBehaviors);

    return NextResponse.json({
      segments,
      summary: {
        total: customerBehaviors.length,
        vip: segments.find(s => s.segment === 'VIP')?.count || 0,
        loyal: segments.find(s => s.segment === 'Loyal')?.count || 0,
        regular: segments.find(s => s.segment === 'Regular')?.count || 0,
        atRisk: segments.find(s => s.segment === 'At-Risk')?.count || 0,
        churned: segments.find(s => s.segment === 'Churned')?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error segmenting customers:", error);
    return NextResponse.json(
      { error: "Failed to segment customers" },
      { status: 500 }
    );
  }
}
