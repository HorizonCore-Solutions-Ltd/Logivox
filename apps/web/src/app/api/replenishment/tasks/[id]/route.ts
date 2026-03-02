/**
 * PATCH /api/replenishment/tasks/:id
 * Dedicated lifecycle API for Humans or AMRs to accept and complete Replenishment tasks
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const taskPatchSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "PO_CREATED",
      "COMPLETED",
      "CANCELLED",
      "FAILED",
    ])
    .optional(),
  pickedQty: z.number().int().min(0).optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const existing = await prisma.replenishmentTask.findFirst({
    where: { id: params.id, organizationId },
  });

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const updates: any = { ...parsed.data };

  if (
    parsed.data.status === "IN_PROGRESS" &&
    existing.status !== "IN_PROGRESS"
  ) {
    updates.startedAt = new Date();
  }

  if (parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    updates.completedAt = new Date();

    // Auto-update the active inventory stock since it was physically replenished
    if (parsed.data.pickedQty || existing.requiredQty) {
      await prisma.inventoryItem.update({
        where: { id: existing.inventoryItemId },
        data: {
          quantity: {
            increment: parsed.data.pickedQty ?? existing.requiredQty,
          },
        },
      });

      // Auto-compute simulated billing cost for completion event
      await prisma.replenishmentCostLog.create({
        data: {
          organizationId,
          taskId: existing.id,
          chargeType: "REPLEN_EXECUTION",
          amountUsd: 1.5, // simulated cost per task
          description: "Task completion scan execution charge",
        },
      });
    }
  }

  const updated = await prisma.replenishmentTask.update({
    where: { id: params.id },
    data: updates,
  });

  return NextResponse.json({ task: updated });
}
