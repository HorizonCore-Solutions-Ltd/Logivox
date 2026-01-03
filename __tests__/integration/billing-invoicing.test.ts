import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';

describe('Billing & Invoicing API Tests', () => {
  let testOrganizationId: string;
  let testCustomerId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: 'Test Billing Org', code: 'TBILL' },
    });
    testOrganizationId = org.id;

    const customer = await prisma.customer.create({
      data: {
        organizationId: testOrganizationId,
        name: 'Test Customer',
        code: 'TCUST01',
        email: 'customer@test.com',
        customerType: 'BUSINESS',
      },
    });
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.invoiceLineItem.deleteMany();
    await prisma.invoice.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.rateCard.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.customer.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.organization.delete({ where: { id: testOrganizationId } });
  });

  test('should create rate card', async () => {
    const rateCard = await prisma.rateCard.create({
      data: {
        organizationId: testOrganizationId,
        customerId: testCustomerId,
        name: 'Standard Rates 2026',
        effectiveFrom: new Date('2026-01-01'),
        storageRate: 10.50,
        receivingRate: 5.00,
        pickingRate: 2.50,
        packingRate: 3.00,
        shippingRate: 15.00,
        isActive: true,
      },
    });

    expect(rateCard.name).toBe('Standard Rates 2026');
    expect(rateCard.storageRate).toBe(10.50);
  });

  test('should create invoice with line items', async () => {
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: testOrganizationId,
        customerId: testCustomerId,
        invoiceNumber: `INV-TEST-${Date.now()}`,
        billingPeriodStart: new Date('2026-01-01'),
        billingPeriodEnd: new Date('2026-01-31'),
        dueDate: new Date('2026-02-15'),
        subtotal: 1000.00,
        taxAmount: 80.00,
        totalAmount: 1080.00,
        status: 'DRAFT',
        lineItems: {
          create: [
            {
              description: 'Storage Fees',
              quantity: 100,
              unitPrice: 5.00,
              amount: 500.00,
            },
            {
              description: 'Picking Fees',
              quantity: 200,
              unitPrice: 2.50,
              amount: 500.00,
            },
          ],
        },
      },
      include: { lineItems: true },
    });

    testInvoiceId = invoice.id;
    expect(invoice.lineItems.length).toBe(2);
    expect(invoice.totalAmount).toBe(1080.00);
  });

  test('should update invoice status', async () => {
    const updated = await prisma.invoice.update({
      where: { id: testInvoiceId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    expect(updated.status).toBe('SENT');
    expect(updated.sentAt).toBeTruthy();
  });

  test('should record payment', async () => {
    const payment = await prisma.payment.create({
      data: {
        organizationId: testOrganizationId,
        invoiceId: testInvoiceId,
        amount: 1080.00,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date(),
        transactionId: 'TXN-123456',
      },
    });

    expect(payment.amount).toBe(1080.00);
    expect(payment.paymentMethod).toBe('BANK_TRANSFER');
  });

  test('should update invoice to PAID after full payment', async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
      include: { payments: true },
    });

    const totalPaid = invoice?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;

    if (totalPaid >= (invoice?.totalAmount || 0)) {
      await prisma.invoice.update({
        where: { id: testInvoiceId },
        data: { status: 'PAID', paidAmount: totalPaid },
      });
    }

    const updated = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
    });

    expect(updated?.status).toBe('PAID');
  });

  test('should calculate invoice totals correctly', async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
      include: { lineItems: true },
    });

    const calculatedSubtotal = invoice?.lineItems.reduce((sum, item) => sum + item.amount, 0) || 0;
    expect(calculatedSubtotal).toBe(invoice?.subtotal);
  });
});
