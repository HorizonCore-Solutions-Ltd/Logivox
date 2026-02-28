/**
 * Vehicle Types Library
 *
 * Database of vehicle types with capacity specifications for load optimization.
 * Used by LoadOptimizationService and vehicle-types API.
 */

export interface VehicleType {
  id: string;
  name: string;
  category: "van" | "truck" | "semi" | "container";
  region: "NA" | "EU" | "APAC" | "global";
  volumeCubicFeet: number;
  maxWeightLbs: number;
  maxPallets: number;
  dimensions: {
    lengthFeet: number;
    widthFeet: number;
    heightFeet: number;
  };
  temperatureControlled?: boolean;
  liftGateAvailable?: boolean;
  costPerMile?: number;
  notes?: string;
}

export interface VehicleRecommendationParams {
  totalVolumeCubicFeet: number;
  totalWeightLbs: number;
  palletCount?: number;
  requiresTemperatureControl?: boolean;
  region?: VehicleType["region"];
  prioritize?: "cost" | "space" | "utilization";
}

// ============================================================================
// Standard Vehicle Types Database
// ============================================================================

const STANDARD_VEHICLES: VehicleType[] = [
  // North America - Vans
  {
    id: "sprinter-van",
    name: "Mercedes Sprinter Van",
    category: "van",
    region: "NA",
    volumeCubicFeet: 319,
    maxWeightLbs: 3500,
    maxPallets: 3,
    dimensions: { lengthFeet: 11.3, widthFeet: 5.9, heightFeet: 5.6 },
    temperatureControlled: false,
    liftGateAvailable: true,
    costPerMile: 1.5,
  },
  {
    id: "cargo-van",
    name: "Cargo Van (Standard)",
    category: "van",
    region: "NA",
    volumeCubicFeet: 250,
    maxWeightLbs: 3000,
    maxPallets: 2,
    dimensions: { lengthFeet: 10, widthFeet: 5, heightFeet: 5 },
    liftGateAvailable: true,
    costPerMile: 1.2,
  },

  // North America - Box Trucks
  {
    id: "box-truck-16",
    name: '16\' Box Truck',
    category: "truck",
    region: "NA",
    volumeCubicFeet: 800,
    maxWeightLbs: 10000,
    maxPallets: 8,
    dimensions: { lengthFeet: 16, widthFeet: 7.5, heightFeet: 7 },
    liftGateAvailable: true,
    costPerMile: 2.0,
  },
  {
    id: "box-truck-24",
    name: '24\' Box Truck',
    category: "truck",
    region: "NA",
    volumeCubicFeet: 1400,
    maxWeightLbs: 20000,
    maxPallets: 14,
    dimensions: { lengthFeet: 24, widthFeet: 8, heightFeet: 8 },
    liftGateAvailable: true,
    costPerMile: 2.8,
  },
  {
    id: "box-truck-26",
    name: '26\' Box Truck',
    category: "truck",
    region: "NA",
    volumeCubicFeet: 1700,
    maxWeightLbs: 26000,
    maxPallets: 16,
    dimensions: { lengthFeet: 26, widthFeet: 8.2, heightFeet: 8.2 },
    temperatureControlled: true,
    liftGateAvailable: true,
    costPerMile: 3.2,
  },

  // North America - Semi Trailers
  {
    id: "semi-dry-van-53",
    name: '53\' Dry Van Semi',
    category: "semi",
    region: "NA",
    volumeCubicFeet: 3800,
    maxWeightLbs: 45000,
    maxPallets: 26,
    dimensions: { lengthFeet: 53, widthFeet: 8.5, heightFeet: 9 },
    costPerMile: 2.5,
  },
  {
    id: "semi-reefer-53",
    name: '53\' Refrigerated Semi',
    category: "semi",
    region: "NA",
    volumeCubicFeet: 3700,
    maxWeightLbs: 43000,
    maxPallets: 26,
    dimensions: { lengthFeet: 53, widthFeet: 8.5, heightFeet: 9 },
    temperatureControlled: true,
    costPerMile: 3.0,
  },
  {
    id: "semi-flatbed-48",
    name: '48\' Flatbed Semi',
    category: "semi",
    region: "NA",
    volumeCubicFeet: 4000,
    maxWeightLbs: 48000,
    maxPallets: 24,
    dimensions: { lengthFeet: 48, widthFeet: 8.5, heightFeet: 10 },
    costPerMile: 2.4,
  },

  // Europe
  {
    id: "eu-sprinter",
    name: "Sprinter Van (EU)",
    category: "van",
    region: "EU",
    volumeCubicFeet: 350,
    maxWeightLbs: 4000,
    maxPallets: 4,
    dimensions: { lengthFeet: 12, widthFeet: 6, heightFeet: 6 },
    costPerMile: 1.8,
  },
  {
    id: "eu-rigid-truck",
    name: "7.5T Rigid Truck",
    category: "truck",
    region: "EU",
    volumeCubicFeet: 1200,
    maxWeightLbs: 16500,
    maxPallets: 12,
    dimensions: { lengthFeet: 20, widthFeet: 8, heightFeet: 8 },
    costPerMile: 2.5,
  },
  {
    id: "eu-articulated-trailer",
    name: "Articulated Trailer (EU)",
    category: "semi",
    region: "EU",
    volumeCubicFeet: 3300,
    maxWeightLbs: 44000,
    maxPallets: 33,
    dimensions: { lengthFeet: 45, widthFeet: 8.2, heightFeet: 9 },
    costPerMile: 2.8,
  },

  // APAC
  {
    id: "apac-light-truck",
    name: "Light Truck (APAC)",
    category: "truck",
    region: "APAC",
    volumeCubicFeet: 600,
    maxWeightLbs: 8000,
    maxPallets: 6,
    dimensions: { lengthFeet: 15, widthFeet: 6.5, heightFeet: 6.5 },
    costPerMile: 1.5,
  },
  {
    id: "apac-container-20",
    name: "20' Container",
    category: "container",
    region: "APAC",
    volumeCubicFeet: 1170,
    maxWeightLbs: 47900,
    maxPallets: 11,
    dimensions: { lengthFeet: 20, widthFeet: 8, heightFeet: 8.5 },
    costPerMile: 2.0,
  },
  {
    id: "apac-container-40",
    name: "40' Container",
    category: "container",
    region: "APAC",
    volumeCubicFeet: 2385,
    maxWeightLbs: 59040,
    maxPallets: 21,
    dimensions: { lengthFeet: 40, widthFeet: 8, heightFeet: 8.5 },
    costPerMile: 2.5,
  },
];

