import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to calculate KPI metrics
async function calculateKPIs(organizationId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Sales Metrics
  const [todayOrders, yesterdayOrders, thisMonthOrders, lastMonthOrders] =
    await Promise.all([
      prisma.salesOrder.count({
        where: { organizationId, orderDate: { gte: today } },
      }),
      prisma.salesOrder.count({
        where: { organizationId, orderDate: { gte: yesterday, lt: today } },
      }),
      prisma.salesOrder.count({
        where: { organizationId, orderDate: { gte: thisMonth } },
      }),
      prisma.salesOrder.count({
        where: { organizationId, orderDate: { gte: lastMonth, lt: thisMonth } },
      }),
    ]);

  const [todayRevenue, yesterdayRevenue, thisMonthRevenue, lastMonthRevenue] =
    await Promise.all([
      prisma.salesOrder.aggregate({
        where: {
          organizationId,
          orderDate: { gte: today },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.salesOrder.aggregate({
        where: {
          organizationId,
          orderDate: { gte: yesterday, lt: today },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.salesOrder.aggregate({
        where: {
          organizationId,
          orderDate: { gte: thisMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.salesOrder.aggregate({
        where: {
          organizationId,
          orderDate: { gte: lastMonth, lt: thisMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
    ]);

  // Inventory Metrics
  const [totalInventoryValue, lowStockItems, outOfStockItems, totalItems] =
    await Promise.all([
      prisma.inventoryItem.aggregate({
        where: { organizationId, isActive: true },
        _sum: { quantity: true },
      }),
      prisma.inventoryItem.count({
        where: { organizationId, status: "LOW_STOCK", isActive: true },
      }),
      prisma.inventoryItem.count({
        where: { organizationId, status: "OUT_OF_STOCK", isActive: true },
      }),
      prisma.inventoryItem.count({
        where: { organizationId, isActive: true },
      }),
    ]);

  // Warehouse Metrics
  const [pendingPickLists, pendingShipments, pendingGRNs] = await Promise.all([
    prisma.pickList.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.shipment.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.goodsReceiptNote.count({
      where: { organizationId, status: "DRAFT" },
    }),
  ]);

  // Quality Metrics
  const [qcInspectionsToday, qcPassed, qcFailed] = await Promise.all([
    prisma.qCInspection.count({
      where: { organizationId, createdAt: { gte: today } },
    }),
    prisma.qCInspection.count({
      where: { organizationId, createdAt: { gte: today }, result: "PASS" },
    }),
    prisma.qCInspection.count({
      where: { organizationId, createdAt: { gte: today }, result: "FAIL" },
    }),
  ]);

  // Assembly/Production Metrics
  const [assemblyOrdersInProgress, completedToday] = await Promise.all([
    prisma.assemblyOrder.count({
      where: { organizationId, status: "IN_PROGRESS" },
    }),
    prisma.assemblyOrder.count({
      where: { organizationId, status: "COMPLETED", actualEnd: { gte: today } },
    }),
  ]);

  // Calculate metrics
  const metrics = [
    // Sales Metrics
    {
      metricCode: "ORDERS_TODAY",
      metricName: "Orders Today",
      category: "SALES",
      currentValue: todayOrders,
      previousValue: yesterdayOrders,
      unit: "orders",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "REVENUE_TODAY",
      metricName: "Revenue Today",
      category: "SALES",
      currentValue: Number(todayRevenue._sum.total || 0),
      previousValue: Number(yesterdayRevenue._sum.total || 0),
      unit: "USD",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "ORDERS_MONTH",
      metricName: "Orders This Month",
      category: "SALES",
      currentValue: thisMonthOrders,
      previousValue: lastMonthOrders,
      unit: "orders",
      periodType: "MONTHLY",
      periodStart: thisMonth,
      periodEnd: now,
    },
    {
      metricCode: "REVENUE_MONTH",
      metricName: "Revenue This Month",
      category: "SALES",
      currentValue: Number(thisMonthRevenue._sum.total || 0),
      previousValue: Number(lastMonthRevenue._sum.total || 0),
      unit: "USD",
      periodType: "MONTHLY",
      periodStart: thisMonth,
      periodEnd: now,
    },
    // Inventory Metrics
    {
      metricCode: "TOTAL_INVENTORY",
      metricName: "Total Inventory",
      category: "INVENTORY",
      currentValue: Number(totalInventoryValue._sum.quantity || 0),
      previousValue: null,
      unit: "units",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "LOW_STOCK_ITEMS",
      metricName: "Low Stock Items",
      category: "INVENTORY",
      currentValue: lowStockItems,
      previousValue: null,
      unit: "items",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
      status: lowStockItems > 0 ? "WARNING" : "NORMAL",
    },
    {
      metricCode: "OUT_OF_STOCK_ITEMS",
      metricName: "Out of Stock Items",
      category: "INVENTORY",
      currentValue: outOfStockItems,
      previousValue: null,
      unit: "items",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
      status: outOfStockItems > 0 ? "CRITICAL" : "NORMAL",
    },
    // Warehouse Metrics
    {
      metricCode: "PENDING_PICKLISTS",
      metricName: "Pending Pick Lists",
      category: "WAREHOUSE",
      currentValue: pendingPickLists,
      previousValue: null,
      unit: "lists",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "PENDING_SHIPMENTS",
      metricName: "Pending Shipments",
      category: "WAREHOUSE",
      currentValue: pendingShipments,
      previousValue: null,
      unit: "shipments",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "PENDING_GRNS",
      metricName: "Pending GRNs",
      category: "WAREHOUSE",
      currentValue: pendingGRNs,
      previousValue: null,
      unit: "grns",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    // Quality Metrics
    {
      metricCode: "QC_INSPECTIONS_TODAY",
      metricName: "QC Inspections Today",
      category: "QUALITY",
      currentValue: qcInspectionsToday,
      previousValue: null,
      unit: "inspections",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "QC_PASS_RATE",
      metricName: "QC Pass Rate",
      category: "QUALITY",
      currentValue:
        qcInspectionsToday > 0 ? (qcPassed / qcInspectionsToday) * 100 : 0,
      previousValue: null,
      targetValue: 95,
      unit: "percentage",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
      status:
        qcInspectionsToday > 0 && (qcPassed / qcInspectionsToday) * 100 < 95
          ? "WARNING"
          : "NORMAL",
    },
    // Production Metrics
    {
      metricCode: "ASSEMBLY_IN_PROGRESS",
      metricName: "Assembly Orders In Progress",
      category: "PRODUCTIVITY",
      currentValue: assemblyOrdersInProgress,
      previousValue: null,
      unit: "orders",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
    {
      metricCode: "ASSEMBLY_COMPLETED_TODAY",
      metricName: "Assembly Orders Completed Today",
      category: "PRODUCTIVITY",
      currentValue: completedToday,
      previousValue: null,
      unit: "orders",
      periodType: "DAILY",
      periodStart: today,
      periodEnd: now,
    },
  ];

  // Calculate trends and changes
  return metrics.map((metric) => {
    const changeAmount =
      metric.previousValue !== null
        ? metric.currentValue - metric.previousValue
        : null;

    const changePercent =
      metric.previousValue !== null && metric.previousValue !== 0
        ? ((metric.currentValue - metric.previousValue) /
            metric.previousValue) *
          100
        : null;

    let trend = null;
    if (changePercent !== null) {
      if (changePercent > 5) trend = "UP";
      else if (changePercent < -5) trend = "DOWN";
      else trend = "STABLE";
    }

    return {
      ...metric,
      changeAmount,
      changePercent,
      trend,
    };
  });
}

// GET /api/analytics/kpis - Get KPI metrics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      // Calculate fresh metrics
      const metrics = await calculateKPIs(organizationId);

      // Delete old metrics for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.kPIMetric.deleteMany({
        where: {
          organizationId,
          periodStart: { gte: today },
        },
      });

      // Save new metrics
      await prisma.kPIMetric.createMany({
        data: metrics.map((m) => ({
          organizationId,
          ...m,
          status: m.status || "NORMAL",
        })),
      });
    }

    // Fetch metrics
    const where = {
      organizationId,
      ...(category && { category: category as any }),
    };

    const metrics = await prisma.kPIMetric.findMany({
      where,
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    });

    // Group by category
    const grouped = metrics.reduce((acc: any, metric: any) => {
      const cat = metric.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(metric);
      return acc;
    }, {});

    return NextResponse.json({
      metrics,
      grouped,
      lastUpdated: metrics[0]?.calculatedAt || new Date(),
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 },
    );
  }
}
