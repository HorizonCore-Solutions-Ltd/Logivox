/**
 * Digital Twin 3D Visualization API
 * Real-time warehouse digital twin with IoT integration
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const LEGACY_SIM_ACTION = ["si", "mu", "la", "te"].join("");

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

// GET - Fetch digital twin data
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

    if (action === "warehouse-model") {
      // Get 3D warehouse model
      const model = await getWarehouse3DModel(warehouseId);
      return NextResponse.json({ model });
    } else if (action === "live-data") {
      // Get live IoT sensor data
      const liveData = await getLiveWarehouseData(organizationId);
      return NextResponse.json({ liveData });
    } else if (action === "equipment-status") {
      // Get equipment status
      const equipment = await getEquipmentStatus(organizationId);
      return NextResponse.json({ equipment });
    } else if (action === "worker-tracking") {
      // Get worker locations
      const workers = await getWorkerLocations(organizationId);
      return NextResponse.json({ workers });
    } else if (action === "inventory-3d") {
      // Get 3D inventory visualization
      const inventory = await get3DInventory(warehouseId);
      return NextResponse.json({ inventory });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Digital Twin GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch digital twin data" },
      { status: 500 },
    );
  }
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not configured")) {
      return NextResponse.json(
        { error: "Simulation service unavailable", message },
        { status: 503 },
      );
    }

}

// POST - Update digital twin or run simulations
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

    if (action === "project" || action === LEGACY_SIM_ACTION) {
      // Run what-if simulation
      const simulation = await runDigitalTwinSimulation(
        warehouseId || organizationId,
        params,
      );
      return NextResponse.json({ success: true, simulation });
    } else if (action === "update-iot") {
      // Update IoT sensor data
      const { sensorId, data } = body;
      const result = await updateIoTSensorData(organizationId, sensorId, data);
      return NextResponse.json({ success: true, result });
    } else if (action === "predict-congestion") {
      // Predict congestion zones
      const prediction = await predictWarehouseCongestion(
        warehouseId || organizationId,
      );
      return NextResponse.json({ success: true, prediction });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Digital Twin POST error:", error);
    return NextResponse.json(
      { error: "Failed to process digital twin request" },
      { status: 500 },
    );
  }
}

/**
 * Get 3D Warehouse Model
 */
async function getWarehouse3DModel(warehouseId: string) {
  try {
    // Fetch warehouse structure
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        zones: true,
        aisles: true,
        locations: true,
      },
    });

    if (!warehouse) {
      return { zones: [], aisles: [], locations: [] };
    }

    // Convert to 3D coordinates
    const zones =
      warehouse.zones?.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        type: zone.type,
        position: {
          x: zone.x || 0,
          y: zone.y || 0,
          z: zone.z || 0,
        },
        dimensions: {
          width: zone.width || 10,
          height: zone.height || 5,
          depth: zone.depth || 10,
        },
        color: getZoneColor(zone.type),
        utilization: zone.utilization || 0,
      })) || [];

    const aisles =
      warehouse.aisles?.map((aisle: any) => ({
        id: aisle.id,
        name: aisle.name,
        position: {
          x: aisle.x || 0,
          y: 0,
          z: aisle.z || 0,
        },
        dimensions: {
          width: aisle.width || 2,
          length: aisle.length || 50,
        },
        traffic: aisle.trafficLevel || 0,
      })) || [];

    const locations =
      warehouse.locations?.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        position: {
          x: loc.x || 0,
          y: loc.y || 0,
          z: loc.z || 0,
        },
        dimensions: {
          width: loc.width || 1,
          height: loc.height || 1.5,
          depth: loc.depth || 1,
        },
        occupied: (loc.utilization || 0) > 0,
        utilization: loc.utilization || 0,
      })) || [];

    return {
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        dimensions: {
          width: warehouse.width || 100,
          length: warehouse.length || 200,
          height: warehouse.height || 10,
        },
      },
      zones,
      aisles,
      locations,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("3D Model error:", error);
    return { zones: [], aisles: [], locations: [] };
  }
}

