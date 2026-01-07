/**
 * Load Optimization Service
 *
 * Handles 3D load planning, trailer optimization, weight distribution,
 * and multi-stop consolidation for warehouse shipping operations.
 *
 * Features:
 * - 3D bin packing algorithm (tetris-style)
 * - Weight distribution and axle balance
 * - Multi-stop reverse loading (LIFO)
 * - Trailer/container management
 * - Real-time capacity calculation
 * - Visual load planning
 * - Automatic order-to-trailer assignment
 * - Vehicle type recommendations (integrated with vehicle-types library)
 *
 * @module LoadOptimizationService
 */

import { prisma } from "@/lib/prisma";
import {
  recommendVehicle,
  findSuitableVehicles,
  type VehicleType,
} from "@/lib/vehicle-types";
import type {
  LoadPlan,
  Trailer,
  Container,
  LoadItem,
  LoadOptimizationResult,
  WeightDistribution,
  LoadSequence,
  TrailerType,
  LoadConstraints,
} from "@/types/load-optimization";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Dimensions {
  length: number; // inches
  width: number; // inches
  height: number; // inches
}

interface Weight {
  weight: number; // lbs
  maxWeight?: number; // capacity
}

interface Position {
  x: number; // position in trailer
  y: number;
  z: number;
}

interface LoadedItem extends LoadItem {
  position: Position;
  rotated: boolean; // if item was rotated for better fit
  stop: number; // delivery stop number
}

interface TrailerConfig extends Trailer {
  usableLength: number; // actual loadable space (minus cab)
  usableWidth: number;
  usableHeight: number;
}

interface LoadPlanResult {
  success: boolean;
  loadPlan: LoadPlan | null;
  utilization: {
    volumePercent: number;
    weightPercent: number;
    floorPercent: number;
  };
  issues: string[];
  recommendations: string[];
}

// ============================================================================
// TRAILER TYPE DEFINITIONS
// ============================================================================

const TRAILER_TYPES: Record<string, TrailerConfig> = {
  DRY_VAN_53: {
    id: "DRY_VAN_53",
    name: "53' Dry Van",
    type: "DRY_VAN",
    length: 636, // 53 feet = 636 inches
    width: 102, // 8.5 feet = 102 inches
    height: 110, // 9.17 feet = 110 inches
    usableLength: 630, // minus 6" for bulkhead
    usableWidth: 100, // minus 2" for side walls
    usableHeight: 108, // minus 2" for floor/ceiling
    maxWeight: 45000, // 45,000 lbs typical
    axleWeights: {
      front: 12000,
      rear: 34000,
    },
    doorType: "REAR",
    features: ["STANDARD"],
  },
  DRY_VAN_48: {
    id: "DRY_VAN_48",
    name: "48' Dry Van",
    type: "DRY_VAN",
    length: 576,
    width: 102,
    height: 110,
    usableLength: 570,
    usableWidth: 100,
    usableHeight: 108,
    maxWeight: 42000,
    axleWeights: {
      front: 12000,
      rear: 30000,
    },
    doorType: "REAR",
    features: ["STANDARD"],
  },
  REEFER_53: {
    id: "REEFER_53",
    name: "53' Refrigerated",
    type: "REEFER",
    length: 636,
    width: 102,
    height: 110,
    usableLength: 620, // minus 16" for refrigeration unit
    usableWidth: 98, // insulation reduces width
    usableHeight: 106, // insulation reduces height
    maxWeight: 43000, // slightly less due to reefer unit
    axleWeights: {
      front: 12000,
      rear: 31000,
    },
    doorType: "REAR",
    features: ["TEMPERATURE_CONTROLLED", "MULTI_ZONE"],
    temperatureRange: { min: -20, max: 70 }, // Fahrenheit
  },
  BOX_TRUCK_26: {
    id: "BOX_TRUCK_26",
    name: "26' Box Truck",
    type: "BOX_TRUCK",
    length: 312, // 26 feet
    width: 102,
    height: 102, // 8.5 feet
    usableLength: 310,
    usableWidth: 100,
    usableHeight: 100,
    maxWeight: 26000, // GVWR
    axleWeights: {
      front: 10000,
      rear: 16000,
    },
    doorType: "REAR_ROLLUP",
    features: ["LIFT_GATE"],
    liftGateCapacity: 3000, // lbs
  },
  CONTAINER_40_HC: {
    id: "CONTAINER_40_HC",
    name: "40' High Cube Container",
    type: "CONTAINER",
    length: 480, // 40 feet
    width: 96, // 8 feet
    height: 107, // 8.92 feet (high cube)
    usableLength: 476,
    usableWidth: 94,
    usableHeight: 105,
    maxWeight: 62000, // international standard
    axleWeights: {
      front: 0,
      rear: 62000,
    },
    doorType: "REAR",
    features: ["STACKABLE", "WEATHERPROOF"],
  },
  CONTAINER_20: {
    id: "CONTAINER_20",
    name: "20' Standard Container",
    type: "CONTAINER",
    length: 240, // 20 feet
    width: 96,
    height: 102, // 8.5 feet
    usableLength: 236,
    usableWidth: 94,
    usableHeight: 100,
    maxWeight: 48000,
    axleWeights: {
      front: 0,
      rear: 48000,
    },
    doorType: "REAR",
    features: ["STACKABLE", "WEATHERPROOF"],
  },
  FLATBED_48: {
    id: "FLATBED_48",
    name: "48' Flatbed",
    type: "FLATBED",
    length: 576,
    width: 102,
    height: 60, // max recommended height for stability
    usableLength: 576, // full length available
    usableWidth: 102,
    usableHeight: 60,
    maxWeight: 48000,
    axleWeights: {
      front: 12000,
      rear: 36000,
    },
    doorType: "OPEN",
    features: ["TARPING", "OVERSIZED"],
  },
};

