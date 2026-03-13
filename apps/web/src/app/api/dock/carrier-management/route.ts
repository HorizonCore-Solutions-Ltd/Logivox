import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const checkInSchema = z.object({
  appointmentId: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverLicense: z.string(),
  driverPhone: z.string(),
  tractorNumber: z.string(),
  trailerNumber: z.string(),
  carrierName: z.string(),
  carrierDOT: z.string().optional(),
  sealNumber: z.string().optional(),
  notes: z.string().optional(),
});

const checkOutSchema = z.object({
  checkInId: z.string(),
  completedDocuments: z.array(z.string()),
  sealVerified: z.boolean(),
  trailerSecured: z.boolean(),
  paperworkComplete: z.boolean(),
  notes: z.string().optional(),
});

const detentionSchema = z.object({
  checkInId: z.string(),
  reason: z.enum([
    "LOADING_DELAY",
    "DOCK_UNAVAILABLE",
    "MISSING_PAPERWORK",
    "EQUIPMENT_ISSUE",
    "OTHER",
  ]),
  expectedDuration: z.number().int().positive(),
});

const calculateDetentionCost = (minutes: number): number => {
  const freeTimeMinutes = 120;
  if (minutes <= freeTimeMinutes) return 0;
  const billableMinutes = minutes - freeTimeMinutes;
  return (billableMinutes / 60) * 100;
};

async function getOrganizationId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        where: { isActive: true },
        include: { organization: true },
        take: 1,
      },
    },
  });
  return user?.organizationMemberships?.[0]?.organizationId ?? null;
}

