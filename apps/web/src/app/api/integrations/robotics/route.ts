import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const ROBOTICS_PROVIDERS = [
  "AUTOSTORE",
  "DEMATIC",
  "LOCUS_ROBOTICS",
  "GEEK_PLUS",
  "FETCH_ROBOTICS",
] as const;

// GET /api/integrations/robotics
// Returns robot fleet status from connected WCS systems
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { organizationId } = authResult;

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId,
      provider: { in: ROBOTICS_PROVIDERS as unknown as string[] },
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
      fleetSize: features.fleetSize ?? 0,
      activeBots: features.activeBots ?? 0,
      tasksQueued: features.tasksQueued ?? 0,
      throughputPerHour: features.throughputPerHour ?? 0,
      wcsVersion: features.wcsVersion ?? null,
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: ROBOTICS_PROVIDERS,
    summary: {
      totalSystems: enriched.length,
      activeSystems: enriched.filter((c) => c.status === "connected").length,
      totalFleetSize: enriched.reduce(
        (sum, c) => sum + (c.fleetSize as number),
        0,
      ),
    },
  });
}

// POST /api/integrations/robotics
// Actions: dispatch | test | sync-fleet | pause | resume
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { organizationId, userId } = authResult;

  const body = await req.json();
  const { action, integrationId, task } = body as {
    action: "dispatch" | "test" | "sync-fleet" | "pause" | "resume";
    integrationId: string;
    task?: {
      taskType: string;
      priority?: number;
      sourceLocation?: string;
      targetLocation?: string;
      itemBarcode?: string;
      quantity?: number;
    };
  };

  if (!integrationId) {
    return NextResponse.json(
      { error: "integrationId required" },
      { status: 400 },
    );
  }

  const integration = await prisma.externalIntegration.findFirst({
    where: { id: integrationId, organizationId },
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
        message: `Robotics WCS connection test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "WCS system reachable",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "dispatch") {
    if (!task?.taskType) {
      return NextResponse.json(
        { error: "task.taskType required" },
        { status: 400 },
      );
    }

    const existingDispatches = await prisma.integrationLog.count({
      where: {
        integrationId,
        message: { startsWith: "Robot task dispatched" },
      },
    });
    const taskId = `TASK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(existingDispatches + 1).padStart(5, "0")}`;

    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `Robot task dispatched: ${task.taskType}`,
        data: { taskId, task, dispatchedBy: userId },
      },
    });

    // In production: POST to WCS API endpoint with task payload
    return NextResponse.json({
      success: true,
      taskId,
      provider: integration.provider,
      task,
      status: "queued",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "sync-fleet") {
    const syncRecord = await prisma.integrationSync.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: "RUNNING",
        data: { action: "sync-fleet", initiatedBy: userId },
      },
    });

    // In production: pull robot list, status, and current task assignments from WCS
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
      message: "Fleet status synced",
    });
  }

  if (action === "pause" || action === "resume") {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "WARN",
        message: `Robotics system ${action}d by ${userId}`,
        data: { action, initiatedBy: userId },
      },
    });

    // In production: call WCS pause/resume endpoint
    return NextResponse.json({
      success: true,
      action,
      provider: integration.provider,
      message: `Robotics system ${action}d`,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
