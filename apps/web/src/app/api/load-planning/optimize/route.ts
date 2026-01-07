import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface LoadItem {
  id: string;
  weight: number;
  volume: number;
  quantity: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

interface Vehicle {
  id: string;
  maxWeight: number;
  maxVolume: number;
}

interface LoadPlan {
  id: string;
  vehicleId: string;
  items: LoadItem[];
  totalWeight: number;
  totalVolume: number;
  weightUtilization: number;
  volumeUtilization: number;
  efficiency: number;
}

/**
 * POST /api/load-planning/optimize
 *
 * Optimize load distribution across available vehicles using bin packing algorithm
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, vehicles, optimization = "BALANCED" } = body;

    if (!items || !vehicles || items.length === 0 || vehicles.length === 0) {
      return NextResponse.json(
        { error: "Items and vehicles are required" },
        { status: 400 },
      );
    }

    // Sort items by priority and size (First-Fit Decreasing algorithm)
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const sortedItems = [...items].sort((a, b) => {
      const priorityDiff =
        priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, sort by weight descending
      return b.weight * b.quantity - a.weight * a.quantity;
    });

    // Sort vehicles by capacity (largest first for better packing)
    const sortedVehicles = [...vehicles].sort((a, b) => {
      if (optimization === "WEIGHT") {
        return b.maxWeight - a.maxWeight;
      } else if (optimization === "VOLUME") {
        return b.maxVolume - a.maxVolume;
      }
      // BALANCED: sort by combined capacity
      return b.maxWeight + b.maxVolume - (a.maxWeight + a.maxVolume);
    });

    const loadPlans: LoadPlan[] = [];
    const unassignedItems: LoadItem[] = [];

    // First-Fit Decreasing bin packing
    for (const item of sortedItems) {
      const itemWeight = item.weight * item.quantity;
      const itemVolume = item.volume * item.quantity;
      let assigned = false;

      // Try to fit into existing load
      for (const plan of loadPlans) {
        const vehicle = sortedVehicles.find((v) => v.id === plan.vehicleId);
        if (!vehicle) continue;

        const newWeight = plan.totalWeight + itemWeight;
        const newVolume = plan.totalVolume + itemVolume;

        // Check if item fits
        if (newWeight <= vehicle.maxWeight && newVolume <= vehicle.maxVolume) {
          plan.items.push(item);
          plan.totalWeight = newWeight;
          plan.totalVolume = newVolume;
          plan.weightUtilization = (newWeight / vehicle.maxWeight) * 100;
          plan.volumeUtilization = (newVolume / vehicle.maxVolume) * 100;

          // Calculate efficiency (average of weight and volume utilization)
          plan.efficiency = Math.round(
            (plan.weightUtilization + plan.volumeUtilization) / 2,
          );

          assigned = true;
          break;
        }
      }

      // If not assigned, create new load
      if (!assigned) {
        // Find best vehicle for this item
        const suitableVehicle = sortedVehicles.find(
          (v) => itemWeight <= v.maxWeight && itemVolume <= v.maxVolume,
        );

        if (suitableVehicle) {
          const weightUtil = (itemWeight / suitableVehicle.maxWeight) * 100;
          const volumeUtil = (itemVolume / suitableVehicle.maxVolume) * 100;

          loadPlans.push({
            id: `load_${loadPlans.length + 1}`,
            vehicleId: suitableVehicle.id,
            items: [item],
            totalWeight: itemWeight,
            totalVolume: itemVolume,
            weightUtilization: weightUtil,
            volumeUtilization: volumeUtil,
            efficiency: Math.round((weightUtil + volumeUtil) / 2),
          });
        } else {
          unassignedItems.push(item);
        }
      }
    }

    // Calculate summary statistics
    const totalWeight = items.reduce(
      (sum: number, item: LoadItem) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = items.reduce(
      (sum: number, item: LoadItem) => sum + item.volume * item.quantity,
      0,
    );
    const averageEfficiency =
      loadPlans.length > 0
        ? Math.round(
            loadPlans.reduce((sum, plan) => sum + plan.efficiency, 0) /
              loadPlans.length,
          )
        : 0;

    return NextResponse.json({
      success: true,
      loadPlans,
      unassignedItems,
      summary: {
        totalLoads: loadPlans.length,
        totalItems: items.length,
        assignedItems: items.length - unassignedItems.length,
        unassignedItems: unassignedItems.length,
        totalWeight,
        totalVolume,
        averageEfficiency,
        optimization,
      },
      recommendations: generateRecommendations(loadPlans, unassignedItems),
    });
  } catch (error: any) {
    console.error("Error optimizing loads:", error);
    return NextResponse.json(
      {
        error: "Failed to optimize loads",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

function generateRecommendations(
  loadPlans: LoadPlan[],
  unassignedItems: LoadItem[],
): string[] {
  const recommendations: string[] = [];

  // Check for low efficiency loads
  const lowEfficiencyLoads = loadPlans.filter((plan) => plan.efficiency < 70);
  if (lowEfficiencyLoads.length > 0) {
    recommendations.push(
      `${lowEfficiencyLoads.length} load(s) have less than 70% efficiency. Consider consolidating with other loads.`,
    );
  }

  // Check for unassigned items
  if (unassignedItems.length > 0) {
    recommendations.push(
      `${unassignedItems.length} item(s) could not be assigned. You may need larger vehicles or to split quantities.`,
    );
  }

  // Check for excellent efficiency
  const excellentLoads = loadPlans.filter((plan) => plan.efficiency >= 85);
  if (excellentLoads.length === loadPlans.length && loadPlans.length > 0) {
    recommendations.push(
      "All loads have excellent efficiency (≥85%). This is an optimal load plan.",
    );
  }

  // Check for weight vs volume imbalance
  for (const plan of loadPlans) {
    const diff = Math.abs(plan.weightUtilization - plan.volumeUtilization);
    if (diff > 30) {
      if (plan.weightUtilization > plan.volumeUtilization) {
        recommendations.push(
          `Load #${plan.id} is weight-heavy but volume-light. Consider adding lighter, bulkier items.`,
        );
      } else {
        recommendations.push(
          `Load #${plan.id} is volume-heavy but weight-light. Consider adding denser items.`,
        );
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Load plan looks good. Ready to create shipments.");
  }

  return recommendations;
}
