export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating a mapping
const createMappingSchema = z.object({
  integrationId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  entityType: z.string().min(1, "Entity type is required"),
  direction: z.enum(["IMPORT", "EXPORT", "BIDIRECTIONAL"]),
  mappings: z.array(
    z.object({
      wmsField: z.string(),
      externalField: z.string(),
      transform: z.string().optional(),
      defaultValue: z.any().optional(),
      isRequired: z.boolean().default(false),
    }),
  ),
  transformations: z.record(z.any()).optional(),
  defaultValues: z.record(z.any()).optional(),
  validationRules: z.record(z.any()).optional(),
  requiredFields: z.array(z.string()).default([]),
  conditions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations/mappings - List mappings
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
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integrationId");
    const entityType = searchParams.get("entityType");
    const direction = searchParams.get("direction");
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (integrationId) where.integrationId = integrationId;
    if (entityType) where.entityType = entityType;
    if (direction) where.direction = direction;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const mappings = await prisma.integrationMapping.findMany({
      where,
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error("Error fetching mappings:", error);
    return NextResponse.json(
      { error: "Failed to fetch mappings" },
      { status: 500 },
    );
  }
}

// POST /api/integrations/mappings - Create mapping
export async function POST(request: Request) {
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
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validatedData = createMappingSchema.parse(body);

    // Verify integration exists
    const integration = await prisma.externalIntegration.findUnique({
      where: { id: validatedData.integrationId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    // Check for existing mapping with same entity type and direction
    const existing = await prisma.integrationMapping.findUnique({
      where: {
        organizationId_integrationId_entityType_direction: {
          organizationId,
          integrationId: validatedData.integrationId,
          entityType: validatedData.entityType,
          direction: validatedData.direction,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "A mapping already exists for this entity type and direction",
        },
        { status: 400 },
      );
    }

    const mapping = await prisma.integrationMapping.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: session.user.id,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating mapping:", error);
    return NextResponse.json(
      { error: "Failed to create mapping" },
      { status: 500 },
    );
  }
}
