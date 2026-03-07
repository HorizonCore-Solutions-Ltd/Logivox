// Invoice Generation & Management Service
// Handles creation of invoices from pending billing transactions.

import { prisma } from "@/lib/prisma";
import type { BillingTransaction } from "@prisma/client";

export const InvoiceService = {
  /**
   * Create Invoices for a specific Client or All Clients
   * Triggered manually or by cron.
   */
  generateInvoices: async (
    organizationId: string,
    clientId?: string,
    periodEnd: Date = new Date(),
  ) => {
    const whereClause: any = {
      organizationId,
      billingStatus: "PENDING",
      transactionDate: { lte: periodEnd },
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    // 1. Find Pending Transactions
    const transactions = await prisma.billingTransaction.findMany({
      where: whereClause,
    });

    if (transactions.length === 0) {
      return { count: 0, invoices: [] };
    }

    // 2. Group by Client
    const txnsByClient = transactions.reduce(
      (acc, txn) => {
        if (!acc[txn.clientId]) acc[txn.clientId] = [];
        acc[txn.clientId].push(txn);
        return acc;
      },
      {} as Record<string, BillingTransaction[]>,
    );

    const createdInvoices: any[] = []; // Using any to avoid strict Invoice type conflict

    // 3. Create ClientInvoice for each Client (3PL Billing)
    for (const [cId, txns] of Object.entries(txnsByClient)) {
      // Calculate Total Amount
      const totalAmount = txns.reduce((sum, t) => sum + Number(t.amount), 0);

      // Find period start (earliest transaction date)
      const earliestDate =
        txns.length > 0
          ? txns.reduce(
              (min, t) => (t.transactionDate < min ? t.transactionDate : min),
              txns[0].transactionDate,
            )
          : new Date();

      // Create Invoice Header
      // We use ClientInvoice for 3PL Billing to Tenant
      const invoice = await prisma.clientInvoice.create({
        data: {
          organizationId,
          clientId: cId,
          invoiceNumber: `INV-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
          invoiceDate: periodEnd,
          dueDate: new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000), // Net 30 default
          periodStart: earliestDate,
          periodEnd: periodEnd,
          subtotal: totalAmount,
          total: totalAmount,
          balanceDue: totalAmount,
          status: "DRAFT",
        },
      });

      // 4. Update Transactions to Link to Invoice
      // Need to map transaction IDs and update
      // We iterate chunks if IDs array is too large, but for now simple
      const txnIds = txns.map((t) => t.id);
      await prisma.billingTransaction.updateMany({
        where: { id: { in: txnIds } },
        data: {
          billingStatus: "INVOICED",
          invoiceId: invoice.id,
        },
      });

      createdInvoices.push({ ...invoice, totalAmount });
    }

    return { count: createdInvoices.length, invoices: createdInvoices };
  },

  /**
   * Approve and Send Invoice
   * Moves invoice from DRAFT to PENDING (Sent to customer)
   */
  approveInvoice: async (invoiceId: string) => {
    return prisma.clientInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "PENDING",
      },
    });
  },
};
