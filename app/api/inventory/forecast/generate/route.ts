/**
 * AI-Powered Demand Forecasting API
 * Generates advanced ML-based inventory forecasts
 * 
 * Features:
 * - Ensemble ML models (SMA, EMA, Linear, Seasonal)
 * - 95%+ accuracy target
 * - Confidence intervals
 * - Risk assessments
 * - Smart recommendations
 * 
 * Performance: < 200ms (p95)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedInventoryService } from '@/lib/services/inventory/advanced-inventory-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/inventory/forecast/generate
 * Generate demand forecast for specific product
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;
    const body = await request.json();
    const { productId, horizonDays = 90 } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (horizonDays < 7 || horizonDays > 365) {
      return NextResponse.json(
        {
          error: 'Horizon days must be between 7 and 365',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to organization
    const product = await prisma.inventoryItem.findFirst({
      where: {
        id: productId,
        organizationId
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Generate forecast
    const intelligence = await advancedInventoryService.generateAdvancedForecast(
      productId,
      horizonDays
    );

    // Save forecast to database for historical tracking
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
          optimalStockLevel: intelligence.optimalStockLevel,
          velocityClass: intelligence.velocityClass,
          velocityScore: intelligence.velocityScore
        } as any
      }
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        forecastId: forecast.id,
        intelligence,
        metadata: {
          generatedAt: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
          organizationId,
          horizonDays
        }
      }
    });

  } catch (error: any) {
    console.error('Forecast generation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate forecast',
        code: 'FORECAST_ERROR',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inventory/forecast/generate
 * Get forecast configuration and capabilities
 */
export async function GET() {
  return NextResponse.json({
    capabilities: {
      models: [
        {
          name: 'Simple Moving Average (SMA)',
          weight: 0.10,
          bestFor: 'Stable demand patterns'
        },
        {
          name: 'Exponential Moving Average (EMA)',
          weight: 0.20,
          bestFor: 'Recent trend emphasis'
        },
        {
          name: 'Linear Regression',
          weight: 0.30,
          bestFor: 'Clear trend lines'
        },
        {
          name: 'Seasonal Decomposition',
          weight: 0.40,
          bestFor: 'Seasonal patterns'
        }
      ],
      horizonRange: {
        min: 7,
        max: 365,
        recommended: 90
      },
      accuracyTarget: '95%+',
      performanceTarget: '<200ms (p95)',
      features: [
        'Confidence intervals',
        'Risk assessment (stockout/overstock)',
        'Optimal stock level calculation',
        'Smart recommendations',
        'ABC velocity classification',
        'Financial impact analysis'
      ]
    }
  });
}
