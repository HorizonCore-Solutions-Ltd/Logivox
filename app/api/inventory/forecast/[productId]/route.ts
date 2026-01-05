/**
 * Product Forecast Retrieval API
 * Get historical forecasts for a specific product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/forecast/[productId]
 * Retrieve latest or historical forecasts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeHistory = searchParams.get('history') === 'true';

    // Verify product access
    const product = await prisma.inventoryItem.findFirst({
      where: {
        id: productId,
        organizationId: session.user.organizationId
      },
      include: {
        product: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get latest forecast
    const latestForecast = await prisma.demandForecast.findFirst({
      where: { productId },
      orderBy: { generatedAt: 'desc' }
    });

    let historicalForecasts = [];
    if (includeHistory) {
      historicalForecasts = await prisma.demandForecast.findMany({
        where: { productId },
        orderBy: { generatedAt: 'desc' },
        take: limit
      });
    }

    // Calculate accuracy if we have historical data
    let accuracy = null;
    if (historicalForecasts.length > 0) {
      // Compare predictions vs actual sales
      const oldestForecast = historicalForecasts[historicalForecasts.length - 1];
      const forecastDate = new Date(oldestForecast.generatedAt);
      const endDate = new Date();
      
      const actualSales = await prisma.salesOrderItem.aggregate({
        where: {
          productId,
          createdAt: {
            gte: forecastDate,
            lte: endDate
          }
        },
        _sum: {
          quantity: true
        }
      });

      if (actualSales._sum.quantity && oldestForecast.avgDailyDemand) {
        const daysDiff = Math.ceil((endDate.getTime() - forecastDate.getTime()) / (1000 * 60 * 60 * 24));
        const predictedTotal = oldestForecast.avgDailyDemand * daysDiff;
        const actualTotal = actualSales._sum.quantity;
        accuracy = {
          predicted: Math.round(predictedTotal),
          actual: actualTotal,
          accuracy: Math.min(100, Math.round((1 - Math.abs(predictedTotal - actualTotal) / actualTotal) * 100)),
          period: `${daysDiff} days`
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          sku: product.product?.sku,
          name: product.product?.name,
          currentQuantity: product.quantity,
          availableQuantity: product.availableQty
        },
        latestForecast,
        historicalForecasts: includeHistory ? historicalForecasts : undefined,
        accuracy,
        statistics: {
          totalForecasts: historicalForecasts.length,
          avgConfidence: historicalForecasts.length > 0
            ? historicalForecasts.reduce((sum, f) => sum + f.confidence, 0) / historicalForecasts.length
            : null
        }
      }
    });

  } catch (error: any) {
    console.error('Forecast retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve forecast', message: error.message },
      { status: 500 }
    );
  }
}
