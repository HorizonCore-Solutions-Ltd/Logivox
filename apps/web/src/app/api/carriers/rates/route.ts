import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  carrierService,
  Address,
  Package,
} from "@/lib/services/carrier-integrations";

/**
 * GET /api/carriers/rates
 *
 * Get shipping rates from all carriers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { origin, destination, packages } = body;

    // Validate required fields
    if (!origin || !destination || !packages || packages.length === 0) {
      return NextResponse.json(
        { error: "Origin, destination, and packages are required" },
        { status: 400 },
      );
    }

    // Validate address fields
    const requiredAddressFields = [
      "street1",
      "city",
      "state",
      "postalCode",
      "country",
    ];
    for (const field of requiredAddressFields) {
      if (!origin[field]) {
        return NextResponse.json(
          { error: `Origin ${field} is required` },
          { status: 400 },
        );
      }
      if (!destination[field]) {
        return NextResponse.json(
          { error: `Destination ${field} is required` },
          { status: 400 },
        );
      }
    }

    // Validate package fields
    const requiredPackageFields = ["weight", "length", "width", "height"];
    for (const pkg of packages) {
      for (const field of requiredPackageFields) {
        if (!pkg[field] || pkg[field] <= 0) {
          return NextResponse.json(
            { error: `Package ${field} must be greater than 0` },
            { status: 400 },
          );
        }
      }
    }

    // Get rates from all carriers
    const rates = await carrierService.getAllRates(
      origin as Address,
      destination as Address,
      packages as Package[],
    );

    return NextResponse.json({
      origin,
      destination,
      packages,
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error getting carrier rates:", error);
    return NextResponse.json(
      {
        error: "Failed to get shipping rates",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
