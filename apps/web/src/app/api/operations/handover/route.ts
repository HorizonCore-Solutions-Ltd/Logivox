// apps/web/src/app/api/operations/handover/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

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
    approvedBy: string | null; // "Green Light" person
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
    type: string; // pallet, crate
    position: string | null; // "Row 1, Left", "Nose"
    weight: number | null;
    contents: string | null; // summary
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
      { status: 400 }
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
                    take: 5 // Get some sample items for summary
                }
            }
        },
        events: {
          orderBy: { createdAt: "asc" },
          include: {
             // If User relation existed on LoadSheetEvent, include user name
             // Our schema has userId, userName strings on Event, so we use those
          },
        },
      },
    });

    if (!loadSheet) {
      return NextResponse.json(
        { error: "Load Sheet not found" },
        { status: 404 }
      );
    }

    // 1. Determine Chain of Custody from Events
    const startEvent = loadSheet.events.find((e) => e.eventType === "LOADING_STARTED" || e.eventType === "CREATED");
    const completeEvent = loadSheet.events.find((e) => e.eventType === "LOADING_COMPLETED" || e.eventType === "DEPARTED");
    const approveEvent = loadSheet.events.find((e) => e.eventType === "APPROVED");

    // 2. Fetch Quality incidents linked to this LoadSheet
    const qualityAlerts = await prisma.alert.findMany({
      where: {
        organizationId,
        relatedEntityId: loadSheet.id,
        category: "QUALITY",
        status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
      },
    });

    const isSafe = qualityAlerts.filter(a => a.severity === 'HIGH').length === 0;

    // 3. Build Manifest with Container Positions (if in metadata)
    const manifest = loadSheet.containers.map((c) => {
      // Safely cast metadata
      const meta = (c.metadata as Record<string, any>) || {};
      
      return {
        id: c.containerNumber || c.id,
        type: c.containerType,
        position: meta.position || "Unassigned", // e.g., "Left-1", "Nose", "Tail-Right"
        weight: c.weight,
        contents: c.containerItems.map(i => `${i.quantity}x ${i.sku}`).join(', ') + 
                  (c.containerItems.length > 0 ? '...' : ''),
        customFields: meta.customFields || {}, // Flexible fields
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
        startedBy: startEvent?.userName || loadSheet.metadata?.startedBy || "System",
        startedAt: loadSheet.startedLoadingAt?.toISOString() || startEvent?.createdAt.toISOString() || null,
        completedBy: completeEvent?.userName || "Pending",
        completedAt: loadSheet.finishedLoadingAt?.toISOString() || null,
        approvedBy: loadSheet.approvedBy || approveEvent?.userName || null,
        approvedAt: loadSheet.approvedAt?.toISOString() || approveEvent?.createdAt.toISOString() || null,
      },
      quality: {
        status: isSafe ? "SAFE" : qualityAlerts.length > 0 ? "ATTENTION_REQUIRED" : "SAFE",
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
      { status: 500 }
    );
  }
}
