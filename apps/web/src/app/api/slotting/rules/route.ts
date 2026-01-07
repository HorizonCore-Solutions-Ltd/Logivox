export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================================================
// SLOTTING OPTIMIZATION API
// ============================================================================
// Optimize warehouse storage locations based on item velocity and characteristics

const slottingRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  warehouseId: z.string(),
  priority: z.number().int().min(1).max(100).default(50),
  criteria: z.object({
    velocityThreshold: z.enum(["FAST", "MEDIUM", "SLOW"]).optional(),
    weightRange: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    dimensionConstraints: z
      .object({
        maxLength: z.number().optional(),
        maxWidth: z.number().optional(),
        maxHeight: z.number().optional(),
      })
      .optional(),
    categoryIds: z.array(z.string()).optional(),
  }),
  targetZoneType: z.enum([
    "PICKING",
    "RESERVE",
    "BULK",
    "FAST_PICK",
    "SLOW_PICK",
  ]),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/slotting/rules
 * List all slotting rules
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");

    const rules = await prisma.slottingRule.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    console.error("Error fetching slotting rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch slotting rules" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/slotting/rules
 * Create a new slotting rule
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = slottingRuleSchema.parse(body);

    const rule = await prisma.slottingRule.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: session.user.id,
      },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SLOTTING_RULE_CREATED",
        entityType: "SlottingRule",
        entityId: rule.id,
        metadata: { ruleName: rule.name, priority: rule.priority },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating slotting rule:", error);
    return NextResponse.json(
      { error: "Failed to create slotting rule" },
      { status: 500 },
    );
  }
}
