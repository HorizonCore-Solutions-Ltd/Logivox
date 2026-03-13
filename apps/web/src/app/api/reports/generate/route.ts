import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reports/generate
 *
 * Generate custom reports with dynamic fields and filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { template, fields, filters, dateRange, chartConfig } =
      await request.json();

    let rows: any[] = [];

    // Generate data based on template
    switch (template) {
      case "inventory-valuation":
        rows = await generateInventoryValuation(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "inventory-turnover":
        rows = await generateInventoryTurnover(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "stock-movement":
        rows = await generateStockMovement(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "order-summary":
        rows = await generateOrderSummary(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "order-fulfillment-time":
        rows = await generateFulfillmentTime(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "picking-efficiency":
        rows = await generatePickingEfficiency(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "warehouse-utilization":
        rows = await generateWarehouseUtilization(
          session.user.organizationId,
          fields,
          filters,
        );
        break;

      case "revenue-by-product":
        rows = await generateRevenueByProduct(
          session.user.organizationId,
          fields,
          filters,
          dateRange,
        );
        break;

      case "kpi-dashboard":
        rows = await generateKPIDashboard(
          session.user.organizationId,
          dateRange,
        );
        break;

      default:
        return NextResponse.json(
          { error: "Unknown template" },
          { status: 400 },
        );
    }

    // Apply custom filters
    rows = applyFilters(rows, filters);

    // Log report generation
    await prisma.activityLog.create({
      data: {
        action: "REPORT_GENERATED",
        entityType: "Report",
        userId: session.user.id,
        organizationId: session.user.organizationId,
        metadata: {
          template,
          fields,
          filters,
          rows: rows.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      rows,
      count: rows.length,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", message: error.message },
      { status: 500 },
    );
  }
}

// Report generation functions

async function generateInventoryValuation(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  const inventory = await prisma.inventory.findMany({
    where: { organizationId: orgId },
    include: {
      product: true,
      location: {
        include: {
          zone: {
            include: {
              warehouse: true,
            },
          },
        },
      },
    },
  });

  return inventory.map((item) => ({
    sku: item.product.sku,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_cost: item.product.cost || 0,
    total_value: item.quantity * (item.product.cost || 0),
    location: item.location?.name || "N/A",
    category: item.product.category || "Uncategorized",
    warehouse: item.location?.zone?.warehouse?.name || "N/A",
    zone: item.location?.zone?.name || "N/A",
  }));
}

async function generateInventoryTurnover(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  // Calculate turnover: COGS / Average Inventory
  const orders = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
    },
    include: {
      lineItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const productSales: Record<
    string,
    { sku: string; name: string; units: number }
  > = {};

  orders.forEach((order) => {
    order.lineItems.forEach((item) => {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = {
          sku: item.product.sku,
          name: item.product.name,
          units: 0,
        };
      }
      productSales[key].units += item.quantity;
    });
  });

  const inventory = await prisma.inventory.findMany({
    where: { organizationId: orgId },
    include: { product: true },
  });

  const inventoryByProduct: Record<string, number> = {};
  inventory.forEach((item) => {
    inventoryByProduct[item.productId] =
      (inventoryByProduct[item.productId] || 0) + item.quantity;
  });

  return Object.entries(productSales).map(([productId, data]) => {
    const avgInventory = inventoryByProduct[productId] || 1;
    const turnoverRate = data.units / avgInventory;
    const daysOnHand = avgInventory > 0 ? 365 / (turnoverRate || 1) : 0;

    return {
      sku: data.sku,
      product_name: data.name,
      units_sold: data.units,
      average_inventory: avgInventory,
      turnover_rate: turnoverRate.toFixed(2),
      days_on_hand: Math.round(daysOnHand),
    };
  });
}

async function generateStockMovement(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  const movements = await prisma.inventoryTransaction.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
    },
    include: {
      product: true,
      location: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return movements.map((txn) => ({
    date: txn.createdAt.toISOString().split("T")[0],
    sku: txn.product.sku,
    product_name: txn.product.name,
    transaction_type: txn.type,
    quantity: txn.quantity,
    location: txn.location?.name || "N/A",
    user: txn.user?.name || "System",
  }));
}

async function generateOrderSummary(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
    },
    include: {
      customer: true,
      lineItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return orders.map((order) => {
    const totalItems = order.lineItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalValue = order.lineItems.reduce(
      (sum, item) => sum + item.quantity * (item.product.price || 0),
      0,
    );

    return {
      order_number: order.orderNumber,
      customer: order.customer?.name || "N/A",
      order_date: order.createdAt.toISOString().split("T")[0],
      status: order.status,
      total_items: totalItems,
      total_value: totalValue.toFixed(2),
    };
  });
}

async function generateFulfillmentTime(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
      shippedAt: { not: null },
    },
  });

  return orders.map((order) => {
    const fulfillmentTime = order.shippedAt
      ? (order.shippedAt.getTime() - order.createdAt.getTime()) /
        (1000 * 60 * 60)
      : 0;

    return {
      order_number: order.orderNumber,
      order_date: order.createdAt.toISOString().split("T")[0],
      ship_date: order.shippedAt?.toISOString().split("T")[0] || "N/A",
      fulfillment_time_hours: fulfillmentTime.toFixed(1),
      status: order.status,
    };
  });
}

async function generatePickingEfficiency(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  const pickTasks = await prisma.pickTask.findMany({
    where: {
      organizationId: orgId,
      completedAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
    },
    include: {
      assignedTo: true,
    },
  });

  const pickerStats: Record<
    string,
    {
      name: string;
      orders: number;
      items: number;
      totalTime: number;
      errors: number;
    }
  > = {};

  pickTasks.forEach((task) => {
    const pickerId = task.assignedToId || "unassigned";
    if (!pickerStats[pickerId]) {
      pickerStats[pickerId] = {
        name: task.assignedTo?.name || "Unassigned",
        orders: 0,
        items: 0,
        totalTime: 0,
        errors: 0,
      };
    }

    pickerStats[pickerId].orders += 1;
    pickerStats[pickerId].items += task.quantity || 0;

    if (task.startedAt && task.completedAt) {
      const timeSpent =
        (task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60);
      pickerStats[pickerId].totalTime += timeSpent;
    }
  });

  return Object.values(pickerStats).map((stats) => ({
    picker_name: stats.name,
    orders_picked: stats.orders,
    items_picked: stats.items,
    average_time:
      stats.orders > 0 ? (stats.totalTime / stats.orders).toFixed(1) : "0",
    accuracy_rate:
      stats.orders > 0
        ? (((stats.orders - stats.issues) / stats.orders) * 100).toFixed(1)
        : "100",
  }));
}

async function generateWarehouseUtilization(
  orgId: string,
  fields: string[],
  filters: any[],
) {
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: orgId },
    include: {
      zones: {
        include: {
          locations: true,
        },
      },
    },
  });

  const rows: any[] = [];

  warehouses.forEach((warehouse) => {
    warehouse.zones.forEach((zone) => {
      const totalLocations = zone.locations.length;
      const occupiedLocations = zone.locations.filter(
        (loc) => loc.currentQuantity > 0,
      ).length;
      const utilization =
        totalLocations > 0 ? (occupiedLocations / totalLocations) * 100 : 0;

      rows.push({
        warehouse: warehouse.name,
        zone: zone.name,
        total_locations: totalLocations,
        occupied_locations: occupiedLocations,
        utilization_percent: utilization.toFixed(1),
      });
    });
  });

  return rows;
}

