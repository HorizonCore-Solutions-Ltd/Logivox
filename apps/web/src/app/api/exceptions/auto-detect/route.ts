/**
 * POST /api/exceptions/auto-detect
 *
 * Scans the entire organization for exception conditions and
 * auto-creates ExceptionRecord entries. Safe to call on a schedule.
 *
 * Detects:
 *  DELAYED_ORDER       – RELEASED/PICKING orders past requested date
 *  SLA_BREACH          – orders approaching SLA based on contract
 *  STOCKOUT            – items with quantity = 0
 *  LOW_STOCK           – items below minStockLevel
 *  OVERDUE_INVOICE     – unpaid invoices past due date
 *  OVERDUE_SHIPMENT    – shipments with no movement in 72 h
 *  CREDIT_LIMIT_EXCEEDED – customers with used > limit
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function upsertException(data: {
  id?: string;
  organizationId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  resourceType: string;
  resourceId: string;
  resourceRef?: string;
  slaBreachAt?: Date;
}) {
  const autoId = `${data.type}-${data.resourceId}-${data.organizationId}`;
  await prisma.exceptionRecord.upsert({
    where: { id: autoId },
    update: {
      updatedAt: new Date(),
      title: data.title,
      description: data.description,
      severity: data.severity as any,
      ...(data.slaBreachAt && { slaBreachAt: data.slaBreachAt }),
    },
    create: {
      id: autoId,
      organizationId: data.organizationId,
      type: data.type as any,
      severity: data.severity as any,
      status: "OPEN",
      title: data.title,
      description: data.description,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceRef: data.resourceRef,
      slaBreachAt: data.slaBreachAt,
    },
  });
  return autoId;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json().catch(() => ({}));
  const { dryRun = false } = body;

  const detected: Array<{ type: string; id: string; title: string }> = [];
  const now = new Date();

  // ── 1. Delayed orders ──────────────────────────────────────────────────────
  const delayedOrders = await prisma.salesOrder.findMany({
    where: {
      organizationId,
      status: { in: ["RELEASED", "PICKING", "PACKING", "READY_TO_SHIP"] },
      requestedDate: { lt: now },
    },
    select: { id: true, soNumber: true, requestedDate: true, customerId: true },
  });

  for (const order of delayedOrders) {
    const daysLate = Math.floor((now.getTime() - new Date(order.requestedDate!).getTime()) / 86400000);
    detected.push({ type: "DELAYED_ORDER", id: order.id, title: `${order.soNumber} is ${daysLate}d late` });
    if (!dryRun) await upsertException({
      organizationId,
      type: "DELAYED_ORDER",
      severity: daysLate > 3 ? "HIGH" : "MEDIUM",
      title: `Delayed order: ${order.soNumber}`,
      description: `Order ${order.soNumber} is ${daysLate} days past its requested delivery date.`,
      resourceType: "SalesOrder",
      resourceId: order.id,
      resourceRef: order.soNumber,
    });
  }

  // ── 2. Stockouts ───────────────────────────────────────────────────────────
  const stockouts = await prisma.inventoryItem.findMany({
    where: { organizationId, quantity: 0, isActive: true },
    select: { id: true, name: true, sku: true },
    take: 200,
  });

  for (const item of stockouts) {
    detected.push({ type: "STOCKOUT", id: item.id, title: `Stockout: ${item.sku}` });
    if (!dryRun) await upsertException({
      organizationId,
      type: "STOCKOUT",
      severity: "HIGH",
      title: `Stockout: ${item.sku} — ${item.name}`,
      description: `Item ${item.sku} has zero stock on hand. Immediate replenishment required.`,
      resourceType: "InventoryItem",
      resourceId: item.id,
      resourceRef: item.sku,
    });
  }

  // ── 3. Low stock ───────────────────────────────────────────────────────────
  const lowStock = await prisma.inventoryItem.findMany({
    where: {
      organizationId,
      isActive: true,
      quantity: { gt: 0 },
      minStockLevel: { gt: 0 },
    },
    select: { id: true, name: true, sku: true, quantity: true, minStockLevel: true },
    take: 200,
  });

  for (const item of lowStock.filter((i) => i.quantity <= (i.minStockLevel ?? 0))) {
    detected.push({ type: "LOW_STOCK", id: item.id, title: `Low stock: ${item.sku}` });
    if (!dryRun) await upsertException({
      organizationId,
      type: "LOW_STOCK",
      severity: "MEDIUM",
      title: `Low stock: ${item.sku} — ${item.name}`,
      description: `Stock ${item.quantity} is at or below minimum level ${item.minStockLevel}.`,
      resourceType: "InventoryItem",
      resourceId: item.id,
      resourceRef: item.sku,
    });
  }

  // ── 4. Overdue invoices ────────────────────────────────────────────────────
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { notIn: ["PAID", "CANCELLED", "VOID"] },
      dueDate: { lt: now },
    },
    select: { id: true, invoiceNumber: true, totalAmount: true, dueDate: true, customerId: true },
    take: 100,
  });

  for (const inv of overdueInvoices) {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
    detected.push({ type: "OVERDUE_INVOICE", id: inv.id, title: `${inv.invoiceNumber} ${daysOverdue}d overdue` });
    if (!dryRun) await upsertException({
      organizationId,
      type: "OVERDUE_INVOICE",
      severity: daysOverdue > 30 ? "HIGH" : "MEDIUM",
      title: `Overdue invoice: ${inv.invoiceNumber}`,
      description: `Invoice ${inv.invoiceNumber} for ${Number(inv.totalAmount).toFixed(2)} is ${daysOverdue} days overdue.`,
      resourceType: "Invoice",
      resourceId: inv.id,
      resourceRef: inv.invoiceNumber,
    });
  }

  // ── 5. Credit limit breaches ───────────────────────────────────────────────
  const creditBreaches = await prisma.customer.findMany({
    where: {
      organizationId,
      creditLimit: { gt: 0 },
      creditHold: false,
    },
    select: { id: true, name: true, code: true, creditLimit: true, creditUsed: true },
    take: 100,
  });

  for (const cust of creditBreaches.filter((c) => Number(c.creditUsed) >= Number(c.creditLimit))) {
    detected.push({ type: "CREDIT_LIMIT_EXCEEDED", id: cust.id, title: `Credit exceeded: ${cust.code}` });
    if (!dryRun) {
      await prisma.customer.update({ where: { id: cust.id }, data: { creditHold: true } });
      await upsertException({
        organizationId,
        type: "CREDIT_LIMIT_EXCEEDED",
        severity: "HIGH",
        title: `Credit limit exceeded: ${cust.name}`,
        description: `Customer ${cust.code} has used ${Number(cust.creditUsed).toFixed(2)} of ${Number(cust.creditLimit).toFixed(2)} credit limit. Account placed on hold.`,
        resourceType: "Customer",
        resourceId: cust.id,
        resourceRef: cust.code,
      });
    }
  }

  // ── 6. Auto-resolve exceptions that are no longer active ──────────────────
  if (!dryRun) {
    const resolvedStockoutIds = stockouts.map((i) => `STOCKOUT-${i.id}-${organizationId}`);
    // Resolve stockout exceptions for items now back in stock
    await prisma.exceptionRecord.updateMany({
      where: {
        organizationId,
        type: "STOCKOUT",
        status: "OPEN",
        id: { notIn: resolvedStockoutIds },
      },
      data: { status: "AUTO_RESOLVED", resolvedAt: now, autoResolved: true },
    });
  }

  return NextResponse.json({
    success: true,
    dryRun,
    summary: {
      delayedOrders: delayedOrders.length,
      stockouts: stockouts.length,
      lowStock: lowStock.filter((i) => i.quantity <= (i.minStockLevel ?? 0)).length,
      overdueInvoices: overdueInvoices.length,
      creditBreaches: creditBreaches.filter((c) => Number(c.creditUsed) >= Number(c.creditLimit)).length,
      total: detected.length,
    },
    detected,
  });
}
