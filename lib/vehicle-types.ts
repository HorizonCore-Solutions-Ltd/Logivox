/**
 * Vehicle Types Library for Load Optimization
 *
 * Simple library of vehicle dimensions and capacities used by LoadOptimizationService
 * to determine which vehicle size best fits a set of orders.
 *
 * NO fleet management, tracking, insurance, or compliance features.
 * JUST dimensions and capacity for load planning.
 */

export interface VehicleType {
  id: string;
  name: string;
  region: "UK" | "EU" | "US" | "ASIA" | "GLOBAL";
  category: "VAN" | "TRUCK" | "TRAILER" | "CONTAINER";

  // Dimensions (inches)
  dimensions: {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    usableLengthInches?: number; // Accounts for wheel wells, cab, etc.
    usableWidthInches?: number;
    usableHeightInches?: number;
  };

  // Capacity
  maxWeightLbs: number;
  volumeCubicFeet: number;
  palletCapacity: number;

  // Features that affect loading
  features?: {
    hasLiftGate?: boolean;
    hasSideLoading?: boolean;
    hasTemperatureControl?: boolean;
    tempRangeMin?: number; // Fahrenheit
    tempRangeMax?: number;
  };

  // Cost estimate for recommendations
  estimatedCostPerMile?: number;
}

// ============================================================================
// GLOBAL VEHICLE TYPE LIBRARY
// ============================================================================

