export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/slotting/recommendations
 * Get slotting recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");

    const recommendations = await prisma.slottingRecommendation.findMany({
      where: {
        organizationId,
        ...(status && { status: status as any }),
      },
      include: {
        item: { select: { sku: true, name: true } },
        rule: { select: { name: true } },
      },
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    });

    const locationIds = [
      ...new Set(
        recommendations
          .flatMap((r) => [r.currentLocationId, r.recommendedLocationId])
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const locations = locationIds.length
      ? await prisma.location.findMany({
          where: { id: { in: locationIds }, organizationId },
          select: { id: true, locationCode: true, name: true, warehouseId: true },
        })
      : [];

    const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

    const response = recommendations
      .map((rec) => {
        const currentLocation = rec.currentLocationId
          ? locationMap.get(rec.currentLocationId)
          : null;
        const recommendedLocation = locationMap.get(rec.recommendedLocationId) || null;

        return {
          ...rec,
          inventoryItem: rec.item,
          currentLocation: currentLocation
            ? { locationCode: currentLocation.locationCode, name: currentLocation.name }
            : null,
          recommendedLocation: recommendedLocation
            ? {
                locationCode: recommendedLocation.locationCode,
                name: recommendedLocation.name,
              }
            : null,
          priority: rec.priorityScore,
        };
      })
      .filter((rec) =>
        warehouseId
          ? (locationMap.get(rec.recommendedLocationId)?.warehouseId || null) ===
            warehouseId
          : true,
      );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/slotting/recommendations/apply
 * Apply selected recommendations
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { recommendationIds } = await req.json();

    if (!recommendationIds || !Array.isArray(recommendationIds)) {
      return NextResponse.json(
        { error: "recommendationIds array is required" },
        { status: 400 },
      );
    }

    const results: any[] = [];

    for (const recId of recommendationIds) {
      const recommendation = await prisma.slottingRecommendation.findFirst({
        where: {
          id: recId,
          organizationId,
          status: "PENDING",
        },
      });

      if (!recommendation) {
        results.push({
          id: recId,
          success: false,
          error: "Recommendation not found or already applied",
        });
        continue;
      }

      try {
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: recommendation.itemId },
          select: {
            id: true,
            quantity: true,
            availableQty: true,
            metadata: true,
            warehouseId: true,
          },
        });

        if (!inventoryItem) {
          results.push({
            id: recId,
            success: false,
            error: "Inventory item not found",
          });
          continue;
        }

        const metadataObject =
          inventoryItem.metadata && typeof inventoryItem.metadata === "object"
            ? (inventoryItem.metadata as Record<string, unknown>)
            : {};

        await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            metadata: {
              ...metadataObject,
              slotting: {
                currentLocationId: recommendation.currentLocationId,
                recommendedLocationId: recommendation.recommendedLocationId,
                implementedAt: new Date().toISOString(),
                implementedBy: session.user.id,
              },
            },
          },
        });

        const [fromLocation, toLocation] = await Promise.all([
          recommendation.currentLocationId
            ? prisma.location.findUnique({
                where: { id: recommendation.currentLocationId },
                select: { warehouseId: true },
              })
            : Promise.resolve(null),
          prisma.location.findUnique({
            where: { id: recommendation.recommendedLocationId },
            select: { warehouseId: true },
          }),
        ]);

        // Create movement record
        await prisma.inventoryMovement.create({
          data: {
            inventoryItemId: recommendation.itemId,
            fromWarehouse:
              fromLocation?.warehouseId || inventoryItem.warehouseId || undefined,
            toWarehouse:
              toLocation?.warehouseId || inventoryItem.warehouseId || undefined,
            quantity: Math.max(1, inventoryItem.availableQty || inventoryItem.quantity),
            type: "TRANSFER",
            reason: recommendation.reason,
            notes: `Slotting move from ${recommendation.currentLocationId || "UNASSIGNED"} to ${recommendation.recommendedLocationId}`,
          },
        });

        // Update recommendation status
        await prisma.slottingRecommendation.update({
          where: { id: recId },
          data: {
            status: "IMPLEMENTED",
            implementedAt: new Date(),
            approvedBy: session.user.id,
            approvedAt: recommendation.approvedAt || new Date(),
          },
        });

        results.push({ id: recId, success: true });
      } catch (error: any) {
        results.push({ id: recId, success: false, error: error.message });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SLOTTING_RECOMMENDATIONS_APPLIED",
        entityType: "SlottingRecommendation",
        metadata: {
          appliedCount: results.filter((r) => r.success).length,
          failedCount: results.filter((r) => !r.success).length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      appliedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error("Error applying recommendations:", error);
    return NextResponse.json(
      { error: "Failed to apply recommendations" },
      { status: 500 },
    );
  }
}
