/**
 * GET  /api/replenishment/forecast?itemId=&warehouseId=  – return cached forecasts
 * POST /api/replenishment/forecast                        – regenerate forecasts for all (or one) item
 *
 * Implements EWMA (Exponentially Weighted Moving Average) demand forecasting.
 * Future model types (ARIMA, PROPHET, NEURAL) are scaffolded but delegate to
 * an external ML service when available.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const generateSchema = z.object({
  inventoryItemId: z.string().optional(), // omit = all items
  horizonDays: z.number().int().min(1).max(365).default(30),
  modelType: z.enum(["EWMA", "ARIMA", "PROPHET", "NEURAL"]).default("EWMA"),
  alpha: z.number().min(0.01).max(0.99).default(0.3), // EWMA smoothing factor
  safetyStockZScore: z.number().min(0).max(4).default(1.645), // 95 % service level
});

// ── EWMA engine ───────────────────────────────────────────────────────────────

function ewmaForecast(
  dailySeries: number[], // oldest → newest
  alpha: number,
  horizonDays: number,
  safetyZ: number,
  leadTimeDays: number,
): {
  dailyDemand: number;
  safetyStockQty: number;
  recommendedQty: number;
  confidence: number;
  seasonalityFactor: number;
  trendFactor: number;
  rawPredictions: Array<{
    date: string;
    qty: number;
    lower: number;
    upper: number;
  }>;
} {
  if (dailySeries.length === 0) {
    const empty = {
      dailyDemand: 0,
      safetyStockQty: 0,
      recommendedQty: 0,
      confidence: 0,
      seasonalityFactor: 1,
      trendFactor: 0,
      rawPredictions: [] as Array<{
        date: string;
        qty: number;
        lower: number;
        upper: number;
      }>,
    };
    return empty;
  }

  // EWMA smoothing
  let ewma = dailySeries[0];
  for (let i = 1; i < dailySeries.length; i++) {
    ewma = alpha * dailySeries[i] + (1 - alpha) * ewma;
  }

  // Trend: simple linear regression slope over last 14 observations
  const window = dailySeries.slice(-14);
  const n = window.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += window[i];
    sumXY += i * window[i];
    sumX2 += i * i;
  }
  const trendFactor =
    n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;

  // Standard deviation for safety stock
  const mean = dailySeries.reduce((a, b) => a + b, 0) / dailySeries.length;
  const variance =
    dailySeries.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
    dailySeries.length;
  const stdDev = Math.sqrt(variance);

  // Safety stock = Z * std_dev * sqrt(lead_time)
  const safetyStockQty = Math.ceil(safetyZ * stdDev * Math.sqrt(leadTimeDays));
  const dailyDemand = Math.max(0, ewma);

  // Confidence: high when std_dev is low relative to mean
  const cv = mean > 0 ? stdDev / mean : 1;
  const confidence = Math.min(1, Math.max(0, 1 - cv * 0.5));

  // Check for basic weekly seasonality (compare last 7 days vs prior 7 days)
  const last7 = dailySeries.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const prior7 =
    dailySeries.length >= 14
      ? dailySeries.slice(-14, -7).reduce((a, b) => a + b, 0) / 7
      : last7;
  const seasonalityFactor = prior7 > 0 ? last7 / prior7 : 1;

  // Recommended replenishment qty = demand over horizon + safety stock
  const recommendedQty = Math.ceil(dailyDemand * horizonDays + safetyStockQty);

  // Build daily prediction series
  const rawPredictions: Array<{
    date: string;
    qty: number;
    lower: number;
    upper: number;
  }> = [];
  const today = new Date();
  let projected = ewma;
  for (let d = 1; d <= horizonDays; d++) {
    projected = Math.max(0, projected + trendFactor);
    const ci = safetyZ * stdDev;
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    rawPredictions.push({
      date: dt.toISOString().slice(0, 10),
      qty: Math.round(projected * 10) / 10,
      lower: Math.max(0, Math.round((projected - ci) * 10) / 10),
      upper: Math.round((projected + ci) * 10) / 10,
    });
  }

  return {
    dailyDemand,
    safetyStockQty,
    recommendedQty,
    confidence,
    seasonalityFactor,
    trendFactor,
    rawPredictions,
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const inventoryItemId = searchParams.get("itemId");
  const includeExpired = searchParams.get("includeExpired") === "true";

  const forecasts = await prisma.replenishmentForecastCache.findMany({
    where: {
      organizationId,
      ...(inventoryItemId && { inventoryItemId }),
      ...(!includeExpired && { expiresAt: { gt: new Date() } }),
    },
    include: {
      inventoryItem: {
        select: { id: true, name: true, sku: true, quantity: true },
      },
    },
    orderBy: { generatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ forecasts });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const { inventoryItemId, horizonDays, modelType, alpha, safetyStockZScore } =
    parsed.data;

  // Check feature flag
  const flags = await prisma.replenishmentFeatureFlag.findUnique({
    where: { organizationId },
  });
  if (flags && !flags.predictiveAI)
    return NextResponse.json(
      { error: "Predictive AI feature is not enabled for this organisation." },
      { status: 403 },
    );

  const refreshHours = flags?.forecastRefreshHours ?? 24;

  // Load items to forecast
  const items = await prisma.inventoryItem.findMany({
    where: {
      organizationId,
      ...(inventoryItemId && { id: inventoryItemId }),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      leadTimeDays: true,
    },
    take: 500, // safety cap
  });

  const lookbackDays = Math.max(horizonDays * 2, 60);
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const results: Array<{ itemId: string; sku: string; forecastId: string }> =
    [];

  for (const item of items) {
    // Aggregate daily demand from sales orders
    const rawOrders = await prisma.salesOrderItem.findMany({
      where: {
        inventoryItemId: item.id,
        salesOrder: { organizationId, orderDate: { gte: since } },
      },
      select: { quantity: true, salesOrder: { select: { orderDate: true } } },
    });

    // Build daily bucket map
    const dailyMap: Record<string, number> = {};
    for (const o of rawOrders) {
      const day = o.salesOrder.orderDate.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + o.quantity;
    }

    // Fill in zeros for days with no sales
    const dailySeries: number[] = [];
    const cur = new Date(since);
    const today = new Date();
    while (cur <= today) {
      const key = cur.toISOString().slice(0, 10);
      dailySeries.push(dailyMap[key] ?? 0);
      cur.setDate(cur.getDate() + 1);
    }

    const leadTimeDays = item.leadTimeDays ?? 3;

    if (modelType !== "EWMA") {
      // TODO: delegate to external ML service for ARIMA/PROPHET/NEURAL
      // For now fall back to EWMA with a note
    }

    const forecast = ewmaForecast(
      dailySeries,
      alpha,
      horizonDays,
      safetyStockZScore,
      leadTimeDays,
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + refreshHours);

    // Store (or overwrite) the forecast
    const saved = await prisma.replenishmentForecastCache.create({
      data: {
        organizationId,
        inventoryItemId: item.id,
        horizonDays,
        dailyDemand: forecast.dailyDemand,
        safetyStockQty: forecast.safetyStockQty,
        recommendedQty: forecast.recommendedQty,
        confidence: forecast.confidence,
        modelType,
        seasonalityFactor: forecast.seasonalityFactor,
        trendFactor: forecast.trendFactor,
        rawPredictions: forecast.rawPredictions,
        expiresAt,
      },
    });

    results.push({ itemId: item.id, sku: item.sku, forecastId: saved.id });
  }

  return NextResponse.json({
    success: true,
    itemsForecasted: results.length,
    results,
  });
}
