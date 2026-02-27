/**
 * Sustainability & Carbon Tracking API
 * Environmental impact monitoring and ESG reporting
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

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

// GET - Fetch sustainability metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await resolveOrganizationId(session.user.email);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const warehouseId = searchParams.get("warehouseId") || organizationId;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (action === "carbon-footprint") {
      // Calculate carbon footprint
      const footprint = await calculateCarbonFootprint(
        warehouseId,
        startDate,
        endDate,
      );
      return NextResponse.json({ footprint });
    } else if (action === "energy-consumption") {
      // Get energy consumption data
      const energy = await getEnergyConsumption(
        warehouseId,
        startDate,
        endDate,
      );
      return NextResponse.json({ energy });
    } else if (action === "waste-metrics") {
      // Get waste and recycling metrics
      const waste = await getWasteMetrics(warehouseId, startDate, endDate);
      return NextResponse.json({ waste });
    } else if (action === "esg-report") {
      // Generate ESG report
      const report = await generateESGReport(warehouseId, startDate, endDate);
      return NextResponse.json({ report });
    } else if (action === "sustainability-score") {
      // Calculate sustainability score
      const score = await calculateSustainabilityScore(warehouseId);
      return NextResponse.json({ score });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Sustainability GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sustainability data" },
      { status: 500 },
    );
  }
}

// POST - Log sustainability events or set targets
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await resolveOrganizationId(session.user.email);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const body = await req.json();
    const { action, warehouseId, params } = body;

    if (action === "log-shipment-carbon") {
      // Log carbon emissions for shipment
      const { shipmentId, distance, mode, weight } = body;
      const result = await logShipmentCarbon(
        shipmentId,
        distance,
        mode,
        weight,
      );
      return NextResponse.json({ success: true, result });
    } else if (action === "set-targets") {
      // Set sustainability targets
      const { targets } = body;
      const result = await setSustainabilityTargets(
        warehouseId || organizationId,
        targets,
      );
      return NextResponse.json({ success: true, result });
    } else if (action === "log-waste") {
      // Log waste event
      const { type, amount, recycled } = body;
      const result = await logWasteEvent(
        warehouseId || organizationId,
        type,
        amount,
        recycled,
      );
      return NextResponse.json({ success: true, result });
    } else if (action === "generate-report") {
      // Generate sustainability report
      const report = await generateSustainabilityReport(
        warehouseId || organizationId,
        params,
      );
      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Sustainability POST error:", error);
    return NextResponse.json(
      { error: "Failed to process sustainability request" },
      { status: 500 },
    );
  }
}

/**
 * Calculate Carbon Footprint
 */
async function calculateCarbonFootprint(
  warehouseId: string,
  startDate?: string | null,
  endDate?: string | null,
  includeTrend: boolean = true,
) {
  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Calculate from shipments
    const shipments = await prisma.shipment.findMany({
      where: {
        warehouseId,
        createdAt: { gte: start, lte: end },
      },
    });

    let totalCarbonKg = 0;

    // Carbon emission factors (kg CO2 per ton-km)
    const emissionFactors: Record<string, number> = {
      TRUCK: 0.062, // Small truck
      FREIGHT: 0.022, // Large freight
      AIR: 0.602, // Air cargo
      SEA: 0.008, // Sea freight
      RAIL: 0.014, // Rail
    };

    shipments.forEach((shipment) => {
      const distance = shipment.distance || 50; // km
      const weight = shipment.weight || 100; // kg
      const mode = shipment.carrierMode || "TRUCK";
      const factor = emissionFactors[mode] || 0.062;

      // Carbon = (weight in tons) * distance * emission factor
      const carbon = (weight / 1000) * distance * factor;
      totalCarbonKg += carbon;
    });

    // Add warehouse energy consumption emissions
    const energyCarbon = await calculateEnergyEmissions(
      warehouseId,
      start,
      end,
    );
    totalCarbonKg += energyCarbon;

    // Calculate trends
    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 1);
    let trend = 0;
    if (includeTrend) {
      const previousFootprint = await calculateCarbonFootprint(
        warehouseId,
        previousStart.toISOString(),
        start.toISOString(),
        false,
      );

      trend =
        previousFootprint.totalCarbonKg > 0
          ? ((totalCarbonKg - previousFootprint.totalCarbonKg) /
              previousFootprint.totalCarbonKg) *
            100
          : 0;
    }

    return {
      totalCarbonKg: Math.round(totalCarbonKg * 100) / 100,
      totalCarbonTons: Math.round((totalCarbonKg / 1000) * 100) / 100,
      shipmentsCount: shipments.length,
      avgPerShipment:
        Math.round((totalCarbonKg / shipments.length) * 100) / 100,
      trend: Math.round(trend * 10) / 10,
      breakdown: {
        transportation: Math.round((totalCarbonKg - energyCarbon) * 100) / 100,
        energy: Math.round(energyCarbon * 100) / 100,
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  } catch (error) {
    console.error("Carbon footprint calculation error:", error);
    return {
      totalCarbonKg: 0,
      totalCarbonTons: 0,
      shipmentsCount: 0,
      avgPerShipment: 0,
      trend: 0,
    };
  }
}

