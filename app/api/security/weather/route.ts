import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/security/weather - Get current weather
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");

    // Get latest weather log
    const latestWeather = await prisma.weatherLog.findFirst({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
      },
      orderBy: { timestamp: "desc" },
    });

    if (!latestWeather) {
      return NextResponse.json(
        { error: "No weather data available" },
        { status: 404 },
      );
    }

    return NextResponse.json(latestWeather);
  } catch (error: any) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/security/weather - Log weather (webhook from weather service)
export async function POST(req: NextRequest) {
  try {
    // TODO: Validate API key from weather service
    const json = await req.json();

    const weather = await prisma.weatherLog.create({
      data: {
        organizationId: json.organizationId,
        warehouseId: json.warehouseId,
        temperature: json.temperature,
        feelsLike: json.feelsLike,
        humidity: json.humidity,
        windSpeed: json.windSpeed,
        windDirection: json.windDirection,
        conditions: json.conditions,
        visibility: json.visibility,
        pressure: json.pressure,
        hasAlert: json.hasAlert || false,
        alertType: json.alertType,
        alertSeverity: json.alertSeverity,
        alertMessage: json.alertMessage,
        source: json.source || "OpenWeather",
      },
    });

    return NextResponse.json(weather);
  } catch (error: any) {
    console.error("Error logging weather:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
