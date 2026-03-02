/**
 * GET    /api/replenishment/wave-bind          – list wave ↔ task bindings
 * POST   /api/replenishment/wave-bind          – bind a replenishment task to an upcoming wave
 * PATCH  /api/replenishment/wave-bind/:id      – mark a binding resolved
 *
 * Wave-aware replenishment pre-fills pick faces before a wave releases,
 * preventing mid-wave shortages and reducing picker downtime.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bindSchema = z.object({
  waveId: z.string(),
  taskId: z.string(),
  bindReason: z.string().optional(),
  requiredByTime: z.string().datetime().optional(),
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const waveId = searchParams.get("waveId");
  const resolved = searchParams.get("resolved");

  const binds = await prisma.replenishmentWaveBind.findMany({
    where: {
      organizationId,
      ...(waveId && { waveId }),
      ...(resolved !== null && { resolved: resolved === "true" }),
    },
    include: {
      wave: {
        select: {
          id: true,
          waveNumber: true,
          name: true,
          status: true,
          scheduledFor: true,
        },
      },
      task: {
        select: {
          id: true,
          status: true,
          requiredQty: true,
          pickedQty: true,
          inventoryItem: { select: { name: true, sku: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ binds });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  // Check feature flag
  const flags = await prisma.replenishmentFeatureFlag.findUnique({
    where: { organizationId },
  });
  if (flags && !flags.waveAware)
    return NextResponse.json(
      { error: "Wave-aware replenishment feature is not enabled." },
      { status: 403 },
    );

  const body = await request.json();
  const parsed = bindSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  // Verify wave and task belong to this org
  const [wave, task] = await Promise.all([
    prisma.wavePick.findFirst({
      where: { id: parsed.data.waveId, organizationId },
    }),
    prisma.replenishmentTask.findFirst({
      where: { id: parsed.data.taskId, organizationId },
    }),
  ]);

  if (!wave)
    return NextResponse.json({ error: "Wave not found" }, { status: 404 });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const bind = await prisma.replenishmentWaveBind.upsert({
    where: {
      waveId_taskId: {
        waveId: parsed.data.waveId,
        taskId: parsed.data.taskId,
      },
    },
    update: {
      bindReason: parsed.data.bindReason,
      requiredByTime: parsed.data.requiredByTime
        ? new Date(parsed.data.requiredByTime)
        : (wave.scheduledFor ?? undefined),
    },
    create: {
      organizationId,
      waveId: parsed.data.waveId,
      taskId: parsed.data.taskId,
      bindReason: parsed.data.bindReason ?? "pre-fill",
      requiredByTime: parsed.data.requiredByTime
        ? new Date(parsed.data.requiredByTime)
        : (wave.scheduledFor ?? undefined),
    },
  });

  return NextResponse.json({ bind }, { status: 201 });
}
