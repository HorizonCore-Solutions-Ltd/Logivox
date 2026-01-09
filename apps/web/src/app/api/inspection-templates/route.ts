import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const checkpointSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "VISUAL",
    "MEASUREMENT",
    "FUNCTIONAL",
    "DOCUMENTATION",
    "PACKAGING",
    "LABELING",
  ]),
  sequence: z.number().int().min(1),
  isRequired: z.boolean().default(true),
  expectedValue: z.string().optional(),
  tolerance: z.string().optional(),
  unit: z.string().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  code: z.string().min(1, "Template code is required"),
  description: z.string().optional(),
  category: z.enum(["INCOMING", "IN_PROCESS", "FINAL", "RANDOM", "COMPLAINT"]),
  inventoryIds: z.array(z.string()).optional(), // null means all items
  supplierIds: z.array(z.string()).optional(), // null means all suppliers
  samplingType: z
    .enum(["FULL", "STATISTICAL", "PERCENTAGE", "RANDOM"])
    .default("FULL"),
  sampleSize: z.number().int().min(1).optional(),
  samplePercentage: z.number().min(0).max(100).optional(),
  requiresApproval: z.boolean().default(false),
  approvalLevels: z.number().int().min(1).max(10).default(1),
  autoQuarantine: z.boolean().default(false),
  checkpoints: z
    .array(checkpointSchema)
    .min(1, "At least one checkpoint is required"),
  isActive: z.boolean().default(true),
});

// GET /api/inspection-templates - List all inspection templates
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
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
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    const templates = await prisma.inspectionTemplate.findMany({
      where: {
        organizationId,
        ...(category && { category: category as any }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error("Error fetching inspection templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspection templates" },
      { status: 500 },
    );
  }
}

// POST /api/inspection-templates - Create new inspection template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Get user's organization
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
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Check if code is unique within organization
    const existing = await prisma.inspectionTemplate.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: validatedData.code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Template code already exists" },
        { status: 409 },
      );
    }

    // Validate sampling configuration
    if (
      validatedData.samplingType === "STATISTICAL" &&
      !validatedData.sampleSize
    ) {
      return NextResponse.json(
        { error: "Sample size required for statistical sampling" },
        { status: 400 },
      );
    }

    if (
      validatedData.samplingType === "PERCENTAGE" &&
      !validatedData.samplePercentage
    ) {
      return NextResponse.json(
        { error: "Sample percentage required for percentage sampling" },
        { status: 400 },
      );
    }

    // Create template
    const template = await prisma.inspectionTemplate.create({
      data: {
        organizationId,
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        category: validatedData.category,
        inventoryIds: validatedData.inventoryIds || null,
        supplierIds: validatedData.supplierIds || null,
        samplingType: validatedData.samplingType,
        sampleSize: validatedData.sampleSize,
        samplePercentage: validatedData.samplePercentage,
        requiresApproval: validatedData.requiresApproval,
        approvalLevels: validatedData.approvalLevels,
        autoQuarantine: validatedData.autoQuarantine,
        checkpoints: validatedData.checkpoints,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating inspection template:", error);
    return NextResponse.json(
      { error: "Failed to create inspection template" },
      { status: 500 },
    );
  }
}
