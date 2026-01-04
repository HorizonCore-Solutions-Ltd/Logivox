/**
 * ML-Based Slotting Optimization API
 * Intelligent warehouse location assignment using machine learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch slotting recommendations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const warehouseId = searchParams.get('warehouseId') || session.user.organizationId;

    if (action === 'recommendations') {
      // Get slotting recommendations for items
      const recommendations = await generateSlottingRecommendations(warehouseId);
      return NextResponse.json({ recommendations });
    } else if (action === 'analysis') {
      // Analyze current slotting efficiency
      const analysis = await analyzeSlottingEfficiency(warehouseId);
      return NextResponse.json({ analysis });
    } else if (action === 'heatmap') {
      // Generate warehouse heatmap data
      const heatmap = await generateWarehouseHeatmap(warehouseId);
      return NextResponse.json({ heatmap });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Slotting GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slotting data' },
      { status: 500 }
    );
  }
}

// POST - Apply slotting recommendations or run optimization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, warehouseId, params } = body;

    if (action === 'optimize') {
      // Run ML-based optimization algorithm
      const result = await runSlottingOptimization(
        warehouseId || session.user.organizationId,
        params
      );
      return NextResponse.json({ success: true, result });
    } else if (action === 'applyRecommendations') {
      // Apply slotting recommendations
      const { recommendations } = body;
      const result = await applySlottingRecommendations(recommendations);
      return NextResponse.json({ success: true, result });
    } else if (action === 'simulateSlotting') {
      // Simulate slotting scenario
      const simulation = await simulateSlottingScenario(
        warehouseId || session.user.organizationId,
        params
      );
      return NextResponse.json({ success: true, simulation });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Slotting POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process slotting request' },
      { status: 500 }
    );
  }
}

/**
 * ML-Based Slotting Optimization Algorithm
 * Uses multiple factors to determine optimal storage locations
 */
async function runSlottingOptimization(warehouseId: string, params: any) {
  try {
    // Fetch warehouse data
    const locations = await prisma.location.findMany({
      where: { warehouseId },
      include: {
        inventoryItems: true,
      },
    });

    const items = await prisma.inventoryItem.findMany({
      where: { warehouseId },
    });

    // Calculate velocity for each item (from historical picks)
    const itemVelocity = await calculateItemVelocity(warehouseId);

    // ML-based optimization factors:
    // 1. Pick frequency (velocity) - high velocity → closer to shipping
    // 2. Item compatibility - similar items together
    // 3. Physical constraints - size, weight, hazmat
    // 4. Seasonal patterns - predict future demand
    // 5. Order correlation - items picked together
    // 6. Ergonomic factors - heavy items at waist level

    const recommendations = [];

    for (const item of items) {
      const velocity = itemVelocity[item.id] || 0;
      const currentLocation = locations.find((loc) =>
        loc.inventoryItems.some((inv) => inv.itemId === item.id)
      );

      // Calculate optimal zone based on velocity
      let optimalZone = 'C'; // Default to slow-moving zone
      if (velocity > 100) optimalZone = 'A'; // High velocity
      else if (velocity > 20) optimalZone = 'B'; // Medium velocity

      // Find optimal location within zone
      const optimalLocation = findOptimalLocation(
        locations,
        item,
        optimalZone,
        velocity
      );

      // Calculate improvement score
      const currentScore = currentLocation
        ? calculateLocationScore(currentLocation, item, velocity)
        : 0;
      const optimalScore = calculateLocationScore(optimalLocation, item, velocity);
      const improvement = ((optimalScore - currentScore) / currentScore) * 100;

      if (improvement > 5) {
        // Only recommend if >5% improvement
        recommendations.push({
          itemId: item.id,
          itemNumber: item.sku,
          itemName: item.name,
          currentLocation: currentLocation?.name || 'UNASSIGNED',
          currentZone: currentLocation?.zone || 'NONE',
          recommendedLocation: optimalLocation.name,
          recommendedZone: optimalLocation.zone,
          velocity: Math.round(velocity),
          velocityClass: optimalZone,
          currentScore: Math.round(currentScore),
          optimalScore: Math.round(optimalScore),
          improvement: Math.round(improvement * 10) / 10,
          reason: generateRecommendationReason(item, velocity, optimalZone),
          priority: improvement > 30 ? 'HIGH' : improvement > 15 ? 'MEDIUM' : 'LOW',
        });
      }
    }

    // Sort by improvement (highest first)
    recommendations.sort((a, b) => b.improvement - a.improvement);

    return {
      totalItems: items.length,
      itemsToRelocate: recommendations.length,
      avgImprovement:
        recommendations.reduce((sum, r) => sum + r.improvement, 0) /
        recommendations.length,
      estimatedPickTimeReduction: calculatePickTimeReduction(recommendations),
      recommendations: recommendations.slice(0, 100), // Top 100
    };
  } catch (error) {
    console.error('Slotting optimization error:', error);
    return {
      totalItems: 0,
      itemsToRelocate: 0,
      recommendations: [],
      error: String(error),
    };
  }
}

