/**
 * GET   /api/replenishment/features  – fetch org-level feature flags (creates defaults if absent)
 * PATCH /api/replenishment/features  – update feature flags
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  predictiveAI: z.boolean().optional(),
  aiModelVersion: z.string().nullable().optional(),
  forecastRefreshHours: z.number().int().min(1).max(168).optional(),
  iotTriggers: z.boolean().optional(),
  robotics: z.boolean().optional(),
  waveAware: z.boolean().optional(),
  microTasks: z.boolean().optional(),
  costOptimisation: z.boolean().optional(),
  digitalTwin: z.boolean().optional(),
  billingIntegration: z.boolean().optional(),
  autoApprovalLimitUsd: z.number().min(0).optional(),
});

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  // Upsert: create defaults if the row doesn't exist yet
  const flags = await prisma.replenishmentFeatureFlag.upsert({
    where: { organizationId },
    update: {},
    create: { organizationId },
  });

  return NextResponse.json({ features: flags });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only ADMIN / OWNER may change feature flags
  const user = session.user as any;
  if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role ?? ""))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const organizationId = user.organizationId;

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

  const flags = await prisma.replenishmentFeatureFlag.upsert({
    where: { organizationId },
    update: parsed.data,
    create: { organizationId, ...parsed.data },
  });

  return NextResponse.json({ features: flags });
}