// ============================================================================
// 3D BIN PACKING ALGORITHM
// ============================================================================

class BinPacking3D {
  private trailer: TrailerConfig;
  private items: LoadItem[];
  private loadedItems: LoadedItem[] = [];
  private occupiedSpaces: Set<string> = new Set();

  constructor(trailer: TrailerConfig, items: LoadItem[]) {
    this.trailer = trailer;
    // Sort items by volume (largest first) for better packing
    this.items = [...items].sort((a, b) => {
      const volA =
        a.dimensions.length * a.dimensions.width * a.dimensions.height;
      const volB =
        b.dimensions.length * b.dimensions.width * b.dimensions.height;
      return volB - volA;
    });
  }

  /**
   * Pack items into trailer using 3D bin packing algorithm
   */
  pack(): LoadedItem[] {
    this.loadedItems = [];
    this.occupiedSpaces.clear();

    // Group items by delivery stop (for multi-stop optimization)
    const itemsByStop = this.groupByStop(this.items);
    const stops = Object.keys(itemsByStop).sort(
      (a, b) => Number(b) - Number(a),
    ); // Reverse order (LIFO)

    // Pack each stop separately, starting from rear
    let currentZ = 0; // Start at front of trailer

    for (const stop of stops) {
      const stopItems = itemsByStop[stop];
      const stopLoadedItems = this.packStop(stopItems, Number(stop), currentZ);

      this.loadedItems.push(...stopLoadedItems);

      // Update Z position for next stop (add access lane)
      if (stopLoadedItems.length > 0) {
        const maxZ = Math.max(
          ...stopLoadedItems.map(
            (item) => item.position.z + item.dimensions.length,
          ),
        );
        currentZ = maxZ + 12; // 12" access lane between stops
      }
    }

    return this.loadedItems;
  }

  /**
   * Pack items for a single delivery stop
   */
  private packStop(
    items: LoadItem[],
    stop: number,
    startZ: number,
  ): LoadedItem[] {
    const loaded: LoadedItem[] = [];

    // Try to pack each item
    for (const item of items) {
      const position = this.findBestPosition(item, startZ);

      if (position) {
        loaded.push({
          ...item,
          position,
          rotated: false, // TODO: Add rotation logic
          stop,
        });

        // Mark space as occupied
        this.markSpaceOccupied(item, position);
      }
    }

    return loaded;
  }

  /**
   * Find best position for item in trailer
   */
  private findBestPosition(item: LoadItem, minZ: number): Position | null {
    const { usableLength, usableWidth, usableHeight } = this.trailer;
    const { length, width, height } = item.dimensions;

    // Try positions from bottom-left-front corner, moving right then back then up
    for (let z = minZ; z <= usableLength - length; z += 6) {
      // 6" increments
      for (let x = 0; x <= usableWidth - width; x += 6) {
        for (let y = 0; y <= usableHeight - height; y += 6) {
          const position: Position = { x, y, z };

          if (this.canFitAt(item, position)) {
            // Validate weight distribution
            if (this.isWeightDistributionValid(item, position)) {
              return position;
            }
          }
        }
      }
    }

    return null; // Can't fit
  }