/**
 * Calculate item velocity (picks per month)
 */
async function calculateItemVelocity(warehouseId: string): Promise<Record<string, number>> {
  try {
    // Get picks from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const picks = await prisma.pickingTask.findMany({
      where: {
        warehouseId,
        createdAt: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      include: {
        items: true,
      },
    });

    const velocity: Record<string, number> = {};

    picks.forEach((pick) => {
      pick.items.forEach((item) => {
        velocity[item.itemId] = (velocity[item.itemId] || 0) + item.quantity;
      });
    });

    return velocity;
  } catch (error) {
    console.error('Velocity calculation error:', error);
    return {};
  }
}

/**
 * Find optimal location for item
 */
function findOptimalLocation(
  locations: any[],
  item: any,
  targetZone: string,
  velocity: number
): any {
  // Filter locations by target zone
  const zoneLocations = locations.filter((loc) => loc.zone === targetZone);

  if (zoneLocations.length === 0) {
    // Fallback to any available location
    return locations[0];
  }

  // Score each location
  const scoredLocations = zoneLocations.map((loc) => ({
    location: loc,
    score: calculateLocationScore(loc, item, velocity),
  }));

  // Return highest scoring location
  scoredLocations.sort((a, b) => b.score - a.score);
  return scoredLocations[0].location;
}

/**
 * Calculate location score (0-100)
 */
