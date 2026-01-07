/**
 * Reporting & Analytics API
 * Comprehensive WMS reporting including inventory, fulfillment, operations, and financial analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@/lib/services/reporting.service';

export const dynamic = 'force-dynamic';

// GET - Generate various reports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type');
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const warehouseId = searchParams.get('warehouseId') || undefined;

    switch (reportType) {
      case 'inventory-valuation':
        const asOfDate = searchParams.get('asOfDate');
        const valuation = await ReportingService.getInventoryValuation({
          organizationId,
          warehouseId,
          asOfDate: asOfDate ? new Date(asOfDate) : undefined,
        });
        return NextResponse.json(valuation);

      case 'inventory-aging':
        const aging = await ReportingService.getInventoryAging({
          organizationId,
          warehouseId,
        });
        return NextResponse.json(aging);

      case 'inventory-turnover':
        const turnoverStart = searchParams.get('startDate');
        const turnoverEnd = searchParams.get('endDate');

        if (!turnoverStart || !turnoverEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const turnover = await ReportingService.getInventoryTurnover({
          organizationId,
          warehouseId,
          startDate: new Date(turnoverStart),
          endDate: new Date(turnoverEnd),
        });
        return NextResponse.json(turnover);

      case 'order-fulfillment':
        const fulfillmentStart = searchParams.get('startDate');
        const fulfillmentEnd = searchParams.get('endDate');

        if (!fulfillmentStart || !fulfillmentEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const fulfillment = await ReportingService.getOrderFulfillmentReport({
          organizationId,
          warehouseId,
          startDate: new Date(fulfillmentStart),
          endDate: new Date(fulfillmentEnd),
        });
        return NextResponse.json(fulfillment);

      case 'receiving-performance':
        const receivingStart = searchParams.get('startDate');
        const receivingEnd = searchParams.get('endDate');

        if (!receivingStart || !receivingEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const receiving = await ReportingService.getReceivingPerformance({
          organizationId,
          warehouseId,
          startDate: new Date(receivingStart),
          endDate: new Date(receivingEnd),
        });
        return NextResponse.json(receiving);

      case 'picking-performance':
        const pickingStart = searchParams.get('startDate');
        const pickingEnd = searchParams.get('endDate');

        if (!pickingStart || !pickingEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const picking = await ReportingService.getPickingPerformance({
          organizationId,
          warehouseId,
          startDate: new Date(pickingStart),
          endDate: new Date(pickingEnd),
        });
        return NextResponse.json(picking);

      case 'warehouse-utilization':
        if (!warehouseId) {
          return NextResponse.json(
            { error: 'Warehouse ID is required' },
            { status: 400 }
          );
        }

        const utilization = await ReportingService.getWarehouseUtilization({
          warehouseId,
        });
        return NextResponse.json(utilization);

      case 'kpi-dashboard':
        const kpiStart = searchParams.get('startDate');
        const kpiEnd = searchParams.get('endDate');

        if (!kpiStart || !kpiEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const kpis = await ReportingService.getKPIDashboard({
          organizationId,
          warehouseId,
          startDate: new Date(kpiStart),
          endDate: new Date(kpiEnd),
        });
        return NextResponse.json(kpis);

      case 'abc-analysis':
        const abcStart = searchParams.get('startDate');
        const abcEnd = searchParams.get('endDate');

        if (!abcStart || !abcEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const abc = await ReportingService.getABCAnalysis({
          organizationId,
          warehouseId,
          startDate: new Date(abcStart),
          endDate: new Date(abcEnd),
        });
        return NextResponse.json(abc);

      case 'stock-alerts':
        const alerts = await ReportingService.getStockAlerts({
          organizationId,
          warehouseId,
        });
        return NextResponse.json(alerts);

      case 'financial-summary':
        const financialStart = searchParams.get('startDate');
        const financialEnd = searchParams.get('endDate');

        if (!financialStart || !financialEnd) {
          return NextResponse.json(
            { error: 'Start and end dates are required' },
            { status: 400 }
          );
        }

        const financial = await ReportingService.getFinancialSummary({
          organizationId,
          startDate: new Date(financialStart),
          endDate: new Date(financialEnd),
        });
        return NextResponse.json(financial);

      default:
        return NextResponse.json(
          { 
            error: 'Invalid report type',
            availableTypes: [
              'inventory-valuation',
              'inventory-aging',
              'inventory-turnover',
              'order-fulfillment',
              'receiving-performance',
              'picking-performance',
              'warehouse-utilization',
              'kpi-dashboard',
              'abc-analysis',
              'stock-alerts',
              'financial-summary'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Reporting GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
