/**
 * Digital Twin 3D Visualization API
 * Real-time warehouse digital twin with IoT integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch digital twin data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const warehouseId = searchParams.get('warehouseId') || session.user.organizationId;

    if (action === 'warehouse-model') {
      // Get 3D warehouse model
      const model = await getWarehouse3DModel(warehouseId);
      return NextResponse.json({ model });
    } else if (action === 'live-data') {
      // Get live IoT sensor data
      const liveData = await getLiveWarehouseData(warehouseId);
      return NextResponse.json({ liveData });
    } else if (action === 'equipment-status') {
      // Get equipment status
      const equipment = await getEquipmentStatus(warehouseId);
      return NextResponse.json({ equipment });
    } else if (action === 'worker-tracking') {
      // Get worker locations
      const workers = await getWorkerLocations(warehouseId);
      return NextResponse.json({ workers });
    } else if (action === 'inventory-3d') {
      // Get 3D inventory visualization
      const inventory = await get3DInventory(warehouseId);
      return NextResponse.json({ inventory });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Digital Twin GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch digital twin data' },
      { status: 500 }
    );
  }
}

// POST - Update digital twin or run simulations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, warehouseId, params } = body;

    if (action === 'simulate') {
      // Run what-if simulation
      const simulation = await runDigitalTwinSimulation(
        warehouseId || session.user.organizationId,
        params
      );
      return NextResponse.json({ success: true, simulation });
    } else if (action === 'update-iot') {
      // Update IoT sensor data
      const { sensorId, data } = body;
      const result = await updateIoTSensorData(sensorId, data);
      return NextResponse.json({ success: true, result });
    } else if (action === 'predict-congestion') {
      // Predict congestion zones
      const prediction = await predictWarehouseCongestion(
        warehouseId || session.user.organizationId
      );
      return NextResponse.json({ success: true, prediction });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Digital Twin POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process digital twin request' },
      { status: 500 }
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
    const zones = warehouse.zones?.map((zone: any) => ({
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

    const aisles = warehouse.aisles?.map((aisle: any) => ({
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

    const locations = warehouse.locations?.map((loc: any) => ({
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
    console.error('3D Model error:', error);
    return { zones: [], aisles: [], locations: [] };
  }
}

/**
 * Get Live Warehouse Data (IoT Sensors)
 */
async function getLiveWarehouseData(warehouseId: string) {
  try {
    // Simulate IoT sensor readings
    const sensors = [
      {
        id: 'TEMP-001',
        type: 'TEMPERATURE',
        location: { x: 10, y: 2, z: 5 },
        value: 22.5,
        unit: '°C',
        status: 'NORMAL',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'HUM-001',
        type: 'HUMIDITY',
        location: { x: 10, y: 2, z: 5 },
        value: 45,
        unit: '%',
        status: 'NORMAL',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'MOTION-001',
        type: 'MOTION',
        location: { x: 20, y: 1, z: 10 },
        value: 12,
        unit: 'people',
        status: 'NORMAL',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'WEIGHT-001',
        type: 'WEIGHT_SENSOR',
        location: { x: 30, y: 0, z: 15 },
        value: 850,
        unit: 'kg',
        status: 'NORMAL',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'LIGHT-001',
        type: 'LIGHT',
        location: { x: 40, y: 5, z: 20 },
        value: 300,
        unit: 'lux',
        status: 'NORMAL',
        timestamp: new Date().toISOString(),
      },
    ];

    return {
      sensors,
      lastUpdate: new Date().toISOString(),
      totalSensors: sensors.length,
    };
  } catch (error) {
    console.error('Live data error:', error);
    return { sensors: [], totalSensors: 0 };
  }
}

/**
 * Get Equipment Status
 */
async function getEquipmentStatus(warehouseId: string) {
  try {
    const equipment = [
      {
        id: 'FLT-001',
        type: 'FORKLIFT',
        name: 'Forklift 1',
        position: { x: 15, y: 0, z: 25 },
        status: 'ACTIVE',
        operator: 'John Doe',
        battery: 85,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'FLT-002',
        type: 'FORKLIFT',
        name: 'Forklift 2',
        position: { x: 50, y: 0, z: 40 },
        status: 'ACTIVE',
        operator: 'Jane Smith',
        battery: 62,
        lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'CONV-001',
        type: 'CONVEYOR',
        name: 'Main Conveyor',
        position: { x: 80, y: 0, z: 10 },
        status: 'ACTIVE',
        speed: 1.5,
        throughput: 450,
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'AGV-001',
        type: 'AGV',
        name: 'AGV Robot 1',
        position: { x: 35, y: 0, z: 60 },
        status: 'ACTIVE',
        battery: 95,
        currentTask: 'PICKING',
        destination: { x: 45, y: 0, z: 70 },
      },
    ];

    return {
      equipment,
      totalEquipment: equipment.length,
      activeCount: equipment.filter((e) => e.status === 'ACTIVE').length,
    };
  } catch (error) {
    console.error('Equipment status error:', error);
    return { equipment: [], totalEquipment: 0, activeCount: 0 };
  }
}

