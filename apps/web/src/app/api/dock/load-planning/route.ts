import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function resolveOrganizationId(email?: string | null) {
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      organizationMemberships: {
        where: { isActive: true },
        select: { organizationId: true },
        take: 1,
      },
    },
  });

  return user?.organizationMemberships[0]?.organizationId || null;
}

// Validation schemas
const createLoadPlanSchema = z.object({
  action: z.literal("create_load_plan"),
  shipmentId: z.string().min(1),
  truckType: z.enum([
    "DRY_VAN_53",
    "DRY_VAN_48",
    "REEFER_53",
    "FLATBED",
    "BOX_TRUCK",
  ]),
  items: z.array(
    z.object({
      id: z.string(),
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      weight: z.number().positive(),
      quantity: z.number().int().positive(),
      stackable: z.boolean().optional(),
      fragile: z.boolean().optional(),
      hazmat: z.boolean().optional(),
    }),
  ),
  constraints: z
    .object({
      maxWeight: z.number().positive().optional(),
      weightDistribution: z
        .enum(["FRONT_HEAVY", "BALANCED", "REAR_HEAVY"])
        .optional(),
    })
    .optional(),
});

const optimizeLoadSchema = z.object({
  action: z.literal("optimize_load"),
  loadPlanId: z.string().min(1),
  optimizationGoal: z.enum([
    "MAXIMIZE_CUBE",
    "MINIMIZE_DAMAGE",
    "BALANCE_WEIGHT",
    "FASTEST_LOAD",
  ]),
});

const calculateUtilizationSchema = z.object({
  action: z.literal("calculate_utilization"),
  loadPlanId: z.string().min(1),
});

// Truck specifications
const TRUCK_SPECS = {
  DRY_VAN_53: {
    length: 636, // inches (53 feet)
    width: 102, // inches (8.5 feet)
    height: 110, // inches (9.17 feet)
    maxWeight: 45000, // lbs
    maxCube: 3960, // cubic feet
    name: "53' Dry Van",
  },
  DRY_VAN_48: {
    length: 576, // inches (48 feet)
    width: 102,
    height: 110,
    maxWeight: 45000,
    maxCube: 3600,
    name: "48' Dry Van",
  },
  REEFER_53: {
    length: 636,
    width: 98, // Slightly narrower due to insulation
    height: 104, // Lower due to refrigeration unit
    maxWeight: 43000,
    maxCube: 3700,
    name: "53' Refrigerated",
  },
  FLATBED: {
    length: 576,
    width: 102,
    height: 96, // Standard flatbed height limit
    maxWeight: 48000,
    maxCube: 3200,
    name: "Flatbed",
  },
  BOX_TRUCK: {
    length: 288, // 24 feet
    width: 96,
    height: 96,
    maxWeight: 26000,
    maxCube: 1500,
    name: "24' Box Truck",
  },
};

// Types
interface LoadItem {
  id: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  stackable?: boolean;
  fragile?: boolean;
  hazmat?: boolean;
  volume?: number;
}

interface PlacedItem extends LoadItem {
  x: number;
  y: number;
  z: number;
  rotation: 0 | 90 | 180 | 270;
  layer: number;
}

interface LoadPlan {
  id: string;
  shipmentId: string;
  truckType: keyof typeof TRUCK_SPECS;
  items: LoadItem[];
  placedItems: PlacedItem[];
  utilization: {
    cubePercent: number;
    weightPercent: number;
    itemsPlaced: number;
    itemsTotal: number;
  };
  weightDistribution: {
    front: number;
    middle: number;
    rear: number;
  };
  score: number;
}

// Calculate item volume
function calculateVolume(item: LoadItem): number {
  return (item.length * item.width * item.height) / 1728; // Convert cubic inches to cubic feet
}

