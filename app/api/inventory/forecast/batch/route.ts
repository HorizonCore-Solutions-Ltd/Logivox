/**
 * Batch Forecasting API
 * Generate forecasts for multiple products in parallel
 * 
 * Performance: Parallelized with Promise.allSettled
 * Ideal for: Daily automated forecasting runs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedInventoryService } from '@/lib/services/inventory/advanced-inventory-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch processing

/**
 * POST /api/inventory/forecast/batch
 * Generate forecasts for multiple products
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;
    const body = await request.json();
    const {
      productIds,
      filters,
      horizonDays = 90,
      maxConcurrent = 10
    } = body;

    let productsToForecast: string[] = [];

    // If specific product IDs provided
    if (productIds && Array.isArray(productIds)) {
      productsToForecast = productIds;
    } else {
      // Otherwise, use filters or get all active products
      const where: any = {
        organizationId,
        isActive: true
      };

      // Apply filters
      if (filters?.velocityClass) {
        // Get products with specific velocity class
        const classifications = await prisma.velocityClassification.findMany({
          where: {
            velocityClass: filters.velocityClass
          }
        });
        where.id = {
          in: classifications.map(c => c.productId)
        };
      }

      if (filters?.minValue !== undefined) {
        where.quantity = {
          gte: filters.minValue
        };
      }

      const products = await prisma.inventoryItem.findMany({
        where,
        select: { id: true },
        take: filters?.limit || 100
      });

      productsToForecast = products.map(p => p.id);
    }

    if (productsToForecast.length === 0) {
      return NextResponse.json(
        { error: 'No products to forecast', code: 'NO_PRODUCTS' },
        { status: 400 }
      );
    }

    // Process in batches to avoid overwhelming the system
    const results = [];
    const errors = [];
    
    for (let i = 0; i < productsToForecast.length; i += maxConcurrent) {
      const batch = productsToForecast.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (productId) => {
          try {
            const intelligence = await advancedInventoryService.generateAdvancedForecast(
              productId,
              horizonDays
            );

            // Save to database
            const forecast = await prisma.demandForecast.create({
              data: {
                productId,
                horizonDays,
                predictions: intelligence.predictions as any,
                avgDailyDemand: intelligence.avgDailyDemand,
                confidence: intelligence.predictions[0]?.confidence || 0,
                modelType: 'ENSEMBLE',
                metadata: {
                  stockoutRisk: intelligence.stockoutRisk,
                  overstockRisk: intelligence.overstockRisk,
                  optimalStockLevel: intelligence.optimalStockLevel
                } as any
              }
            });

            return {
              productId,
              forecastId: forecast.id,
              success: true,
              intelligence
            };
          } catch (error: any) {
            return {
              productId,
              success: false,
              error: error.message
            };
          }
        })
      );

      // Collect results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({
            productId: 'unknown',
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: productsToForecast.length,
          successful: results.length,
          failed: errors.length,
          processingTime: `${responseTime}ms`,
          avgTimePerProduct: `${Math.round(responseTime / productsToForecast.length)}ms`
        },
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('Batch forecast error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate batch forecasts',
        message: error.message
      },
      { status: 500 }
    );
  }
}
