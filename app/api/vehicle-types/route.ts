/**
 * Vehicle Recommendation API
 *
 * Simple API for getting vehicle type recommendations based on order dimensions.
 * Used by LoadOptimizationService to determine appropriate vehicle size.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllVehicleTypes,
  getVehicleTypesByRegion,
  recommendVehicle,
  findSuitableVehicles,
  addCustomVehicleType,
  type VehicleType,
} from "@/lib/vehicle-types";

// ============================================================================
// GET /api/vehicle-types
// Get all available vehicle types
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") as VehicleType["region"] | null;

    const vehicleTypes = region
      ? getVehicleTypesByRegion(region)
      : getAllVehicleTypes();

    return NextResponse.json({
      success: true,
      vehicleTypes,
      total: vehicleTypes.length,
    });
  } catch (error) {
    console.error("Get vehicle types error:", error);
    return NextResponse.json(
      { error: "Failed to get vehicle types" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/vehicle-types/recommend
// Get vehicle recommendation for given load
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      totalVolumeCubicFeet,
      totalWeightLbs,
      palletCount,
      requiresTemperatureControl,
      region,
      prioritize = "utilization",
    } = body;

    // Get recommendation
    const recommended = recommendVehicle({
      totalVolumeCubicFeet,
      totalWeightLbs,
      palletCount,
      requiresTemperatureControl,
      region,
      prioritize,
    });

    // Get all suitable vehicles
    const suitable = findSuitableVehicles({
      totalVolumeCubicFeet,
      totalWeightLbs,
      palletCount,
      requiresTemperatureControl,
      region,
    });

    if (!recommended) {
      return NextResponse.json({
        success: false,
        message: "No suitable vehicle found for this load",
        suitable: [],
      });
    }

    // Calculate utilization
    const utilizationPercent =
      (totalVolumeCubicFeet / recommended.volumeCubicFeet) * 100;
    const weightUtilizationPercent =
      (totalWeightLbs / recommended.maxWeightLbs) * 100;

    return NextResponse.json({
      success: true,
      recommended: {
        ...recommended,
        utilization: {
          volumePercent: Math.round(utilizationPercent * 10) / 10,
          weightPercent: Math.round(weightUtilizationPercent * 10) / 10,
          isOptimal: utilizationPercent >= 75 && utilizationPercent <= 95,
        },
      },
      alternatives: suitable.slice(0, 3), // Top 3 alternatives
      totalSuitable: suitable.length,
    });
  } catch (error) {
    console.error("Recommend vehicle error:", error);
    return NextResponse.json(
      { error: "Failed to recommend vehicle" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/vehicle-types/custom
// Add custom vehicle type
// ============================================================================

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicleType: VehicleType = body;

    // Validate required fields
    if (!vehicleType.id || !vehicleType.name || !vehicleType.dimensions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Add custom vehicle type
    addCustomVehicleType(vehicleType);

    return NextResponse.json({
      success: true,
      message: "Custom vehicle type added",
      vehicleType,
    });
  } catch (error) {
    console.error("Add custom vehicle error:", error);
    return NextResponse.json(
      { error: "Failed to add custom vehicle type" },
      { status: 500 },
    );
  }
}