// 3D bin packing algorithm (First Fit Decreasing)
function packItems(
  items: LoadItem[],
  truckSpec: (typeof TRUCK_SPECS)[keyof typeof TRUCK_SPECS],
  optimizationGoal: string,
): PlacedItem[] {
  const placed: PlacedItem[] = [];
  const sortedItems = [...items].sort((a, b) => {
    // Sort by optimization goal
    if (optimizationGoal === "MAXIMIZE_CUBE") {
      return calculateVolume(b) - calculateVolume(a);
    }
    if (optimizationGoal === "MINIMIZE_DAMAGE") {
      // Place fragile items last (on top)
      if (a.fragile !== b.fragile) return a.fragile ? 1 : -1;
      return b.weight - a.weight;
    }
    if (optimizationGoal === "BALANCE_WEIGHT") {
      return b.weight - a.weight;
    }
    // FASTEST_LOAD - place heaviest/largest first
    return b.length * b.width * b.height - a.length * a.width * a.height;
  });

  let currentX = 0;
  let currentY = 0;
  let currentZ = 0;
  let currentLayer = 0;
  let layerHeight = 0;

  for (const item of sortedItems) {
    for (let qty = 0; qty < item.quantity; qty++) {
      // Try different rotations
      const rotations = [
        {
          length: item.length,
          width: item.width,
          height: item.height,
          rotation: 0 as const,
        },
        {
          length: item.width,
          width: item.length,
          height: item.height,
          rotation: 90 as const,
        },
      ];

      let itemPlaced = false;

      for (const rot of rotations) {
        // Check if item fits at current position
        if (
          currentX + rot.length <= truckSpec.length &&
          currentY + rot.width <= truckSpec.width &&
          currentZ + rot.height <= truckSpec.height
        ) {
          placed.push({
            ...item,
            x: currentX,
            y: currentY,
            z: currentZ,
            rotation: rot.rotation,
            layer: currentLayer,
            volume: calculateVolume(item),
          });

          // Update position for next item
          currentX += rot.length;
          layerHeight = Math.max(layerHeight, rot.height);
          itemPlaced = true;
          break;
        }
      }

      // If item didn't fit, try next row
      if (!itemPlaced) {
        currentX = 0;
        currentY += item.width;

        // Check if we need a new layer
        if (currentY + item.width > truckSpec.width) {
          currentY = 0;
          currentZ += layerHeight;
          currentLayer++;
          layerHeight = 0;

          // Check if we're out of vertical space
          if (currentZ + item.height > truckSpec.height) {
            break; // Can't place this item
          }
        }

        // Try placing again
        if (
          currentX + item.length <= truckSpec.length &&
          currentY + item.width <= truckSpec.width &&
          currentZ + item.height <= truckSpec.height
        ) {
          placed.push({
            ...item,
            x: currentX,
            y: currentY,
            z: currentZ,
            rotation: 0,
            layer: currentLayer,
            volume: calculateVolume(item),
          });

          currentX += item.length;
          layerHeight = Math.max(layerHeight, item.height);
        }
      }
    }
  }

  return placed;
}

// Calculate weight distribution
function calculateWeightDistribution(
  placedItems: PlacedItem[],
  truckLength: number,
): { front: number; middle: number; rear: number } {
  const frontThird = truckLength / 3;
  const middleThird = (truckLength * 2) / 3;

  let frontWeight = 0;
  let middleWeight = 0;
  let rearWeight = 0;

  placedItems.forEach((item) => {
    const itemCenter = item.x + item.length / 2;

    if (itemCenter < frontThird) {
      frontWeight += item.weight;
    } else if (itemCenter < middleThird) {
      middleWeight += item.weight;
    } else {
      rearWeight += item.weight;
    }
  });

  const totalWeight = frontWeight + middleWeight + rearWeight;

  return {
    front: totalWeight > 0 ? (frontWeight / totalWeight) * 100 : 0,
    middle: totalWeight > 0 ? (middleWeight / totalWeight) * 100 : 0,
    rear: totalWeight > 0 ? (rearWeight / totalWeight) * 100 : 0,
  };
}

