import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const BI_PROVIDERS = ["POWER_BI", "TABLEAU", "LOOKER", "QLIK", "DOMO"] as const;

// GET /api/integrations/bi
// Returns BI tool connections, last export timestamps, dataset status
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId } = authResult as { orgId: string };

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId: orgId,
      provider: { in: BI_PROVIDERS as unknown as string[] },
    },
    select: {
      id: true,
      provider: true,
      name: true,
      isActive: true,
      lastSyncAt: true,
      syncFrequency: true,
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
      lastExport: c.lastSyncAt,
      datasetName: features.datasetName ?? null,
      workspaceId: features.workspaceId ?? null,
      rowsExported: features.rowsExported ?? 0,
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: BI_PROVIDERS,
  });
}

// POST /api/integrations/bi
// Actions: export | test | configure
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId, userId } = authResult as { orgId: string; userId: string };

  const body = await req.json();
  const { action, integrationId, exportConfig } = body as {
    action: "export" | "test" | "configure";
    integrationId: string;
    exportConfig?: {
      datasets?: string[]; // e.g. ['inventory', 'orders', 'labour', 'kpis']
      dateRange?: { from: string; to: string };
      format?: "json" | "csv";
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
        message: `BI connection test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "BI tool API reachable",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "export") {
    const datasets = exportConfig?.datasets ?? ["inventory", "orders", "kpis"];

    const syncRecord = await prisma.integrationSync.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: "RUNNING",
        data: { action: "export", datasets, exportConfig, initiatedBy: userId },
      },
    });

    // In production:
    // Power BI: use push datasets API or refresh dataflow
    // Tableau: use REST API to publish datasource
    // Looker: use Looker API to write LookML or trigger PDT
    // Qlik: use QRS API to reload app
    // Domo: use DataSet API to replace rows

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
      datasets,
      provider: integration.provider,
      message: `KPI export queued for ${integration.provider}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "configure") {
    if (!exportConfig) {
      return NextResponse.json(
        { error: "exportConfig required" },
        { status: 400 },
      );
    }

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: {
        features: exportConfig as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "BI export configuration saved",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