  /**
   * Check if item can fit at position without collisions
   */
  private canFitAt(item: LoadItem, position: Position): boolean {
    const { x, y, z } = position;
    const { length, width, height } = item.dimensions;
    const { usableLength, usableWidth, usableHeight } = this.trailer;

    // Check trailer boundaries
    if (x + width > usableWidth) return false;
    if (y + height > usableHeight) return false;
    if (z + length > usableLength) return false;

    // Check for collisions with already placed items
    for (let dx = 0; dx < width; dx += 6) {
      for (let dy = 0; dy < height; dy += 6) {
        for (let dz = 0; dz < length; dz += 6) {
          const key = `${x + dx},${y + dy},${z + dz}`;
          if (this.occupiedSpaces.has(key)) {
            return false;
          }
        }
      }
    }

    // Check stackability rules
    if (y > 0 && !this.hasSupport(item, position)) {
      return false;
    }

    // Check if item can bear weight above (if not on floor)
    if (!item.stackable && this.hasItemAbove(position, item.dimensions)) {
      return false;
    }

    return true;
  }

  /**
   * Check if item has adequate support below
   */
  private hasSupport(item: LoadItem, position: Position): boolean {
    const { x, z } = position;
    const { width, length } = item.dimensions;

    // Check if at least 70% of bottom surface is supported
    let supportedArea = 0;
    const totalArea = width * length;

    for (const loaded of this.loadedItems) {
      // Check if loaded item is below this position
      if (loaded.position.y + loaded.dimensions.height === position.y) {
        // Calculate overlap area
        const overlapX = Math.max(
          0,
          Math.min(x + width, loaded.position.x + loaded.dimensions.width) -
            Math.max(x, loaded.position.x),
        );
        const overlapZ = Math.max(
          0,
          Math.min(z + length, loaded.position.z + loaded.dimensions.length) -
            Math.max(z, loaded.position.z),
        );
        supportedArea += overlapX * overlapZ;
      }
    }

    return supportedArea >= totalArea * 0.7;
  }