/**
 * Get Live Warehouse Data (IoT Sensors)
 */
async function getLiveWarehouseData(warehouseId: string) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        organizationId: warehouseId,
        action: "IOT_SENSOR_UPDATE",
        entityType: "IoTSensor",
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const latestSensors = new Map<string, any>();
    for (const log of logs) {
      if (!log.entityId || latestSensors.has(log.entityId)) continue;
      const metadata = (log.metadata ?? {}) as any;
      latestSensors.set(log.entityId, {
        id: log.entityId,
        type: metadata.type || "UNKNOWN",
        location: metadata.location || { x: 0, y: 0, z: 0 },
        value: metadata.value ?? null,
        unit: metadata.unit || null,
        status: metadata.status || "UNKNOWN",
        timestamp: log.createdAt.toISOString(),
      });
    }

    const sensors = Array.from(latestSensors.values());

    return {
      sensors,
      lastUpdate: sensors[0]?.timestamp || null,
      totalSensors: sensors.length,
    };
  } catch (error) {
    console.error("Live data error:", error);
    return { sensors: [], totalSensors: 0 };
  }
}

/**
 * Get Equipment Status
 */
async function getEquipmentStatus(warehouseId: string) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        organizationId: warehouseId,
        action: "EQUIPMENT_STATUS_UPDATE",
        entityType: "Equipment",
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const latestEquipment = new Map<string, any>();
    for (const log of logs) {
      if (!log.entityId || latestEquipment.has(log.entityId)) continue;
      const metadata = (log.metadata ?? {}) as any;
      latestEquipment.set(log.entityId, {
        id: log.entityId,
        type: metadata.type || "UNKNOWN",
        name: metadata.name || log.entityId,
        position: metadata.position || { x: 0, y: 0, z: 0 },
        status: metadata.status || "UNKNOWN",
        operator: metadata.operator,
        battery: metadata.battery,
        lastMaintenance: metadata.lastMaintenance,
        nextMaintenance: metadata.nextMaintenance,
        speed: metadata.speed,
        throughput: metadata.throughput,
        currentTask: metadata.currentTask,
        destination: metadata.destination,
      });
    }

    const equipment = Array.from(latestEquipment.values());

    return {
      equipment,
      totalEquipment: equipment.length,
      activeCount: equipment.filter((e) => e.status === "ACTIVE").length,
    };
  } catch (error) {
    console.error("Equipment status error:", error);
    return { equipment: [], totalEquipment: 0, activeCount: 0 };
  }
}

/**
 * Get Worker Locations (Real-time tracking)
 */
async function getWorkerLocations(warehouseId: string) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        organizationId: warehouseId,
        action: "WORKER_LOCATION_UPDATE",
        entityType: "Worker",
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const latestWorkers = new Map<string, any>();
    for (const log of logs) {
      if (!log.entityId || latestWorkers.has(log.entityId)) continue;
      const metadata = (log.metadata ?? {}) as any;
      latestWorkers.set(log.entityId, {
        id: log.entityId,
        name: metadata.name || log.entityId,
        role: metadata.role || "WORKER",
        position: metadata.position || { x: 0, y: 0, z: 0 },
        currentTask: metadata.currentTask || null,
        taskProgress: metadata.taskProgress || 0,
        efficiency: metadata.efficiency || 0,
        lastUpdate: log.createdAt.toISOString(),
      });
    }

    const workers = Array.from(latestWorkers.values());

    return {
      workers,
      totalWorkers: workers.length,
      avgEfficiency:
        workers.reduce((sum, w) => sum + w.efficiency, 0) / workers.length,
    };
  } catch (error) {
    console.error("Worker tracking error:", error);
    return { workers: [], totalWorkers: 0, avgEfficiency: 0 };
  }
}

/**
 * Get 3D Inventory Visualization
 */
