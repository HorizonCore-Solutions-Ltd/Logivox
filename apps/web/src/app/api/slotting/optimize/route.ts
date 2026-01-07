export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/slotting/optimize
 * Run slotting optimization algorithm
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
    const { warehouseId } = await req.json();

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouseId is required" },
        { status: 400 },
      );
    }

    // Get all active slotting rules for the warehouse
    const rules = await prisma.slottingRule.findMany({
      where: {
        organizationId,
        warehouseId,
        isActive: true,
      },
      orderBy: { priority: "desc" },
    });

    // Get all inventory items in the warehouse
    const inventory = await prisma.inventoryItem.findMany({
      where: {
        organizationId,
        warehouseId,
        isActive: true,
      },
      include: {
        location: true,
        category: true,
      },
    });

    // Get available locations in the warehouse
    const locations = await prisma.location.findMany({
      where: {
        organizationId,
        warehouseId,
        isActive: true,
        isPickable: true,
      },
    });

    // Run optimization algorithm
    const recommendations: any[] = [];

    for (const item of inventory) {
      // Calculate item velocity (orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orderCount = await prisma.salesOrderLine.count({
        where: {
          inventoryItemId: item.id,
          order: {
            organizationId,
            orderDate: { gte: thirtyDaysAgo },
          },
        },
      });

      let velocity: "FAST" | "MEDIUM" | "SLOW" = "SLOW";
      if (orderCount > 20) velocity = "FAST";
      else if (orderCount > 5) velocity = "MEDIUM";

      // Find best matching rule
      for (const rule of rules) {
        const criteria = rule.criteria as any;

        // Check velocity match
        if (
          criteria.velocityThreshold &&
          criteria.velocityThreshold !== velocity
        ) {
          continue;
        }

        // Check weight range
        if (criteria.weightRange) {
          if (
            criteria.weightRange.min &&
            item.weight &&
            item.weight < criteria.weightRange.min
          )
            continue;
          if (
            criteria.weightRange.max &&
            item.weight &&
            item.weight > criteria.weightRange.max
          )
            continue;
        }

        // Check dimension constraints
        if (criteria.dimensionConstraints) {
          if (
            criteria.dimensionConstraints.maxLength &&
            item.length &&
            item.length > criteria.dimensionConstraints.maxLength
          )
            continue;
          if (
            criteria.dimensionConstraints.maxWidth &&
            item.width &&
            item.width > criteria.dimensionConstraints.maxWidth
          )
            continue;
          if (
            criteria.dimensionConstraints.maxHeight &&
            item.height &&
            item.height > criteria.dimensionConstraints.maxHeight
          )
            continue;
        }

        // Check category match
        if (criteria.categoryIds && criteria.categoryIds.length > 0) {
          if (
            !item.categoryId ||
            !criteria.categoryIds.includes(item.categoryId)
          )
            continue;
        }

        // Find best location in target zone
        const targetLocation = locations.find((loc) => {
          // Match location type to target zone
          if (rule.targetZoneType === "FAST_PICK" && loc.type !== "BIN")
            return false;
          if (rule.targetZoneType === "BULK" && loc.type !== "RACK")
            return false;

          // Check capacity
          if (loc.capacity && item.quantity > loc.capacity) return false;

          // Check if location is already optimal
          if (loc.id === item.locationId) return false;

          return true;
        });

        if (targetLocation) {
          recommendations.push({
            inventoryItemId: item.id,
            sku: item.sku,
            name: item.name,
            currentLocationId: item.locationId,
            currentLocationCode: item.location?.locationCode,
            recommendedLocationId: targetLocation.id,
            recommendedLocationCode: targetLocation.locationCode,
            reason: `${velocity} velocity item should be in ${rule.targetZoneType} zone`,
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            velocity,
            orderCount,
            estimatedTimeSavings:
              velocity === "FAST" ? 30 : velocity === "MEDIUM" ? 15 : 0, // seconds per pick
          });
          break; // Use first matching rule
        }
      }
    }

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map((rec) =>
        prisma.slottingRecommendation.create({
          data: {
            organizationId,
            warehouseId,
            inventoryItemId: rec.inventoryItemId,
            currentLocationId: rec.currentLocationId,
            recommendedLocationId: rec.recommendedLocationId,
            reason: rec.reason,
            ruleId: rec.ruleId,
            priority: rec.priority,
            status: "PENDING",
            metadata: {
              velocity: rec.velocity,
              orderCount: rec.orderCount,
              estimatedTimeSavings: rec.estimatedTimeSavings,
            },
            createdById: session.user.id,
          },
        }),
      ),
    );

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SLOTTING_OPTIMIZATION_RUN",
        entityType: "SlottingRecommendation",
        metadata: {
          warehouseId,
          recommendationCount: savedRecommendations.length,
          rulesApplied: rules.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      recommendationCount: savedRecommendations.length,
      recommendations: savedRecommendations,
      rulesApplied: rules.length,
      itemsAnalyzed: inventory.length,
    });
  } catch (error: any) {
    console.error("Error running slotting optimization:", error);
    return NextResponse.json(
      { error: "Failed to run optimization" },
      { status: 500 },
    );
  }
}
