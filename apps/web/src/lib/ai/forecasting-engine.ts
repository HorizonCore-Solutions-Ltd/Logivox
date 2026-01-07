/**
 * Forecasting Engine for LogiVox
 *
 * Integrates AI forecasting models with database to provide
 * real-time inventory predictions and recommendations.
 */

import { prisma } from "@/lib/prisma";
import {
  generateForecast,
  analyzeStockTurnover,
  performABCAnalysis,
  calculateDemandVariability,
  type ForecastData,
  type StockOptimization,
  type TurnoverAnalysis,
  type ABCClassification,
} from "./inventory-forecasting";

// ============================================================================
// Forecast Generation for Products
// ============================================================================

export async function generateProductForecast(
  productId: string,
  tenantId: string,
): Promise<ForecastData | null> {
  try {
    // Fetch product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) {
      return null;
    }

    // Fetch historical sales data (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const bookings = await prisma.booking.findMany({
      where: {
        productId,
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Aggregate sales by day
    const dailySales: number[] = [];
    const salesByDate = new Map<string, number>();

    bookings.forEach((booking: { quantity: number; createdAt: Date }) => {
      const dateKey = booking.createdAt.toISOString().split("T")[0];
      if (!dateKey) return;

      const current = salesByDate.get(dateKey) || 0;
      salesByDate.set(dateKey, current + booking.quantity);
    });

    // Fill in missing days with 0 sales
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split("T")[0];
      if (dateKey) {
        dailySales.push(salesByDate.get(dateKey) || 0);
      }
    }

    // Generate forecast
    const forecast = await generateForecast(
      productId,
      dailySales,
      product.quantity,
      7, // 7 days lead time
      50, // $50 order cost
      product.unitCost * 0.2, // 20% of unit cost as holding cost
    );

    // Add product name
    forecast.productName = product.name;

    return forecast;
  } catch (error) {
    console.error("Error generating forecast:", error);
    return null;
  }
}

// ============================================================================
// Bulk Forecast Generation
// ============================================================================

export async function generateAllForecasts(
  tenantId: string,
  limit: number = 50,
): Promise<ForecastData[]> {
  try {
    // Get products with recent activity
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        quantity: {
          gte: 0,
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Generate forecasts in parallel
    const forecasts = await Promise.all(
      products.map((product: { id: string; name: string }) =>
        generateProductForecast(product.id, tenantId),
      ),
    );

    // Filter out null results
    return forecasts.filter((f): f is ForecastData => f !== null);
  } catch (error) {
    console.error("Error generating bulk forecasts:", error);
    return [];
  }
}

// ============================================================================
// Stock Optimization Recommendations
// ============================================================================

export async function generateStockOptimization(
  tenantId: string,
): Promise<StockOptimization[]> {
  try {
    const forecasts = await generateAllForecasts(tenantId);
    const optimizations: StockOptimization[] = [];

    for (const forecast of forecasts) {
      const currentStock = forecast.currentStock;
      const optimalStock =
        forecast.reorderPoint + forecast.suggestedOrderQuantity / 2;

      const overstock = Math.max(0, currentStock - optimalStock);
      const understock = Math.max(0, optimalStock - currentStock);

      let recommendation: StockOptimization["recommendation"];
      let suggestedAction: string;
      let estimatedCostSavings = 0;

      if (currentStock < forecast.reorderPoint) {
        recommendation = "order";
        suggestedAction = `Order ${forecast.suggestedOrderQuantity} units immediately. Current stock (${currentStock}) is below reorder point (${forecast.reorderPoint}).`;
      } else if (overstock > forecast.suggestedOrderQuantity) {
        recommendation = "reduce";
        suggestedAction = `Reduce stock by ${Math.round(overstock)} units through promotions or reduced ordering. Excess holding costs detected.`;
        estimatedCostSavings = overstock * 5; // $5 per unit holding cost
      } else {
        recommendation = "maintain";
        suggestedAction = `Stock levels optimal. Current: ${currentStock}, Optimal range: ${Math.round(forecast.reorderPoint)}-${Math.round(optimalStock)}`;
      }

      optimizations.push({
        productId: forecast.productId,
        currentStock,
        optimalStock: Math.round(optimalStock),
        overstock: Math.round(overstock),
        understock: Math.round(understock),
        recommendation,
        suggestedAction,
        estimatedCostSavings,
      });
    }

    // Sort by priority (orders first, then reductions, then maintenance)
    return optimizations.sort((a, b) => {
      const priority = { order: 0, reduce: 1, maintain: 2 };
      return priority[a.recommendation] - priority[b.recommendation];
    });
  } catch (error) {
    console.error("Error generating stock optimization:", error);
    return [];
  }
}

// ============================================================================
// Turnover Analysis
// ============================================================================

export async function analyzeTurnoverRates(
  tenantId: string,
  periodDays: number = 90,
): Promise<TurnoverAnalysis[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all products
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        quantity: true,
      },
    });

    // Get sales for each product
    const analyses: TurnoverAnalysis[] = [];

    for (const product of products) {
      const sales = await prisma.booking.aggregate({
        where: {
          productId: product.id,
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const soldQuantity = sales._sum.quantity || 0;
      const analysis = analyzeStockTurnover(
        soldQuantity,
        product.quantity,
        periodDays,
      );
      analysis.productId = product.id;

      analyses.push(analysis);
    }

    // Sort by turnover rate (descending)
    return analyses.sort((a, b) => b.turnoverRate - a.turnoverRate);
  } catch (error) {
    console.error("Error analyzing turnover:", error);
    return [];
  }
}

// ============================================================================
// ABC Classification
// ============================================================================

export async function classifyInventoryABC(
  tenantId: string,
  periodDays: number = 365,
): Promise<ABCClassification[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all products with their sales
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        unitPrice: true,
      },
    });

    // Calculate annual value for each product
    const productValues = await Promise.all(
      products.map(
        async (product: { id: string; name: string; unitPrice: number }) => {
          const sales = await prisma.booking.aggregate({
            where: {
              productId: product.id,
              tenantId,
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
              status: {
                in: ["CONFIRMED", "COMPLETED"],
              },
            },
            _sum: {
              quantity: true,
            },
          });

          const soldQuantity = sales._sum.quantity || 0;
          const annualValue = soldQuantity * product.unitPrice;

          return {
            id: product.id,
            annualValue,
          };
        },
      ),
    );

    return performABCAnalysis(productValues);
  } catch (error) {
    console.error("Error performing ABC analysis:", error);
    return [];
  }
}

