export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const invoiceSchema = z.object({
  customerId: z.string(),
  invoiceNumber: z.string().optional(),
  billingPeriodStart: z.string().transform(str => new Date(str)),
  billingPeriodEnd: z.string().transform(str => new Date(str)),
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    amount: z.number().positive(),
  })),
});

/**
 * GET /api/billing/invoices
 * List all invoices
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
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        ...(customerId && { customerId }),
        ...(status && { status: status as any }),
        ...(startDate && { billingPeriodStart: { gte: new Date(startDate) } }),
        ...(endDate && { billingPeriodEnd: { lte: new Date(endDate) } }),
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true, email: true },
        },
        lineItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

/**
 * POST /api/billing/invoices
 * Create a new invoice
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
    const { lineItems, ...invoiceData } = invoiceSchema.parse(body);

    // Generate invoice number if not provided
    const invoiceNumber = invoiceData.invoiceNumber || `INV-${Date.now()}`;

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * 0.0; // Configure tax rate as needed
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber,
        organizationId,
        subtotal,
        taxAmount,
        totalAmount,
        status: 'DRAFT',
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true, email: true },
        },
        lineItems: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'INVOICE_CREATED',
        entityType: 'Invoice',
        entityId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          totalAmount: invoice.totalAmount,
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