/**
 * Calculate Energy Emissions
 */
async function calculateEnergyEmissions(
  warehouseId: string,
  start: Date,
  end: Date,
): Promise<number> {
  try {
    const energy = await getEnergyConsumption(
      warehouseId,
      start.toISOString(),
      end.toISOString(),
    );
    const totalKwh = energy.totalKwh || 0;

    const configuredIntensity = Number(
      process.env.ENERGY_CARBON_INTENSITY_KG_PER_KWH || 0,
    );
    const carbonIntensity = configuredIntensity > 0 ? configuredIntensity : 0.5;
    const carbonKg = totalKwh * 0.5;

    return totalKwh * carbonIntensity;
  } catch (error) {
    console.error("Energy emissions error:", error);
    return 0;
  }
}

/**
 * Get Energy Consumption
 */
async function getEnergyConsumption(
  warehouseId: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const logs = await prisma.activityLog.findMany({
      where: {
        organizationId: warehouseId,
        action: "SUSTAINABILITY_ENERGY_LOG",
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: "asc" },
      take: 5000,
    });

    const byDate = new Map<
      string,
      { consumption: number; renewable: number }
    >();
    logs.forEach((log) => {
      const metadata = (log.metadata ?? {}) as any;
      const date = new Date(log.createdAt).toISOString().split("T")[0];
      const current = byDate.get(date) || { consumption: 0, renewable: 0 };
      current.consumption += Number(metadata.kwh || 0);
      current.renewable += Number(metadata.renewableKwh || 0);
      byDate.set(date, current);
    });

    const rate = Number(process.env.ENERGY_COST_PER_KWH || 0.12);
    const dailyData = Array.from(byDate.entries()).map(([date, data]) => ({
      date,
      consumption: Math.round(data.consumption * 10) / 10,
      cost: Math.round(data.consumption * rate * 100) / 100,
      renewable: Math.round(data.renewable * 10) / 10,
    }));

    const totalConsumption = dailyData.reduce(
      (sum, d) => sum + d.consumption,
      0,
    );
    const totalCost = dailyData.reduce((sum, d) => sum + d.cost, 0);
    const totalRenewable = dailyData.reduce((sum, d) => sum + d.renewable, 0);

    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      totalKwh: Math.round(totalConsumption * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100,
      renewablePercent:
        totalConsumption > 0
          ? Math.round((totalRenewable / totalConsumption) * 100)
          : 0,
      avgDailyKwh: Math.round((totalConsumption / days) * 10) / 10,
      dailyData,
      breakdown: {
        lighting: Math.round(totalConsumption * 0.3 * 10) / 10,
        hvac: Math.round(totalConsumption * 0.4 * 10) / 10,
        equipment: Math.round(totalConsumption * 0.2 * 10) / 10,
        other: Math.round(totalConsumption * 0.1 * 10) / 10,
      },
    };
  } catch (error) {
    console.error("Energy consumption error:", error);
    return {
      totalKwh: 0,
      totalCost: 0,
      renewablePercent: 0,
      dailyData: [],
    };
  }
}

