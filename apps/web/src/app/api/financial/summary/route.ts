import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const CLOSED_STATUSES = ["SHIPPED", "DELIVERED"] as const;
type ClosedStatus = (typeof CLOSED_STATUSES)[number];

// ── GET /api/financial/summary ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { organizationId } = auth;

  const { searchParams } = new URL(req.url);
  const periodEnd = searchParams.get("periodEnd")
    ? new Date(searchParams.get("periodEnd")!)
    : new Date();
  const periodStart = searchParams.get("periodStart")
    ? new Date(searchParams.get("periodStart")!)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);

  const periodMs = periodEnd.getTime() - periodStart.getTime();
  const priorEnd = new Date(periodStart.getTime() - 1);
  const priorStart = new Date(priorEnd.getTime() - periodMs);

  const statusFilter: ClosedStatus[] = [...CLOSED_STATUSES];

  const [
    salesAgg,
    purchaseAgg,
    rmaCount,
    inventoryAgg,
    salesCount,
    priorSalesAgg,
    priorSalesCount,
    priorPurchaseAgg,
    monthlySales,
    monthlyPurchases,
    topProducts,
  ] = await Promise.all([
    prisma.salesOrder.aggregate({
      where: {
        organizationId,
        orderDate: { gte: periodStart, lte: periodEnd },
        status: { in: statusFilter },
      },
      _sum: {
        total: true,
        shippingCost: true,
        taxAmount: true,
        discount: true,
      },
    }),
    prisma.purchaseOrder.aggregate({
      where: {
        organizationId,
        orderDate: { gte: periodStart, lte: periodEnd },
        totalAmount: { not: null },
      },
      _sum: { totalAmount: true },
    }),
    prisma.rMA.count({
      where: {
        organizationId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.$queryRaw<{ total_value: string }[]>`
      SELECT COALESCE(SUM(quantity * CAST("costPrice" AS NUMERIC)), 0)::text AS total_value
      FROM inventory_items
      WHERE "organizationId" = ${organizationId}
        AND "isActive" = true
        AND "costPrice" IS NOT NULL
    `,
    prisma.salesOrder.count({
      where: {
        organizationId,
        orderDate: { gte: periodStart, lte: periodEnd },
        status: { in: statusFilter },
      },
    }),
    prisma.salesOrder.aggregate({
      where: {
        organizationId,
        orderDate: { gte: priorStart, lte: priorEnd },
        status: { in: statusFilter },
      },
      _sum: { total: true },
    }),
    prisma.salesOrder.count({
      where: {
        organizationId,
        orderDate: { gte: priorStart, lte: priorEnd },
        status: { in: statusFilter },
      },
    }),
    prisma.purchaseOrder.aggregate({
      where: {
        organizationId,
        orderDate: { gte: priorStart, lte: priorEnd },
        totalAmount: { not: null },
      },
      _sum: { totalAmount: true },
    }),
    prisma.$queryRaw<{ month: string; revenue: string; orders: string }[]>`
      SELECT TO_CHAR("orderDate",'YYYY-MM') AS month,
             COALESCE(SUM(total),0)::text   AS revenue,
             COUNT(*)::text                  AS orders
      FROM sales_orders
      WHERE "organizationId"=${organizationId}
        AND "orderDate">=${periodStart} AND "orderDate"<=${periodEnd}
        AND status IN ('SHIPPED','DELIVERED')
      GROUP BY month ORDER BY month ASC
    `,
    prisma.$queryRaw<{ month: string; cogs: string }[]>`
      SELECT TO_CHAR("orderDate",'YYYY-MM')     AS month,
             COALESCE(SUM("totalAmount"),0)::text AS cogs
      FROM purchase_orders
      WHERE "organizationId"=${organizationId}
        AND "orderDate">=${periodStart} AND "orderDate"<=${periodEnd}
      GROUP BY month ORDER BY month ASC
    `,
    prisma.$queryRaw<
      {
        product_name: string;
        sku: string;
        total_qty: string;
        total_rev: string;
      }[]
    >`
      SELECT ii.name AS product_name, ii.sku,
             COALESCE(SUM(soi.quantity),0)::text     AS total_qty,
             COALESCE(SUM(soi."lineTotal"),0)::text  AS total_rev
      FROM sales_order_items soi
        JOIN inventory_items ii ON ii.id=soi."inventoryItemId"
        JOIN sales_orders so    ON so.id=soi."salesOrderId"
      WHERE so."organizationId"=${organizationId}
        AND so."orderDate">=${periodStart} AND so."orderDate"<=${periodEnd}
        AND so.status IN ('SHIPPED','DELIVERED')
      GROUP BY ii.id,ii.name,ii.sku
      ORDER BY total_rev DESC LIMIT 5
    `,
  ]);

  const revenue = Number(salesAgg._sum.total ?? 0);
  const cogs = Number(purchaseAgg._sum.totalAmount ?? 0);
  const shippingCost = Number(salesAgg._sum.shippingCost ?? 0);
  const taxCollected = Number(salesAgg._sum.taxAmount ?? 0);
  const discountsGiven = Number(salesAgg._sum.discount ?? 0);
  const inventoryValue = Number(inventoryAgg[0]?.total_value ?? 0);
  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const costPerOrder = salesCount > 0 ? cogs / salesCount : 0;
  const avgOrderValue = salesCount > 0 ? revenue / salesCount : 0;
  const returnRate = salesCount > 0 ? (rmaCount / salesCount) * 100 : 0;
  const priorRevenue = Number(priorSalesAgg._sum.total ?? 0);
  const priorCogs = Number(priorPurchaseAgg._sum.totalAmount ?? 0);
  const priorGrossMargin =
    priorRevenue > 0 ? ((priorRevenue - priorCogs) / priorRevenue) * 100 : 0;
  const priorAvgOrderValue =
    priorSalesCount > 0 ? priorRevenue / priorSalesCount : 0;
  const revenueGrowthPct =
    priorRevenue > 0 ? ((revenue - priorRevenue) / priorRevenue) * 100 : null;
  const marginChangePct =
    priorRevenue > 0 ? grossMarginPct - priorGrossMargin : null;
  const aovChangePct =
    priorAvgOrderValue > 0
      ? ((avgOrderValue - priorAvgOrderValue) / priorAvgOrderValue) * 100
      : null;

  const recommendations: string[] = [];
  if (grossMarginPct < 30 && revenue > 0)
    recommendations.push(
      "Gross margin below 30% — renegotiate supplier costs or adjust pricing.",
    );
  if (returnRate > 5)
    recommendations.push(
      `Return rate at ${returnRate.toFixed(1)}% — investigate quality and order accuracy.`,
    );
  if (discountsGiven > revenue * 0.1 && revenue > 0)
    recommendations.push(
      "Discounts exceed 10% of revenue — review discount policy.",
    );
  if (costPerOrder > avgOrderValue * 0.5 && avgOrderValue > 0)
    recommendations.push(
      "Cost per order is high relative to average order value — review procurement.",
    );
  if (recommendations.length === 0)
    recommendations.push(
      "Financial performance within healthy ranges. Continue monitoring KPIs.",
    );

  const monthSet = new Set([
    ...monthlySales.map((r) => r.month),
    ...monthlyPurchases.map((r) => r.month),
  ]);
  const trend = Array.from(monthSet)
    .sort()
    .map((month) => {
      const s = monthlySales.find((r) => r.month === month);
      const p = monthlyPurchases.find((r) => r.month === month);
      const rev = Number(s?.revenue ?? 0);
      const cg = Number(p?.cogs ?? 0);
      return {
        month,
        revenue: rev,
        cogs: cg,
        grossProfit: rev - cg,
        grossMarginPct:
          rev > 0 ? Math.round(((rev - cg) / rev) * 1000) / 10 : 0,
        orders: Number(s?.orders ?? 0),
      };
    });

  return NextResponse.json({
    period: { start: periodStart, end: periodEnd },
    kpis: {
      revenue: Math.round(revenue * 100) / 100,
      cogs: Math.round(cogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMarginPct: Math.round(grossMarginPct * 10) / 10,
      shippingCost: Math.round(shippingCost * 100) / 100,
      taxCollected: Math.round(taxCollected * 100) / 100,
      discountsGiven: Math.round(discountsGiven * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      salesCount,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      costPerOrder: Math.round(costPerOrder * 100) / 100,
      rmaCount,
      returnRate: Math.round(returnRate * 10) / 10,
    },
    changes: {
      revenueGrowthPct:
        revenueGrowthPct !== null
          ? Math.round(revenueGrowthPct * 10) / 10
          : null,
      marginChangePct:
        marginChangePct !== null ? Math.round(marginChangePct * 10) / 10 : null,
      aovChangePct:
        aovChangePct !== null ? Math.round(aovChangePct * 10) / 10 : null,
    },
    trend,
    topProducts: topProducts.map((p) => ({
      sku: p.sku,
      name: p.product_name,
      quantity: Number(p.total_qty),
      revenue: Number(p.total_rev),
    })),
    recommendations,
  });
}
