import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
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

// Mock database (replace with actual Prisma queries)
interface LoadVerification {
  id: string;
  shipmentId: string;
  dockId: string;
  verifierUserId: string;
  verifierName: string;
  verificationType: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  totalItems: number;
  scannedItems: number;
  passedItems: number;
  discrepancies: number;
  verificationScore: number;
}

interface VerificationItem {
  id: string;
  verificationId: string;
  itemId: string;
  sku: string;
  description: string;
  expectedQuantity: number;
  scannedQuantity: number;
  condition: string;
  status: string;
  scannedAt?: Date;
  scannedBy?: string;
  notes?: string;
}

interface Discrepancy {
  id: string;
  verificationId: string;
  itemId: string;
  sku: string;
  discrepancyType: string;
  severity: string;
  description: string;
  status: string;
  reportedAt: Date;
  reportedBy: string;
  resolvedAt?: Date;
  resolution?: string;
  imageUrl?: string;
  actionRequired?: string;
}

interface QualityMetrics {
  totalVerifications: number;
  passRate: number;
  avgVerificationTime: number;
  avgAccuracy: number;
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  topIssues: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  verifierPerformance: Array<{
    verifierId: string;
    verifierName: string;
    verificationsCompleted: number;
    avgAccuracy: number;
    avgTime: number;
  }>;
}

// Mock data
const verifications: LoadVerification[] = [
  {
    id: "VER-001",
    shipmentId: "SHIP-2401-001",
    dockId: "DOCK-01",
    verifierUserId: "USR-101",
    verifierName: "Mike Johnson",
    verificationType: "PRE_LOAD",
    status: "IN_PROGRESS",
    startedAt: new Date("2024-01-08T08:30:00"),
    totalItems: 45,
    scannedItems: 32,
    passedItems: 30,
    discrepancies: 2,
    verificationScore: 93.8,
  },
  {
    id: "VER-002",
    shipmentId: "SHIP-2401-002",
    dockId: "DOCK-03",
    verifierUserId: "USR-102",
    verifierName: "Sarah Chen",
    verificationType: "POST_LOAD",
    status: "COMPLETED",
    startedAt: new Date("2024-01-08T07:15:00"),
    completedAt: new Date("2024-01-08T08:00:00"),
    totalItems: 68,
    scannedItems: 68,
    passedItems: 67,
    discrepancies: 1,
    verificationScore: 98.5,
  },
  {
    id: "VER-003",
    shipmentId: "SHIP-2401-003",
    dockId: "DOCK-05",
    verifierUserId: "USR-103",
    verifierName: "David Martinez",
    verificationType: "QUALITY_CHECK",
    status: "PENDING",
    startedAt: new Date("2024-01-08T09:00:00"),
    totalItems: 52,
    scannedItems: 0,
    passedItems: 0,
    discrepancies: 0,
    verificationScore: 0,
  },
];

const verificationItems: VerificationItem[] = [
  {
    id: "ITEM-001",
    verificationId: "VER-001",
    itemId: "SKU-12345",
    sku: "SKU-12345",
    description: "Widget Assembly A-100",
    expectedQuantity: 10,
    scannedQuantity: 10,
    condition: "GOOD",
    status: "VERIFIED",
    scannedAt: new Date("2024-01-08T08:35:00"),
    scannedBy: "Mike Johnson",
  },
  {
    id: "ITEM-002",
    verificationId: "VER-001",
    itemId: "SKU-12346",
    sku: "SKU-12346",
    description: "Component B-200",
    expectedQuantity: 25,
    scannedQuantity: 23,
    condition: "GOOD",
    status: "DISCREPANCY",
    scannedAt: new Date("2024-01-08T08:40:00"),
    scannedBy: "Mike Johnson",
    notes: "Quantity mismatch - 2 units short",
  },
  {
    id: "ITEM-003",
    verificationId: "VER-001",
    itemId: "SKU-12347",
    sku: "SKU-12347",
    description: "Packaging Materials",
    expectedQuantity: 5,
    scannedQuantity: 5,
    condition: "DAMAGED",
    status: "DISCREPANCY",
    scannedAt: new Date("2024-01-08T08:42:00"),
    scannedBy: "Mike Johnson",
    notes: "2 boxes have water damage",
  },
];

