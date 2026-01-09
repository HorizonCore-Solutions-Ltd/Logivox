/**
 * Individual Work Order Management API
 * GET /api/returns/refurb/[id] - Get work order details
 * PATCH /api/returns/refurb/[id] - Update work order
 * POST /api/returns/refurb/[id]/complete-step - Complete current step
 * POST /api/returns/refurb/[id]/qa - Perform QA
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RefurbishmentService } from "@/lib/services/returns/refurbishment";

const completeStepSchema = z.object({
  notes: z.string().optional(),
  partsUsed: z
    .array(
      z.object({
        partNumber: z.string(),
        quantity: z.number(),
        cost: z.number().optional(),
      }),
    )
    .optional(),
  actualMinutes: z.number().optional(),
});

const qaSchema = z.object({
  testsPassed: z.number(),
  testsFailed: z.number(),
  cosmeticGrade: z.enum(["A", "B", "C", "D", "F"]),
  functionalGrade: z.enum(["A", "B", "C", "D", "F"]),
  notes: z.string().optional(),
  issues: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const workOrder = (await prisma.$queryRaw`
      SELECT wo.*, ri.sku, ri.product_id, p.name as product_name,
             r.rma_number, r.id as rma_id, c.name as customer_name,
             u.name as assigned_to_name
      FROM refurb_work_orders wo
      JOIN "RMAItem" ri ON ri.id = wo.rma_item_id
      JOIN "RMA" r ON r.id = ri.rma_id
      LEFT JOIN "Product" p ON p.id = ri.product_id
      LEFT JOIN "Customer" c ON c.id = r.customer_id
      LEFT JOIN "User" u ON u.id = wo.assigned_to
      WHERE wo.id = ${params.id}
        AND r.organization_id = ${membership.organizationId}
    `) as any[];

    if (!workOrder || workOrder.length === 0) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ workOrder: workOrder[0] });
  } catch (error) {
    console.error("Error fetching work order:", error);
    return NextResponse.json(
      { error: "Failed to fetch work order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { action } = body;

    // Get work order
    const workOrder = (await prisma.$queryRaw`
      SELECT wo.*, r.organization_id
      FROM refurb_work_orders wo
      JOIN "RMAItem" ri ON ri.id = wo.rma_item_id
      JOIN "RMA" r ON r.id = ri.rma_id
      WHERE wo.id = ${params.id}
        AND r.organization_id = ${membership.organizationId}
    `) as any[];

    if (!workOrder || workOrder.length === 0) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    const wo = workOrder[0];

    if (action === "complete-step") {
      const data = completeStepSchema.parse(body);
      const refurbService = new RefurbishmentService();

      const updatedWO = await refurbService.completeStep(
        params.id,
        session.user.id,
        data.notes,
        data.partsUsed,
        data.actualMinutes,
      );

      await prisma.$executeRaw`
        UPDATE refurb_work_orders
        SET 
          current_step_index = ${updatedWO.currentStepIndex},
          steps = ${JSON.stringify(updatedWO.steps)}::jsonb,
          parts_used = ${JSON.stringify(updatedWO.partsUsed)}::jsonb,
          actual_cost = ${updatedWO.actualCost},
          status = ${updatedWO.status},
          completed_at = ${updatedWO.completedAt},
          updated_at = NOW()
        WHERE id = ${params.id}
      `;

      return NextResponse.json({
        workOrder: updatedWO,
        message: "Step completed successfully",
      });
    }

    if (action === "qa") {
      const data = qaSchema.parse(body);
      const refurbService = new RefurbishmentService();

      const qaResult = await refurbService.performQA(params.id, {
        inspectorId: session.user.id,
        testsPassed: data.testsPassed,
        testsFailed: data.testsFailed,
        cosmeticGrade: data.cosmeticGrade,
        functionalGrade: data.functionalGrade,
        overallPass: data.testsFailed === 0 && data.functionalGrade !== "F",
        notes: data.notes,
        issues: data.issues,
        images: data.images,
      });

      await prisma.$executeRaw`
        UPDATE refurb_work_orders
        SET 
          qa_results = ${JSON.stringify([...(wo.qa_results || []), qaResult])}::jsonb,
          qa_passed = ${qaResult.overallPass},
          qa_completed_at = ${qaResult.timestamp},
          status = ${qaResult.overallPass ? "COMPLETED" : "QA_FAILED"},
          updated_at = NOW()
        WHERE id = ${params.id}
      `;

      // Update RMA item if QA passed
      if (qaResult.overallPass) {
        await prisma.rMAItem.update({
          where: { id: wo.rma_item_id },
          data: {
            disposition: "REFURBISHED",
            condition: "REFURBISHED",
            metadata: {
              qaGrade: data.functionalGrade,
              cosmeticGrade: data.cosmeticGrade,
            },
          },
        });
      }

      return NextResponse.json({
        qaResult,
        message: "QA completed successfully",
      });
    }

    // General update
    const allowedFields = [
      "status",
      "priority",
      "assigned_to",
      "estimated_days",
      "notes",
    ];
    const updates: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.$executeRawUnsafe(
        `
        UPDATE refurb_work_orders
        SET ${Object.keys(updates)
          .map((k, i) => `${k} = $${i + 2}`)
          .join(", ")},
            updated_at = NOW()
        WHERE id = $1
      `,
        params.id,
        ...Object.values(updates),
      );
    }

    return NextResponse.json({ message: "Work order updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating work order:", error);
    return NextResponse.json(
      {
        error: "Failed to update work order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
