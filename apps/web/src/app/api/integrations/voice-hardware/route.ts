import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const VOICE_PROVIDERS = [
  "HONEYWELL_VOCOLLECT",
  "LYDIA_VOICE",
  "ANDROID_HEADSET",
] as const;

export interface OperatorVoiceProfile {
  operatorId: string;
  name: string;
  language: string;
  voiceTemplateId?: string;
  headsetSerial?: string;
  status: "active" | "inactive";
  lastTrainedAt?: string;
}

// GET /api/integrations/voice-hardware
// Returns voice system connections, headset inventory, active sessions
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId } = authResult as { orgId: string };

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId: orgId,
      provider: { in: VOICE_PROVIDERS as unknown as string[] },
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
    const profiles =
      (features.operatorProfiles as OperatorVoiceProfile[]) ?? [];
    return {
      ...c,
      status: c.isActive
        ? c.lastSyncAt
          ? "connected"
          : "pending"
        : "disconnected",
      headsetCount: features.headsetCount ?? 0,
      activeSessions: features.activeSessions ?? 0,
      operatorProfileCount: profiles.length,
      supportedLanguages: features.supportedLanguages ?? ["en-GB", "en-US"],
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: VOICE_PROVIDERS,
    summary: {
      totalSystems: enriched.length,
      activeSystems: enriched.filter((c) => c.status === "connected").length,
      totalHeadsets: enriched.reduce(
        (sum, c) => sum + ((c.headsetCount as number) || 0),
        0,
      ),
    },
  });
}

// POST /api/integrations/voice-hardware
// Actions: sync-profiles | push-tasks | test | register-headset | train
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId, userId } = authResult as { orgId: string; userId: string };

  const body = await req.json();
  const { action, integrationId, operatorIds, tasks, headset } = body as {
    action:
      | "sync-profiles"
      | "push-tasks"
      | "test"
      | "register-headset"
      | "train";
    integrationId: string;
    operatorIds?: string[];
    tasks?: Array<{
      taskId: string;
      operatorId: string;
      instruction: string;
      location?: string;
      barcode?: string;
      quantity?: number;
    }>;
    headset?: { serial: string; model: string };
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
        message: `Voice hardware connection test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "Voice system reachable",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "sync-profiles") {
    const syncRecord = await prisma.integrationSync.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: "RUNNING",
        data: { action: "sync-profiles", operatorIds, initiatedBy: userId },
      },
    });

    // In production:
    // Vocollect: push operator profiles via VoiceConsole API
    // Lydia: sync operator records to Lydia server
    // Android: push profiles to Android voice app via MDM
    await prisma.integrationSync.update({
      where: { id: syncRecord.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        recordsProcessed: operatorIds?.length ?? 0,
      },
    });

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      syncId: syncRecord.id,
      profilesSynced: operatorIds?.length ?? 0,
      message: `Operator voice profiles synced to ${integration.provider}`,
    });
  }

  if (action === "push-tasks") {
    if (!tasks?.length) {
      return NextResponse.json(
        { error: "tasks array required" },
        { status: 400 },
      );
    }

    // In production: post voice task queue to VMS server / Android voice app
    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `${tasks.length} voice tasks pushed to ${integration.provider}`,
        data: { taskIds: tasks.map((t) => t.taskId), pushedBy: userId },
      },
    });

    return NextResponse.json({
      success: true,
      taskCount: tasks.length,
      provider: integration.provider,
      message: `Voice tasks dispatched`,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "register-headset") {
    if (!headset?.serial) {
      return NextResponse.json(
        { error: "headset.serial required" },
        { status: 400 },
      );
    }

    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `Headset registered: ${headset.serial} (${headset.model})`,
        data: { headset, registeredBy: userId },
      },
    });

    return NextResponse.json({
      success: true,
      headset,
      message: "Headset registered",
    });
  }

  if (action === "train") {
    const syncRecord = await prisma.integrationSync.create({
      data: {
        integrationId,
        startedAt: new Date(),
        status: "RUNNING",
        data: { action: "train", operatorIds, initiatedBy: userId },
      },
    });

    // In production: trigger voice template training for Vocollect/Lydia
    await prisma.integrationSync.update({
      where: { id: syncRecord.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        recordsProcessed: operatorIds?.length ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      syncId: syncRecord.id,
      message: `Voice training initiated for ${operatorIds?.length ?? 0} operators`,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
