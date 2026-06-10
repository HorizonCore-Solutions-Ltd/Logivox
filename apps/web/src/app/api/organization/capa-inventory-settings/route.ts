export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";

const DEFAULT_SETTINGS = {
  enabled: true,
  thresholds: {
    damage: 10,
    adjustment: 25,
    transfer: 50,
  },
  warehouseOverrides: {} as Record<
    string,
    {
      damage?: number;
      adjustment?: number;
      transfer?: number;
    }
  >,
};

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  thresholds: z
    .object({
      damage: z.number().int().min(1).max(100000).optional(),
      adjustment: z.number().int().min(1).max(100000).optional(),
      transfer: z.number().int().min(1).max(100000).optional(),
    })
    .optional(),
  warehouseOverrides: z
    .record(
      z.object({
        damage: z.number().int().min(1).max(100000).optional(),
        adjustment: z.number().int().min(1).max(100000).optional(),
        transfer: z.number().int().min(1).max(100000).optional(),
      }),
    )
    .optional(),
});

export async function GET() {
  const permission = await requirePermission("view");
  if (permission.error) return permission.error;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { securitySettings: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  const securitySettings = (org.securitySettings as Record<string, any>) || {};
  const saved =
    (securitySettings.capaInventorySettings as Record<string, any>) || {};

  const settings = {
    ...DEFAULT_SETTINGS,
    ...saved,
    thresholds: {
      ...DEFAULT_SETTINGS.thresholds,
      ...(saved.thresholds || {}),
    },
  };

  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const permission = await requirePermission("manageSettings");
  if (permission.error) return permission.error;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { securitySettings: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  const currentSecurity = (org.securitySettings as Record<string, any>) || {};
  const currentSettings =
    (currentSecurity.capaInventorySettings as Record<string, any>) || {};

  const updatedSettings = {
    ...DEFAULT_SETTINGS,
    ...currentSettings,
    ...parsed.data,
    thresholds: {
      ...DEFAULT_SETTINGS.thresholds,
      ...(currentSettings.thresholds || {}),
      ...(parsed.data.thresholds || {}),
    },
  };

  const updatedSecurity = {
    ...currentSecurity,
    capaInventorySettings: updatedSettings,
  };

  await prisma.organization.update({
    where: { id: organizationId },
    data: { securitySettings: updatedSecurity },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      organizationId,
      action: "UPDATE_CAPA_INVENTORY_SETTINGS",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      description:
        "Updated CAPA auto-creation thresholds for inventory adjustments",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  return NextResponse.json({ success: true, settings: updatedSettings });
}