const discrepancies: Discrepancy[] = [
  {
    id: "DISC-001",
    verificationId: "VER-001",
    itemId: "SKU-12346",
    sku: "SKU-12346",
    discrepancyType: "QUANTITY_MISMATCH",
    severity: "HIGH",
    description: "Expected 25 units, found 23. Missing 2 units.",
    status: "OPEN",
    reportedAt: new Date("2024-01-08T08:40:00"),
    reportedBy: "Mike Johnson",
    actionRequired: "Locate missing units or adjust shipment",
  },
  {
    id: "DISC-002",
    verificationId: "VER-001",
    itemId: "SKU-12347",
    sku: "SKU-12347",
    discrepancyType: "DAMAGED_ITEM",
    severity: "MEDIUM",
    description: "Water damage on 2 out of 5 boxes",
    status: "OPEN",
    reportedAt: new Date("2024-01-08T08:42:00"),
    reportedBy: "Mike Johnson",
    imageUrl: "/images/damage-report-001.jpg",
    actionRequired: "Replace damaged boxes before loading",
  },
  {
    id: "DISC-003",
    verificationId: "VER-002",
    itemId: "SKU-12348",
    sku: "SKU-12348",
    discrepancyType: "PACKAGING_ISSUE",
    severity: "LOW",
    description: "Improper labeling on 1 pallet",
    status: "RESOLVED",
    reportedAt: new Date("2024-01-08T07:30:00"),
    reportedBy: "Sarah Chen",
    resolvedAt: new Date("2024-01-08T07:45:00"),
    resolution: "Pallet re-labeled correctly",
  },
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create_verification": {
        const data = createVerificationSchema.parse(body);

        // In production, create verification in database
        const newVerification: LoadVerification = {
          id: `VER-${String(verifications.length + 1).padStart(3, "0")}`,
          shipmentId: data.shipmentId,
          dockId: data.dockId,
          verifierUserId: data.verifierUserId,
          verifierName: "Current User", // From session
          verificationType: data.verificationType,
          status: "PENDING",
          startedAt: new Date(),
          totalItems: 0, // Will be set when items are loaded
          scannedItems: 0,
          passedItems: 0,
          discrepancies: 0,
          verificationScore: 0,
        };

        verifications.push(newVerification);

        return NextResponse.json({
          success: true,
          verification: newVerification,
          message: "Verification created successfully",
        });
      }

      case "scan_item": {
        const data = scanItemSchema.parse(body);

        const verification = verifications.find(
          (v) => v.id === data.verificationId,
        );
        if (!verification) {
          return NextResponse.json(
            { error: "Verification not found" },
            { status: 404 },
          );
        }

        // Determine item status based on scan
        let itemStatus = "VERIFIED";
        let hasDiscrepancy = false;

        if (data.scannedQuantity !== data.expectedQuantity) {
          itemStatus = "DISCREPANCY";
          hasDiscrepancy = true;
        } else if (data.condition !== "GOOD") {
          itemStatus = "DISCREPANCY";
          hasDiscrepancy = true;
        }

        const newItem: VerificationItem = {
          id: `ITEM-${String(verificationItems.length + 1).padStart(3, "0")}`,
          verificationId: data.verificationId,
          itemId: data.itemId,
          sku: data.sku,
          description: `Item ${data.sku}`, // Would come from product database
          expectedQuantity: data.expectedQuantity,
          scannedQuantity: data.scannedQuantity,
          condition: data.condition,
          status: itemStatus,
          scannedAt: new Date(),
          scannedBy: session.user.name || "Unknown",
          notes: data.notes,
        };

        verificationItems.push(newItem);

        // Update verification counts
        verification.scannedItems += 1;
        if (!hasDiscrepancy) {
          verification.passedItems += 1;
        } else {
          verification.discrepancies += 1;
        }

        // Calculate verification score
        if (verification.totalItems > 0) {
          verification.verificationScore =
            (verification.passedItems / verification.totalItems) * 100;
        }

        // Update status to IN_PROGRESS if it was PENDING
        if (verification.status === "PENDING") {
          verification.status = "IN_PROGRESS";
        }

        return NextResponse.json({
          success: true,
          item: newItem,
          verification: verification,
          hasDiscrepancy: hasDiscrepancy,
          message: hasDiscrepancy
            ? "Discrepancy detected"
            : "Item verified successfully",
        });
      }

      case "report_discrepancy": {
        const data = reportDiscrepancySchema.parse(body);

        const newDiscrepancy: Discrepancy = {
          id: `DISC-${String(discrepancies.length + 1).padStart(3, "0")}`,
          verificationId: data.verificationId,
          itemId: data.itemId,
          sku: data.itemId, // Would lookup actual SKU
          discrepancyType: data.discrepancyType,
          severity: data.severity,
          description: data.description,
          status: "OPEN",
          reportedAt: new Date(),
          reportedBy: session.user.name || "Unknown",
          imageUrl: data.imageUrl,
          actionRequired: data.actionRequired,
        };

        discrepancies.push(newDiscrepancy);

        // Auto-trigger notifications for critical discrepancies
        if (data.severity === "CRITICAL") {
          // Send notification to supervisors
          console.log(
            "CRITICAL DISCREPANCY - Notifying supervisors:",
            newDiscrepancy,
          );
        }

        return NextResponse.json({
          success: true,
          discrepancy: newDiscrepancy,
          message: "Discrepancy reported",
        });
      }

      case "complete_verification": {
        const data = completeVerificationSchema.parse(body);

        const verification = verifications.find(
          (v) => v.id === data.verificationId,
        );
        if (!verification) {
          return NextResponse.json(
            { error: "Verification not found" },
            { status: 404 },
          );
        }

        verification.status = data.status;
        verification.completedAt = new Date();

        // Calculate final score
        if (verification.totalItems > 0) {
          verification.verificationScore =
            (verification.passedItems / verification.totalItems) * 100;
        }

        // Update shipment status based on verification result
        let shipmentStatus = "VERIFIED";
        if (data.status === "FAILED") {
          shipmentStatus = "VERIFICATION_FAILED";
        } else if (data.status === "PASSED_WITH_EXCEPTIONS") {
          shipmentStatus = "VERIFIED_WITH_EXCEPTIONS";
        }

        return NextResponse.json({
          success: true,
          verification: verification,
          shipmentStatus: shipmentStatus,
          message: "Verification completed",
        });
      }

      case "resolve_discrepancy": {
        const { discrepancyId, resolution } = body;

        const discrepancy = discrepancies.find((d) => d.id === discrepancyId);
        if (!discrepancy) {
          return NextResponse.json(
            { error: "Discrepancy not found" },
            { status: 404 },
          );
        }

        discrepancy.status = "RESOLVED";
        discrepancy.resolvedAt = new Date();
        discrepancy.resolution = resolution;

        return NextResponse.json({
          success: true,
          discrepancy: discrepancy,
          message: "Discrepancy resolved",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in verification API:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const verificationId = searchParams.get("verificationId");

    switch (action) {
      case "verification": {
        if (!verificationId) {
          return NextResponse.json(
            { error: "Verification ID required" },
            { status: 400 },
          );
        }

        const verification = verifications.find((v) => v.id === verificationId);
        if (!verification) {
          return NextResponse.json(
            { error: "Verification not found" },
            { status: 404 },
          );
        }

        const items = verificationItems.filter(
          (i) => i.verificationId === verificationId,
        );
        const verificationDiscrepancies = discrepancies.filter(
          (d) => d.verificationId === verificationId,
        );

        return NextResponse.json({
          verification,
          items,
          discrepancies: verificationDiscrepancies,
        });
      }

      case "active_verifications": {
        const activeVerifications = verifications.filter(
          (v) => v.status === "IN_PROGRESS" || v.status === "PENDING",
        );

        return NextResponse.json({
          verifications: activeVerifications,
        });
      }

      case "discrepancies": {
        const openDiscrepancies = discrepancies.filter(
          (d) => d.status === "OPEN",
        );

        // Group by severity
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

      case "quality_metrics": {
        const completedVerifications = verifications.filter(
          (v) => v.status === "COMPLETED",
        );

        const totalVerifications = completedVerifications.length;
        const passedVerifications = completedVerifications.filter(
          (v) => v.verificationScore >= 95,
        ).length;

        const passRate =
          totalVerifications > 0
            ? (passedVerifications / totalVerifications) * 100
            : 0;

        // Calculate average verification time
        const verificationTimes = completedVerifications
          .filter((v) => v.completedAt)
          .map((v) => {
            const start = new Date(v.startedAt).getTime();
            const end = new Date(v.completedAt!).getTime();
            return (end - start) / 1000 / 60; // minutes
          });

        const avgVerificationTime =
          verificationTimes.length > 0
            ? verificationTimes.reduce((a, b) => a + b, 0) /
              verificationTimes.length
            : 0;

        // Calculate average accuracy
        const avgAccuracy =
          completedVerifications.length > 0
            ? completedVerifications.reduce(
                (sum, v) => sum + v.verificationScore,
                0,
              ) / completedVerifications.length
            : 0;

        // Total discrepancies
        const totalDiscrepancies = discrepancies.length;
        const criticalDiscrepancies = discrepancies.filter(
          (d) => d.severity === "CRITICAL",
        ).length;

        // Top issues
        const issueTypeCounts = discrepancies.reduce(
          (acc, d) => {
            acc[d.discrepancyType] = (acc[d.discrepancyType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const topIssues = Object.entries(issueTypeCounts)
          .map(([type, count]) => ({
            type,
            count,
            percentage: (count / totalDiscrepancies) * 100,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Verifier performance
        const verifierStats = verifications.reduce(
          (acc, v) => {
            if (!acc[v.verifierUserId]) {
              acc[v.verifierUserId] = {
                verifierId: v.verifierUserId,
                verifierName: v.verifierName,
                verifications: [],
              };
            }
            acc[v.verifierUserId].verifications.push(v);
            return acc;
          },
          {} as Record<string, any>,
        );

        const verifierPerformance = Object.values(verifierStats).map(
          (stats: any) => {
            const completed = stats.verifications.filter(
              (v: LoadVerification) => v.status === "COMPLETED",
            );
            const avgAccuracy =
              completed.length > 0
                ? completed.reduce(
                    (sum: number, v: LoadVerification) =>
                      sum + v.verificationScore,
                    0,
                  ) / completed.length
                : 0;

            const times = completed
              .filter((v: LoadVerification) => v.completedAt)
              .map((v: LoadVerification) => {
                const start = new Date(v.startedAt).getTime();
                const end = new Date(v.completedAt!).getTime();
                return (end - start) / 1000 / 60;
              });

            const avgTime =
              times.length > 0
                ? times.reduce((a: number, b: number) => a + b, 0) /
                  times.length
                : 0;

            return {
              verifierId: stats.verifierId,
              verifierName: stats.verifierName,
              verificationsCompleted: completed.length,
              avgAccuracy,
              avgTime,
            };
          },
        );

        const metrics: QualityMetrics = {
          totalVerifications,
          passRate,
          avgVerificationTime,
          avgAccuracy,
          totalDiscrepancies,
          criticalDiscrepancies,
          topIssues,
          verifierPerformance,
        };

        return NextResponse.json({ metrics });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in verification API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