  /**
   * Check if there are items above this position
   */
  private hasItemAbove(position: Position, dimensions: Dimensions): boolean {
    const { x, y, z } = position;

    for (const loaded of this.loadedItems) {
      // Check if item is above
      if (loaded.position.y > y) {
        // Check for overlap in X and Z
        const overlapX =
          Math.max(x, loaded.position.x) <
          Math.min(
            x + dimensions.width,
            loaded.position.x + loaded.dimensions.width,
          );
        const overlapZ =
          Math.max(z, loaded.position.z) <
          Math.min(
            z + dimensions.length,
            loaded.position.z + loaded.dimensions.length,
          );

        if (overlapX && overlapZ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate weight distribution doesn't exceed axle limits
   */
  private isWeightDistributionValid(
    item: LoadItem,
    position: Position,
  ): boolean {
    // Calculate center of gravity
    const trailerCenter = this.trailer.usableLength / 2;
    const itemCenter = position.z + item.dimensions.length / 2;

    // Calculate weight on each axle
    const distanceFromCenter = Math.abs(itemCenter - trailerCenter);
    const totalWeight = this.getTotalWeight() + item.weight;

    // Simplified weight distribution (actual would be more complex)
    const rearWeight =
      totalWeight * (0.6 + (itemCenter / this.trailer.usableLength) * 0.2);
    const frontWeight = totalWeight - rearWeight;

    // Check against axle limits
    if (this.trailer.axleWeights) {
      if (frontWeight > this.trailer.axleWeights.front) return false;
      if (rearWeight > this.trailer.axleWeights.rear) return false;
    }

    return true;
  }

  /**
   * Mark space as occupied by item
   */
  private markSpaceOccupied(item: LoadItem, position: Position): void {
    const { x, y, z } = position;
    const { width, height, length } = item.dimensions;

    for (let dx = 0; dx < width; dx += 6) {
      for (let dy = 0; dy < height; dy += 6) {
        for (let dz = 0; dz < length; dz += 6) {
          const key = `${x + dx},${y + dy},${z + dz}`;
          this.occupiedSpaces.add(key);
        }
      }
    }
  }

  /**
   * Group items by delivery stop
   */
  private groupByStop(items: LoadItem[]): Record<string, LoadItem[]> {
    return items.reduce(
      (acc, item) => {
        const stop = item.deliveryStop || 1;
        if (!acc[stop]) acc[stop] = [];
        acc[stop].push(item);
        return acc;
      },
      {} as Record<string, LoadItem[]>,
    );
  }

  /**
   * Calculate total weight of loaded items
   */
  private getTotalWeight(): number {
    return this.loadedItems.reduce((sum, item) => sum + item.weight, 0);
  }
}

// ============================================================================
// LOAD OPTIMIZATION SERVICE
// ============================================================================

export class LoadOptimizationService {
  /**
   * Create optimized load plan for orders
   */
  async createLoadPlan(params: {
    orderIds: string[];
    trailerId?: string;
    trailerType?: string;
    warehouseId: string;
    dockDoorId?: string;
    constraints?: LoadConstraints;
  }): Promise<LoadPlanResult> {
    const { orderIds, trailerId, trailerType, warehouseId, constraints } =
      params;

    try {
      // 1. Get orders with items
      const orders = await prisma.order.findMany({
        where: {
          id: { in: orderIds },
          warehouseId,
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          deliveryAddress: true,
        },
      });

      if (orders.length === 0) {
        return {
          success: false,
          loadPlan: null,
          utilization: { volumePercent: 0, weightPercent: 0, floorPercent: 0 },
          issues: ["No orders found"],
          recommendations: [],
        };
      }

      // 2. Get or create trailer
      let trailer: TrailerConfig;
      if (trailerId) {
        const dbTrailer = await prisma.trailer.findUnique({
          where: { id: trailerId },
        });
        if (!dbTrailer) {
          return {
            success: false,
            loadPlan: null,
            utilization: {
              volumePercent: 0,
              weightPercent: 0,
              floorPercent: 0,
            },
            issues: ["Trailer not found"],
            recommendations: [],
          };
        }
        trailer = this.mapTrailerToConfig(dbTrailer);
      } else if (trailerType) {
        trailer = TRAILER_TYPES[trailerType];
        if (!trailer) {
          return {
            success: false,
            loadPlan: null,
            utilization: {
              volumePercent: 0,
              weightPercent: 0,
              floorPercent: 0,
            },
            issues: ["Invalid trailer type"],
            recommendations: [],
          };
        }
      } else {
        // Auto-select best trailer based on requirements
        trailer = await this.selectBestTrailer(orders);
      }

      // 3. Convert orders to load items
      const loadItems = this.convertOrdersToLoadItems(orders);

      // 4. Validate constraints
      const validation = this.validateConstraints(
        loadItems,
        trailer,
        constraints,
      );
      if (!validation.valid) {
        return {
          success: false,
          loadPlan: null,
          utilization: { volumePercent: 0, weightPercent: 0, floorPercent: 0 },
          issues: validation.issues,
          recommendations: validation.recommendations,
        };
      }

      // 5. Run 3D bin packing algorithm
      const packer = new BinPacking3D(trailer, loadItems);
      const loadedItems = packer.pack();

      // 6. Calculate utilization
      const utilization = this.calculateUtilization(loadedItems, trailer);

      // 7. Check if all items loaded
      const unloadedItems = loadItems.filter(
        (item) => !loadedItems.find((loaded) => loaded.id === item.id),
      );

      // 8. Generate recommendations
      const recommendations = this.generateRecommendations(
        loadedItems,
        unloadedItems,
        utilization,
        trailer,
      );

      // 9. Create load plan in database
      const loadPlan = await this.saveLoadPlan({
        trailerId: trailerId || trailer.id,
        warehouseId,
        orderIds,
        loadedItems,
        utilization,
        trailer,
      });

      return {
        success: unloadedItems.length === 0,
        loadPlan,
        utilization,
        issues:
          unloadedItems.length > 0
            ? [`Could not fit ${unloadedItems.length} items`]
            : [],
        recommendations,
      };
    } catch (error) {
      console.error("Load optimization error:", error);
      return {
        success: false,
        loadPlan: null,
        utilization: { volumePercent: 0, weightPercent: 0, floorPercent: 0 },
        issues: ["Failed to create load plan"],
        recommendations: [],
      };
    }
  }

  /**
   * Auto-assign orders to available trailers
   */
  async autoAssignOrders(params: {
    orderIds: string[];
    warehouseId: string;
    dockDoorIds?: string[];
  }): Promise<{
    assignments: Array<{
      trailerId: string;
      orderIds: string[];
      loadPlan: LoadPlan;
      utilization: any;
    }>;
    unassigned: string[];
  }> {
    const { orderIds, warehouseId, dockDoorIds } = params;

    // Get available trailers at dock
    const availableTrailers = await prisma.trailer.findMany({
      where: {
        warehouseId,
        status: "AT_DOCK",
        ...(dockDoorIds && {
          currentDockDoorId: { in: dockDoorIds },
        }),
      },
    });

    const assignments = [];
    let remainingOrderIds = [...orderIds];

    // Try to assign orders to each trailer
    for (const trailer of availableTrailers) {
      if (remainingOrderIds.length === 0) break;

      const result = await this.createLoadPlan({
        orderIds: remainingOrderIds,
        trailerId: trailer.id,
        warehouseId,
      });

      if (result.success && result.loadPlan) {
        assignments.push({
          trailerId: trailer.id,
          orderIds: result.loadPlan.orderIds,
          loadPlan: result.loadPlan,
          utilization: result.utilization,
        });

        // Remove assigned orders
        remainingOrderIds = remainingOrderIds.filter(
          (id) => !result.loadPlan!.orderIds.includes(id),
        );
      }
    }

    return {
      assignments,
      unassigned: remainingOrderIds,
    };
  }

  /**
   * Get load plan with 3D visualization data
   */
  async getLoadPlanVisualization(loadPlanId: string): Promise<{
    loadPlan: LoadPlan;
    visualization: {
      trailer: TrailerConfig;
      items: LoadedItem[];
      stats: any;
    };
  } | null> {
    const loadPlan = await prisma.loadPlan.findUnique({
      where: { id: loadPlanId },
      include: {
        trailer: true,
        orders: true,
        items: true,
      },
    });

    if (!loadPlan) return null;

    const trailer = this.mapTrailerToConfig(loadPlan.trailer);

    return {
      loadPlan: loadPlan as any,
      visualization: {
        trailer,
        items: loadPlan.items as any,
        stats: {
          totalItems: loadPlan.items.length,
          totalWeight: loadPlan.items.reduce(
            (sum: number, item: any) => sum + item.weight,
            0,
          ),
          utilization: loadPlan.utilization,
        },
      },
    };
  }

  /**
   * Calculate weight distribution across axles
   */
  calculateWeightDistribution(
    loadedItems: LoadedItem[],
    trailer: TrailerConfig,
  ): WeightDistribution {
    const trailerCenter = trailer.usableLength / 2;
    let frontWeight = 0;
    let rearWeight = 0;
    let totalWeight = 0;

    for (const item of loadedItems) {
      const itemCenter = item.position.z + item.dimensions.length / 2;
      const distanceFromCenter = itemCenter - trailerCenter;

      // Weight distribution formula (simplified)
      const rearRatio = 0.6 + (distanceFromCenter / trailer.usableLength) * 0.2;
      const itemRearWeight = item.weight * rearRatio;
      const itemFrontWeight = item.weight * (1 - rearRatio);

      frontWeight += itemFrontWeight;
      rearWeight += itemRearWeight;
      totalWeight += item.weight;
    }

    return {
      front: Math.round(frontWeight),
      rear: Math.round(rearWeight),
      total: Math.round(totalWeight),
      frontPercent: (frontWeight / totalWeight) * 100,
      rearPercent: (rearWeight / totalWeight) * 100,
      balanced: this.isBalanced(frontWeight, rearWeight, trailer),
      warnings: this.getWeightWarnings(frontWeight, rearWeight, trailer),
    };
  }

  /**
   * Optimize load sequence for multi-stop delivery
   */
  optimizeLoadSequence(items: LoadItem[]): LoadSequence {
    // Group by delivery stop
    const stopGroups = items.reduce(
      (acc, item) => {
        const stop = item.deliveryStop || 1;
        if (!acc[stop]) acc[stop] = [];
        acc[stop].push(item);
        return acc;
      },
      {} as Record<number, LoadItem[]>,
    );

    // Sort stops (last stop first - LIFO loading)
    const stops = Object.keys(stopGroups)
      .map(Number)
      .sort((a, b) => b - a);

    // Create sequence with access lanes
    const sequence: LoadSequence = {
      stops: [],
      accessLanes: [],
    };

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      sequence.stops.push({
        stopNumber: stop,
        items: stopGroups[stop],
        loadOrder: i + 1,
      });

      // Add access lane after each stop (except last)
      if (i < stops.length - 1) {
        sequence.accessLanes.push({
          afterStop: stop,
          width: 12, // 12 inches
        });
      }
    }

    return sequence;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async selectBestTrailer(orders: any[]): Promise<TrailerConfig> {
    // Calculate total requirements
    let totalVolume = 0;
    let totalWeight = 0;
    let requiresTemp = false;

    for (const order of orders) {
      for (const item of order.orderItems) {
        const product = item.product;
        totalVolume +=
          (product.length || 12) *
          (product.width || 12) *
          (product.height || 12) *
          item.quantity;
        totalWeight += (product.weight || 1) * item.quantity;
        if (product.requiresTemperatureControl) requiresTemp = true;
      }
    }

    // Select appropriate trailer
    if (requiresTemp) {
      return TRAILER_TYPES.REEFER_53;
    } else if (totalWeight < 26000 && totalVolume < 2500000) {
      return TRAILER_TYPES.BOX_TRUCK_26;
    } else if (totalVolume < 50000000) {
      return TRAILER_TYPES.DRY_VAN_48;
    } else {
      return TRAILER_TYPES.DRY_VAN_53;
    }
  }

  private convertOrdersToLoadItems(orders: any[]): LoadItem[] {
    const items: LoadItem[] = [];

    for (const order of orders) {
      for (const orderItem of order.orderItems) {
        const product = orderItem.product;

        // Create load item for each quantity
        for (let i = 0; i < orderItem.quantity; i++) {
          items.push({
            id: `${orderItem.id}-${i}`,
            orderId: order.id,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            dimensions: {
              length: product.length || 12,
              width: product.width || 12,
              height: product.height || 12,
            },
            weight: product.weight || 1,
            stackable: product.stackable !== false,
            fragile: product.fragile === true,
            hazmat: product.hazmat === true,
            requiresTemp: product.requiresTemperatureControl === true,
            deliveryStop: order.deliverySequence || 1,
          });
        }
      }
    }

    return items;
  }

  private validateConstraints(
    items: LoadItem[],
    trailer: TrailerConfig,
    constraints?: LoadConstraints,
  ): { valid: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check total weight
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight > trailer.maxWeight) {
      issues.push(
        `Total weight (${totalWeight} lbs) exceeds trailer capacity (${trailer.maxWeight} lbs)`,
      );
      recommendations.push("Split shipment into multiple trailers");
    }

    // Check temperature requirements
    const needsTemp = items.some((item) => item.requiresTemp);
    if (needsTemp && trailer.type !== "REEFER") {
      issues.push("Temperature-controlled items require refrigerated trailer");
    }

    // Check hazmat
    const hasHazmat = items.some((item) => item.hazmat);
    if (hasHazmat && !trailer.features?.includes("HAZMAT_CERTIFIED")) {
      recommendations.push(
        "Hazmat items require certified trailer and placards",
      );
    }

    // Check fragile items
    const fragileCount = items.filter((item) => item.fragile).length;
    if (fragileCount > items.length * 0.3) {
      recommendations.push("High number of fragile items - load carefully");
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  private calculateUtilization(
    loadedItems: LoadedItem[],
    trailer: TrailerConfig,
  ) {
    const trailerVolume =
      trailer.usableLength * trailer.usableWidth * trailer.usableHeight;
    const trailerFloor = trailer.usableLength * trailer.usableWidth;

    let usedVolume = 0;
    let usedWeight = 0;
    let usedFloor = 0;

    for (const item of loadedItems) {
      usedVolume +=
        item.dimensions.length * item.dimensions.width * item.dimensions.height;
      usedWeight += item.weight;

      // Calculate floor space (footprint at y=0)
      if (item.position.y === 0) {
        usedFloor += item.dimensions.width * item.dimensions.length;
      }
    }

    return {
      volumePercent: Math.round((usedVolume / trailerVolume) * 100),
      weightPercent: Math.round((usedWeight / trailer.maxWeight) * 100),
      floorPercent: Math.round((usedFloor / trailerFloor) * 100),
    };
  }

  private generateRecommendations(
    loadedItems: LoadedItem[],
    unloadedItems: LoadItem[],
    utilization: any,
    trailer: TrailerConfig,
  ): string[] {
    const recommendations: string[] = [];

    if (unloadedItems.length > 0) {
      recommendations.push(
        `${unloadedItems.length} items could not fit - consider larger trailer or multiple shipments`,
      );
    }

    if (utilization.volumePercent < 60) {
      recommendations.push(
        "Low volume utilization - consider consolidating with other orders",
      );
    }

    if (utilization.floorPercent > 90 && utilization.volumePercent < 70) {
      recommendations.push(
        "Good floor utilization but low cube - consider stacking more items",
      );
    }

    const weightDist = this.calculateWeightDistribution(loadedItems, trailer);
    if (weightDist.warnings.length > 0) {
      recommendations.push(...weightDist.warnings);
    }

    return recommendations;
  }

  private async saveLoadPlan(data: any): Promise<LoadPlan> {
    // Save to database
    return (await prisma.loadPlan.create({
      data: {
        trailerId: data.trailerId,
        warehouseId: data.warehouseId,
        status: "DRAFT",
        totalItems: data.loadedItems.length,
        totalWeight: data.loadedItems.reduce(
          (sum: number, item: LoadedItem) => sum + item.weight,
          0,
        ),
        utilization: data.utilization,
        orderIds: data.orderIds,
        // Items would be saved as JSON or separate table
        items: data.loadedItems,
      },
    })) as any;
  }

  private mapTrailerToConfig(dbTrailer: any): TrailerConfig {
    return {
      ...dbTrailer,
      usableLength: dbTrailer.length * 0.98,
      usableWidth: dbTrailer.width * 0.98,
      usableHeight: dbTrailer.height * 0.98,
    };
  }

  private isBalanced(
    front: number,
    rear: number,
    trailer: TrailerConfig,
  ): boolean {
    if (!trailer.axleWeights) return true;

    return (
      front <= trailer.axleWeights.front && rear <= trailer.axleWeights.rear
    );
  }

  private getWeightWarnings(
    front: number,
    rear: number,
    trailer: TrailerConfig,
  ): string[] {
    const warnings: string[] = [];

    if (!trailer.axleWeights) return warnings;

    if (front > trailer.axleWeights.front) {
      warnings.push(
        `Front axle overweight: ${front} lbs exceeds ${trailer.axleWeights.front} lbs limit`,
      );
    }

    if (rear > trailer.axleWeights.rear) {
      warnings.push(
        `Rear axle overweight: ${rear} lbs exceeds ${trailer.axleWeights.rear} lbs limit`,
      );
    }

    // Check balance
    const total = front + rear;
    const frontRatio = front / total;
    if (frontRatio < 0.25 || frontRatio > 0.35) {
      warnings.push("Unbalanced load - redistribute weight");
    }

    return warnings;
  }

  // ============================================================================
  // VEHICLE TYPE INTEGRATION
  // ============================================================================

  /**
   * Recommend vehicle for orders using vehicle-types library
   */
  async recommendVehicleForOrders(params: {
    orderIds: string[];
    warehouseId: string;
    region?: VehicleType["region"];
    prioritize?: "cost" | "utilization" | "capacity";
  }): Promise<{
    vehicle: VehicleType | null;
    totalVolume: number;
    totalWeight: number;
    palletCount: number;
    utilization: {
      volumePercent: number;
      weightPercent: number;
    };
    alternatives: VehicleType[];
  }> {
    // Get orders
    const orders = await prisma.order.findMany({
      where: {
        id: { in: params.orderIds },
        warehouseId: params.warehouseId,
      },
      include: { items: true },
    });

    // Calculate totals
    let totalVolume = 0;
    let totalWeight = 0;
    let palletCount = 0;

    for (const order of orders) {
      for (const item of order.items) {
        const itemVolume =
          (item.lengthInches * item.widthInches * item.heightInches) / 1728; // Convert to cu ft
        totalVolume += itemVolume * item.quantity;
        totalWeight += item.weightLbs * item.quantity;
      }
      palletCount += order.palletCount || 0;
    }

    // Check if refrigeration needed
    const requiresTemperatureControl = orders.some(
      (o) => o.requiresRefrigeration,
    );

    // Get warehouse region if not specified
    let region = params.region;
    if (!region) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: params.warehouseId },
      });
      region = (warehouse?.region as VehicleType["region"]) || "UK";
    }

    // Recommend vehicle
    const vehicle = recommendVehicle({
      totalVolumeCubicFeet: totalVolume,
      totalWeightLbs: totalWeight,
      palletCount,
      requiresTemperatureControl,
      region,
      prioritize: params.prioritize || "utilization",
    });

    // Get alternatives
    const alternatives = findSuitableVehicles({
      totalVolumeCubicFeet: totalVolume,
      totalWeightLbs: totalWeight,
      palletCount,
      requiresTemperatureControl,
      region,
    }).slice(0, 3); // Top 3

    return {
      vehicle,
      totalVolume,
      totalWeight,
      palletCount,
      utilization: vehicle
        ? {
            volumePercent: (totalVolume / vehicle.volumeCubicFeet) * 100,
            weightPercent: (totalWeight / vehicle.maxWeightLbs) * 100,
          }
        : { volumePercent: 0, weightPercent: 0 },
      alternatives,
    };
  }

  /**
   * Optimize load with vehicle recommendation
   */
  async optimizeLoadWithVehicle(params: {
    orderIds: string[];
    warehouseId: string;
    region?: VehicleType["region"];
  }): Promise<{
    success: boolean;
    vehicle: VehicleType | null;
    loadPlan: LoadPlanResult | null;
    recommendation: string;
  }> {
    // Get vehicle recommendation
    const vehicleRec = await this.recommendVehicleForOrders({
      orderIds: params.orderIds,
      warehouseId: params.warehouseId,
      region: params.region,
      prioritize: "utilization",
    });

    if (!vehicleRec.vehicle) {
      return {
        success: false,
        vehicle: null,
        loadPlan: null,
        recommendation: "No suitable vehicle found for this load",
      };
    }

    // Create trailer config from vehicle
    const trailerConfig: TrailerConfig = {
      id: vehicleRec.vehicle.id,
      name: vehicleRec.vehicle.name,
      type: vehicleRec.vehicle.category as any,
      length: vehicleRec.vehicle.dimensions.lengthInches,
      width: vehicleRec.vehicle.dimensions.widthInches,
      height: vehicleRec.vehicle.dimensions.heightInches,
      usableLength:
        vehicleRec.vehicle.dimensions.usableLengthInches ||
        vehicleRec.vehicle.dimensions.lengthInches * 0.98,
      usableWidth:
        vehicleRec.vehicle.dimensions.usableWidthInches ||
        vehicleRec.vehicle.dimensions.widthInches * 0.98,
      usableHeight:
        vehicleRec.vehicle.dimensions.usableHeightInches ||
        vehicleRec.vehicle.dimensions.heightInches * 0.98,
      maxWeight: vehicleRec.vehicle.maxWeightLbs,
      doorType: vehicleRec.vehicle.features?.hasSideLoading ? "SIDE" : "REAR",
      features: [],
    };

    // Get orders for load planning
    const orders = await prisma.order.findMany({
      where: {
        id: { in: params.orderIds },
        warehouseId: params.warehouseId,
      },
      include: { items: true },
    });

    // Convert to load items
    const loadItems: LoadItem[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        loadItems.push({
          id: item.id,
          orderId: order.id,
          sku: item.sku,
          description: item.name,
          dimensions: {
            length: item.lengthInches,
            width: item.widthInches,
            height: item.heightInches,
          },
          weight: item.weightLbs,
          quantity: item.quantity,
          fragile: item.fragile || false,
          stackable: item.stackable !== false,
          stop: order.deliverySequence || 1,
        });
      }
    }

    // Run 3D bin packing
    const binPacking = new BinPacking3D(trailerConfig, loadItems);
    const loadedItems = binPacking.pack();

    // Calculate utilization
    const totalVolume = loadedItems.reduce((sum, item) => {
      return (
        sum +
        (item.dimensions.length *
          item.dimensions.width *
          item.dimensions.height) /
          1728
      );
    }, 0);
    const trailerVolume =
      (trailerConfig.usableLength *
        trailerConfig.usableWidth *
        trailerConfig.usableHeight) /
      1728;

    const loadPlan: LoadPlanResult = {
      success: loadedItems.length === loadItems.length,
      loadPlan: {
        id: `plan_${Date.now()}`,
        items: loadedItems,
        trailer: trailerConfig,
        totalItems: loadedItems.length,
        totalWeight: loadedItems.reduce((sum, item) => sum + item.weight, 0),
      } as any,
      utilization: {
        volumePercent: (totalVolume / trailerVolume) * 100,
        weightPercent: vehicleRec.utilization.weightPercent,
        floorPercent: 0,
      },
      issues:
        loadedItems.length < loadItems.length ? ["Not all items fit"] : [],
      recommendations: [],
    };

    // Generate recommendation
    let recommendation = `Recommended: ${vehicleRec.vehicle.name}. `;
    if (
      loadPlan.utilization.volumePercent >= 75 &&
      loadPlan.utilization.volumePercent <= 95
    ) {
      recommendation += `Optimal utilization: ${Math.round(loadPlan.utilization.volumePercent)}%`;
    } else if (loadPlan.utilization.volumePercent < 75) {
      recommendation += `Low utilization (${Math.round(loadPlan.utilization.volumePercent)}%). Consider smaller vehicle.`;
    } else {
      recommendation += `High utilization (${Math.round(loadPlan.utilization.volumePercent)}%). Load may be tight.`;
    }

    return {
      success: true,
      vehicle: vehicleRec.vehicle,
      loadPlan,
      recommendation,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const loadOptimizationService = new LoadOptimizationService();

export { TRAILER_TYPES, BinPacking3D };

export type { LoadedItem, TrailerConfig, LoadPlanResult };
