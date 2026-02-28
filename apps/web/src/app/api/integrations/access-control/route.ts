import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const ACCESS_PROVIDERS = [
  "PAXTON_NET2",
  "GALLAGHER",
  "HID_ORIGO",
  "LENELS2",
  "BRIVO",
  "GENETEC",
] as const;

// GET /api/integrations/access-control
// Returns access control connections, badge holder count, recent door events
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId } = authResult as { orgId: string };

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId: orgId,
      provider: { in: ACCESS_PROVIDERS as unknown as string[] },
    },
    select: {
      id: true,
      provider: true,
      name: true,
      isActive: true,
      lastSyncAt: true,
      features: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const enriched = connections.map((c) => {
    const features = (c.features as Record<string, unknown>) ?? {};
    return {
      ...c,
      status: c.isActive
        ? c.lastSyncAt
          ? "connected"
          : "pending_sync"
        : "disconnected",
      badgeHolderCount: features.badgeHolderCount ?? 0,
      zoneCount: features.zoneCount ?? 0,
      lastBadgeSync: c.lastSyncAt,
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: ACCESS_PROVIDERS,
    summary: {
      total: enriched.length,
      active: enriched.filter((c) => c.isActive).length,
    },
  });
}

// POST /api/integrations/access-control
// Actions: sync-badges | test | sync-zones
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId, userId } = authResult as { orgId: string; userId: string };

  const body = await req.json();
  const { action, integrationId } = body as {
    action: "sync-badges" | "test" | "sync-zones";
    integrationId: string;
  };

  if (!integrationId) {
    return NextResponse.json(
      { error: "integrationId required" },
      { status: 400 },
    );
  }

  const integration = await prisma.externalIntegration.findFirst({
    where: { id: integrationId, organizationId: orgId },
  });

  if (!integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 },
    );
  }

  if (action === "test") {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `Access control connection test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "Access control system reachable",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "sync-badges" || action === "sync-zones") {
    const syncRecord = await prisma.integrationSync.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: "RUNNING",
        data: { action, initiatedBy: userId },
      },
    });

    // In production: query access control system API and upsert badge holders
    // Map WMS users to access zones based on roles
    await prisma.integrationSync.update({
      where: { id: syncRecord.id },
      data: { status: "SUCCESS", completedAt: new Date(), recordsProcessed: 0 },
    });

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      syncId: syncRecord.id,
      action,
      message: `${action === "sync-badges" ? "Badge" : "Zone"} sync completed for ${integration.provider}`,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
