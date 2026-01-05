/**
 * Forecast Accuracy Reporting API
 * Validates forecast accuracy against actual sales
 * 
 * Target: 95%+ accuracy
 * Reporting: Daily, Weekly, Monthly
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/forecast/accuracy
 * Calculate forecast accuracy metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const groupBy = searchParams.get('groupBy') || 'product'; // product, category, overall

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all forecasts in period
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        generatedAt: {
          gte: startDate
        }
      },
      include: {
        product: {
          include: {
            product: true
          }
        }
      }
    });

    // Calculate accuracy for each forecast
    const accuracyResults = await Promise.all(
      forecasts.map(async (forecast) => {
        const forecastDate = new Date(forecast.generatedAt);
        const endDate = new Date();
        const daysSinceForecast = Math.min(
          Math.ceil((endDate.getTime() - forecastDate.getTime()) / (1000 * 60 * 60 * 24)),
          forecast.horizonDays
        );

        // Get actual sales in the forecast period
        const actualSales = await prisma.salesOrderItem.aggregate({
          where: {
            productId: forecast.productId,
            createdAt: {
              gte: forecastDate,
              lte: endDate
            }
          },
          _sum: {
            quantity: true
          }
        });

        const predictedTotal = forecast.avgDailyDemand * daysSinceForecast;
        const actualTotal = actualSales._sum.quantity || 0;
        
        let accuracy = 0;
        if (actualTotal > 0) {
          const error = Math.abs(predictedTotal - actualTotal);
          accuracy = Math.max(0, Math.min(100, (1 - error / actualTotal) * 100));
        }

        return {
          forecastId: forecast.id,
          productId: forecast.productId,
          productName: forecast.product?.product?.name || 'Unknown',
          category: forecast.product?.product?.category || 'Uncategorized',
          predicted: Math.round(predictedTotal),
          actual: actualTotal,
          accuracy: Math.round(accuracy),
          error: Math.round(Math.abs(predictedTotal - actualTotal)),
          daysCovered: daysSinceForecast,
          forecastConfidence: forecast.confidence
        };
      })
    );

    // Group results
    let groupedResults: any = {};
    
    if (groupBy === 'product') {
      groupedResults = accuracyResults.reduce((acc, result) => {
        if (!acc[result.productId]) {
          acc[result.productId] = {
            productId: result.productId,
            productName: result.productName,
            forecasts: [],
            avgAccuracy: 0
          };
        }
        acc[result.productId].forecasts.push(result);
        return acc;
      }, {} as any);

      // Calculate averages
      Object.values(groupedResults).forEach((group: any) => {
        group.avgAccuracy = Math.round(
          group.forecasts.reduce((sum: number, f: any) => sum + f.accuracy, 0) / group.forecasts.length
        );
      });
    }

    // Overall statistics
    const totalForecasts = accuracyResults.length;
    const avgAccuracy = totalForecasts > 0
      ? Math.round(accuracyResults.reduce((sum, r) => sum + r.accuracy, 0) / totalForecasts)
      : 0;
    const above95 = accuracyResults.filter(r => r.accuracy >= 95).length;
    const above90 = accuracyResults.filter(r => r.accuracy >= 90).length;
    const below80 = accuracyResults.filter(r => r.accuracy < 80).length;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          period: `${periodDays} days`,
          totalForecasts,
          avgAccuracy: `${avgAccuracy}%`,
          accuracyTarget: '95%',
          metTarget: avgAccuracy >= 95,
          distribution: {
            above95Percent: above95,
            above90Percent: above90,
            below80Percent: below80
          },
          performance: avgAccuracy >= 95 ? 'EXCELLENT' :
                       avgAccuracy >= 90 ? 'GOOD' :
                       avgAccuracy >= 80 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT'
        },
        results: groupBy === 'product' ? Object.values(groupedResults) : accuracyResults,
        topPerformers: accuracyResults
          .sort((a, b) => b.accuracy - a.accuracy)
          .slice(0, 10),
        needsImprovement: accuracyResults
          .filter(r => r.accuracy < 80)
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 10)
      }
    });

  } catch (error: any) {
    console.error('Accuracy report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate accuracy report', message: error.message },
      { status: 500 }
    );
  }
}
