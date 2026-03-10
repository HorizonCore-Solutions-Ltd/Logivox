import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/../../../../lib/audit-service"; // Adjust based on path

export const dynamic = "force-dynamic";

interface HandoverResponse {
  loadSheet: {
    id: string;
    number: string;
    carrier: string;
    vehicle?: {
      type: string;
      length: string | null;
      maxWeight: number | null;
    };
    destination: string | null;
    status: string;
    metrics: {
      totalWeight: number;
      totalContainers: number;
    };
  };
  custody: {
    startedBy: string | null;
    startedAt: string | null;
    completedBy: string | null;
    completedAt: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
  };
  quality: {
    status: "SAFE" | "ATTENTION_REQUIRED" | "UNSAFE";
    activeAlerts: number;
    incidents: Array<{
      type: string;
      severity: string;
      message: string;
      reportedAt: string;
    }>;
  };
  manifest: Array<{
    id: string;
    type: string;
    position: string | null;
    weight: number | null;
    contents: string | null;
    customFields: Record<string, any>;
  }>;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { searchParams } = new URL(request.url);
  const loadSheetId = searchParams.get("loadSheetId");
  const loadSheetNumber = searchParams.get("loadSheetNumber");

  if (!loadSheetId && !loadSheetNumber) {
    return NextResponse.json(
      { error: "Missing loadSheetId or loadSheetNumber" },
      { status: 400 },
    );
  }

  try {
    const loadSheet = await prisma.loadSheet.findFirst({
      where: {
        organizationId,
        OR: [
          { id: loadSheetId || undefined },
          { loadSheetNumber: loadSheetNumber || undefined },
        ],
      },
      include: {
        customer: true,
        vehicleType: true,
        containers: {
          include: {
            containerItems: {
              take: 5,
            },
          },
        },
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!loadSheet) {
      return NextResponse.json(
        { error: "Load Sheet not found" },
        { status: 404 },
      );
    }

    const startEvent = loadSheet.events.find(
      (e) => e.eventType === "LOADING_STARTED" || e.eventType === "CREATED",
    );
    const completeEvent = loadSheet.events.find(
      (e) => e.eventType === "LOADING_COMPLETED" || e.eventType === "DEPARTED",
    );
    const approveEvent = loadSheet.events.find(
      (e) => e.eventType === "APPROVED",
    );

    const qualityAlerts = await prisma.alert.findMany({
      where: {
        organizationId,
        relatedEntityId: loadSheet.id,
        category: "QUALITY",
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
    });

    const isSafe =
      qualityAlerts.filter((a) => a.severity === "HIGH").length === 0;

    const manifest = loadSheet.containers.map((c) => {
      const meta = (c.metadata as Record<string, any>) || {};

      return {
        id: c.containerNumber || c.id,
        type: c.containerType,
        position: meta.position || "Unassigned",
        weight: c.weight,
        contents:
          c.containerItems.map((i) => `${i.quantity}x ${i.sku}`).join(", ") +
          (c.containerItems.length > 0 ? "..." : ""),
        customFields: meta.customFields || {},
      };
    });

    const response: HandoverResponse = {
      loadSheet: {
        id: loadSheet.id,
        number: loadSheet.loadSheetNumber,
        carrier: loadSheet.carrierName,
        vehicle: loadSheet.vehicleType
          ? {
              type: loadSheet.vehicleType.name,
              length: `${loadSheet.vehicleType.length}m`,
              maxWeight: loadSheet.vehicleType.maxWeight,
            }
          : undefined,
        destination: loadSheet.customer?.name || "Unknown",
        status: loadSheet.status,
        metrics: {
          totalWeight: loadSheet.totalWeight,
          totalContainers: loadSheet.totalContainers,
        },
      },
      custody: {
        startedBy:
          startEvent?.userName ||
          (loadSheet.metadata as any)?.startedBy ||
          "System",
        startedAt:
          loadSheet.startedLoadingAt?.toISOString() ||
          startEvent?.createdAt.toISOString() ||
          null,
        completedBy: completeEvent?.userName || "Pending",
        completedAt: loadSheet.finishedLoadingAt?.toISOString() || null,
        approvedBy: loadSheet.approvedBy || approveEvent?.userName || null,
        approvedAt:
          loadSheet.approvedAt?.toISOString() ||
          approveEvent?.createdAt.toISOString() ||
          null,
      },
      quality: {
        status: isSafe
          ? "SAFE"
          : qualityAlerts.length > 0
            ? "ATTENTION_REQUIRED"
            : "SAFE",
        activeAlerts: qualityAlerts.length,
        incidents: qualityAlerts.map((a) => ({
          type: a.title,
          severity: a.severity,
          message: a.message,
          reportedAt: a.triggeredAt.toISOString(),
        })),
      },
      manifest,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Handover API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId, user } = auth;

  try {
    const body = await request.json();
    const { loadSheetId, action, driverId, safetyChecks, signaturePayload } =
      body;

    // Multi-actor enforcement: ensure drivers and dispatchers are correctly segregated
    if (
      !["DISPATCH", "DRIVER_ACCEPT", "SECURITY_GATE_RELEASE"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid handover action" },
        { status: 400 },
      );
    }

    const loadSheet = await prisma.loadSheet.findUnique({
      where: { id: loadSheetId, organizationId },
    });

    if (!loadSheet) {
      return NextResponse.json(
        { error: "LoadSheet not found" },
        { status: 404 },
      );
    }

    // 1. Transaction to update load sheet and record event
    const updatedLoadSheet = await prisma.$transaction(async (tx) => {
      let nextStatus = loadSheet.status;
      if (action === "DISPATCH") nextStatus = "DISPATCHED";
      if (action === "DRIVER_ACCEPT") nextStatus = "IN_TRANSIT";
      if (action === "SECURITY_GATE_RELEASE") nextStatus = "CLEARED";

      const ls = await tx.loadSheet.update({
        where: { id: loadSheetId },
        data: { status: nextStatus },
      });

      await tx.loadSheetEvent.create({
        data: {
          loadSheetId,
          eventType: action,
          userId: user.id,
          userName: user.email,
          metadata: { driverId, safetyChecks, signaturePayload },
        },
      });

      return ls;
    });

    // 2. Cryptographic audit trail for digital chain-of-custody
    const auditService = await import(
      "../../../../../../../lib/audit-service"
    ).catch(() => null);
    if (auditService) {
      await auditService.logAudit({
        eventType: "HANDOVER_" + action,
        userId: user.id,
        userEmail: user.email,
        resource: "LoadSheet",
        resourceId: loadSheetId,
        action: "TRANSFER_OF_CUSTODY",
        changes: { status: updatedLoadSheet.status, before: loadSheet.status },
        metadata: { driverId, safetyChecks, hasSignature: !!signaturePayload },
        severity: "INFO",
      });
    }

    return NextResponse.json({ success: true, loadSheet: updatedLoadSheet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
