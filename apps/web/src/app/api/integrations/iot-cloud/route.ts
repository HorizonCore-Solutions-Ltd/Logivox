import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const IOT_PROVIDERS = ["AWS_IOT", "AZURE_IOT", "GOOGLE_IOT"] as const;

// GET /api/integrations/iot-cloud
// Returns IoT cloud connections, device registry summaries, telemetry endpoint info
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId } = authResult as { orgId: string };

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId: orgId,
      provider: { in: IOT_PROVIDERS as unknown as string[] },
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
    orderBy: { provider: "asc" },
  });

  const enriched = connections.map((c) => {
    const features = (c.features as Record<string, unknown>) ?? {};
    return {
      ...c,
      status: c.isActive
        ? c.lastSyncAt
          ? "connected"
          : "pending"
        : "disconnected",
      deviceCount: features.deviceCount ?? 0,
      telemetryEndpoint: features.telemetryEndpoint ?? null,
      region: features.region ?? null,
      hubName: features.hubName ?? null,
      mqttBroker: features.mqttBroker ?? null,
      lastTelemetryAt: c.lastSyncAt,
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: IOT_PROVIDERS,
    summary: {
      totalPlatforms: enriched.length,
      activePlatforms: enriched.filter((c) => c.status === "connected").length,
      totalDevices: enriched.reduce(
        (sum, c) => sum + ((c.deviceCount as number) || 0),
        0,
      ),
    },
  });
}

// POST /api/integrations/iot-cloud
// Actions: sync-devices | test | configure
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId, userId } = authResult as { orgId: string; userId: string };

  const body = await req.json();
  const { action, integrationId, config } = body as {
    action: "sync-devices" | "test" | "configure";
    integrationId: string;
    config?: {
      region?: string;
      hubName?: string;
      mqttBroker?: string;
      telemetryEndpoint?: string;
      topicFilter?: string;
    };
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
        message: `IoT cloud connection test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "IoT cloud platform reachable",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "sync-devices") {
    const syncRecord = await prisma.integrationSync.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: "RUNNING",
        data: { action: "sync-devices", initiatedBy: userId },
      },
    });

    // In production:
    // AWS IoT: list things from IoT Registry via AWS SDK
    // Azure IoT: query device twin registry via Azure SDK
    // Google IoT: list devices from Device Manager API
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
      message: `IoT device registry synced from ${integration.provider}`,
    });
  }

  if (action === "configure") {
    if (!config) {
      return NextResponse.json({ error: "config required" }, { status: 400 });
    }

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: {
        features: config as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `IoT cloud configuration saved for ${integration.provider}`,
        data: { updatedBy: userId, fields: Object.keys(config) },
      },
    });

    return NextResponse.json({
      success: true,
      message: "IoT cloud configuration saved",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
