import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CarbonFootprint {
  orderId: string;
  totalCO2e: number;
  breakdown: {
    transportation: number;
    packaging: number;
    warehousing: number;
    manufacturing: number;
  };
  timestamp: Date;
}

/**
 * GET /api/sustainability/footprints
 * Get carbon footprint data for orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const orderId = searchParams.get("orderId");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      organizationId: session.user.organizationId,
      createdAt: {
        gte: startDate,
      },
    };

    if (orderId) {
      where.orderId = orderId;
    }

    // Get carbon footprint records
    const footprints = await prisma.carbonFootprint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    // Calculate aggregated statistics
    const totalCO2e = footprints.reduce((sum, f) => sum + f.totalCO2e, 0);
    const averageCO2ePerOrder =
      footprints.length > 0 ? totalCO2e / footprints.length : 0;

    const breakdown = {
      transportation: footprints.reduce((sum, f) => sum + f.transportation, 0),
      packaging: footprints.reduce((sum, f) => sum + f.packaging, 0),
      warehousing: footprints.reduce((sum, f) => sum + f.warehousing, 0),
      manufacturing: footprints.reduce((sum, f) => sum + f.manufacturing, 0),
    };

    // Group by date for trend analysis
    const footprintsByDate = footprints.reduce(
      (acc, f) => {
        const date = f.createdAt.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            totalCO2e: 0,
            count: 0,
            transportation: 0,
            packaging: 0,
            warehousing: 0,
            manufacturing: 0,
          };
        }
        acc[date].totalCO2e += f.totalCO2e;
        acc[date].count += 1;
        acc[date].transportation += f.transportation;
        acc[date].packaging += f.packaging;
        acc[date].warehousing += f.warehousing;
        acc[date].manufacturing += f.manufacturing;
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCO2e: Math.round(totalCO2e * 100) / 100,
          averageCO2ePerOrder: Math.round(averageCO2ePerOrder * 100) / 100,
          totalOrders: footprints.length,
          breakdown: {
            transportation: Math.round(breakdown.transportation * 100) / 100,
            packaging: Math.round(breakdown.packaging * 100) / 100,
            warehousing: Math.round(breakdown.warehousing * 100) / 100,
            manufacturing: Math.round(breakdown.manufacturing * 100) / 100,
          },
          percentages: {
            transportation:
              totalCO2e > 0
                ? Math.round((breakdown.transportation / totalCO2e) * 100)
                : 0,
            packaging:
              totalCO2e > 0
                ? Math.round((breakdown.packaging / totalCO2e) * 100)
                : 0,
            warehousing:
              totalCO2e > 0
                ? Math.round((breakdown.warehousing / totalCO2e) * 100)
                : 0,
            manufacturing:
              totalCO2e > 0
                ? Math.round((breakdown.manufacturing / totalCO2e) * 100)
                : 0,
          },
        },
        trends: Object.values(footprintsByDate).slice(0, 30),
        recentOrders: footprints.slice(0, 10).map((f) => ({
          orderId: f.orderId,
          orderNumber: f.order.orderNumber,
          totalCO2e: Math.round(f.totalCO2e * 100) / 100,
          breakdown: {
            transportation: Math.round(f.transportation * 100) / 100,
            packaging: Math.round(f.packaging * 100) / 100,
            warehousing: Math.round(f.warehousing * 100) / 100,
            manufacturing: Math.round(f.manufacturing * 100) / 100,
          },
          createdAt: f.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch carbon footprints:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch footprints",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sustainability/footprints
 * Calculate and store carbon footprint for an order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, transportation, packaging, warehousing, manufacturing } =
      body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Verify order exists and belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const totalCO2e =
      (transportation || 0) +
      (packaging || 0) +
      (warehousing || 0) +
      (manufacturing || 0);

    const footprint = await prisma.carbonFootprint.create({
      data: {
        orderId,
        totalCO2e,
        transportation: transportation || 0,
        packaging: packaging || 0,
        warehousing: warehousing || 0,
        manufacturing: manufacturing || 0,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      data: footprint,
    });
  } catch (error) {
    console.error("Failed to create carbon footprint:", error);
    return NextResponse.json(
      {
        error: "Failed to create footprint",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