async function getEvents(organizationId: string) {
  return prisma.activityLog.findMany({
    where: {
      organizationId,
      entityType: "DockCarrierCheckIn",
      action: {
        in: [
          "DOCK_CARRIER_CHECKIN",
          "DOCK_CARRIER_CHECKOUT",
          "DOCK_CARRIER_DOCUMENT_UPDATED",
          "DOCK_CARRIER_DETENTION_STARTED",
          "DOCK_CARRIER_DETENTION_ENDED",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });
}

function buildCheckInState(checkInId: string, events: any[]) {
  const created = events.find(
    (e) => e.action === "DOCK_CARRIER_CHECKIN" && e.entityId === checkInId,
  );
  if (!created) return null;

  const base = created.metadata as any;
  const checkout = events.find(
    (e) => e.action === "DOCK_CARRIER_CHECKOUT" && e.entityId === checkInId,
  );

  const docs = events
    .filter(
      (e) =>
        e.action === "DOCK_CARRIER_DOCUMENT_UPDATED" &&
        (e.metadata as any)?.checkInId === checkInId,
    )
    .map((e) => ({ ...(e.metadata as any), updatedAt: e.createdAt }));

  const detentionStarts = events.filter(
    (e) =>
      e.action === "DOCK_CARRIER_DETENTION_STARTED" &&
      (e.metadata as any)?.checkInId === checkInId,
  );
  const detentionEnds = events.filter(
    (e) =>
      e.action === "DOCK_CARRIER_DETENTION_ENDED" &&
      (e.metadata as any)?.checkInId === checkInId,
  );

  const detentionById = new Map<string, any>();
  for (const start of detentionStarts) {
    const meta = start.metadata as any;
    detentionById.set(meta.detentionId, {
      detentionId: meta.detentionId,
      reason: meta.reason,
      startTime: start.createdAt,
      endTime: null,
      duration: 0,
      cost: 0,
      status: "ACTIVE",
    });
  }
  for (const end of detentionEnds) {
    const meta = end.metadata as any;
    const det = detentionById.get(meta.detentionId);
    if (det) {
      det.endTime = end.createdAt;
      det.duration = meta.duration;
      det.cost = meta.cost;
      det.status = "COMPLETED";
    }
  }
  const detention = [...detentionById.values()];
  const totalDetention = detention.reduce(
    (sum, d) => sum + Number(d.duration || 0),
    0,
  );

  const checkInTime = created.createdAt;
  const checkOutTime = checkout?.createdAt;

  const status = checkout ? "CHECKED_OUT" : "CHECKED_IN";

  return {
    id: checkInId,
    appointmentId: base.appointmentId,
    shipmentId: base.shipmentId,
    dockId: base.dockId,
    driverId: base.driverId,
    driverName: base.driverName,
    driverLicense: base.driverLicense,
    driverPhone: base.driverPhone,
    tractorNumber: base.tractorNumber,
    trailerNumber: base.trailerNumber,
    carrierName: base.carrierName,
    carrierDOT: base.carrierDOT,
    sealNumber: base.sealNumber,
    checkInTime,
    scheduledTime: new Date(base.scheduledTime),
    checkOutTime,
    status,
    detentionMinutes: totalDetention,
    detentionReason: detention.find((d) => d.status === "ACTIVE")?.reason,
    notes: base.notes,
    documents: docs,
    detention,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "check_in") {
      const data = checkInSchema.parse(body);
      const checkInId = `CHK-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_CARRIER_CHECKIN",
          entityType: "DockCarrierCheckIn",
          entityId: checkInId,
          metadata: {
            ...data,
            shipmentId: `SHIP-${data.appointmentId}`,
            dockId: "DOCK-TBD",
            scheduledTime: new Date().toISOString(),
          },
        },
      });

      for (const docType of ["BOL", "SHIPPING_MANIFEST", "INSPECTION_REPORT"]) {
        await prisma.activityLog.create({
          data: {
            organizationId,
            userId: session.user.id,
            action: "DOCK_CARRIER_DOCUMENT_UPDATED",
            entityType: "DockCarrierCheckIn",
            entityId: `DOC-${Date.now()}-${crypto.randomUUID().slice(0, 3).toUpperCase()}`,
            metadata: {
              checkInId,
              documentType: docType,
              status: "PENDING",
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        checkInId,
        message: "Driver checked in successfully",
      });
    }

    if (action === "check_out") {
      const data = checkOutSchema.parse(body);
      const canCheckout =
        data.sealVerified &&
        data.trailerSecured &&
        data.paperworkComplete &&
        data.completedDocuments.length > 0;

      if (!canCheckout) {
        return NextResponse.json(
          {
            success: false,
            error: "Checkout requirements not met",
          },
          { status: 400 },
        );
      }

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_CARRIER_CHECKOUT",
          entityType: "DockCarrierCheckIn",
          entityId: data.checkInId,
          metadata: {
            completedDocuments: data.completedDocuments,
            sealVerified: data.sealVerified,
            trailerSecured: data.trailerSecured,
            paperworkComplete: data.paperworkComplete,
            notes: data.notes,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Driver checked out successfully",
      });
    }

    if (action === "start_detention") {
      const data = detentionSchema.parse(body);
      const detentionId = `DET-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_CARRIER_DETENTION_STARTED",
          entityType: "DockCarrierCheckIn",
          entityId: data.checkInId,
          metadata: {
            detentionId,
            checkInId: data.checkInId,
            reason: data.reason,
            expectedDuration: data.expectedDuration,
          },
        },
      });

      return NextResponse.json({
        success: true,
        detentionId,
        message: "Detention tracking started",
      });
    }

    if (action === "end_detention") {
      const { checkInId, detentionId } = body;
      if (!checkInId || !detentionId) {
        return NextResponse.json(
          { error: "checkInId and detentionId required" },
          { status: 400 },
        );
      }

      const events = await getEvents(organizationId);
      const startEvent = events.find(
        (e) =>
          e.action === "DOCK_CARRIER_DETENTION_STARTED" &&
          (e.metadata as any)?.detentionId === detentionId,
      );
      if (!startEvent) {
        return NextResponse.json(
          { error: "Detention event not found" },
          { status: 404 },
        );
      }

      const duration = Math.round(
        (Date.now() - startEvent.createdAt.getTime()) / 60000,
      );
      const cost = calculateDetentionCost(duration);

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_CARRIER_DETENTION_ENDED",
          entityType: "DockCarrierCheckIn",
          entityId: checkInId,
          metadata: {
            detentionId,
            checkInId,
            duration,
            cost,
          },
        },
      });

      return NextResponse.json({
        success: true,
        detentionId,
        duration,
        cost,
        message: "Detention tracking ended",
      });
    }

    if (action === "update_document") {
      const { checkInId, documentType, status, fileUrl } = body;
      if (!checkInId || !documentType || !status) {
        return NextResponse.json(
          { error: "checkInId, documentType and status required" },
          { status: 400 },
        );
      }

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_CARRIER_DOCUMENT_UPDATED",
          entityType: "DockCarrierCheckIn",
          entityId: `DOC-${Date.now()}-${crypto.randomUUID().slice(0, 3).toUpperCase()}`,
          metadata: {
            checkInId,
            documentType,
            status,
            fileUrl,
            verifiedBy: status === "VERIFIED" ? session.user.name : undefined,
          },
        },
      });

      return NextResponse.json({ success: true, message: "Document updated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in carrier management API:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const events = await getEvents(organizationId);
    const checkInIds = [
      ...new Set(
        events
          .filter((e) => e.action === "DOCK_CARRIER_CHECKIN")
          .map((e) => e.entityId),
      ),
    ] as string[];

    const checkIns = checkInIds
      .map((id) => buildCheckInState(id, events))
      .filter(Boolean) as any[];

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const checkInId = searchParams.get("checkInId");

    if (action === "check_in") {
      if (!checkInId) {
        return NextResponse.json(
          { error: "Check-in ID required" },
          { status: 400 },
        );
      }
      const checkIn = checkIns.find((c) => c.id === checkInId);
      if (!checkIn) {
        return NextResponse.json(
          { error: "Check-in not found" },
          { status: 404 },
        );
      }

      const currentDetention =
        checkIn.status !== "CHECKED_OUT"
          ? Math.max(
              0,
              Math.round(
                (Date.now() - new Date(checkIn.checkInTime).getTime()) / 60000,
              ) - 120,
            )
          : 0;

      return NextResponse.json({
        checkIn,
        documents: checkIn.documents,
        detention: checkIn.detention,
        currentDetention,
        detentionCost: calculateDetentionCost(
          currentDetention || checkIn.detentionMinutes,
        ),
      });
    }

    if (action === "active_check_ins") {
      const active = checkIns.filter((c) => c.status !== "CHECKED_OUT");
      return NextResponse.json({ checkIns: active });
    }

    if (action === "detention_report") {
      const allDetention = checkIns.flatMap((c) => c.detention || []);
      const totalCost = allDetention.reduce(
        (sum, d) => sum + Number(d.cost || 0),
        0,
      );
      return NextResponse.json({
        totalEvents: allDetention.length,
        totalCost,
        detentionReasons: [],
        events: allDetention,
      });
    }

    if (action === "carrier_metrics") {
      const completed = checkIns.filter((c) => c.status === "CHECKED_OUT");
      const totalCheckIns = completed.length;
      const activeDrivers = checkIns.filter(
        (c) => c.status !== "CHECKED_OUT",
      ).length;
      const avgDetentionTime =
        completed.length > 0
          ? completed.reduce(
              (sum, c) => sum + Number(c.detentionMinutes || 0),
              0,
            ) / completed.length
          : 0;
      const totalDetentionCost = completed.reduce(
        (sum, c) =>
          sum + calculateDetentionCost(Number(c.detentionMinutes || 0)),
        0,
      );

      return NextResponse.json({
        metrics: {
          totalCheckIns,
          activeDrivers,
          avgCheckInTime: 0,
          avgCheckOutTime: 0,
          avgDetentionTime,
          onTimePercentage: null,
          totalDetentionCost,
          carrierPerformance: [],
          detentionReasons: [],
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in carrier management API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
