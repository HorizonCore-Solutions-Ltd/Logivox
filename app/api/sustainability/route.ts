/**
 * Sustainability & Carbon Tracking API
 * Environmental impact monitoring and ESG reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch sustainability metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const warehouseId = searchParams.get('warehouseId') || session.user.organizationId;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (action === 'carbon-footprint') {
      // Calculate carbon footprint
      const footprint = await calculateCarbonFootprint(warehouseId, startDate, endDate);
      return NextResponse.json({ footprint });
    } else if (action === 'energy-consumption') {
      // Get energy consumption data
      const energy = await getEnergyConsumption(warehouseId, startDate, endDate);
      return NextResponse.json({ energy });
    } else if (action === 'waste-metrics') {
      // Get waste and recycling metrics
      const waste = await getWasteMetrics(warehouseId, startDate, endDate);
      return NextResponse.json({ waste });
    } else if (action === 'esg-report') {
      // Generate ESG report
      const report = await generateESGReport(warehouseId, startDate, endDate);
      return NextResponse.json({ report });
    } else if (action === 'sustainability-score') {
      // Calculate sustainability score
      const score = await calculateSustainabilityScore(warehouseId);
      return NextResponse.json({ score });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sustainability GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sustainability data' },
      { status: 500 }
    );
  }
}

// POST - Log sustainability events or set targets
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, warehouseId, params } = body;

    if (action === 'log-shipment-carbon') {
      // Log carbon emissions for shipment
      const { shipmentId, distance, mode, weight } = body;
      const result = await logShipmentCarbon(shipmentId, distance, mode, weight);
      return NextResponse.json({ success: true, result });
    } else if (action === 'set-targets') {
      // Set sustainability targets
      const { targets } = body;
      const result = await setSustainabilityTargets(
        warehouseId || session.user.organizationId,
        targets
      );
      return NextResponse.json({ success: true, result });
    } else if (action === 'log-waste') {
      // Log waste event
      const { type, amount, recycled } = body;
      const result = await logWasteEvent(
        warehouseId || session.user.organizationId,
        type,
        amount,
        recycled
      );
      return NextResponse.json({ success: true, result });
    } else if (action === 'generate-report') {
      // Generate sustainability report
      const report = await generateSustainabilityReport(
        warehouseId || session.user.organizationId,
        params
      );
      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sustainability POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process sustainability request' },
      { status: 500 }
    );
  }
}

/**
 * Calculate Carbon Footprint
 */
async function calculateCarbonFootprint(
  warehouseId: string,
  startDate?: string | null,
  endDate?: string | null
) {
  try {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
      const mode = shipment.carrierMode || 'TRUCK';
      const factor = emissionFactors[mode] || 0.062;

      // Carbon = (weight in tons) * distance * emission factor
      const carbon = (weight / 1000) * distance * factor;
      totalCarbonKg += carbon;
    });

    // Add warehouse energy consumption emissions
    const energyCarbon = await calculateEnergyEmissions(warehouseId, start, end);
    totalCarbonKg += energyCarbon;

    // Calculate trends
    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 1);
    const previousFootprint = await calculateCarbonFootprint(
      warehouseId,
      previousStart.toISOString(),
      start.toISOString()
    );

    const trend =
      previousFootprint.totalCarbonKg > 0
        ? ((totalCarbonKg - previousFootprint.totalCarbonKg) / previousFootprint.totalCarbonKg) * 100
        : 0;

    return {
      totalCarbonKg: Math.round(totalCarbonKg * 100) / 100,
      totalCarbonTons: Math.round((totalCarbonKg / 1000) * 100) / 100,
      shipmentsCount: shipments.length,
      avgPerShipment: Math.round((totalCarbonKg / shipments.length) * 100) / 100,
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
    console.error('Carbon footprint calculation error:', error);
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
  end: Date
): Promise<number> {
  try {
    // Simulate energy consumption data
    // In production, this would come from IoT sensors or utility bills

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Average warehouse energy consumption: 10 kWh per sq meter per year
    // Assuming 10,000 sq meter warehouse = 27.4 kWh per day
    const dailyKwh = 274;
    const totalKwh = dailyKwh * days;

    // Carbon intensity: 0.5 kg CO2 per kWh (grid average)
    const carbonKg = totalKwh * 0.5;

    return carbonKg;
  } catch (error) {
    console.error('Energy emissions error:', error);
    return 0;
  }
}

/**
 * Get Energy Consumption
 */
