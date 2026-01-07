import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const horizon = parseInt(searchParams.get("horizon") || "30");

    // Generate mock forecast data based on historical demand
    const forecasts = await (prisma as any).demandForecast.findMany({
      where: {
        forecastDate: {
          gte: new Date(),
          lte: new Date(Date.now() + horizon * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
        model: {
          select: {
            modelName: true,
            version: true,
          },
        },
      },
      orderBy: {
        forecastDate: "asc",
      },
      take: 100,
    });

    const formattedForecasts = forecasts.map((f: any) => ({
      id: f.id,
      sku: f.product.sku,
      productName: f.product.name,
      forecastDate: f.forecastDate.toISOString(),
      predictedDemand: f.predictedDemand,
      actualDemand: f.actualDemand || undefined,
      confidence: f.confidence,
      modelVersion: `${f.model.modelName}-${f.model.version}`,
      accuracy: f.actualDemand
        ? 1 - Math.abs(f.predictedDemand - f.actualDemand) / f.actualDemand
        : undefined,
    }));

    return NextResponse.json(formattedForecasts);
  } catch (error) {
    console.error("Error fetching forecasts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
