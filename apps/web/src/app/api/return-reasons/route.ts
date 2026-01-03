export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReturnReasonSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  autoApprove: z.boolean().optional().default(false),
  requiresQC: z.boolean().optional().default(true),
  defaultAction: z.enum(["REFUND", "EXCHANGE", "STORE_CREDIT", "REPAIR", "DISPOSE"]).optional(),
  allowedDays: z.number().int().positive().optional(),
  restockable: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

// GET /api/return-reasons - List return reasons (configuration)
export async function GET(request: NextRequest) {
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
        { error: "No active organization found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const where: any = {
      organizationId: membership.organizationId,
    };

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const returnReasons = await prisma.returnReason.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ returnReasons });
  } catch (error) {
    console.error("Error fetching return reasons:", error);
    return NextResponse.json(
      { error: "Failed to fetch return reasons" },
      { status: 500 }
    );
  }
}

// POST /api/return-reasons - Create custom return reason
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createReturnReasonSchema.parse(body);

    // Check if code already exists
    const existing = await prisma.returnReason.findUnique({
      where: {
        organizationId_code: {
          organizationId: membership.organizationId,
          code: data.code.toUpperCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Return reason code already exists" },
        { status: 400 }
      );
    }

    const returnReason = await prisma.returnReason.create({
      data: {
        organizationId: membership.organizationId,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        autoApprove: data.autoApprove,
        requiresQC: data.requiresQC,
        defaultAction: data.defaultAction,
        allowedDays: data.allowedDays,
        restockable: data.restockable,
        sortOrder: data.sortOrder,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "RETURN_REASON_CREATED",
        entityType: "ReturnReason",
        entityId: returnReason.id,
        metadata: {
          code: returnReason.code,
          name: returnReason.name,
        },
      },
    });

    return NextResponse.json(returnReason, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating return reason:", error);
    return NextResponse.json(
      { error: "Failed to create return reason" },
      { status: 500 }
    );
  }
}
