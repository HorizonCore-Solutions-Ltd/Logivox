/**
 * Refurbishment API
 * GET /api/returns/refurb/work-orders - List work orders
 * POST /api/returns/refurb/work-orders - Create work order
 * GET /api/returns/refurb/templates - List templates
 * POST /api/returns/refurb/templates - Create template
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { RefurbishmentService } from '@/lib/services/returns/refurbishment';

const createWorkOrderSchema = z.object({
  rmaItemId: z.string(),
  productId: z.string(),
  templateId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedDays: z.number().optional(),
  notes: z.string().optional(),
});

const createTemplateSchema = z.object({
  name: z.string(),
  category: z.string(),
  estimatedDays: z.number(),
  steps: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    estimatedMinutes: z.number(),
    requiredSkills: z.array(z.string()).optional(),
    requiredParts: z.array(z.object({
      partNumber: z.string(),
      quantity: z.number(),
      description: z.string().optional(),
    })).optional(),
    qualityChecks: z.array(z.object({
      name: z.string(),
      criteria: z.string(),
      required: z.boolean().default(true),
    })).optional(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type'); // work-orders or templates

    if (type === 'templates') {
      const templates = await prisma.$queryRaw`
        SELECT * FROM refurb_templates
        WHERE organization_id = ${membership.organizationId}
        ORDER BY name
      `;

      return NextResponse.json({ templates });
    }

    // Get work orders
    let query = `
      SELECT wo.*, ri.sku, ri.product_id, p.name as product_name,
             r.rma_number, c.name as customer_name,
             u.name as assigned_to_name
      FROM refurb_work_orders wo
      JOIN "RMAItem" ri ON ri.id = wo.rma_item_id
      JOIN "RMA" r ON r.id = ri.rma_id
      LEFT JOIN "Product" p ON p.id = ri.product_id
      LEFT JOIN "Customer" c ON c.id = r.customer_id
      LEFT JOIN "User" u ON u.id = wo.assigned_to
      WHERE r.organization_id = $1
    `;

    const params: any[] = [membership.organizationId];

    if (status) {
      query += ` AND wo.status = $${params.length + 1}`;
      params.push(status);
    }

    if (priority) {
      query += ` AND wo.priority = $${params.length + 1}`;
      params.push(priority);
    }

    query += ` ORDER BY 
      CASE wo.priority 
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
      END,
      wo.created_at DESC
    `;

    const workOrders = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error('Error fetching refurb data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refurbishment data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'template') {
      const data = createTemplateSchema.parse(body);

      const refurbService = new RefurbishmentService();
      const template = await refurbService.createTemplate(data);

      await prisma.$executeRaw`
        INSERT INTO refurb_templates (
          id, organization_id, name, category, estimated_days,
          steps, metadata, created_at, created_by
        ) VALUES (
          ${template.id}, ${membership.organizationId}, ${data.name},
          ${data.category}, ${data.estimatedDays}, ${JSON.stringify(data.steps)}::jsonb,
          '{}'::jsonb, NOW(), ${session.user.id}
        )
      `;

      return NextResponse.json({
        template,
        message: 'Refurbishment template created',
      });
    }

    // Create work order
    const data = createWorkOrderSchema.parse(body);

    // Verify RMA item
    const rmaItem = await prisma.rMAItem.findFirst({
      where: { id: data.rmaItemId },
      include: {
        rma: true,
        product: true,
      },
    });

    if (!rmaItem || rmaItem.rma.organizationId !== membership.organizationId) {
      return NextResponse.json({ error: 'RMA item not found' }, { status: 404 });
    }

    // Get template if specified
    let steps = [];
    if (data.templateId) {
      const template = await prisma.$queryRaw`
        SELECT * FROM refurb_templates
        WHERE id = ${data.templateId}
          AND organization_id = ${membership.organizationId}
      ` as any[];

      if (template.length > 0) {
        steps = template[0].steps;
      }
    }

    const refurbService = new RefurbishmentService();
    const workOrder = await refurbService.createWorkOrder({
      rmaItemId: data.rmaItemId,
      productId: data.productId,
      sku: rmaItem.sku || '',
      condition: rmaItem.condition || 'USED',
      priority: data.priority,
      estimatedDays: data.estimatedDays,
      steps,
      notes: data.notes,
    });

    await prisma.$executeRaw`
      INSERT INTO refurb_work_orders (
        id, rma_item_id, product_id, status, priority,
        estimated_days, estimated_cost, steps, current_step_index,
        parts_used, qa_results, metadata, created_at, created_by
      ) VALUES (
        ${workOrder.id}, ${data.rmaItemId}, ${data.productId}, ${workOrder.status},
        ${data.priority}, ${data.estimatedDays || null}, ${workOrder.estimatedCost},
        ${JSON.stringify(workOrder.steps)}::jsonb, 0, '[]'::jsonb,
        '[]'::jsonb, ${JSON.stringify({ notes: data.notes })}::jsonb,
        NOW(), ${session.user.id}
      )
    `;

    // Update RMA item
    await prisma.rMAItem.update({
      where: { id: data.rmaItemId },
      data: { disposition: 'REFURBISH' },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: 'REFURB_WORK_ORDER_CREATED',
        entityType: 'REFURB_WORK_ORDER',
        entityId: workOrder.id,
        metadata: {
          rmaNumber: rmaItem.rma.rmaNumber,
          sku: rmaItem.sku,
          priority: data.priority,
        },
      },
    });

    return NextResponse.json({
      workOrder,
      message: 'Work order created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating refurb data:', error);
    return NextResponse.json(
      { error: 'Failed to create refurbishment data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
