/**
 * Autonomous Configuration API
 * Update autonomous operations settings
 *
 * Configurable:
 * - Trust score thresholds
 * - Approval limits
 * - IoT thresholds
 * - Risk tolerances
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory/autonomous/config
 * Get current autonomous configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create config
    let config = await prisma.autonomousConfig.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    if (!config) {
      // Create default config
      config = await prisma.autonomousConfig.create({
        data: {
          organizationId: session.user.organizationId,
          minTrustScore: 80,
          approvalThreshold: 10000,
          maxOrderValue: 50000,
          iotDiscrepancyThreshold: 10,
          maxAdjustmentValue: 5000,
          requireVerification: true,
          enableAutoReorders: true,
          enableAutoTransfers: true,
          enableAutoAdjustments: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        config,
        descriptions: {
          minTrustScore:
            "Minimum confidence score (0-100) required for autonomous execution",
          approvalThreshold:
            "Orders above this value require manual approval ($)",
          maxOrderValue:
            "Maximum allowed order value for autonomous execution ($)",
          iotDiscrepancyThreshold:
            "IoT discrepancy threshold for auto-adjustments (%)",
          maxAdjustmentValue: "Maximum value for autonomous adjustments ($)",
          requireVerification:
            "Require physical verification for high-value adjustments",
          enableAutoReorders: "Enable autonomous reordering",
          enableAutoTransfers: "Enable autonomous warehouse transfers",
          enableAutoAdjustments: "Enable autonomous inventory adjustments",
        },
      },
    });
  } catch (error: any) {
    console.error("Config retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve configuration", message: error.message },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/autonomous/config
 * Update autonomous configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      minTrustScore,
      approvalThreshold,
      maxOrderValue,
      iotDiscrepancyThreshold,
      maxAdjustmentValue,
      requireVerification,
      enableAutoReorders,
      enableAutoTransfers,
      enableAutoAdjustments,
    } = body;

    // Validation
    if (
      minTrustScore !== undefined &&
      (minTrustScore < 0 || minTrustScore > 100)
    ) {
      return NextResponse.json(
        { error: "minTrustScore must be between 0 and 100" },
        { status: 400 },
      );
    }

    if (approvalThreshold !== undefined && approvalThreshold < 0) {
      return NextResponse.json(
        { error: "approvalThreshold must be positive" },
        { status: 400 },
      );
    }

    // Update config
    const config = await prisma.autonomousConfig.upsert({
      where: { organizationId: session.user.organizationId },
      update: {
        minTrustScore,
        approvalThreshold,
        maxOrderValue,
        iotDiscrepancyThreshold,
        maxAdjustmentValue,
        requireVerification,
        enableAutoReorders,
        enableAutoTransfers,
        enableAutoAdjustments,
        updatedAt: new Date(),
      },
      create: {
        organizationId: session.user.organizationId,
        minTrustScore: minTrustScore ?? 80,
        approvalThreshold: approvalThreshold ?? 10000,
        maxOrderValue: maxOrderValue ?? 50000,
        iotDiscrepancyThreshold: iotDiscrepancyThreshold ?? 10,
        maxAdjustmentValue: maxAdjustmentValue ?? 5000,
        requireVerification: requireVerification ?? true,
        enableAutoReorders: enableAutoReorders ?? true,
        enableAutoTransfers: enableAutoTransfers ?? true,
        enableAutoAdjustments: enableAutoAdjustments ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully",
      data: { config },
    });
  } catch (error: any) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Failed to update configuration", message: error.message },
      { status: 500 },
    );
  }
}
