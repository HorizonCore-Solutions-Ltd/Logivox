/**
 * GET  /api/customers/[id]/credit-check
 *
 * Evaluates a customer's current credit position:
 *  - creditLimit, creditUsed, available
 *  - outstanding invoices and their aging
 *  - current hold status
 *  - active contract terms
 *
 * POST /api/customers/[id]/credit-check
 *  body: { orderValue: number, currency?: string }
 *  – check if a new order can proceed based on available credit
 *    and set/release creditHold automatically
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, organizationId },
    select: {
      id: true, name: true, code: true, currency: true,
      creditLimit: true, creditUsed: true, creditHold: true, paymentTermsDays: true,
    },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const creditLimit = Number(customer.creditLimit ?? 0);
  const creditUsed = Number(customer.creditUsed ?? 0);
  const available = creditLimit > 0 ? creditLimit - creditUsed : null;
  const utilizationPct = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : null;

  // Outstanding invoices aging
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      customerId: params.id,
      status: { notIn: ["PAID", "CANCELLED", "VOID"] },
    },
    select: { id: true, invoiceNumber: true, totalAmount: true, dueDate: true, status: true, createdAt: true },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  const aging = { current: 0, days30: 0, days60: 0, days90plus: 0 };
  for (const inv of invoices) {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86_400_000);
    const amt = Number(inv.totalAmount);
    if (daysOverdue <= 0) aging.current += amt;
    else if (daysOverdue <= 30) aging.days30 += amt;
    else if (daysOverdue <= 60) aging.days60 += amt;
    else aging.days90plus += amt;
  }

  // Active contract
  const contract = await prisma.customerContract.findFirst({
    where: { organizationId, customerId: params.id, status: "ACTIVE" },
    select: { id: true, contractNumber: true, name: true, creditLimit: true, discountPct: true, paymentTermsDays: true, pricingTier: true, endDate: true },
  });

  // Open orders value
  const openOrdersAgg = await prisma.salesOrder.aggregate({
    where: {
      organizationId,
      customerId: params.id,
      status: { notIn: ["CANCELLED", "CLOSED", "DELIVERED"] },
    },
    _sum: { total: true },
    _count: true,
  });

  return NextResponse.json({
    customer,
    credit: {
      limit: creditLimit,
      used: creditUsed,
      available,
      utilizationPct,
      hold: customer.creditHold,
    },
    openOrders: {
      count: openOrdersAgg._count,
      value: Number(openOrdersAgg._sum.total ?? 0),
    },
    outstandingInvoices: {
      count: invoices.length,
      total: invoices.reduce((s, i) => s + Number(i.totalAmount), 0),
      aging,
      items: invoices,
    },
    activeContract: contract,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const orderValue = Number(body.orderValue ?? 0);

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, organizationId },
    select: { id: true, name: true, creditLimit: true, creditUsed: true, creditHold: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const creditLimit = Number(customer.creditLimit ?? 0);
  const creditUsed = Number(customer.creditUsed ?? 0);
  const available = creditLimit > 0 ? creditLimit - creditUsed : Infinity;
  const wouldExceed = creditLimit > 0 && (creditUsed + orderValue) > creditLimit;

  let approved = true;
  let risk: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED" = "LOW";
  const flags: string[] = [];

  if (customer.creditHold) {
    approved = false;
    risk = "BLOCKED";
    flags.push("Customer is on credit hold");
  } else if (wouldExceed) {
    approved = false;
    risk = "BLOCKED";
    flags.push(`Order value ${orderValue} would exceed credit limit ${creditLimit}`);

    // Auto-set credit hold
    await prisma.customer.update({
      where: { id: params.id },
      data: { creditHold: true },
    });

    await prisma.exceptionRecord.create({
      data: {
        organizationId,
        type: "CREDIT_LIMIT_EXCEEDED",
        severity: "HIGH",
        status: "OPEN",
        title: `Credit limit exceeded — ${customer.name}`,
        description: `Order worth ${orderValue} would bring balance to ${creditUsed + orderValue}, exceeding limit of ${creditLimit}.`,
        resourceType: "Customer",
        resourceId: params.id,
      },
    });
  } else {
    const utilization = creditLimit > 0 ? (creditUsed + orderValue) / creditLimit : 0;
    if (utilization >= 0.9) { risk = "HIGH"; flags.push("Credit utilization will exceed 90%"); }
    else if (utilization >= 0.7) { risk = "MEDIUM"; flags.push("Credit utilization above 70%"); }
  }

  return NextResponse.json({
    approved,
    risk,
    flags,
    credit: {
      limit: creditLimit,
      used: creditUsed,
      available: available === Infinity ? null : available,
      afterOrder: creditLimit > 0 ? creditUsed + orderValue : null,
    },
  });
}
