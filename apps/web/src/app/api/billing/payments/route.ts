export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'CHECK', 'CASH', 'OTHER']),
  paymentDate: z.string().transform(str => new Date(str)),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/billing/payments
 * List all payments
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');

    const payments = await prisma.payment.findMany({
      where: {
        organizationId,
        ...(invoiceId && { invoiceId }),
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

/**
 * POST /api/billing/payments
 * Record a new payment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = paymentSchema.parse(body);

    // Verify invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: validatedData.invoiceId,
        organizationId,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            customer: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    // Calculate total payments for this invoice
    const totalPayments = await prisma.payment.aggregate({
      where: { invoiceId: validatedData.invoiceId },
      _sum: { amount: true },
    });

    const paidAmount = totalPayments._sum.amount || 0;

    // Update invoice status based on payment
    let newStatus = invoice.status;
    if (paidAmount >= invoice.totalAmount) {
      newStatus = 'PAID';
    } else if (paidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await prisma.invoice.update({
      where: { id: validatedData.invoiceId },
      data: { 
        status: newStatus,
        paidAmount,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: payment.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