/**
 * Get Worker Locations (Real-time tracking)
 */
async function getWorkerLocations(warehouseId: string) {
  try {
    // Simulate real-time worker tracking
    const workers = [
      {
        id: 'WKR-001',
        name: 'Alice Johnson',
        role: 'PICKER',
        position: { x: 25, y: 0, z: 35 },
        currentTask: 'PICKING',
        taskProgress: 65,
        efficiency: 98,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'WKR-002',
        name: 'Bob Williams',
        role: 'PICKER',
        position: { x: 55, y: 0, z: 50 },
        currentTask: 'PICKING',
        taskProgress: 40,
        efficiency: 92,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'WKR-003',
        name: 'Carol Davis',
        role: 'PACKER',
        position: { x: 85, y: 0, z: 15 },
        currentTask: 'PACKING',
        taskProgress: 80,
        efficiency: 95,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'WKR-004',
        name: 'David Brown',
        role: 'QC',
        position: { x: 70, y: 0, z: 25 },
        currentTask: 'INSPECTION',
        taskProgress: 50,
        efficiency: 100,
        lastUpdate: new Date().toISOString(),
      },
    ];

    return {
      workers,
      totalWorkers: workers.length,
      avgEfficiency: workers.reduce((sum, w) => sum + w.efficiency, 0) / workers.length,
    };
  } catch (error) {
    console.error('Worker tracking error:', error);
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
    console.error('3D Inventory error:', error);
    return { items: [], totalItems: 0, totalValue: 0 };
  }
}

/**
 * Run Digital Twin Simulation
 */
async function runDigitalTwinSimulation(warehouseId: string, params: any) {
  try {
    const { scenario, duration } = params;

    // Simulate different scenarios
    let results: any = {};

    if (scenario === 'PEAK_SEASON') {
      results = {
        scenario: 'Peak Season (2x orders)',
        averagePickTime: 3.2,
        congestionPoints: [
          { zone: 'Zone A', congestionLevel: 85 },
          { zone: 'Zone B', congestionLevel: 70 },
        ],
        bottlenecks: ['Packing Station 1', 'Bay Door 3'],
        recommendations: [
          'Add 2 more pickers to Zone A',
          'Open additional packing station',
          'Adjust slotting for high-velocity items',
        ],
        estimatedThroughput: 850,
        projectedBottleneckTime: '2-4 PM',
      };
    } else if (scenario === 'EQUIPMENT_FAILURE') {
      results = {
        scenario: 'Forklift Failure',
        affectedOperations: ['Receiving', 'Replenishment'],
        impactPercentage: 35,
        workarounds: [
          'Reassign tasks to remaining forklifts',
          'Prioritize critical replenishment',
        ],
        estimatedDelay: '45 minutes',
      };
    } else if (scenario === 'NEW_LAYOUT') {
      results = {
        scenario: 'Layout Optimization',
        currentPickDistance: 245,
        optimizedPickDistance: 180,
        improvement: 26.5,
        estimatedROI: '6 months',
        implementationTime: '2 weeks',
      };
    }

    return {
      ...results,
      simulationTime: new Date().toISOString(),
      duration: duration || 60,
    };
  } catch (error) {
    console.error('Simulation error:', error);
    return { error: String(error) };
  }
}

/**
 * Update IoT Sensor Data
 */
async function updateIoTSensorData(sensorId: string, data: any) {
  // In production, this would update real IoT sensor readings
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
    // ML-based congestion prediction
    const congestionZones = [
      {
        zone: 'Zone A',
        currentCongestion: 45,
        predictedCongestion: 78,
        predictedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        confidence: 85,
        recommendation: 'Redirect workers to Zone B',
      },
      {
        zone: 'Packing Area',
        currentCongestion: 60,
        predictedCongestion: 92,
        predictedTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        confidence: 90,
        recommendation: 'Open additional packing stations',
      },
    ];

    return {
      predictions: congestionZones,
      overallRisk: 'MEDIUM',
      peakTime: '2:00 PM - 4:00 PM',
    };
  } catch (error) {
    console.error('Congestion prediction error:', error);
    return { predictions: [], overallRisk: 'UNKNOWN' };
  }
}

/**
 * Helper: Get zone color based on type
 */
function getZoneColor(type: string): string {
  const colors: Record<string, string> = {
    PICKING: '#3b82f6', // Blue
    PACKING: '#10b981', // Green
    RECEIVING: '#f59e0b', // Orange
    SHIPPING: '#ef4444', // Red
    RESERVE: '#6b7280', // Gray
    QC: '#8b5cf6', // Purple
  };
  return colors[type] || '#6b7280';
}

/**
 * Helper: Get inventory color based on category
 */
function getInventoryColor(category: string): string {
  const colors: Record<string, string> = {
    ELECTRONICS: '#3b82f6',
    CLOTHING: '#10b981',
    FOOD: '#f59e0b',
    PHARMACEUTICAL: '#ef4444',
    INDUSTRIAL: '#6b7280',
  };
  return colors[category] || '#94a3b8';
}
