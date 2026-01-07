/**
 * Reporting Service
 * 
 * Comprehensive reporting and analytics:
 * - Inventory reports (valuation, aging, turnover)
 * - Order fulfillment reports
 * - Operational performance
 * - Financial summaries
 * - KPI dashboards
 * - Export capabilities
 */

import { prisma } from '@/lib/prisma';
import { SalesOrderStatus } from '@prisma/client';

export class ReportingService {
  
  /**
   * Generate inventory valuation report
   */
  static async getInventoryValuation(params: {
    organizationId: string;
    warehouseId?: string;
    asOfDate?: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
      isActive: true,
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
    });

    let totalValue = 0;
    let totalQuantity = 0;

    const itemDetails = items.map(item => {
      const quantity = item.quantity;
      const unitCost = Number(item.costPrice || 0);
      const value = quantity * unitCost;
      
      totalValue += value;
      totalQuantity += quantity;

      return {
        sku: item.sku,
        name: item.name,
        quantity,
        unitCost: unitCost.toFixed(2),
        totalValue: value.toFixed(2),
        warehouseId: item.warehouseId,
      };
    });

    return {
      organizationId: params.organizationId,
      warehouseId: params.warehouseId,
      asOfDate: params.asOfDate || new Date(),
      totalItems: items.length,
      totalQuantity,
      totalValue: totalValue.toFixed(2),
      items: itemDetails.sort((a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue)),
    };
  }

  /**
   * Generate inventory aging report
   */
  static async getInventoryAging(params: {
    organizationId: string;
    warehouseId?: string;
  }) {
    const where: any = {
      organizationId: params.organizationId,
      isActive: true,
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
    });

    const now = new Date();
    const aging = {
      under30Days: { count: 0, value: 0 },
      days30to60: { count: 0, value: 0 },
      days60to90: { count: 0, value: 0 },
      over90Days: { count: 0, value: 0 },
    };

    for (const item of items) {
      const ageInDays = (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const value = item.quantity * Number(item.costPrice || 0);

      if (ageInDays <= 30) {
        aging.under30Days.count++;
        aging.under30Days.value += value;
      } else if (ageInDays <= 60) {
        aging.days30to60.count++;
        aging.days30to60.value += value;
      } else if (ageInDays <= 90) {
        aging.days60to90.count++;
        aging.days60to90.value += value;
      } else {
        aging.over90Days.count++;
        aging.over90Days.value += value;
      }
    }

    return {
      organizationId: params.organizationId,
      warehouseId: params.warehouseId,
      reportDate: now,
      aging: {
        under30Days: {
          count: aging.under30Days.count,
          value: aging.under30Days.value.toFixed(2),
        },
        days30to60: {
          count: aging.days30to60.count,
          value: aging.days30to60.value.toFixed(2),
        },
        days60to90: {
          count: aging.days60to90.count,
          value: aging.days60to90.value.toFixed(2),
        },
        over90Days: {
          count: aging.over90Days.count,
          value: aging.over90Days.value.toFixed(2),
        },
      },
    };
  }

  /**
   * Generate inventory turnover report
   */
  static async getInventoryTurnover(params: {
    organizationId: string;
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    // Get inventory movements
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...where,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      include: {
        inventoryItem: true,
      },
    });

    // Calculate turnover by item
    const itemTurnover: Record<string, any> = {};

    for (const movement of movements) {
      const itemId = movement.inventoryItemId;
      
      if (!itemTurnover[itemId]) {
        itemTurnover[itemId] = {
          sku: movement.inventoryItem.sku,
          name: movement.inventoryItem.name,
          totalSold: 0,
          averageInventory: movement.inventoryItem.quantity,
        };
      }

      if (movement.type === 'SALE') {
        itemTurnover[itemId].totalSold += Math.abs(movement.quantity);
      }
    }

    // Calculate turnover ratio
    const turnoverData = Object.values(itemTurnover).map((item: any) => {
      const turnoverRatio = item.averageInventory > 0 
        ? item.totalSold / item.averageInventory 
        : 0;

      return {
        ...item,
        turnoverRatio: turnoverRatio.toFixed(2),
      };
    });

    return {
      organizationId: params.organizationId,
      period: { startDate: params.startDate, endDate: params.endDate },
      items: turnoverData.sort((a, b) => parseFloat(b.turnoverRatio) - parseFloat(a.turnoverRatio)),
    };
  }

  /**
   * Generate order fulfillment report
   */
  static async getOrderFulfillmentReport(params: {
    organizationId: string;
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        items: true,
      },
    });

    const stats = {
      totalOrders: orders.length,
      byStatus: {} as Record<string, number>,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0,
      averageItemsPerOrder: 0,
      onTimeDelivery: 0,
    };

    for (const order of orders) {
      // Count by status
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;

      // Calculate revenue
      const orderTotal = Number(order.total || 0);
      stats.totalRevenue += orderTotal;

      // Count items
      stats.totalItems += order.items.length;

      // Check on-time delivery
      if (order.status === SalesOrderStatus.DELIVERED && order.requestedDate && order.shippedDate) {
        if (order.shippedDate <= order.requestedDate) {
          stats.onTimeDelivery++;
        }
      }
    }

    stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
    stats.averageItemsPerOrder = stats.totalOrders > 0 ? stats.totalItems / stats.totalOrders : 0;

    const onTimeRate = stats.totalOrders > 0 
      ? (stats.onTimeDelivery / stats.totalOrders) * 100 
      : 0;

    return {
      organizationId: params.organizationId,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalOrders: stats.totalOrders,
      ordersByStatus: stats.byStatus,
      totalRevenue: stats.totalRevenue.toFixed(2),
      averageOrderValue: stats.averageOrderValue.toFixed(2),
      totalItems: stats.totalItems,
      averageItemsPerOrder: stats.averageItemsPerOrder.toFixed(2),
      onTimeDeliveryRate: onTimeRate.toFixed(2) + '%',
    };
  }

  /**
   * Generate receiving performance report
   */
  static async getReceivingPerformance(params: {
    organizationId: string;
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const grns = await prisma.goodsReceiptNote.findMany({
      where,
      include: {
        items: true,
      },
    });

    const stats = {
      totalReceipts: grns.length,
      totalItems: 0,
      totalQuantity: 0,
      averageProcessingTime: 0,
      byStatus: {} as Record<string, number>,
    };

    let totalProcessingMinutes = 0;
    let processedCount = 0;

    for (const grn of grns) {
      stats.byStatus[grn.status] = (stats.byStatus[grn.status] || 0) + 1;
      stats.totalItems += grn.items.length;

      for (const item of grn.items) {
        stats.totalQuantity += item.receivedQuantity;
      }

      // Calculate processing time
      if (grn.receivedDate && grn.createdAt) {
        const processingTime = (grn.receivedDate.getTime() - grn.createdAt.getTime()) / (1000 * 60);
        totalProcessingMinutes += processingTime;
        processedCount++;
      }
    }

    stats.averageProcessingTime = processedCount > 0 
      ? totalProcessingMinutes / processedCount 
      : 0;

    return {
      organizationId: params.organizationId,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalReceipts: stats.totalReceipts,
      totalItems: stats.totalItems,
      totalQuantity: stats.totalQuantity,
      averageProcessingMinutes: stats.averageProcessingTime.toFixed(0),
      receiptsByStatus: stats.byStatus,
    };
  }

  /**
   * Generate picking performance report
   */
  static async getPickingPerformance(params: {
    organizationId: string;
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const pickLists = await prisma.pickList.findMany({
      where,
      include: {
        items: true,
      },
    });

    const stats = {
      totalPickLists: pickLists.length,
      totalItems: 0,
      totalQuantityPicked: 0,
      accuracyRate: 0,
      averagePickTime: 0,
      byStatus: {} as Record<string, number>,
    };

    let totalPickMinutes = 0;
    let completedCount = 0;
    let accurateItems = 0;

    for (const pickList of pickLists) {
      stats.byStatus[pickList.status] = (stats.byStatus[pickList.status] || 0) + 1;

      for (const item of pickList.items) {
        stats.totalItems++;
        const quantityPicked = item.quantityPicked || 0;
        stats.totalQuantityPicked += quantityPicked;

        // Check accuracy
        if (quantityPicked === item.quantityToPick) {
          accurateItems++;
        }
      }

      // Calculate pick time
      if (pickList.completedDate && pickList.assignedDate) {
        const pickTime = (pickList.completedDate.getTime() - pickList.assignedDate.getTime()) / (1000 * 60);
        totalPickMinutes += pickTime;
        completedCount++;
      }
    }

    stats.accuracyRate = stats.totalItems > 0 
      ? (accurateItems / stats.totalItems) * 100 
      : 100;

    stats.averagePickTime = completedCount > 0 
      ? totalPickMinutes / completedCount 
      : 0;

    return {
      organizationId: params.organizationId,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalPickLists: stats.totalPickLists,
      totalItems: stats.totalItems,
      totalQuantityPicked: stats.totalQuantityPicked,
      accuracyRate: stats.accuracyRate.toFixed(2) + '%',
      averagePickMinutes: stats.averagePickTime.toFixed(0),
      pickListsByStatus: stats.byStatus,
    };
  }

  /**
   * Generate warehouse utilization report
   */
  static async getWarehouseUtilization(params: {
    warehouseId: string;
  }) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.warehouseId },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Get inventory
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { warehouseId: params.warehouseId },
    });

    const totalItems = inventoryItems.length;
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const reservedQty = inventoryItems.reduce((sum, item) => sum + item.reservedQty, 0);
    const availableQty = inventoryItems.reduce((sum, item) => sum + item.availableQty, 0);

    const utilizationRate = totalQuantity > 0 
      ? (reservedQty / totalQuantity) * 100 
      : 0;

    return {
      warehouseId: params.warehouseId,
      warehouseName: warehouse.name,
      totalInventoryItems: totalItems,
      totalQuantity,
      reservedQuantity: reservedQty,
      availableQuantity: availableQty,
      utilizationRate: utilizationRate.toFixed(2) + '%',
    };
  }

  /**
   * Generate KPI dashboard
   */
  static async getKPIDashboard(params: {
    organizationId: string;
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    // Run multiple reports in parallel
    const [fulfillment, receiving, picking] = await Promise.all([
      this.getOrderFulfillmentReport(params),
      this.getReceivingPerformance(params),
      this.getPickingPerformance(params),
    ]);

    return {
      organizationId: params.organizationId,
      warehouseId: params.warehouseId,
      period: { startDate: params.startDate, endDate: params.endDate },
      kpis: {
        orderFulfillment: {
          totalOrders: fulfillment.totalOrders,
          totalRevenue: fulfillment.totalRevenue,
          averageOrderValue: fulfillment.averageOrderValue,
          onTimeDeliveryRate: fulfillment.onTimeDeliveryRate,
        },
        receiving: {
          totalReceipts: receiving.totalReceipts,
          totalItems: receiving.totalItems,
          averageProcessingMinutes: receiving.averageProcessingMinutes,
        },
        picking: {
          totalPickLists: picking.totalPickLists,
          accuracyRate: picking.accuracyRate,
          averagePickMinutes: picking.averagePickMinutes,
        },
      },
    };
  }

  /**
   * Generate ABC analysis report
   */
  static async getABCAnalysis(params: {
    organizationId: string;
    warehouseId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    // Get sales data
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        type: 'SALE',
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      include: {
        inventoryItem: true,
      },
    });

    // Calculate revenue by item
    const itemRevenue: Record<string, any> = {};

    for (const movement of movements) {
      const itemId = movement.inventoryItemId;
      const quantity = Math.abs(movement.quantity);
      const unitCost = Number(movement.inventoryItem.costPrice || 0);
      const revenue = quantity * unitCost;

      if (!itemRevenue[itemId]) {
        itemRevenue[itemId] = {
          sku: movement.inventoryItem.sku,
          name: movement.inventoryItem.name,
          revenue: 0,
          quantity: 0,
        };
      }

      itemRevenue[itemId].revenue += revenue;
      itemRevenue[itemId].quantity += quantity;
    }

    // Sort by revenue
    const sorted = Object.values(itemRevenue).sort((a: any, b: any) => b.revenue - a.revenue);

    // Calculate total revenue
    const totalRevenue = sorted.reduce((sum: number, item: any) => sum + item.revenue, 0);

    // Classify items (A: 80%, B: 15%, C: 5%)
    let cumulativeRevenue = 0;
    const classified = sorted.map((item: any) => {
      cumulativeRevenue += item.revenue;
      const percentage = (cumulativeRevenue / totalRevenue) * 100;

      let classification = 'C';
      if (percentage <= 80) {
        classification = 'A';
      } else if (percentage <= 95) {
        classification = 'B';
      }

      return {
        ...item,
        revenue: item.revenue.toFixed(2),
        classification,
        cumulativePercentage: percentage.toFixed(2),
      };
    });

    const categoryCount = {
      A: classified.filter(i => i.classification === 'A').length,
      B: classified.filter(i => i.classification === 'B').length,
      C: classified.filter(i => i.classification === 'C').length,
    };

    return {
      organizationId: params.organizationId,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalRevenue: totalRevenue.toFixed(2),
      totalItems: sorted.length,
      categoryCount,
      items: classified,
    };
  }

  /**
   * Generate stock alert report
   */
  static async getStockAlerts(params: {
    organizationId: string;
    warehouseId?: string;
  }) {
    const where: any = {
      organizationId: params.organizationId,
      isActive: true,
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
    });

    const alerts = {
      outOfStock: [] as any[],
      lowStock: [] as any[],
      overstock: [] as any[],
    };

    for (const item of items) {
      const quantity = item.quantity;
      const reorderPoint = item.reorderPoint || 0;
      const maxStock = item.maxStockLevel || 0;

      if (quantity === 0) {
        alerts.outOfStock.push({
          sku: item.sku,
          name: item.name,
          quantity,
          reorderPoint,
        });
      } else if (quantity <= reorderPoint) {
        alerts.lowStock.push({
          sku: item.sku,
          name: item.name,
          quantity,
          reorderPoint,
          shortfall: reorderPoint - quantity,
        });
      } else if (maxStock > 0 && quantity > maxStock) {
        alerts.overstock.push({
          sku: item.sku,
          name: item.name,
          quantity,
          maxStock,
          excess: quantity - maxStock,
        });
      }
    }

    return {
      organizationId: params.organizationId,
      warehouseId: params.warehouseId,
      reportDate: new Date(),
      summary: {
        outOfStock: alerts.outOfStock.length,
        lowStock: alerts.lowStock.length,
        overstock: alerts.overstock.length,
      },
      alerts,
    };
  }

  /**
   * Generate financial summary
   */
  static async getFinancialSummary(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    // Sales orders
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    // Purchase orders
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const totalSales = salesOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalPurchases = purchaseOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const grossProfit = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    return {
      organizationId: params.organizationId,
      period: { startDate: params.startDate, endDate: params.endDate },
      totalSales: totalSales.toFixed(2),
      totalPurchases: totalPurchases.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      profitMargin: profitMargin.toFixed(2) + '%',
      salesOrderCount: salesOrders.length,
      purchaseOrderCount: purchaseOrders.length,
    };
  }
}
