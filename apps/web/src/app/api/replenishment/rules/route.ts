/**
 * GET  /api/replenishment/rules  – list rules
 * POST /api/replenishment/rules  – create rule
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  strategy: z.enum(["MIN_MAX", "REORDER_POINT", "DEMAND_BASED", "PERIODIC_REVIEW"]).default("MIN_MAX"),
  inventoryItemId: z.string().optional(),
  warehouseId: z.string().optional(),
  minQty: z.number().int().min(0).default(0),
  maxQty: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).default(0),
  reorderQty: z.number().int().min(1).default(1),
  demandDays: z.number().int().min(1).max(365).default(30),
  leadTimeDays: z.number().int().min(0).max(365).default(3),
  supplierId: z.string().optional(),
  autoCreatePO: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get("warehouseId");
  const isActive = searchParams.get("isActive");

  const rules = await prisma.replenishmentRule.findMany({
    where: {
      organizationId,
      ...(warehouseId && { warehouseId }),
      ...(isActive !== null && { isActive: isActive === "true" }),
    },
    include: {
      _count: { select: { tasks: { where: { status: "PENDING" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const rule = await prisma.replenishmentRule.create({
    data: { ...parsed.data, organizationId, createdById: session.user.id },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
