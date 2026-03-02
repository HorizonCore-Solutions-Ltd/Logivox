/**
 * GET    /api/replenishment/rules/:id  – fetch a single rule
 * PATCH  /api/replenishment/rules/:id  – update rule fields (supports partial updates, e.g. { isActive })
 * DELETE /api/replenishment/rules/:id  – soft-delete (deactivate) or hard-delete
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  strategy: z
    .enum(["MIN_MAX", "REORDER_POINT", "DEMAND_BASED", "PERIODIC_REVIEW"])
    .optional(),
  inventoryItemId: z.string().nullable().optional(),
  warehouseId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  minQty: z.number().int().min(0).optional(),
  maxQty: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQty: z.number().int().min(1).optional(),
  demandDays: z.number().int().min(1).max(365).optional(),
  leadTimeDays: z.number().int().min(0).max(365).optional(),
  reviewFrequencyDays: z.number().int().min(1).max(365).optional(),
  nextReviewDate: z.string().datetime().nullable().optional(),
  autoCreatePO: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ── helpers ───────────────────────────────────────────────────────────────────

async function resolveRule(id: string, organizationId: string) {
  return prisma.replenishmentRule.findFirst({
    where: { id, organizationId },
  });
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const rule = await prisma.replenishmentRule.findFirst({
    where: { id: params.id, organizationId },
    include: {
      _count: { select: { tasks: { where: { status: "PENDING" } } } },
      inventoryItem: {
        select: { id: true, name: true, sku: true, quantity: true },
      },
      warehouse: { select: { id: true, name: true, code: true } },
      supplier: { select: { id: true, name: true } },
    },
  });

  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ rule });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const existing = await resolveRule(params.id, organizationId);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const updated = await prisma.replenishmentRule.update({
    where: { id: params.id },
    data: parsed.data,
    include: {
      _count: { select: { tasks: { where: { status: "PENDING" } } } },
      inventoryItem: {
        select: { id: true, name: true, sku: true, quantity: true },
      },
      warehouse: { select: { id: true, name: true, code: true } },
      supplier: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ rule: updated });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const existing = await resolveRule(params.id, organizationId);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const hard = searchParams.get("hard") === "true";

  if (hard) {
    await prisma.replenishmentRule.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  }

  // Soft delete – deactivate so existing tasks aren't orphaned
  const deactivated = await prisma.replenishmentRule.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ rule: deactivated, message: "Rule deactivated" });
}
