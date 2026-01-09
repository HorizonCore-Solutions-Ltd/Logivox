/**
 * Predictive Analytics & Forecasting API
 * GET /api/returns/forecasts - Get return forecasts
 * POST /api/returns/forecasts/generate - Generate new forecast
 * GET /api/returns/analytics/trends - Get return trends
 * GET /api/returns/analytics/staffing - Get staffing recommendations
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ReturnsForecastingService } from "@/lib/services/returns/predictive-analytics";

const generateForecastSchema = z.object({
  periodDays: z.number().min(1).max(365).default(30),
  includeSeasonality: z.boolean().default(true),
  confidenceLevel: z.number().min(0.5).max(0.99).default(0.95),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // forecasts, trends, staffing

    if (type === "trends") {
      // Get return trends
      const trends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as return_count,
          SUM(total_amount) as total_value,
          AVG(total_amount) as avg_value,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM "RMA"
        WHERE organization_id = ${membership.organizationId}
          AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `;

      // Get top return reasons
      const topReasons = await prisma.$queryRaw`
        SELECT 
          rr.reason,
          rr.category,
          COUNT(*) as count,
          SUM(r.total_amount) as total_value
        FROM "RMA" r
        JOIN "ReturnReason" rr ON rr.id = r.return_reason_id
        WHERE r.organization_id = ${membership.organizationId}
          AND r.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY rr.id, rr.reason, rr.category
        ORDER BY count DESC
        LIMIT 10
      `;

      // Get top returned products
      const topProducts = await prisma.$queryRaw`
        SELECT 
          ri.sku,
          p.name as product_name,
          COUNT(*) as return_count,
          SUM(ri.quantity) as total_quantity,
          SUM(ri.unit_price * ri.quantity) as total_value
        FROM "RMAItem" ri
        JOIN "RMA" r ON r.id = ri.rma_id
        LEFT JOIN "Product" p ON p.id = ri.product_id
        WHERE r.organization_id = ${membership.organizationId}
          AND r.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY ri.sku, p.name
        ORDER BY return_count DESC
        LIMIT 20
      `;

      return NextResponse.json({
        trends,
        topReasons,
        topProducts,
      });
    }

    if (type === "staffing") {
      const forecastingService = new ReturnsForecastingService();
      const staffing = await forecastingService.recommendStaffing(
        membership.organizationId,
        30, // next 30 days
      );

      return NextResponse.json({ staffing });
    }

    // Get forecasts
    const forecasts = await prisma.$queryRaw`
      SELECT * FROM returns_forecasts
      WHERE organization_id = ${membership.organizationId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({ forecasts });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = generateForecastSchema.parse(body);

    // Get historical return data
    const historicalData = (await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as return_count,
        SUM(total_amount) as total_value,
        AVG(total_amount) as avg_value
      FROM "RMA"
      WHERE organization_id = ${membership.organizationId}
        AND created_at >= NOW() - INTERVAL '365 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `) as any[];

    // Get seasonal patterns
    const seasonalData = (await prisma.$queryRaw`
      SELECT 
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as count,
        AVG(total_amount) as avg_value
      FROM "RMA"
      WHERE organization_id = ${membership.organizationId}
        AND created_at >= NOW() - INTERVAL '365 days'
      GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(MONTH FROM created_at)
    `) as any[];

    const forecastingService = new ReturnsForecastingService();
    const forecast = await forecastingService.generateForecast({
      organizationId: membership.organizationId,
      historicalData: historicalData.map((d: any) => ({
        date: d.date,
        returnCount: parseInt(d.return_count),
        totalValue: parseFloat(d.total_value || 0),
        avgValue: parseFloat(d.avg_value || 0),
      })),
      periodDays: data.periodDays,
      includeSeasonality: data.includeSeasonality,
      confidenceLevel: data.confidenceLevel,
    });

    // Save forecast
    await prisma.$executeRaw`
      INSERT INTO returns_forecasts (
        id, organization_id, forecast_date, period_days,
        predicted_count, predicted_value, confidence_level,
        seasonal_factors, model_metadata, created_at, created_by
      ) VALUES (
        gen_random_uuid(), ${membership.organizationId}, NOW(), ${data.periodDays},
        ${forecast.predictedCount}, ${forecast.predictedValue}, ${data.confidenceLevel},
        ${JSON.stringify(forecast.seasonalFactors)}::jsonb,
        ${JSON.stringify(forecast.modelMetadata)}::jsonb,
        NOW(), ${session.user.id}
      )
    `;

    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "FORECAST_GENERATED",
        entityType: "FORECAST",
        entityId: forecast.id,
        metadata: {
          periodDays: data.periodDays,
          predictedCount: forecast.predictedCount,
          predictedValue: forecast.predictedValue,
        },
      },
    });

    return NextResponse.json({
      forecast,
      message: "Forecast generated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error generating forecast:", error);
    return NextResponse.json(
      {
        error: "Failed to generate forecast",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
