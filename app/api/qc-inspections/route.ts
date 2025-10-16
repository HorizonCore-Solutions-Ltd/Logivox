import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createInspectionSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  category: z.enum(['INCOMING', 'IN_PROCESS', 'FINAL', 'RANDOM', 'COMPLAINT']),
  inventoryId: z.string().min(1, "Inventory ID is required"),
  quantity: z.number().int().min(1),
  sampleSize: z.number().int().min(1).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  grnId: z.string().optional(),
  salesOrderId: z.string().optional(),
  lotId: z.string().optional(),
  notes: z.string().optional(),
});

// Helper function to generate inspection number
async function generateInspectionNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastInspection = await prisma.qCInspection.findFirst({
    where: {
      organizationId,
      inspectionNumber: {
        startsWith: `QC-${dateStr}`,
      },
    },
    orderBy: { inspectionNumber: 'desc' },
  });

  let sequence = 1;
  if (lastInspection) {
    const lastSequence = parseInt(lastInspection.inspectionNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `QC-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

// Helper function to calculate sample size
function calculateSampleSize(
  samplingType: string,
  quantity: number,
  sampleSize?: number,
  samplePercentage?: number
): number {
  switch (samplingType) {
    case 'FULL':
      return quantity;
    case 'STATISTICAL':
      return sampleSize || Math.min(quantity, 100); // Default AQL sample
    case 'PERCENTAGE':
      return Math.ceil(quantity * ((samplePercentage || 10) / 100));
    case 'RANDOM':
      return sampleSize || Math.min(quantity, 10); // Default random sample
    default:
      return quantity;
  }
}

// GET /api/qc-inspections - List all inspections
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const result = searchParams.get("result");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = {
      organizationId,
      ...(status && { status: status as any }),
      ...(result && { result: result as any }),
      ...(category && { category: category as any }),
    };

    const [inspections, total] = await Promise.all([
      prisma.qCInspection.findMany({
        where,
        include: {
          template: { select: { name: true, code: true } },
          inventoryItem: { select: { sku: true, name: true } },
          inspectedBy: { select: { name: true, email: true } },
          _count: {
            select: {
              checkpoints: true,
              approvals: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qCInspection.count({ where }),
    ]);

    return NextResponse.json({
      inspections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}

// POST /api/qc-inspections - Create new inspection
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInspectionSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get template
    const template = await prisma.inspectionTemplate.findUnique({
      where: { id: validatedData.templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Calculate sample size
    const sampleSize = calculateSampleSize(
      template.samplingType,
      validatedData.quantity,
      validatedData.sampleSize || template.sampleSize || undefined,
      template.samplePercentage || undefined
    );

    // Generate inspection number
    const inspectionNumber = await generateInspectionNumber(organizationId);

    // Create inspection with checkpoints
    const inspection = await prisma.qCInspection.create({
      data: {
        organizationId,
        inspectionNumber,
        templateId: validatedData.templateId,
        category: validatedData.category,
        inventoryId: validatedData.inventoryId,
        quantity: validatedData.quantity,
        sampleSize,
        referenceType: validatedData.referenceType,
        referenceId: validatedData.referenceId,
        grnId: validatedData.grnId,
        salesOrderId: validatedData.salesOrderId,
        lotId: validatedData.lotId,
        status: 'PENDING',
        inspectedById: session.user.id,
        notes: validatedData.notes,
        // Create checkpoints from template
        checkpoints: {
          create: (template.checkpoints as any[]).map((cp) => ({
            name: cp.name,
            description: cp.description,
            type: cp.type,
            sequence: cp.sequence,
            isRequired: cp.isRequired,
            expectedValue: cp.expectedValue,
            tolerance: cp.tolerance,
            unit: cp.unit,
            status: 'PENDING',
            performedById: session.user.id,
          })),
        },
        // Create first approval if required
        ...(template.requiresApproval && {
          approvals: {
            create: {
              level: 1,
              status: 'PENDING',
            },
          },
          currentApprovalLevel: 1,
          approvalStatus: 'PENDING',
        }),
      },
      include: {
        checkpoints: true,
        approvals: true,
        template: true,
        inventoryItem: true,
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating inspection:", error);
    return NextResponse.json(
      { error: "Failed to create inspection" },
      { status: 500 }
    );
  }
}
