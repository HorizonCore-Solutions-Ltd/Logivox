export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail } from '@/lib/services/email-service';

const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

const sendInvoiceSchema = z.object({
  recipientEmail: z.string().email().optional(),
});

/**
 * GET /api/billing/invoices/[id]
 * Get invoice by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        customer: true,
        lineItems: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

/**
 * PUT /api/billing/invoices/[id]
 * Update invoice
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateInvoiceSchema.parse(body);

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        customer: true,
        lineItems: true,
        payments: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'INVOICE_UPDATED',
        entityType: 'Invoice',
        entityId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

/**
 * POST /api/billing/invoices/[id]/send
 * Send invoice via email
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const organization = user.organizationMemberships[0].organization;
    const body = await req.json();
    const { recipientEmail } = sendInvoiceSchema.parse(body);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const toEmail = recipientEmail || invoice.customer.email;
    if (!toEmail) {
      return NextResponse.json({ error: 'No recipient email available' }, { status: 400 });
    }

    // Send invoice email
    await sendEmail({
      to: toEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${organization.name}`,
      html: `
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.customer.name},</p>
        <p>Please find your invoice for the period ${invoice.billingPeriodStart.toLocaleDateString()} to ${invoice.billingPeriodEnd.toLocaleDateString()}.</p>
        
        <h3>Invoice Details:</h3>
        <ul>
          <li>Invoice Number: ${invoice.invoiceNumber}</li>
          <li>Due Date: ${invoice.dueDate.toLocaleDateString()}</li>
          <li>Total Amount: $${invoice.totalAmount.toFixed(2)}</li>
        </ul>
        
        <h3>Line Items:</h3>
        <table border="1" cellpadding="5">
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
          ${invoice.lineItems.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        
        <p><strong>Subtotal:</strong> $${invoice.subtotal.toFixed(2)}</p>
        <p><strong>Tax:</strong> $${invoice.taxAmount.toFixed(2)}</p>
        <p><strong>Total:</strong> $${invoice.totalAmount.toFixed(2)}</p>
        
        <p>Thank you for your business!</p>
      `,
    });

    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id: params.id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'INVOICE_SENT',
        entityType: 'Invoice',
        entityId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          recipientEmail: toEmail,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      sentTo: toEmail,
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
