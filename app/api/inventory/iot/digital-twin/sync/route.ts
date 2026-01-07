/**
 * Digital Twin Synchronization API
 * Sync physical state (IoT) with digital state (WMS)
 *
 * Features:
 * - Real-time sync validation
 * - Discrepancy detection
 * - Auto-sync capabilities
 * - Confidence scoring
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { iotMonitoringService } from "@/lib/services/inventory/iot-monitoring-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/inventory/iot/digital-twin/sync
 * Synchronize digital twin for product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, autoSync = false } = body;

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product ID is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Get digital twin state
    const twinState =
      await iotMonitoringService.synchronizeDigitalTwin(productId);

    // Auto-sync if requested and confidence is high
    if (autoSync && twinState.syncConfidence >= 85) {
      // Perform sync (update WMS with IoT data)
      const updates = await Promise.all(
        twinState.discrepancies.map(async (disc) => {
          if (disc.type === "quantity" && twinState.physicalState.quantity) {
            await prisma.inventoryItem.update({
              where: { productId },
              data: {
                quantity: twinState.physicalState.quantity,
                lastUpdated: new Date(),
              },
            });
            return { type: "quantity", synced: true };
          }
          return { type: disc.type, synced: false };
        }),
      );

      return NextResponse.json({
        success: true,
        message: "Digital twin synchronized",
        data: {
          twinState,
          syncedUpdates: updates.filter((u) => u.synced),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        twinState,
        recommendation:
          twinState.syncConfidence >= 85
            ? "Auto-sync recommended (high confidence)"
            : "Manual review recommended (low confidence)",
      },
    });
  } catch (error: any) {
    console.error("Digital twin sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to synchronize digital twin",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/inventory/iot/digital-twin/sync
 * Get digital twin sync status for all products
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minConfidence = parseInt(searchParams.get("minConfidence") || "0");

    // Get products with IoT devices
    const products = await prisma.inventoryItem.findMany({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      take: 100,
      include: {
        product: true,
      },
    });

    // Check sync status for each
    const syncStatuses = await Promise.all(
      products.map(async (product) => {
        try {
          const twinState = await iotMonitoringService.synchronizeDigitalTwin(
            product.id,
          );
          return {
            productId: product.id,
            productName: product.product?.name || "Unknown",
            syncConfidence: twinState.syncConfidence,
            discrepancies: twinState.discrepancies.length,
            needsSync: twinState.syncConfidence < 85,
            twinState,
          };
        } catch (error) {
          return {
            productId: product.id,
            productName: product.product?.name || "Unknown",
            syncConfidence: 0,
            discrepancies: 0,
            needsSync: true,
            error: "No IoT data available",
          };
        }
      }),
    );

    // Filter by confidence if specified
    const filtered =
      minConfidence > 0
        ? syncStatuses.filter((s) => s.syncConfidence >= minConfidence)
        : syncStatuses;

    // Statistics
    const needsSync = syncStatuses.filter((s) => s.needsSync).length;
    const highConfidence = syncStatuses.filter(
      (s) => s.syncConfidence >= 85,
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        products: filtered,
        statistics: {
          total: syncStatuses.length,
          needsSync,
          highConfidence,
          avgConfidence:
            syncStatuses.length > 0
              ? Math.round(
                  syncStatuses.reduce((sum, s) => sum + s.syncConfidence, 0) /
                    syncStatuses.length,
                )
              : 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Sync status retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sync status", message: error.message },
      { status: 500 },
    );
  }
}