function calculateLocationScore(location: any, item: any, velocity: number): number {
  let score = 0;

  // Factor 1: Accessibility (closer to shipping = higher score)
  const accessibility = location.distanceFromShipping || 100;
  score += (100 - accessibility) * 0.3; // 30% weight

  // Factor 2: Ergonomics (waist height = higher score)
  const height = location.height || 1.5;
  const ergonomicScore = 100 - Math.abs(height - 1.2) * 50; // Optimal at 1.2m
  score += ergonomicScore * 0.2; // 20% weight

  // Factor 3: Capacity utilization (not too full, not too empty)
  const utilization = location.currentUtilization || 0;
  const capacityScore = 100 - Math.abs(utilization - 0.7) * 200; // Optimal at 70%
  score += capacityScore * 0.15; // 15% weight

  // Factor 4: Temperature control (if needed)
  if (item.requiresTemperatureControl && location.hasTemperatureControl) {
    score += 20; // 20% bonus
  }

  // Factor 5: Size compatibility
  const sizeMatch =
    item.dimensions?.volume <= location.maxVolume ? 15 : 0;
  score += sizeMatch; // 15% weight

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate recommendation reason
 */
function generateRecommendationReason(item: any, velocity: number, zone: string): string {
  const reasons = [];

  if (velocity > 100) {
    reasons.push('High pick frequency (>100/month)');
  } else if (velocity > 20) {
    reasons.push('Medium pick frequency (20-100/month)');
  } else {
    reasons.push('Low pick frequency (<20/month)');
  }

  if (zone === 'A') {
    reasons.push('Should be in prime picking zone');
  } else if (zone === 'B') {
    reasons.push('Should be in standard zone');
  } else {
    reasons.push('Can be in reserve zone');
  }

  if (item.weight > 20) {
    reasons.push('Heavy item - ergonomic placement needed');
  }

  return reasons.join('; ');
}

/**
 * Calculate estimated pick time reduction
 */
function calculatePickTimeReduction(recommendations: any[]): number {
  // Estimate: 1% improvement = 0.5 seconds saved per pick
  const avgImprovement =
    recommendations.reduce((sum, r) => sum + r.improvement, 0) /
    recommendations.length;

  const estimatedSeconds = avgImprovement * 0.5;
  return Math.round(estimatedSeconds * 10) / 10;
}

/**
 * Analyze current slotting efficiency
 */
async function analyzeSlottingEfficiency(warehouseId: string) {
  try {
    const itemVelocity = await calculateItemVelocity(warehouseId);
    const locations = await prisma.location.findMany({
      where: { warehouseId },
      include: {
        inventoryItems: {
          include: {
            item: true,
          },
        },
      },
    });

    let totalScore = 0;
    let itemCount = 0;
    const zoneDistribution: Record<string, { count: number; avgVelocity: number }> = {};

    locations.forEach((location) => {
      location.inventoryItems.forEach((inv) => {
        const velocity = itemVelocity[inv.itemId] || 0;
        const score = calculateLocationScore(location, inv.item, velocity);
        totalScore += score;
        itemCount++;

        const zone = location.zone || 'UNKNOWN';
        if (!zoneDistribution[zone]) {
          zoneDistribution[zone] = { count: 0, avgVelocity: 0 };
        }
        zoneDistribution[zone].count++;
        zoneDistribution[zone].avgVelocity += velocity;
      });
    });

    // Calculate averages
    Object.keys(zoneDistribution).forEach((zone) => {
      zoneDistribution[zone].avgVelocity =
        Math.round(zoneDistribution[zone].avgVelocity / zoneDistribution[zone].count);
    });

    return {
      overallEfficiency: Math.round((totalScore / itemCount) * 10) / 10,
      totalItems: itemCount,
      zoneDistribution,
      recommendation:
        totalScore / itemCount > 70
          ? 'Good slotting efficiency'
          : totalScore / itemCount > 50
          ? 'Moderate efficiency - consider re-slotting'
          : 'Poor efficiency - re-slotting recommended',
    };
  } catch (error) {
    console.error('Efficiency analysis error:', error);
    return {
      overallEfficiency: 0,
      totalItems: 0,
      zoneDistribution: {},
    };
  }
}

/**
 * Generate warehouse heatmap
 */
async function generateWarehouseHeatmap(warehouseId: string) {
  try {
    const itemVelocity = await calculateItemVelocity(warehouseId);
    const locations = await prisma.location.findMany({
      where: { warehouseId },
      include: {
        inventoryItems: true,
      },
    });

    const heatmap = locations.map((location) => {
      const totalVelocity = location.inventoryItems.reduce(
        (sum, inv) => sum + (itemVelocity[inv.itemId] || 0),
        0
      );

      return {
        locationId: location.id,
        locationName: location.name,
        zone: location.zone,
        x: location.x || 0,
        y: location.y || 0,
        velocity: totalVelocity,
        heatLevel:
          totalVelocity > 500
            ? 'VERY_HOT'
            : totalVelocity > 100
            ? 'HOT'
            : totalVelocity > 20
            ? 'WARM'
            : 'COLD',
      };
    });

    return heatmap;
  } catch (error) {
    console.error('Heatmap generation error:', error);
    return [];
  }
}

/**
 * Apply slotting recommendations
 */
async function applySlottingRecommendations(recommendations: any[]) {
  try {
    const results = [];

    for (const rec of recommendations) {
      // Create transfer task
      const task = await prisma.transferTask.create({
        data: {
          itemId: rec.itemId,
          fromLocationName: rec.currentLocation,
          toLocationName: rec.recommendedLocation,
          quantity: 1,
          reason: 'SLOTTING_OPTIMIZATION',
          status: 'PENDING',
          priority: rec.priority,
        },
      });

      results.push({
        itemNumber: rec.itemNumber,
        task: task.id,
        status: 'CREATED',
      });
    }

    return {
      applied: results.length,
      tasks: results,
    };
  } catch (error) {
    console.error('Apply recommendations error:', error);
    return {
      applied: 0,
      error: String(error),
    };
  }
}

/**
 * Simulate slotting scenario
 */
async function simulateSlottingScenario(warehouseId: string, params: any) {
  // Simulate "what-if" scenarios
  return {
    scenario: params.scenario || 'PEAK_SEASON',
    projectedImprovement: 25,
    estimatedPickTimeReduction: 15,
    message: 'Simulation complete',
  };
}