// Custom vehicle types added at runtime
const customVehicles: VehicleType[] = [];

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Get all available vehicle types (standard + custom)
 */
export function getAllVehicleTypes(): VehicleType[] {
  return [...STANDARD_VEHICLES, ...customVehicles];
}

/**
 * Get vehicle types filtered by region
 */
export function getVehicleTypesByRegion(
  region: VehicleType["region"],
): VehicleType[] {
  return getAllVehicleTypes().filter(
    (v) => v.region === region || v.region === "global",
  );
}

/**
 * Find vehicles that meet the load requirements
 */
export function findSuitableVehicles(
  params: VehicleRecommendationParams,
): VehicleType[] {
  const {
    totalVolumeCubicFeet,
    totalWeightLbs,
    palletCount = 0,
    requiresTemperatureControl = false,
    region,
  } = params;

  let vehicles = getAllVehicleTypes();

  // Filter by region if specified
  if (region) {
    vehicles = vehicles.filter((v) => v.region === region || v.region === "global");
  }

  // Filter by capacity requirements
  return vehicles.filter((vehicle) => {
    // Must have enough volume
    if (vehicle.volumeCubicFeet < totalVolumeCubicFeet) return false;

    // Must support the weight
    if (vehicle.maxWeightLbs < totalWeightLbs) return false;

    // Must have enough pallet spaces
    if (palletCount > 0 && vehicle.maxPallets < palletCount) return false;

    // Must have temperature control if required
    if (requiresTemperatureControl && !vehicle.temperatureControlled)
      return false;

    return true;
  });
}

/**
 * Recommend the best vehicle for the given load
 */
export function recommendVehicle(
  params: VehicleRecommendationParams,
): VehicleType | null {
  const { prioritize = "utilization" } = params;
  const suitable = findSuitableVehicles(params);

  if (suitable.length === 0) return null;

  // Sort based on priority
  const sorted = suitable.sort((a, b) => {
    if (prioritize === "cost") {
      return (a.costPerMile || 999) - (b.costPerMile || 999);
    }

    if (prioritize === "space") {
      return b.volumeCubicFeet - a.volumeCubicFeet;
    }

    // Default: utilization (find vehicle closest to load size for best efficiency)
    const aUtilization =
      params.totalVolumeCubicFeet / a.volumeCubicFeet;
    const bUtilization =
      params.totalVolumeCubicFeet / b.volumeCubicFeet;

    // Prefer 75-95% utilization (optimal range)
    const aScore = Math.abs(0.85 - aUtilization);
    const bScore = Math.abs(0.85 - bUtilization);

    return aScore - bScore;
  });

  return sorted[0];
}

/**
 * Add a custom vehicle type
 */
export function addCustomVehicleType(vehicle: VehicleType): void {
  // Check if already exists
  const existingIndex = customVehicles.findIndex((v) => v.id === vehicle.id);

  if (existingIndex >= 0) {
    // Update existing
    customVehicles[existingIndex] = vehicle;
  } else {
    // Add new
    customVehicles.push(vehicle);
  }
}

/**
 * Get a specific vehicle type by ID
 */
export function getVehicleTypeById(id: string): VehicleType | undefined {
  return getAllVehicleTypes().find((v) => v.id === id);
}

/**
 * Calculate utilization percentage for a vehicle and load
 */
export function calculateUtilization(
  vehicle: VehicleType,
  loadVolume: number,
  loadWeight: number,
): { volumePercent: number; weightPercent: number; isOptimal: boolean } {
  const volumePercent = (loadVolume / vehicle.volumeCubicFeet) * 100;
  const weightPercent = (loadWeight / vehicle.maxWeightLbs) * 100;
  const isOptimal = volumePercent >= 75 && volumePercent <= 95;

  return {
    volumePercent: Math.round(volumePercent * 10) / 10,
    weightPercent: Math.round(weightPercent * 10) / 10,
    isOptimal,
  };
}
