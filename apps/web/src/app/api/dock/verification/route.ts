import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const createVerificationSchema = z.object({
  shipmentId: z.string(),
  dockId: z.string(),
  verifierUserId: z.string(),
  verificationType: z.enum([
    "PRE_LOAD",
    "POST_LOAD",
    "QUALITY_CHECK",
    "FINAL_INSPECTION",
  ]),
});

const scanItemSchema = z.object({
  verificationId: z.string(),
  itemId: z.string(),
  sku: z.string(),
  expectedQuantity: z.number().int().positive(),
  scannedQuantity: z.number().int().nonnegative(),
  condition: z.enum(["GOOD", "DAMAGED", "MISSING", "INCORRECT"]),
  notes: z.string().optional(),
});

const reportDiscrepancySchema = z.object({
  verificationId: z.string(),
  itemId: z.string(),
  discrepancyType: z.enum([
    "QUANTITY_MISMATCH",
    "DAMAGED_ITEM",
    "MISSING_ITEM",
    "WRONG_ITEM",
    "PACKAGING_ISSUE",
  ]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  description: z.string(),
  imageUrl: z.string().optional(),
  actionRequired: z.string().optional(),
});

const completeVerificationSchema = z.object({
  verificationId: z.string(),
  status: z.enum(["PASSED", "PASSED_WITH_EXCEPTIONS", "FAILED"]),
  notes: z.string().optional(),
});

async function getOrganizationId(userId: string): Promise<string | null> {
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

function createVerificationId() {
  return `VER-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

function createItemEventId() {
  return `ITEM-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

function createDiscrepancyId() {
  return `DISC-${Date.now()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

async function loadVerificationEvents(organizationId: string) {
  const events = await prisma.activityLog.findMany({
    where: {
      organizationId,
      entityType: {
        in: ["DockVerification", "DockVerificationItem", "DockDiscrepancy"],
      },
      action: {
        in: [
          "DOCK_VERIFICATION_CREATED",
          "DOCK_VERIFICATION_ITEM_SCANNED",
          "DOCK_VERIFICATION_COMPLETED",
          "DOCK_VERIFICATION_DISCREPANCY_REPORTED",
          "DOCK_VERIFICATION_DISCREPANCY_RESOLVED",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });
  return events;
}

function buildVerificationState(events: any[]) {
  const created = events.find((e) => e.action === "DOCK_VERIFICATION_CREATED");
  if (!created) return null;

  const scannedItems = events.filter(
    (e) => e.action === "DOCK_VERIFICATION_ITEM_SCANNED",
  );
  const discrepancyReported = events.filter(
    (e) => e.action === "DOCK_VERIFICATION_DISCREPANCY_REPORTED",
  );
  const discrepancyResolved = events.filter(
    (e) => e.action === "DOCK_VERIFICATION_DISCREPANCY_RESOLVED",
  );
  const completed = events.find((e) => e.action === "DOCK_VERIFICATION_COMPLETED");

  const resolvedSet = new Set(
    discrepancyResolved.map((e) => (e.metadata as any)?.discrepancyId).filter(Boolean),
  );

  const openDiscrepancies = discrepancyReported.filter(
    (e) => !resolvedSet.has((e.metadata as any)?.discrepancyId),
  );

  const passedItems = scannedItems.filter((e) => !(e.metadata as any)?.hasDiscrepancy).length;
  const totalItems = scannedItems.length;
  const verificationScore = totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

  const base = created.metadata as any;

  return {
    id: created.entityId,
    shipmentId: base.shipmentId,
    dockId: base.dockId,
    verifierUserId: base.verifierUserId,
    verifierName: base.verifierName,
    verificationType: base.verificationType,
    status: completed ? (completed.metadata as any)?.status || "COMPLETED" : totalItems > 0 ? "IN_PROGRESS" : "PENDING",
    startedAt: created.createdAt,
    completedAt: completed?.createdAt,
    totalItems,
    scannedItems: totalItems,
    passedItems,
    discrepancies: openDiscrepancies.length,
    verificationScore,
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
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "create_verification") {
      const data = createVerificationSchema.parse(body);
      const verificationId = createVerificationId();

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_VERIFICATION_CREATED",
          entityType: "DockVerification",
          entityId: verificationId,
          metadata: {
            shipmentId: data.shipmentId,
            dockId: data.dockId,
            verifierUserId: data.verifierUserId,
            verifierName: session.user.name || session.user.email || "Unknown",
            verificationType: data.verificationType,
          },
        },
      });

      return NextResponse.json({
        success: true,
        verificationId,
        message: "Verification created successfully",
      });
    }

    if (action === "scan_item") {
      const data = scanItemSchema.parse(body);
      const itemEventId = createItemEventId();
      const hasDiscrepancy =
        data.scannedQuantity !== data.expectedQuantity || data.condition !== "GOOD";

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_VERIFICATION_ITEM_SCANNED",
          entityType: "DockVerificationItem",
          entityId: itemEventId,
          metadata: {
            verificationId: data.verificationId,
            itemId: data.itemId,
            sku: data.sku,
            expectedQuantity: data.expectedQuantity,
            scannedQuantity: data.scannedQuantity,
            condition: data.condition,
            notes: data.notes,
            scannedBy: session.user.name || session.user.email || "Unknown",
            hasDiscrepancy,
          },
        },
      });

      return NextResponse.json({
        success: true,
        itemId: itemEventId,
        hasDiscrepancy,
        message: hasDiscrepancy ? "Discrepancy detected" : "Item verified successfully",
      });
    }

    if (action === "report_discrepancy") {
      const data = reportDiscrepancySchema.parse(body);
      const discrepancyId = createDiscrepancyId();

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_VERIFICATION_DISCREPANCY_REPORTED",
          entityType: "DockDiscrepancy",
          entityId: discrepancyId,
          metadata: {
            discrepancyId,
            verificationId: data.verificationId,
            itemId: data.itemId,
            discrepancyType: data.discrepancyType,
            severity: data.severity,
            description: data.description,
            imageUrl: data.imageUrl,
            actionRequired: data.actionRequired,
            reportedBy: session.user.name || session.user.email || "Unknown",
          },
        },
      });

      return NextResponse.json({ success: true, discrepancyId, message: "Discrepancy reported" });
    }

    if (action === "complete_verification") {
      const data = completeVerificationSchema.parse(body);

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_VERIFICATION_COMPLETED",
          entityType: "DockVerification",
          entityId: data.verificationId,
          metadata: {
            status: data.status,
            notes: data.notes,
            completedBy: session.user.name || session.user.email || "Unknown",
          },
        },
      });

      return NextResponse.json({ success: true, message: "Verification completed" });
    }

    if (action === "resolve_discrepancy") {
      const { discrepancyId, resolution } = body;
      if (!discrepancyId || !resolution) {
        return NextResponse.json(
          { error: "discrepancyId and resolution are required" },
          { status: 400 },
        );
      }

      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DOCK_VERIFICATION_DISCREPANCY_RESOLVED",
          entityType: "DockDiscrepancy",
          entityId: discrepancyId,
          metadata: {
            discrepancyId,
            resolution,
            resolvedBy: session.user.name || session.user.email || "Unknown",
          },
        },
      });

      return NextResponse.json({ success: true, message: "Discrepancy resolved" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in verification API:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const verificationId = searchParams.get("verificationId");

    const events = await loadVerificationEvents(organizationId);

    if (action === "verification") {
      if (!verificationId) {
        return NextResponse.json({ error: "Verification ID required" }, { status: 400 });
      }

      const verificationEvents = events.filter((e) => e.entityId === verificationId || (e.metadata as any)?.verificationId === verificationId);
      const verification = buildVerificationState(verificationEvents);

      if (!verification) {
        return NextResponse.json({ error: "Verification not found" }, { status: 404 });
      }

      const items = verificationEvents
        .filter((e) => e.action === "DOCK_VERIFICATION_ITEM_SCANNED")
        .map((e) => ({ id: e.entityId, ...(e.metadata as any), scannedAt: e.createdAt }));

      const discrepancies = verificationEvents
        .filter((e) => e.action === "DOCK_VERIFICATION_DISCREPANCY_REPORTED")
        .map((e) => ({ id: e.entityId, ...(e.metadata as any), reportedAt: e.createdAt }));

      return NextResponse.json({ verification, items, discrepancies });
    }

    const verificationIds = [
      ...new Set(
        events
          .filter((e) => e.action === "DOCK_VERIFICATION_CREATED")
          .map((e) => e.entityId)
          .filter(Boolean),
      ),
    ] as string[];

    const verifications = verificationIds
      .map((id) => {
        const verificationEvents = events.filter(
          (e) => e.entityId === id || (e.metadata as any)?.verificationId === id,
        );
        return buildVerificationState(verificationEvents);
      })
      .filter(Boolean);

    if (action === "active_verifications") {
      return NextResponse.json({
        verifications: verifications.filter(
          (v: any) => v.status === "IN_PROGRESS" || v.status === "PENDING",
        ),
      });
    }

    if (action === "discrepancies") {
      const reported = events.filter(
        (e) => e.action === "DOCK_VERIFICATION_DISCREPANCY_REPORTED",
      );
      const resolvedIds = new Set(
        events
          .filter((e) => e.action === "DOCK_VERIFICATION_DISCREPANCY_RESOLVED")
          .map((e) => (e.metadata as any)?.discrepancyId)
          .filter(Boolean),
      );

      const openDiscrepancies = reported
        .filter((e) => !resolvedIds.has((e.metadata as any)?.discrepancyId))
        .map((e) => ({ id: e.entityId, ...(e.metadata as any), reportedAt: e.createdAt }));

      const bySeverity = {
        CRITICAL: openDiscrepancies.filter((d) => d.severity === "CRITICAL"),
        HIGH: openDiscrepancies.filter((d) => d.severity === "HIGH"),
        MEDIUM: openDiscrepancies.filter((d) => d.severity === "MEDIUM"),
        LOW: openDiscrepancies.filter((d) => d.severity === "LOW"),
      };

      return NextResponse.json({
        discrepancies: openDiscrepancies,
        bySeverity,
        totalOpen: openDiscrepancies.length,
        criticalCount: bySeverity.CRITICAL.length,
      });
    }

    if (action === "quality_metrics") {
      const completed = verifications.filter((v: any) => v.status === "COMPLETED");
      const totalVerifications = completed.length;
      const passedVerifications = completed.filter((v: any) => v.verificationScore >= 95).length;
      const passRate =
        totalVerifications > 0 ? (passedVerifications / totalVerifications) * 100 : 0;

      const verificationTimes = completed
        .filter((v: any) => v.completedAt)
        .map((v: any) => {
          const start = new Date(v.startedAt).getTime();
          const end = new Date(v.completedAt).getTime();
          return (end - start) / 1000 / 60;
        });

      const avgVerificationTime =
        verificationTimes.length > 0
          ? verificationTimes.reduce((a: number, b: number) => a + b, 0) /
            verificationTimes.length
          : 0;

      const avgAccuracy =
        completed.length > 0
          ? completed.reduce((sum: number, v: any) => sum + v.verificationScore, 0) /
            completed.length
          : 0;

      const allDiscrepancies = events.filter(
        (e) => e.action === "DOCK_VERIFICATION_DISCREPANCY_REPORTED",
      );

      return NextResponse.json({
        metrics: {
          totalVerifications,
          passRate,
          avgVerificationTime,
          avgAccuracy,
          totalDiscrepancies: allDiscrepancies.length,
          criticalDiscrepancies: allDiscrepancies.filter(
            (d) => (d.metadata as any)?.severity === "CRITICAL",
          ).length,
          topIssues: [],
          verifierPerformance: [],
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in verification API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