// Calculate utilization
function calculateUtilization(
  placedItems: PlacedItem[],
  allItems: LoadItem[],
  truckSpec: (typeof TRUCK_SPECS)[keyof typeof TRUCK_SPECS],
): {
  cubePercent: number;
  weightPercent: number;
  itemsPlaced: number;
  itemsTotal: number;
} {
  const totalVolume = placedItems.reduce(
    (sum, item) => sum + (item.volume || 0),
    0,
  );
  const totalWeight = placedItems.reduce((sum, item) => sum + item.weight, 0);
  const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cubePercent: (totalVolume / truckSpec.maxCube) * 100,
    weightPercent: (totalWeight / truckSpec.maxWeight) * 100,
    itemsPlaced: placedItems.length,
    itemsTotal: totalItems,
  };
}

// Calculate load plan score
function calculateLoadScore(
  utilization: { cubePercent: number; weightPercent: number },
  weightDist: { front: number; middle: number; rear: number },
  placedItemsCount: number,
  totalItemsCount: number,
): number {
  let score = 0;

  // Cube utilization (40% weight)
  score += Math.min(utilization.cubePercent, 100) * 0.4;

  // Items placement rate (30% weight)
  const placementRate = (placedItemsCount / totalItemsCount) * 100;
  score += placementRate * 0.3;

  // Weight balance (20% weight) - prefer 60% middle, 20% front, 20% rear
  const idealFront = 20;
  const idealMiddle = 60;
  const idealRear = 20;
  const balanceScore =
    100 -
    (Math.abs(weightDist.front - idealFront) +
      Math.abs(weightDist.middle - idealMiddle) +
      Math.abs(weightDist.rear - idealRear)) /
      3;
  score += Math.max(balanceScore, 0) * 0.2;

  // Weight utilization (10% weight)
  score += Math.min(utilization.weightPercent, 100) * 0.1;

  return Math.round(score);
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await resolveOrganizationId(session.user.email);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // CREATE LOAD PLAN
    if (action === "create_load_plan") {
      const data = createLoadPlanSchema.parse(body);

      const truckSpec = TRUCK_SPECS[data.truckType];

      // Add volume to items
      const itemsWithVolume = data.items.map((item) => ({
        ...item,
        volume: calculateVolume(item),
      }));

      // Pack items using default optimization
      const placedItems = packItems(
        itemsWithVolume,
        truckSpec,
        "MAXIMIZE_CUBE",
      );

      // Calculate metrics
      const utilization = calculateUtilization(
        placedItems,
        itemsWithVolume,
        truckSpec,
      );
      const weightDistribution = calculateWeightDistribution(
        placedItems,
        truckSpec.length,
      );
      const score = calculateLoadScore(
        utilization,
        weightDistribution,
        placedItems.length,
        itemsWithVolume.reduce((sum, item) => sum + item.quantity, 0),
      );

      const loadPlan: LoadPlan = {
        id: `LOAD-${Date.now()}`,
        shipmentId: data.shipmentId,
        truckType: data.truckType,
        items: itemsWithVolume,
        placedItems,
        utilization,
        weightDistribution,
        score,
      };

      await prisma.activityLog.create({
        data: {
          organizationId,
          action: "DOCK_LOAD_PLAN",
          entityType: "LoadPlan",
          entityId: loadPlan.id,
          metadata: loadPlan,
        },
      });

      return NextResponse.json({
        success: true,
        loadPlan,
        truckSpec: {
          ...truckSpec,
          remainingCube:
            truckSpec.maxCube -
            (utilization.cubePercent / 100) * truckSpec.maxCube,
          remainingWeight:
            truckSpec.maxWeight -
            (utilization.weightPercent / 100) * truckSpec.maxWeight,
        },
      });
    }

    // OPTIMIZE LOAD
    if (action === "optimize_load") {
      const data = optimizeLoadSchema.parse(body);

      const existingPlan = await getLoadPlan(organizationId, data.loadPlanId);
      if (!existingPlan) {
        return NextResponse.json(
          { error: "Load plan not found" },
          { status: 404 },
        );
      }

      const truckSpec = TRUCK_SPECS[existingPlan.truckType];

      // Repack with new optimization goal
      const optimizedPlacement = packItems(
        existingPlan.items,
        truckSpec,
        data.optimizationGoal,
      );

      const newUtilization = calculateUtilization(
        optimizedPlacement,
        existingPlan.items,
        truckSpec,
      );
      const newWeightDist = calculateWeightDistribution(
        optimizedPlacement,
        truckSpec.length,
      );
      const newScore = calculateLoadScore(
        newUtilization,
        newWeightDist,
        optimizedPlacement.length,
        existingPlan.items.reduce((sum, item) => sum + item.quantity, 0),
      );

      const improvement = {
        cubeUtilization:
          newUtilization.cubePercent - existingPlan.utilization.cubePercent,
        weightBalance:
          Math.abs(newWeightDist.middle - 60) <
          Math.abs(existingPlan.weightDistribution.middle - 60),
        itemsPlaced:
          optimizedPlacement.length - existingPlan.placedItems.length,
        scoreImprovement: newScore - existingPlan.score,
      };

      const optimizedLoadPlan: LoadPlan = {
        ...existingPlan,
        placedItems: optimizedPlacement,
        utilization: newUtilization,
        weightDistribution: newWeightDist,
        score: newScore,
      };

      await prisma.activityLog.create({
        data: {
          organizationId,
          action: "DOCK_LOAD_PLAN_OPTIMIZED",
          entityType: "LoadPlan",
          entityId: existingPlan.id,
          metadata: optimizedLoadPlan,
        },
      });

      return NextResponse.json({
        success: true,
        optimizedLoadPlan,
        improvement,
        optimizationGoal: data.optimizationGoal,
      });
    }

    // CALCULATE UTILIZATION
    if (action === "calculate_utilization") {
      const data = calculateUtilizationSchema.parse(body);

      const loadPlan = await getLoadPlan(organizationId, data.loadPlanId);
      if (!loadPlan) {
        return NextResponse.json(
          { error: "Load plan not found" },
          { status: 404 },
        );
      }

      const truckSpec = TRUCK_SPECS[loadPlan.truckType];

      return NextResponse.json({
        success: true,
        utilization: loadPlan.utilization,
        weightDistribution: loadPlan.weightDistribution,
        capacity: {
          cube: {
            used: (loadPlan.utilization.cubePercent / 100) * truckSpec.maxCube,
            available: truckSpec.maxCube,
            remaining:
              truckSpec.maxCube -
              (loadPlan.utilization.cubePercent / 100) * truckSpec.maxCube,
          },
          weight: {
            used:
              (loadPlan.utilization.weightPercent / 100) * truckSpec.maxWeight,
            available: truckSpec.maxWeight,
            remaining:
              truckSpec.maxWeight -
              (loadPlan.utilization.weightPercent / 100) * truckSpec.maxWeight,
          },
        },
        recommendations: generateRecommendations(loadPlan, truckSpec),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Load planning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await resolveOrganizationId(session.user.email);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // GET LOAD PLAN
    if (action === "load_plan") {
      const loadPlanId = searchParams.get("loadPlanId");
      if (!loadPlanId) {
        return NextResponse.json(
          { error: "Load plan ID required" },
          { status: 400 },
        );
      }

      const loadPlan = await getLoadPlan(organizationId, loadPlanId);
      if (!loadPlan) {
        return NextResponse.json(
          { error: "Load plan not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ loadPlan });
    }

    // GET TRUCK SPECS
    if (action === "truck_specs") {
      return NextResponse.json({ truckSpecs: TRUCK_SPECS });
    }

    // GET LOAD SUMMARY
    if (action === "load_summary") {
      const logs = await prisma.activityLog.findMany({
        where: {
          organizationId,
          action: { in: ["DOCK_LOAD_PLAN", "DOCK_LOAD_PLAN_OPTIMIZED"] },
          entityType: "LoadPlan",
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const latestByPlan = new Map<string, LoadPlan>();
      logs.forEach((log) => {
        const metadata = log.metadata as any;
        if (metadata?.id && metadata?.utilization) {
          latestByPlan.set(log.entityId, metadata as LoadPlan);
        }
      });

      const plans = Array.from(latestByPlan.values());
      const totalPlans = plans.length;
      const avgCubeUtilization =
        totalPlans > 0
          ? plans.reduce((sum, plan) => sum + plan.utilization.cubePercent, 0) /
            totalPlans
          : 0;
      const avgWeightUtilization =
        totalPlans > 0
          ? plans.reduce(
              (sum, plan) => sum + plan.utilization.weightPercent,
              0,
            ) / totalPlans
          : 0;
      const avgScore =
        totalPlans > 0
          ? plans.reduce((sum, plan) => sum + plan.score, 0) / totalPlans
          : 0;

      const topPerformers = [...plans]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((plan) => ({
          id: plan.id,
          shipmentId: plan.shipmentId,
          score: plan.score,
          cubeUtilization: Number(plan.utilization.cubePercent.toFixed(1)),
        }));

      const needsOptimization = plans
        .filter(
          (plan) =>
            plan.score < 75 ||
            plan.utilization.cubePercent < 75 ||
            Math.abs(plan.weightDistribution.middle - 60) > 15,
        )
        .slice(0, 5)
        .map((plan) => ({
          id: plan.id,
          shipmentId: plan.shipmentId,
          score: plan.score,
          cubeUtilization: Number(plan.utilization.cubePercent.toFixed(1)),
          issue:
            plan.utilization.cubePercent < 75
              ? "Low cube utilization"
              : "Poor weight balance",
        }));

      const summary = {
        totalPlans,
        avgCubeUtilization: Number(avgCubeUtilization.toFixed(1)),
        avgWeightUtilization: Number(avgWeightUtilization.toFixed(1)),
        avgScore: Number(avgScore.toFixed(1)),
        topPerformers,
        needsOptimization,
      };

      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Load planning GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper functions
async function getLoadPlan(
  organizationId: string,
  loadPlanId: string,
): Promise<LoadPlan | null> {
  const log = await prisma.activityLog.findFirst({
    where: {
      organizationId,
      entityType: "LoadPlan",
      entityId: loadPlanId,
      action: { in: ["DOCK_LOAD_PLAN", "DOCK_LOAD_PLAN_OPTIMIZED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!log?.metadata) {
    return null;
  }

  return log.metadata as unknown as LoadPlan;
}

function generateRecommendations(
  loadPlan: LoadPlan,
  truckSpec: (typeof TRUCK_SPECS)[keyof typeof TRUCK_SPECS],
): string[] {
  const recommendations: string[] = [];

  // Cube utilization recommendations
  if (loadPlan.utilization.cubePercent < 75) {
    recommendations.push(
      "Low cube utilization. Consider consolidating with another shipment.",
    );
  } else if (loadPlan.utilization.cubePercent > 95) {
    recommendations.push("Excellent cube utilization! Load is well optimized.");
  }

  // Weight balance recommendations
  const { front, middle, rear } = loadPlan.weightDistribution;
  if (Math.abs(middle - 60) > 15) {
    recommendations.push(
      "Weight distribution is unbalanced. Reposition heavier items toward center.",
    );
  }
  if (front > 35) {
    recommendations.push(
      "Too much weight in front. Risk of poor handling and braking.",
    );
  }
  if (rear > 35) {
    recommendations.push(
      "Too much weight in rear. Risk of reduced traction and stability.",
    );
  }

  // Items placement recommendations
  const placementRate =
    (loadPlan.placedItems.length / loadPlan.utilization.itemsTotal) * 100;
  if (placementRate < 90) {
    recommendations.push(
      `Only ${placementRate.toFixed(0)}% of items placed. Consider using larger truck or multiple loads.`,
    );
  }

  // Weight utilization
  if (loadPlan.utilization.weightPercent > 95) {
    recommendations.push(
      "Near maximum weight capacity. Verify axle weight limits.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Load plan is well optimized. No issues detected.");
  }

  return recommendations;
}
