import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['INCOMING', 'IN_PROCESS', 'FINAL', 'RANDOM', 'COMPLAINT']).optional(),
  inventoryIds: z.array(z.string()).optional(),
  supplierIds: z.array(z.string()).optional(),
  samplingType: z.enum(['FULL', 'STATISTICAL', 'PERCENTAGE', 'RANDOM']).optional(),
  sampleSize: z.number().int().min(1).optional(),
  samplePercentage: z.number().min(0).max(100).optional(),
  requiresApproval: z.boolean().optional(),
  approvalLevels: z.number().int().min(1).max(10).optional(),
  autoQuarantine: z.boolean().optional(),
  checkpoints: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/inspection-templates/[id] - Get template details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.inspectionTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { inspections: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PATCH /api/inspection-templates/[id] - Update template
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const template = await prisma.inspectionTemplate.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/inspection-templates/[id] - Delete template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if template is used in any inspections
    const inspectionCount = await prisma.qCInspection.count({
      where: { templateId: params.id },
    });

    if (inspectionCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete template that has been used in inspections",
          inspectionCount,
        },
        { status: 409 }
      );
    }

    await prisma.inspectionTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