export const VEHICLE_TYPES: Record<string, VehicleType> = {
  // ===== UK VEHICLES =====

  UK_ARTIC_53: {
    id: "UK_ARTIC_53",
    name: "53ft Articulated Lorry (UK)",
    region: "UK",
    category: "TRAILER",
    dimensions: {
      lengthInches: 636,
      widthInches: 102,
      heightInches: 110,
      usableLengthInches: 620,
      usableWidthInches: 98,
      usableHeightInches: 108,
    },
    maxWeightLbs: 44000,
    volumeCubicFeet: 3800,
    palletCapacity: 26,
    estimatedCostPerMile: 1.85,
  },

  "UK_RIGID_7.5T": {
    id: "UK_RIGID_7.5T",
    name: "7.5 Tonne Box Truck (UK)",
    region: "UK",
    category: "TRUCK",
    dimensions: {
      lengthInches: 240,
      widthInches: 96,
      heightInches: 96,
      usableLengthInches: 232,
      usableWidthInches: 92,
      usableHeightInches: 92,
    },
    maxWeightLbs: 16535,
    volumeCubicFeet: 1400,
    palletCapacity: 9,
    features: {
      hasLiftGate: true,
    },
    estimatedCostPerMile: 1.25,
  },

  UK_LUTON_VAN: {
    id: "UK_LUTON_VAN",
    name: "Luton Van 3.5T (UK)",
    region: "UK",
    category: "VAN",
    dimensions: {
      lengthInches: 168,
      widthInches: 84,
      heightInches: 84,
      usableLengthInches: 160,
      usableWidthInches: 80,
      usableHeightInches: 80,
    },
    maxWeightLbs: 7716,
    volumeCubicFeet: 1100,
    palletCapacity: 6,
    features: {
      hasLiftGate: true,
    },
    estimatedCostPerMile: 0.95,
  },

  UK_TRANSIT_LWB: {
    id: "UK_TRANSIT_LWB",
    name: "Ford Transit LWB (UK)",
    region: "UK",
    category: "VAN",
    dimensions: {
      lengthInches: 157,
      widthInches: 70,
      heightInches: 72,
      usableLengthInches: 150,
      usableWidthInches: 66,
      usableHeightInches: 68,
    },
    maxWeightLbs: 6173,
    volumeCubicFeet: 487,
    palletCapacity: 4,
    estimatedCostPerMile: 0.89,
  },

  UK_SPRINTER_LWB: {
    id: "UK_SPRINTER_LWB",
    name: "Mercedes Sprinter LWB (UK)",
    region: "UK",
    category: "VAN",
    dimensions: {
      lengthInches: 170,
      widthInches: 70,
      heightInches: 72,
      usableLengthInches: 162,
      usableWidthInches: 66,
      usableHeightInches: 68,
    },
    maxWeightLbs: 6614,
    volumeCubicFeet: 533,
    palletCapacity: 4,
    estimatedCostPerMile: 0.92,
  },

  // ===== US VEHICLES =====

  US_53FT_TRAILER: {
    id: "US_53FT_TRAILER",
    name: "53ft Dry Van Trailer (US)",
    region: "US",
    category: "TRAILER",
    dimensions: {
      lengthInches: 636,
      widthInches: 102,
      heightInches: 110,
      usableLengthInches: 624,
      usableWidthInches: 98,
      usableHeightInches: 108,
    },
    maxWeightLbs: 45000,
    volumeCubicFeet: 3900,
    palletCapacity: 26,
    estimatedCostPerMile: 1.75,
  },

  US_26FT_BOX: {
    id: "US_26FT_BOX",
    name: "26ft Box Truck (US)",
    region: "US",
    category: "TRUCK",
    dimensions: {
      lengthInches: 312,
      widthInches: 102,
      heightInches: 102,
      usableLengthInches: 300,
      usableWidthInches: 98,
      usableHeightInches: 98,
    },
    maxWeightLbs: 26000,
    volumeCubicFeet: 1700,
    palletCapacity: 12,
    features: {
      hasLiftGate: true,
    },
    estimatedCostPerMile: 1.5,
  },

  US_16FT_BOX: {
    id: "US_16FT_BOX",
    name: "16ft Box Truck (US)",
    region: "US",
    category: "TRUCK",
    dimensions: {
      lengthInches: 192,
      widthInches: 96,
      heightInches: 90,
      usableLengthInches: 184,
      usableWidthInches: 92,
      usableHeightInches: 86,
    },
    maxWeightLbs: 12500,
    volumeCubicFeet: 800,
    palletCapacity: 6,
    estimatedCostPerMile: 1.1,
  },

  US_CARGO_VAN: {
    id: "US_CARGO_VAN",
    name: "Cargo Van (US)",
    region: "US",
    category: "VAN",
    dimensions: {
      lengthInches: 144,
      widthInches: 56,
      heightInches: 54,
      usableLengthInches: 138,
      usableWidthInches: 52,
      usableHeightInches: 50,
    },
    maxWeightLbs: 4500,
    volumeCubicFeet: 350,
    palletCapacity: 2,
    estimatedCostPerMile: 0.75,
  },

  // ===== EU VEHICLES =====

  "EU_13.6M_TRAILER": {
    id: "EU_13.6M_TRAILER",
    name: "13.6m Mega Trailer (EU)",
    region: "EU",
    category: "TRAILER",
    dimensions: {
      lengthInches: 535, // 13.6 meters
      widthInches: 96,
      heightInches: 118, // Mega trailer height
      usableLengthInches: 525,
      usableWidthInches: 93,
      usableHeightInches: 115,
    },
    maxWeightLbs: 55116, // 25 tonnes
    volumeCubicFeet: 3400,
    palletCapacity: 33,
    estimatedCostPerMile: 1.8,
  },

  "EU_7.5T_TRUCK": {
    id: "EU_7.5T_TRUCK",
    name: "7.5 Tonne Truck (EU)",
    region: "EU",
    category: "TRUCK",
    dimensions: {
      lengthInches: 240,
      widthInches: 96,
      heightInches: 96,
      usableLengthInches: 230,
      usableWidthInches: 92,
      usableHeightInches: 92,
    },
    maxWeightLbs: 16535,
    volumeCubicFeet: 1400,
    palletCapacity: 9,
    estimatedCostPerMile: 1.2,
  },

  "EU_3.5T_VAN": {
    id: "EU_3.5T_VAN",
    name: "3.5 Tonne Panel Van (EU)",
    region: "EU",
    category: "VAN",
    dimensions: {
      lengthInches: 165,
      widthInches: 70,
      heightInches: 72,
      usableLengthInches: 158,
      usableWidthInches: 66,
      usableHeightInches: 68,
    },
    maxWeightLbs: 7716,
    volumeCubicFeet: 520,
    palletCapacity: 4,
    estimatedCostPerMile: 0.85,
  },

  // ===== ASIA VEHICLES =====

  ASIA_20FT_CONTAINER: {
    id: "ASIA_20FT_CONTAINER",
    name: "20ft Container (Asia)",
    region: "ASIA",
    category: "CONTAINER",
    dimensions: {
      lengthInches: 234, // 19'10" internal
      widthInches: 92,
      heightInches: 94,
      usableLengthInches: 230,
      usableWidthInches: 90,
      usableHeightInches: 92,
    },
    maxWeightLbs: 55126, // 25 tonnes max
    volumeCubicFeet: 1165,
    palletCapacity: 10,
    estimatedCostPerMile: 1.4,
  },

  ASIA_40FT_CONTAINER: {
    id: "ASIA_40FT_CONTAINER",
    name: "40ft Container (Asia)",
    region: "ASIA",
    category: "CONTAINER",
    dimensions: {
      lengthInches: 472, // 39'5" internal
      widthInches: 92,
      heightInches: 94,
      usableLengthInches: 468,
      usableWidthInches: 90,
      usableHeightInches: 92,
    },
    maxWeightLbs: 67200, // 30 tonnes max
    volumeCubicFeet: 2350,
    palletCapacity: 20,
    estimatedCostPerMile: 1.6,
  },

  ASIA_LIGHT_TRUCK: {
    id: "ASIA_LIGHT_TRUCK",
    name: "Light Truck 3T (Asia)",
    region: "ASIA",
    category: "TRUCK",
    dimensions: {
      lengthInches: 180,
      widthInches: 72,
      heightInches: 72,
      usableLengthInches: 172,
      usableWidthInches: 68,
      usableHeightInches: 68,
    },
    maxWeightLbs: 6614,
    volumeCubicFeet: 480,
    palletCapacity: 4,
    estimatedCostPerMile: 0.7,
  },

  // ===== REFRIGERATED VEHICLES =====

  REEFER_TRAILER_53: {
    id: "REEFER_TRAILER_53",
    name: "53ft Refrigerated Trailer",
    region: "GLOBAL",
    category: "TRAILER",
    dimensions: {
      lengthInches: 620,
      widthInches: 98,
      heightInches: 104, // Slightly less due to insulation
      usableLengthInches: 610,
      usableWidthInches: 94,
      usableHeightInches: 100,
    },
    maxWeightLbs: 43000,
    volumeCubicFeet: 3500,
    palletCapacity: 24,
    features: {
      hasTemperatureControl: true,
      tempRangeMin: -25,
      tempRangeMax: 70,
    },
    estimatedCostPerMile: 2.25,
  },

  REEFER_VAN: {
    id: "REEFER_VAN",
    name: "Refrigerated Van",
    region: "GLOBAL",
    category: "VAN",
    dimensions: {
      lengthInches: 150,
      widthInches: 64,
      heightInches: 66,
      usableLengthInches: 144,
      usableWidthInches: 60,
      usableHeightInches: 62,
    },
    maxWeightLbs: 6000,
    volumeCubicFeet: 400,
    palletCapacity: 3,
    features: {
      hasTemperatureControl: true,
      tempRangeMin: -10,
      tempRangeMax: 50,
    },
    estimatedCostPerMile: 1.15,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all vehicle types for a specific region
 */
export function getVehicleTypesByRegion(
  region: VehicleType["region"],
): VehicleType[] {
  return Object.values(VEHICLE_TYPES).filter(
    (v) => v.region === region || v.region === "GLOBAL",
  );
}

/**
 * Get all vehicle types by category
 */
export function getVehicleTypesByCategory(
  category: VehicleType["category"],
): VehicleType[] {
  return Object.values(VEHICLE_TYPES).filter((v) => v.category === category);
}

/**
 * Get vehicle type by ID
 */
export function getVehicleType(id: string): VehicleType | undefined {
  return VEHICLE_TYPES[id];
}

/**
 * Find vehicle types that can fit given dimensions and weight
 */
export function findSuitableVehicles(params: {
  totalVolumeCubicFeet: number;
  totalWeightLbs: number;
  palletCount?: number;
  requiresTemperatureControl?: boolean;
  region?: VehicleType["region"];
}): VehicleType[] {
  let vehicles = Object.values(VEHICLE_TYPES);

  // Filter by region if specified
  if (params.region) {
    vehicles = vehicles.filter(
      (v) => v.region === params.region || v.region === "GLOBAL",
    );
  }

  // Filter by temperature control if required
  if (params.requiresTemperatureControl) {
    vehicles = vehicles.filter((v) => v.features?.hasTemperatureControl);
  }

  // Filter by capacity
  vehicles = vehicles.filter(
    (v) =>
      v.volumeCubicFeet >= params.totalVolumeCubicFeet &&
      v.maxWeightLbs >= params.totalWeightLbs &&
      (!params.palletCount || v.palletCapacity >= params.palletCount),
  );

  // Sort by volume (smallest suitable vehicle first for cost efficiency)
  return vehicles.sort((a, b) => a.volumeCubicFeet - b.volumeCubicFeet);
}

/**
 * Recommend best vehicle for given load
 * Returns vehicle that optimizes cost while meeting requirements
 */
export function recommendVehicle(params: {
  totalVolumeCubicFeet: number;
  totalWeightLbs: number;
  palletCount?: number;
  requiresTemperatureControl?: boolean;
  region?: VehicleType["region"];
  prioritize?: "cost" | "utilization" | "capacity";
}): VehicleType | null {
  const suitable = findSuitableVehicles(params);

  if (suitable.length === 0) return null;

  if (params.prioritize === "cost") {
    // Cheapest suitable vehicle
    return suitable.sort(
      (a, b) =>
        (a.estimatedCostPerMile || 999) - (b.estimatedCostPerMile || 999),
    )[0];
  }

  if (params.prioritize === "utilization") {
    // Best utilization (closest fit)
    return suitable.sort((a, b) => {
      const aUtil = params.totalVolumeCubicFeet / a.volumeCubicFeet;
      const bUtil = params.totalVolumeCubicFeet / b.volumeCubicFeet;
      return Math.abs(bUtil - 0.85) - Math.abs(aUtil - 0.85); // Target 85% utilization
    })[0];
  }

  // Default: smallest suitable vehicle (cost efficiency)
  return suitable[0];
}

/**
 * Add custom vehicle type (for warehouses with non-standard vehicles)
 */
export function addCustomVehicleType(vehicleType: VehicleType): void {
  VEHICLE_TYPES[vehicleType.id] = vehicleType;
}

/**
 * Get all vehicle types
 */
export function getAllVehicleTypes(): VehicleType[] {
  return Object.values(VEHICLE_TYPES);
}
