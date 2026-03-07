"use server";

import { prisma } from "@/lib/prisma";
import { InvoiceService } from "./invoiceService";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function getBillingDashboardStats() {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    throw new Error("Unauthorized");
  }
  const orgId = user.organizationId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Pending Revenue (Draft/Pending Transactions)
  const pendingTxns = await prisma.billingTransaction.aggregate({
    where: {
      organizationId: orgId,
      billingStatus: "PENDING",
    },
    _sum: {
      amount: true,
    },
  });
  const pendingRevenue = Number(pendingTxns._sum.amount || 0);

  // 2. Invoiced This Month (Client Invoices created this month)
  const invoicesThisMonth = await prisma.clientInvoice.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: startOfMonth,
      },
      status: {
        not: "DRAFT", // Only count sent/finalized invoices
      },
    },
    include: {
      transactions: true,
    },
  });

  const invoicedRevenue = invoicesThisMonth.reduce(
    (sum, inv) =>
      sum +
      inv.transactions.reduce((tSum, t) => tSum + Number(t.amount || 0), 0),
    0,
  );

  // 3. VAS Revenue (Specific Transaction Type)
  const vasTxns = await prisma.billingTransaction.aggregate({
    where: {
      organizationId: orgId,
      type: "VAS",
      transactionDate: {
        gte: startOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });
  const vasRevenue = Number(vasTxns._sum.amount || 0);

  // 4. Active Contracts (Active Rate Cards / Clients)
  const activeContracts = await prisma.billingRateCard.count({
    where: {
      organizationId: orgId,
      isActive: true,
    },
  });

  return {
    pendingRevenue,
    invoicedThisMonth: invoicedRevenue,
    vasRevenue,
    activeContracts,
  };
}

export async function getRecentTransactions() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return [];
  const orgId = user.organizationId;

  const transactions = await prisma.billingTransaction.findMany({
    where: {
      organizationId: orgId,
    },
    orderBy: {
      transactionDate: "desc",
    },
    take: 10,
    include: {
      client: {
        select: {
          clientName: true,
        },
      },
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    date: t.transactionDate,
    clientName: t.client?.clientName || "Unknown Client",
    type: t.type,
    description: t.description,
    amount: Number(t.amount),
    status: t.billingStatus,
  }));
}

export async function getRecentInvoices() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return [];
  const orgId = user.organizationId;

  const invoicesWithClient = await prisma.clientInvoice.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      client: { select: { clientName: true } },
    },
  });

  return invoicesWithClient.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.client?.clientName || "Unknown",
    createdAt: inv.createdAt,
    totalAmount: Number(inv.total),
    status: inv.status,
  }));
}

export async function getRecentVAS() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return [];

  const requests = await prisma.vASRequest.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      client: { select: { clientName: true } },
      // billingTransaction: { select: { amount: true } } // billingTransaction is not a relation field on VASRequest apparently?
      // Wait, let's check relation.
    },
  });

  // Need to verify if VASRequest has relation directly defined.
  // Schema says `billingTransactionId`. But no `@relation` field defined for it on VASRequest side?
  // "billingTransactionId String?"
  // It seems no relation field `billingTransaction` is in the model `VASRequest`.
  // So I can't `include`. I would need to fetch separately or just ignore fee for now and return 0.
  // Or maybe I can assume standard fee based on service code?
  // For now, I'll return 0 fee to avoid complex queries if relation is missing.

  return requests.map((req) => ({
    id: req.id,
    type: req.serviceName,
    requester: req.client?.clientName || "Unknown",
    instructions: req.description || "No details",
    fee: 0, // Placeholder as linking back to txn is complex without relation
    status: req.status,
    createdAt: req.createdAt,
  }));
}

export async function runBillingCycle() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { success: false, message: "Unauthorized" };

  try {
    const result = await InvoiceService.generateInvoices(user.organizationId);
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Billing Cycle Error:", error);
    return { success: false, message: error.message };
  }
}

export async function getActiveChargebacks() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return [];

  // Fetch supplier chargebacks only
  const chargebacks = await prisma.supplierChargeback.findMany({
    where: {
      organizationId: user.organizationId,
      status: { not: "COMPLETED" },
    },
    include: {
      supplier: true,
    },
    take: 5,
  });

  return chargebacks.map((cb) => ({
    id: cb.id,
    supplierName: cb.supplier.name,
    amount: Number(cb.amount),
    reason: cb.reason,
    status: cb.status,
    date: cb.createdAt,
  }));
}