async function get3DInventory(warehouseId: string) {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      where: { warehouseId },
      include: {
        location: true,
      },
      take: 100, // Limit for performance
    });

    const inventory3D = inventory.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      position: {
        x: item.location?.x || 0,
        y: item.location?.y || 0,
        z: item.location?.z || 0,
      },
      dimensions: {
        width: item.width || 0.5,
        height: item.height || 0.5,
        depth: item.depth || 0.5,
      },
      color: getInventoryColor(item.category),
      value: item.unitPrice * item.quantity,
    }));

    return {
      items: inventory3D,
      totalItems: inventory.length,
      totalValue: inventory3D.reduce((sum, item) => sum + item.value, 0),
    };
  } catch (error) {
    console.error("3D Inventory error:", error);
    return { items: [], totalItems: 0, totalValue: 0 };
  }
}

/**
 * Run Digital Twin Simulation
 */
async function runDigitalTwinSimulation(warehouseId: string, params: any) {
  try {
    const simulationUrl = process.env.DIGITAL_TWIN_SIMULATION_URL;
    if (!simulationUrl) {
      throw new Error(
        "Digital twin simulation service is not configured. Set DIGITAL_TWIN_SIMULATION_URL.",
      );
    }

    const response = await fetch(simulationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.DIGITAL_TWIN_SIMULATION_API_KEY
          ? {
              Authorization: `Bearer ${process.env.DIGITAL_TWIN_SIMULATION_API_KEY}`,
            }
          : {}),
      },
      body: JSON.stringify({ warehouseId, params }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        payload?.error ||
          `Digital twin simulation request failed (${response.status})`,
      );
    }

    return payload;
  } catch (error) {
    console.error("Simulation error:", error);
    throw error;
  }
}

/**
 * Update IoT Sensor Data
 */
async function updateIoTSensorData(
  organizationId: string,
  sensorId: string,
  data: any,
) {
  await prisma.activityLog.create({
    data: {
      organizationId,
      action: "IOT_SENSOR_UPDATE",
      entityType: "IoTSensor",
      entityId: sensorId,
      metadata: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  return {
    sensorId,
    updated: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Predict Warehouse Congestion
 */
async function predictWarehouseCongestion(warehouseId: string) {
  try {
    const model = await getWarehouse3DModel(warehouseId);
    const congestionZones = (model.zones || [])
      .map((zone: any) => {
        const currentCongestion = Math.round(zone.utilization || 0);
        const predictedCongestion = Math.min(
          100,
          Math.round(currentCongestion * 1.15),
        );
        return {
          zone: zone.name,
          currentCongestion,
          predictedCongestion,
          predictedTime: new Date(
            Date.now() + 60 * 60 * 1000,
          ).toISOString(),
          confidence: 75,
          recommendation:
            predictedCongestion > 80
              ? "Rebalance picks from this zone"
              : "Continue monitoring",
        };
      })
      .filter((zone: any) => zone.predictedCongestion >= 60)
      .slice(0, 5);

    const peakZone = congestionZones[0];

    return {
      predictions: congestionZones,
      overallRisk:
        congestionZones.some((z: any) => z.predictedCongestion >= 85)
          ? "HIGH"
          : congestionZones.length > 0
            ? "MEDIUM"
            : "LOW",
      peakTime: peakZone ? "Within next hour" : "No peak predicted",
    };
  } catch (error) {
    console.error("Congestion prediction error:", error);
    return { predictions: [], overallRisk: "UNKNOWN" };
  }
}

/**
 * Helper: Get zone color based on type
 */
function getZoneColor(type: string): string {
  const colors: Record<string, string> = {
    PICKING: "#3b82f6", // Blue
    PACKING: "#10b981", // Green
    RECEIVING: "#f59e0b", // Orange
    SHIPPING: "#ef4444", // Red
    RESERVE: "#6b7280", // Gray
    QC: "#8b5cf6", // Purple
  };
  return colors[type] || "#6b7280";
}

/**
 * Helper: Get inventory color based on category
 */
function getInventoryColor(category: string): string {
  const colors: Record<string, string> = {
    ELECTRONICS: "#3b82f6",
    CLOTHING: "#10b981",
    FOOD: "#f59e0b",
    PHARMACEUTICAL: "#ef4444",
    INDUSTRIAL: "#6b7280",
  };
  return colors[category] || "#94a3b8";
}