async function getEnergyConsumption(
  warehouseId: string,
  startDate?: string | null,
  endDate?: string | null
) {
  try {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Simulate daily energy data
    const dailyData = [];
    const baseConsumption = 274; // kWh per day

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);

      // Add some variation (+/- 20%)
      const variation = (Math.random() - 0.5) * 0.4;
      const consumption = baseConsumption * (1 + variation);

      dailyData.push({
        date: date.toISOString().split('T')[0],
        consumption: Math.round(consumption * 10) / 10,
        cost: Math.round(consumption * 0.12 * 100) / 100, // $0.12 per kWh
        renewable: Math.round(consumption * 0.15 * 10) / 10, // 15% renewable
      });
    }

    const totalConsumption = dailyData.reduce((sum, d) => sum + d.consumption, 0);
    const totalCost = dailyData.reduce((sum, d) => sum + d.cost, 0);
    const totalRenewable = dailyData.reduce((sum, d) => sum + d.renewable, 0);

    return {
      totalKwh: Math.round(totalConsumption * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100,
      renewablePercent: Math.round((totalRenewable / totalConsumption) * 100),
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
    console.error('Energy consumption error:', error);
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
  endDate?: string | null
) {
  try {
    // Simulate waste data
    // In production, this would come from actual waste tracking

    return {
      totalWaste: 850, // kg
      recycled: 650, // kg
      landfill: 200, // kg
      recyclingRate: 76.5, // %
      breakdown: {
        cardboard: 400,
        plastic: 200,
        metal: 50,
        wood: 150,
        general: 50,
      },
      costSavings: 1250, // $ from recycling
      carbonAvoided: 450, // kg CO2 avoided from recycling
    };
  } catch (error) {
    console.error('Waste metrics error:', error);
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
  endDate?: string | null
) {
  try {
    const footprint = await calculateCarbonFootprint(warehouseId, startDate, endDate);
    const energy = await getEnergyConsumption(warehouseId, startDate, endDate);
    const waste = await getWasteMetrics(warehouseId, startDate, endDate);

    return {
      environmental: {
        carbonFootprint: footprint,
        energyConsumption: energy,
        wasteManagement: waste,
        waterUsage: {
          total: 15000, // liters
          perEmployee: 500,
        },
      },
      social: {
        employees: 42,
        safetyIncidents: 0,
        trainingHours: 840,
        diversityScore: 85,
      },
      governance: {
        complianceRate: 100,
        auditsPassed: 12,
        certifications: ['ISO 14001', 'LEED', 'Green Business'],
      },
      summary: {
        overallScore: 87,
        grade: 'A',
        improvements: [
          'Increase renewable energy to 25%',
          'Reduce packaging waste by 10%',
          'Implement electric forklift fleet',
        ],
      },
    };
  } catch (error) {
    console.error('ESG report error:', error);
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
      grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D',
      factors: {
        carbonEfficiency: footprint.avgPerShipment < 10 ? 'GOOD' : 'NEEDS IMPROVEMENT',
        renewableEnergy: energy.renewablePercent > 20 ? 'GOOD' : 'NEEDS IMPROVEMENT',
        wasteManagement: waste.recyclingRate > 60 ? 'GOOD' : 'NEEDS IMPROVEMENT',
      },
      recommendations: [
        'Switch to electric vehicle fleet',
        'Install solar panels for renewable energy',
        'Implement comprehensive recycling program',
        'Optimize shipping routes to reduce emissions',
        'Use sustainable packaging materials',
      ],
    };
  } catch (error) {
    console.error('Sustainability score error:', error);
    return { score: 0, grade: 'N/A' };
  }
}

/**
 * Log Shipment Carbon
 */
async function logShipmentCarbon(
  shipmentId: string,
  distance: number,
  mode: string,
  weight: number
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

    // In production, save to database
    return {
      shipmentId,
      carbonKg: Math.round(carbon * 100) / 100,
      distance,
      mode,
      weight,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Log shipment carbon error:', error);
    return { error: String(error) };
  }
}

/**
 * Set Sustainability Targets
 */
async function setSustainabilityTargets(warehouseId: string, targets: any) {
  // In production, save targets to database
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
  recycled: boolean
) {
  // In production, save to database
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
  const report = await generateESGReport(warehouseId, params.startDate, params.endDate);
  return {
    ...report,
    generatedAt: new Date().toISOString(),
    format: params.format || 'PDF',
  };
}