// ============================================================================
// Demand Variability Analysis
// ============================================================================

export async function analyzeDemandVariability(
  productId: string,
  tenantId: string,
  periodDays: number = 90,
) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Fetch daily sales
    const bookings = await prisma.booking.findMany({
      where: {
        productId,
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
    });

    // Aggregate by day
    const salesByDate = new Map<string, number>();
    bookings.forEach((booking: { quantity: number; createdAt: Date }) => {
      const dateKey = booking.createdAt.toISOString().split("T")[0];
      if (!dateKey) return;

      const current = salesByDate.get(dateKey) || 0;
      salesByDate.set(dateKey, current + booking.quantity);
    });

    // Convert to array
    const dailySales: number[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split("T")[0];
      if (dateKey) {
        dailySales.push(salesByDate.get(dateKey) || 0);
      }
    }

    return calculateDemandVariability(dailySales);
  } catch (error) {
    console.error("Error analyzing demand variability:", error);
    return null;
  }
}

// ============================================================================
// Smart Reorder Alerts
// ============================================================================

export interface ReorderAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  urgency: "critical" | "high" | "medium" | "low";
  daysUntilStockout: number;
  estimatedStockoutDate: Date;
  message: string;
}

export async function generateReorderAlerts(
  tenantId: string,
): Promise<ReorderAlert[]> {
  try {
    const forecasts = await generateAllForecasts(tenantId);
    const alerts: ReorderAlert[] = [];

    for (const forecast of forecasts) {
      if (forecast.currentStock <= forecast.reorderPoint) {
        const daysUntilStockout =
          forecast.averageDailySales > 0
            ? forecast.currentStock / forecast.averageDailySales
            : Infinity;

        let urgency: ReorderAlert["urgency"];
        if (daysUntilStockout <= 3) {
          urgency = "critical";
        } else if (daysUntilStockout <= 7) {
          urgency = "high";
        } else if (daysUntilStockout <= 14) {
          urgency = "medium";
        } else {
          urgency = "low";
        }

        const estimatedStockoutDate = new Date();
        estimatedStockoutDate.setDate(
          estimatedStockoutDate.getDate() + Math.floor(daysUntilStockout),
        );

        alerts.push({
          productId: forecast.productId,
          productName: forecast.productName,
          currentStock: forecast.currentStock,
          reorderPoint: forecast.reorderPoint,
          suggestedQuantity: forecast.suggestedOrderQuantity,
          urgency,
          daysUntilStockout: Math.floor(daysUntilStockout),
          estimatedStockoutDate,
          message: `${forecast.productName} is at ${forecast.currentStock} units (${Math.round(daysUntilStockout)} days of supply). Reorder ${forecast.suggestedOrderQuantity} units.`,
        });
      }
    }

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return alerts.sort(
      (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency],
    );
  } catch (error) {
    console.error("Error generating reorder alerts:", error);
    return [];
  }
}

// ============================================================================
// Forecast Accuracy Tracking
// ============================================================================

export async function trackForecastAccuracy(
  productId: string,
  tenantId: string,
  forecastDate: Date,
  predictedDemand: number,
): Promise<number> {
  try {
    // Get actual sales for the forecast date
    const startOfDay = new Date(forecastDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(forecastDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await prisma.booking.aggregate({
      where: {
        productId,
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const actualDemand = sales._sum.quantity || 0;

    // Calculate accuracy (MAPE - Mean Absolute Percentage Error)
    const error = Math.abs(actualDemand - predictedDemand);
    const accuracy = actualDemand > 0 ? 1 - error / actualDemand : 0;

    return Math.max(0, Math.min(1, accuracy));
  } catch (error) {
    console.error("Error tracking forecast accuracy:", error);
    return 0;
  }
}