/**
 * Get Waste Metrics
 */
async function getWasteMetrics(
  warehouseId: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const logs = await prisma.activityLog.findMany({
      where: {
        organizationId: warehouseId,
        action: "SUSTAINABILITY_WASTE_LOG",
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const breakdown: Record<string, number> = {
      cardboard: 0,
      plastic: 0,
      metal: 0,
      wood: 0,
      general: 0,
    };

    let recycled = 0;
    let landfill = 0;
    logs.forEach((log) => {
      const metadata = (log.metadata ?? {}) as any;
      const type = String(metadata.type || "general").toLowerCase();
      const amount = Number(metadata.amount || 0);
      const normalizedType = type in breakdown ? type : "general";
      breakdown[normalizedType] += amount;
      if (metadata.recycled) recycled += amount;
      else landfill += amount;
    });

    const totalWaste = recycled + landfill;
    const recyclingRate =
      totalWaste > 0 ? Number(((recycled / totalWaste) * 100).toFixed(1)) : 0;
    const costSavings = Math.round(recycled * 1.5 * 100) / 100;
    const carbonAvoided = Math.round(recycled * 0.7 * 100) / 100;

    return {
      totalWaste,
      recycled,
      landfill,
      recyclingRate,
      breakdown,
      costSavings,
      carbonAvoided,
    };
  } catch (error) {
    console.error("Waste metrics error:", error);
    return {
      totalWaste: 0,
      recycled: 0,
      landfill: 0,
      recyclingRate: 0,
    };
  }
}

/**
 * Generate ESG Report
 */
async function generateESGReport(
  warehouseId: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  try {
    const footprint = await calculateCarbonFootprint(
      warehouseId,
      startDate,
      endDate,
    );
    const energy = await getEnergyConsumption(warehouseId, startDate, endDate);
    const waste = await getWasteMetrics(warehouseId, startDate, endDate);

    const [employeeCount, safetyIncidents, complianceEvents] =
      await Promise.all([
        prisma.organizationMember.count({
          where: {
            organizationId: warehouseId,
            isActive: true,
          },
        }),
        prisma.activityLog.count({
          where: {
            organizationId: warehouseId,
            action: "SAFETY_INCIDENT",
            ...(startDate || endDate
              ? {
                  createdAt: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                  },
                }
              : {}),
          },
        }),
        prisma.auditLog.count({
          where: {
            organizationId: warehouseId,
            ...(startDate || endDate
              ? {
                  timestamp: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                  },
                }
              : {}),
          },
        }),
      ]);

    return {
      environmental: {
        carbonFootprint: footprint,
        energyConsumption: energy,
        wasteManagement: waste,
        waterUsage: {
          total: 0,
          perEmployee: employeeCount > 0 ? 0 : 0,
        },
      },
      social: {
        employees: employeeCount,
        safetyIncidents,
        trainingHours: 0,
        diversityScore: null,
      },
      governance: {
        complianceRate: complianceEvents > 0 ? 100 : 0,
        auditsPassed: complianceEvents,
        certifications: [],
      },
      summary: {
        overallScore: null,
        grade: null,
        improvements: [],
      },
    };
  } catch (error) {
    console.error("ESG report error:", error);
    return { error: String(error) };
  }
}

/**
 * Calculate Sustainability Score
 */
