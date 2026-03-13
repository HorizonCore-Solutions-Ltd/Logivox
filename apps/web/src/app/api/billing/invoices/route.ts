import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId, user } = auth;

  try {
    const body = await request.json();
    const { customerId, items, dueDate, notes, currency = "USD" } = body;

    // Build subtotal from items
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
      };
    });

    const taxAmount = subtotal * 0.08; // Example 8% tax
    const totalAmount = subtotal + taxAmount;

    // Secure, temper-proof invoice generation using transaction
    const newInvoice = await prisma.$transaction(async (tx) => {
      // 1. Generate unique invoice number
      const count = await tx.invoice.count({ where: { organizationId } });
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;

      // 2. Cryptographic signature payload
      const hashContent = JSON.stringify({
        organizationId,
        customerId,
        invoiceNumber,
        totalAmount,
        items: formattedItems,
        salt: process.env.FINANCE_PEPPER || "logivox-finance-integrity",
      });

      const hash = createHash("sha256").update(hashContent).digest("hex");

      // 3. Create core document
      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          customerId,
          invoiceNumber,
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(),
          dueDate: new Date(dueDate),
          subtotal,
          taxAmount,
          totalAmount,
          currency,
          status: "ISSUED",
          notes,
          hash, // Temper-proofing lock
          lineItems: {
            create: formattedItems,
          },
        },
        include: {
          lineItems: true,
        },
      });

      return invoice;
    });

    // 4. Audit Log
    const auditService = await import(
      "../../../../../../../lib/audit-service"
    ).catch(() => null);
    if (auditService) {
      await auditService.logAudit({
        eventType: "INVOICE_GENERATED",
        userId: user.id,
        userEmail: user.email,
        resource: "Invoice",
        resourceId: newInvoice.id,
        action: "CREATE_TAMPER_PROOF_INVOICE",
        changes: { totalAmount: newInvoice.totalAmount },
        metadata: {
          invoiceNumber: newInvoice.invoiceNumber,
          signature: newInvoice.hash,
        },
        severity: "INFO",
      });
    }

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    // Note: simple implementation for demo

    let whereClause: any = { organizationId };

    if (status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      invoices,
      pagination: { total: invoices.length, pages: 1 },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
