import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bomComponentSchema = z.object({
  componentId: z.string().min(1, "Component ID is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().optional(),
  isOptional: z.boolean().default(false),
  isSubstitutable: z.boolean().default(false),
  substituteIds: z.array(z.string()).optional(),
  unitCost: z.number().optional(),
  sequence: z.number().int().min(1).default(1),
  assemblyNotes: z.string().optional(),
  position: z.string().optional(),
  scrapFactor: z.number().min(0).max(100).default(0),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const createBOMSchema = z.object({
  name: z.string().min(1, "BOM name is required"),
  description: z.string().optional(),
  version: z.string().default("1.0"),
  productId: z.string().min(1, "Product ID is required"),
  productQuantity: z.number().int().min(1).default(1),
  bomType: z
    .enum(["ASSEMBLY", "DISASSEMBLY", "KIT", "RECIPE", "CONFIGURATION"])
    .default("ASSEMBLY"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  estimatedTime: z.number().int().optional(),
  laborCost: z.number().optional(),
  overheadCost: z.number().optional(),
  standardYield: z.number().min(0).max(100).default(100),
  scrapRate: z.number().min(0).max(100).default(0),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  notes: z.string().optional(),
  components: z
    .array(bomComponentSchema)
    .min(1, "At least one component is required"),
});

// Helper function to generate BOM number
async function generateBOMNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const lastBOM = await prisma.billOfMaterials.findFirst({
    where: {
      organizationId,
      bomNumber: {
        startsWith: `BOM-${dateStr}`,
      },
    },
    orderBy: { bomNumber: "desc" },
  });

  let sequence = 1;
  if (lastBOM) {
    const lastSequence = parseInt(lastBOM.bomNumber.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `BOM-${dateStr}-${sequence.toString().padStart(3, "0")}`;
}

// GET /api/boms - List all BOMs
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
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const bomType = searchParams.get("bomType");
    const status = searchParams.get("status");
    const isActive = searchParams.get("isActive");

    const where = {
      organizationId,
      ...(productId && { productId }),
      ...(bomType && { bomType: bomType as any }),
      ...(status && { status: status as any }),
      ...(isActive !== null && { isActive: isActive === "true" }),
    };

    const boms = await prisma.billOfMaterials.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
        _count: {
          select: {
            components: true,
            assemblyOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ boms });
  } catch (error) {
    console.error("Error fetching BOMs:", error);
    return NextResponse.json(
      { error: "Failed to fetch BOMs" },
      { status: 500 },
    );
  }
}

// POST /api/boms - Create new BOM
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBOMSchema.parse(body);

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

    // Generate BOM number
    const bomNumber = await generateBOMNumber(organizationId);

    // Calculate total cost from components
    const totalComponentCost = validatedData.components.reduce(
      (sum, comp) => sum + (comp.unitCost || 0) * comp.quantity,
      0,
    );

    const totalCost =
      totalComponentCost +
      (validatedData.laborCost || 0) +
      (validatedData.overheadCost || 0);

    // Create BOM with components
    const bom = await prisma.billOfMaterials.create({
      data: {
        organizationId,
        bomNumber,
        name: validatedData.name,
        description: validatedData.description,
        version: validatedData.version,
        productId: validatedData.productId,
        productQuantity: validatedData.productQuantity,
        bomType: validatedData.bomType,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
        estimatedTime: validatedData.estimatedTime,
        laborCost: validatedData.laborCost,
        overheadCost: validatedData.overheadCost,
        totalCost,
        standardYield: validatedData.standardYield,
        scrapRate: validatedData.scrapRate,
        status: "DRAFT",
        effectiveFrom: validatedData.effectiveFrom
          ? new Date(validatedData.effectiveFrom)
          : new Date(),
        effectiveTo: validatedData.effectiveTo
          ? new Date(validatedData.effectiveTo)
          : null,
        notes: validatedData.notes,
        components: {
          create: validatedData.components.map((comp) => ({
            componentId: comp.componentId,
            quantity: comp.quantity,
            unit: comp.unit,
            isOptional: comp.isOptional,
            isSubstitutable: comp.isSubstitutable,
            substituteIds: comp.substituteIds,
            unitCost: comp.unitCost,
            totalCost: comp.unitCost ? comp.unitCost * comp.quantity : null,
            sequence: comp.sequence,
            assemblyNotes: comp.assemblyNotes,
            position: comp.position,
            scrapFactor: comp.scrapFactor,
            reference: comp.reference,
            notes: comp.notes,
          })),
        },
      },
      include: {
        product: true,
        components: {
          include: {
            component: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
          orderBy: { sequence: "asc" },
        },
      },
    });

    return NextResponse.json(bom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating BOM:", error);
    return NextResponse.json(
      { error: "Failed to create BOM" },
      { status: 500 },
    );
  }
}