async function calculateSustainabilityScore(warehouseId: string) {
  try {
    const footprint = await calculateCarbonFootprint(warehouseId, null, null);
    const energy = await getEnergyConsumption(warehouseId, null, null);
    const waste = await getWasteMetrics(warehouseId, null, null);

    // Calculate score (0-100)
    let score = 50; // Base score

    // Carbon efficiency (+/- 20 points)
    if (footprint.avgPerShipment < 5) score += 20;
    else if (footprint.avgPerShipment < 10) score += 10;

    // Renewable energy (+/- 15 points)
    if (energy.renewablePercent > 50) score += 15;
    else if (energy.renewablePercent > 20) score += 10;
    else if (energy.renewablePercent > 10) score += 5;

    // Recycling rate (+/- 15 points)
    if (waste.recyclingRate > 80) score += 15;
    else if (waste.recyclingRate > 60) score += 10;
    else if (waste.recyclingRate > 40) score += 5;

    score = Math.min(100, Math.max(0, score));

    return {
      score: Math.round(score),
      grade:
        score >= 90
          ? "A+"
          : score >= 80
            ? "A"
            : score >= 70
              ? "B"
              : score >= 60
                ? "C"
                : "D",
      factors: {
        carbonEfficiency:
          footprint.avgPerShipment < 10 ? "GOOD" : "NEEDS IMPROVEMENT",
        renewableEnergy:
          energy.renewablePercent > 20 ? "GOOD" : "NEEDS IMPROVEMENT",
        wasteManagement:
          waste.recyclingRate > 60 ? "GOOD" : "NEEDS IMPROVEMENT",
      },
      recommendations: [
        "Switch to electric vehicle fleet",
        "Install solar panels for renewable energy",
        "Implement comprehensive recycling program",
        "Optimize shipping routes to reduce emissions",
        "Use sustainable packaging materials",
      ],
    };
  } catch (error) {
    console.error("Sustainability score error:", error);
    return { score: 0, grade: "N/A" };
  }
}

/**
 * Log Shipment Carbon
 */
async function logShipmentCarbon(
  shipmentId: string,
  distance: number,
  mode: string,
  weight: number,
) {
  try {
    const emissionFactors: Record<string, number> = {
      TRUCK: 0.062,
      FREIGHT: 0.022,
      AIR: 0.602,
      SEA: 0.008,
      RAIL: 0.014,
    };

    const factor = emissionFactors[mode] || 0.062;
    const carbon = (weight / 1000) * distance * factor;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { organizationId: true },
    });

    if (shipment?.organizationId) {
      await prisma.activityLog.create({
        data: {
          organizationId: shipment.organizationId,
          action: "SUSTAINABILITY_SHIPMENT_CARBON_LOG",
          entityType: "Shipment",
          entityId: shipmentId,
          metadata: {
            carbonKg: Math.round(carbon * 100) / 100,
            distance,
            mode,
            weight,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return {
      shipmentId,
      carbonKg: Math.round(carbon * 100) / 100,
      distance,
      mode,
      weight,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Log shipment carbon error:", error);
    return { error: String(error) };
  }
}

/**
 * Set Sustainability Targets
 */
async function setSustainabilityTargets(warehouseId: string, targets: any) {
  await prisma.activityLog.create({
    data: {
      organizationId: warehouseId,
      action: "SUSTAINABILITY_TARGETS_SET",
      entityType: "SustainabilityTargets",
      entityId: warehouseId,
      metadata: {
        targets,
        setAt: new Date().toISOString(),
      },
    },
  });

  return {
    warehouseId,
    targets,
    setAt: new Date().toISOString(),
  };
}

/**
 * Log Waste Event
 */
async function logWasteEvent(
  warehouseId: string,
  type: string,
  amount: number,
  recycled: boolean,
) {
  await prisma.activityLog.create({
    data: {
      organizationId: warehouseId,
      action: "SUSTAINABILITY_WASTE_LOG",
      entityType: "WasteEvent",
      entityId: `${type}-${Date.now()}`,
      metadata: {
        type,
        amount,
        recycled,
        timestamp: new Date().toISOString(),
      },
    },
  });

  return {
    warehouseId,
    type,
    amount,
    recycled,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate Sustainability Report
 */
async function generateSustainabilityReport(warehouseId: string, params: any) {
  const report = await generateESGReport(
    warehouseId,
    params.startDate,
    params.endDate,
  );
  return {
    ...report,
    generatedAt: new Date().toISOString(),
    format: params.format || "PDF",
  };
}