async function generateRevenueByProduct(
  orgId: string,
  fields: string[],
  filters: any[],
  dateRange: any,
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
      status: { in: ["COMPLETED", "SHIPPED"] },
    },
    include: {
      lineItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const productRevenue: Record<
    string,
    {
      sku: string;
      name: string;
      units: number;
      revenue: number;
      cost: number;
    }
  > = {};

  orders.forEach((order) => {
    order.lineItems.forEach((item) => {
      const key = item.productId;
      if (!productRevenue[key]) {
        productRevenue[key] = {
          sku: item.product.sku,
          name: item.product.name,
          units: 0,
          revenue: 0,
          cost: 0,
        };
      }

      productRevenue[key].units += item.quantity;
      productRevenue[key].revenue += item.quantity * (item.product.price || 0);
      productRevenue[key].cost += item.quantity * (item.product.cost || 0);
    });
  });

  return Object.values(productRevenue).map((data) => {
    const profit = data.revenue - data.cost;
    const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

    return {
      sku: data.sku,
      product_name: data.name,
      units_sold: data.units,
      revenue: data.revenue.toFixed(2),
      cost: data.cost.toFixed(2),
      profit: profit.toFixed(2),
      margin_percent: margin.toFixed(1),
    };
  });
}

async function generateKPIDashboard(orgId: string, dateRange: any) {
  // Calculate various KPIs
  const orders = await prisma.order.count({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
    },
  });

  const revenue = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["COMPLETED", "SHIPPED"] },
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      },
    },
    include: {
      lineItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const totalRevenue = revenue.reduce((sum, order) => {
    return (
      sum +
      order.lineItems.reduce(
        (orderSum, item) =>
          orderSum + item.quantity * (item.product.price || 0),
        0,
      )
    );
  }, 0);

  return [
    {
      metric: "Total Orders",
      current_value: orders.toString(),
      target: "1000",
      variance: (((orders - 1000) / 1000) * 100).toFixed(1) + "%",
      trend: orders >= 1000 ? "up" : "down",
    },
    {
      metric: "Revenue",
      current_value: "$" + totalRevenue.toFixed(2),
      target: "$50000",
      variance: (((totalRevenue - 50000) / 50000) * 100).toFixed(1) + "%",
      trend: totalRevenue >= 50000 ? "up" : "down",
    },
  ];
}

function applyFilters(rows: any[], filters: any[]): any[] {
  if (!filters || filters.length === 0) return rows;

  return rows.filter((row) => {
    return filters.every((filter) => {
      const value = row[filter.field];
      const filterValue = filter.value;

      switch (filter.operator) {
        case "equals":
          return value == filterValue;
        case "not_equals":
          return value != filterValue;
        case "greater_than":
          return parseFloat(value) > parseFloat(filterValue);
        case "less_than":
          return parseFloat(value) < parseFloat(filterValue);
        case "contains":
          return String(value)
            .toLowerCase()
            .includes(String(filterValue).toLowerCase());
        case "starts_with":
          return String(value)
            .toLowerCase()
            .startsWith(String(filterValue).toLowerCase());
        default:
          return true;
      }
    });
  });
}
