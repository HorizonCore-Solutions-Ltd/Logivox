import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";

describe("Billing & Invoicing API Tests", () => {
  let testOrganizationId: string;
  let testCustomerId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: "Test Billing Org", code: "TBILL" },
    });
    testOrganizationId = org.id;

    const customer = await prisma.customer.create({
      data: {
        organizationId: testOrganizationId,
        name: "Test Customer",
        code: "TCUST01",
        email: "customer@test.com",
        customerType: "BUSINESS",
      },
    });
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.invoiceLineItem.deleteMany();
    await prisma.invoice.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.rateCard.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.customer.deleteMany({
      where: { organizationId: testOrganizationId },
    });
    await prisma.organization.delete({ where: { id: testOrganizationId } });
  });

  test("should create rate card", async () => {
    const rateCard = await prisma.rateCard.create({
      data: {
        organizationId: testOrganizationId,
        customerId: testCustomerId,
        name: "Standard Rates 2026",
        effectiveFrom: new Date("2026-01-01"),
        storageRate: 10.5,
        receivingRate: 5.0,
        pickingRate: 2.5,
        packingRate: 3.0,
        shippingRate: 15.0,
        isActive: true,
      },
    });

    expect(rateCard.name).toBe("Standard Rates 2026");
    expect(rateCard.storageRate).toBe(10.5);
  });

  test("should create invoice with line items", async () => {
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: testOrganizationId,
        customerId: testCustomerId,
        invoiceNumber: `INV-TEST-${Date.now()}`,
        billingPeriodStart: new Date("2026-01-01"),
        billingPeriodEnd: new Date("2026-01-31"),
        dueDate: new Date("2026-02-15"),
        subtotal: 1000.0,
        taxAmount: 80.0,
        totalAmount: 1080.0,
        status: "DRAFT",
        lineItems: {
          create: [
            {
              description: "Storage Fees",
              quantity: 100,
              unitPrice: 5.0,
              amount: 500.0,
            },
            {
              description: "Picking Fees",
              quantity: 200,
              unitPrice: 2.5,
              amount: 500.0,
            },
          ],
        },
      },
      include: { lineItems: true },
    });

    testInvoiceId = invoice.id;
    expect(invoice.lineItems.length).toBe(2);
    expect(invoice.totalAmount).toBe(1080.0);
  });

  test("should update invoice status", async () => {
    const updated = await prisma.invoice.update({
      where: { id: testInvoiceId },
      data: { status: "SENT", sentAt: new Date() },
    });

    expect(updated.status).toBe("SENT");
    expect(updated.sentAt).toBeTruthy();
  });

  test("should record payment", async () => {
    const payment = await prisma.payment.create({
      data: {
        organizationId: testOrganizationId,
        invoiceId: testInvoiceId,
        amount: 1080.0,
        paymentMethod: "BANK_TRANSFER",
        paymentDate: new Date(),
        transactionId: "TXN-123456",
      },
    });

    expect(payment.amount).toBe(1080.0);
    expect(payment.paymentMethod).toBe("BANK_TRANSFER");
  });

  test("should update invoice to PAID after full payment", async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
      include: { payments: true },
    });

    const totalPaid =
      invoice?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;

    if (totalPaid >= (invoice?.totalAmount || 0)) {
      await prisma.invoice.update({
        where: { id: testInvoiceId },
        data: { status: "PAID", paidAmount: totalPaid },
      });
    }

    const updated = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
    });

    expect(updated?.status).toBe("PAID");
  });

  test("should calculate invoice totals correctly", async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
      include: { lineItems: true },
    });

    const calculatedSubtotal =
      invoice?.lineItems.reduce((sum, item) => sum + item.amount, 0) || 0;
    expect(calculatedSubtotal).toBe(invoice?.subtotal);
  });
});
