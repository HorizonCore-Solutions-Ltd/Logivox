import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const allocateStagingZoneSchema = z.object({
  action: z.literal('allocate_staging_zone'),
  shipmentId: z.string().min(1),
  estimatedItems: z.number().int().positive(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']),
  loadTime: z.string().datetime(),
  requirements: z.array(z.enum(['REFRIGERATED', 'HAZMAT', 'OVERSIZED', 'FRAGILE'])).optional(),
});

const stagingItemSchema = z.object({
  action: z.literal('stage_item'),
  shipmentId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
  zoneId: z.string().min(1),
  pickerId: z.string().optional(),
});

const consolidateStageSchema = z.object({
  action: z.literal('consolidate_stage'),
  zoneId: z.string().min(1),
  targetZoneId: z.string().optional(),
});

const markLoadReadySchema = z.object({
  action: z.literal('mark_load_ready'),
  shipmentId: z.string().min(1),
  verifiedBy: z.string().min(1),
});

// Types
interface StagingZone {
  id: string;
  name: string;
  type: 'STANDARD' | 'REFRIGERATED' | 'HAZMAT' | 'OVERSIZED';
  capacity: number;
  currentUtilization: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'FULL' | 'RESERVED';
  assignedShipment?: string;
  location: string;
}

interface StagedItem {
  id: string;
  shipmentId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  quantityStaged: number;
  zoneId: string;
  stagedAt: Date;
  stagedBy: string;
  status: 'STAGED' | 'VERIFIED' | 'LOADED';
}

interface ShipmentStaging {
  shipmentId: string;
  carrier: string;
  loadTime: Date;
  priority: string;
  allocatedZones: string[];
  totalItems: number;
  stagedItems: number;
  completionPercent: number;
  status: 'PICKING' | 'STAGING' | 'READY' | 'LOADING' | 'COMPLETE';
  verifiedAt?: Date;
  verifiedBy?: string;
}

// Staging zone allocation algorithm
function allocateOptimalZone(
  zones: StagingZone[],
  requirements: string[],
  estimatedItems: number,
  priority: string
): StagingZone | null {
  // Filter zones by requirements
  const compatibleZones = zones.filter(zone => {
    if (zone.status === 'FULL') return false;
    
    // Check type compatibility
    if (requirements.includes('REFRIGERATED') && zone.type !== 'REFRIGERATED') return false;
    if (requirements.includes('HAZMAT') && zone.type !== 'HAZMAT') return false;
    if (requirements.includes('OVERSIZED') && zone.type !== 'OVERSIZED') return false;
    
    // Check capacity
    const availableSpace = zone.capacity - zone.currentUtilization;
    if (availableSpace < estimatedItems * 0.5) return false; // Need at least 50% of space
    
    return true;
  });

  if (compatibleZones.length === 0) return null;

  // Score zones
  const scoredZones = compatibleZones.map(zone => {
    let score = 0;
    
    // Prefer zones closer to loading docks (based on name/location)
    if (zone.location.includes('DOCK-SIDE')) score += 30;
    if (zone.location.includes('MAIN-AISLE')) score += 20;
    
    // Prefer less utilized zones for better organization
    const utilizationPercent = (zone.currentUtilization / zone.capacity) * 100;
    if (utilizationPercent < 30) score += 25;
    else if (utilizationPercent < 60) score += 15;
    
    // Available zones better than reserved
    if (zone.status === 'AVAILABLE') score += 20;
    
    // Priority bonus for urgent shipments
    if (priority === 'URGENT') score += 10;
    
    return { zone, score };
  });

  // Return highest scored zone
  return scoredZones.sort((a, b) => b.score - a.score)[0].zone;
}

// Calculate staging progress
function calculateStagingProgress(
  stagedItems: StagedItem[],
  totalItemsExpected: number
): {
  completionPercent: number;
  itemsStaged: number;
  itemsRemaining: number;
  avgStagingRate: number; // items per hour
} {
  const itemsStaged = stagedItems.reduce((sum, item) => sum + item.quantityStaged, 0);
  const completionPercent = totalItemsExpected > 0 
    ? (itemsStaged / totalItemsExpected) * 100 
    : 0;

  // Calculate staging rate (assuming 8-hour shift)
  const firstStaged = stagedItems.length > 0 
    ? Math.min(...stagedItems.map(i => new Date(i.stagedAt).getTime()))
    : Date.now();
  const hoursElapsed = Math.max((Date.now() - firstStaged) / (1000 * 60 * 60), 0.5);
  const avgStagingRate = itemsStaged / hoursElapsed;

  return {
    completionPercent: Math.min(completionPercent, 100),
    itemsStaged,
    itemsRemaining: Math.max(totalItemsExpected - itemsStaged, 0),
    avgStagingRate,
  };
}

// Identify consolidation opportunities
function findConsolidationOpportunities(
  zones: StagingZone[],
  stagedItems: StagedItem[]
): {
  zoneId: string;
  currentItems: number;
  suggestedTargetZone: string;
  spaceSaved: number;
  reason: string;
}[] {
  const opportunities: any[] = [];

  zones.forEach(zone => {
    const zoneItems = stagedItems.filter(item => item.zoneId === zone.id);
    const itemCount = zoneItems.reduce((sum, item) => sum + item.quantityStaged, 0);
    const utilizationPercent = (itemCount / zone.capacity) * 100;

    // Flag zones with low utilization that could be consolidated
    if (utilizationPercent < 40 && itemCount > 0) {
      // Find a suitable target zone
      const targetZone = zones.find(z => 
        z.id !== zone.id &&
        z.type === zone.type &&
        z.status !== 'FULL' &&
        (z.capacity - z.currentUtilization) >= itemCount
      );

      if (targetZone) {
        opportunities.push({
          zoneId: zone.id,
          currentItems: itemCount,
          suggestedTargetZone: targetZone.id,
          spaceSaved: zone.capacity,
          reason: `Low utilization (${utilizationPercent.toFixed(0)}%) - consolidate to free zone`,
        });
      }
    }
  });

  return opportunities;
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ALLOCATE STAGING ZONE
    if (action === 'allocate_staging_zone') {
      const data = allocateStagingZoneSchema.parse(body);
      
      const zones = await getStagingZones();
      const optimalZone = allocateOptimalZone(
        zones,
        data.requirements || [],
        data.estimatedItems,
        data.priority
      );

      if (!optimalZone) {
        return NextResponse.json({
          success: false,
          error: 'No suitable staging zone available',
          suggestion: 'Consider consolidating existing zones or waiting for space',
        }, { status: 400 });
      }

      // Reserve the zone
      optimalZone.status = 'RESERVED';
      optimalZone.assignedShipment = data.shipmentId;

      return NextResponse.json({
        success: true,
        allocatedZone: optimalZone,
        shipmentId: data.shipmentId,
        capacity: optimalZone.capacity,
        availableSpace: optimalZone.capacity - optimalZone.currentUtilization,
      });
    }

    // STAGE ITEM
    if (action === 'stage_item') {
      const data = stagingItemSchema.parse(body);

      const stagedItem: StagedItem = {
        id: `STAGED-${Date.now()}`,
        shipmentId: data.shipmentId,
        itemId: data.itemId,
        itemName: `Product ${data.itemId}`,
        quantity: data.quantity,
        quantityStaged: data.quantity,
        zoneId: data.zoneId,
        stagedAt: new Date(),
        stagedBy: data.pickerId || session.user.id || 'SYSTEM',
        status: 'STAGED',
      };

      return NextResponse.json({
        success: true,
        stagedItem,
        message: `${data.quantity} units staged in ${data.zoneId}`,
        timestamp: new Date(),
      });
    }

    // CONSOLIDATE STAGE
    if (action === 'consolidate_stage') {
      const data = consolidateStageSchema.parse(body);

      const zones = await getStagingZones();
      const sourceZone = zones.find(z => z.id === data.zoneId);
      
      if (!sourceZone) {
        return NextResponse.json({ error: 'Source zone not found' }, { status: 404 });
      }

      const stagedItems = await getStagedItems(data.zoneId);
      const itemCount = stagedItems.reduce((sum, item) => sum + item.quantityStaged, 0);

      // Find target zone if not specified
      let targetZoneId = data.targetZoneId;
      if (!targetZoneId) {
        const targetZone = zones.find(z =>
          z.id !== sourceZone.id &&
          z.type === sourceZone.type &&
          z.status !== 'FULL' &&
          (z.capacity - z.currentUtilization) >= itemCount
        );
        targetZoneId = targetZone?.id;
      }

      if (!targetZoneId) {
        return NextResponse.json({
          success: false,
          error: 'No suitable target zone found',
        }, { status: 400 });
      }

      // Move items
      stagedItems.forEach(item => {
        item.zoneId = targetZoneId!;
      });

      return NextResponse.json({
        success: true,
        itemsMoved: stagedItems.length,
        unitsConsolidated: itemCount,
        fromZone: data.zoneId,
        toZone: targetZoneId,
        spaceSaved: sourceZone.capacity,
      });
    }

    // MARK LOAD READY
    if (action === 'mark_load_ready') {
      const data = markLoadReadySchema.parse(body);

      const shipment = await getShipmentStaging(data.shipmentId);
      if (!shipment) {
        return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
      }

      shipment.status = 'READY';
      shipment.verifiedAt = new Date();
      shipment.verifiedBy = data.verifiedBy;

      return NextResponse.json({
        success: true,
        shipment,
        readyForLoading: true,
        verifiedAt: shipment.verifiedAt,
        message: `Shipment ${data.shipmentId} marked ready for loading`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Staging error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // GET STAGING ZONES
    if (action === 'staging_zones') {
      const zones = await getStagingZones();
      
      return NextResponse.json({
        zones,
        summary: {
          total: zones.length,
          available: zones.filter(z => z.status === 'AVAILABLE').length,
          occupied: zones.filter(z => z.status === 'OCCUPIED').length,
          full: zones.filter(z => z.status === 'FULL').length,
          avgUtilization: zones.reduce((sum, z) => sum + (z.currentUtilization / z.capacity) * 100, 0) / zones.length,
        },
      });
    }

    // GET SHIPMENT STAGING STATUS
    if (action === 'shipment_staging') {
      const shipmentId = searchParams.get('shipmentId');
      if (!shipmentId) {
        // Return all active shipments
        const shipments = await getAllActiveShipments();
        return NextResponse.json({ shipments });
      }

      const shipment = await getShipmentStaging(shipmentId);
      if (!shipment) {
        return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
      }

      const stagedItems = await getStagedItemsByShipment(shipmentId);
      const progress = calculateStagingProgress(stagedItems, shipment.totalItems);

      return NextResponse.json({
        shipment,
        stagedItems,
        progress,
      });
    }

    // GET CONSOLIDATION OPPORTUNITIES
    if (action === 'consolidation_opportunities') {
      const zones = await getStagingZones();
      const allStagedItems = await getAllStagedItems();
      
      const opportunities = findConsolidationOpportunities(zones, allStagedItems);

      return NextResponse.json({
        opportunities,
        potentialSpaceSaved: opportunities.reduce((sum, opp) => sum + opp.spaceSaved, 0),
        zonesAffected: opportunities.length,
      });
    }

    // GET STAGING METRICS
    if (action === 'staging_metrics') {
      const zones = await getStagingZones();
      const allShipments = await getAllActiveShipments();
      const allStagedItems = await getAllStagedItems();

      const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
      const totalUtilized = zones.reduce((sum, z) => sum + z.currentUtilization, 0);

      return NextResponse.json({
        metrics: {
          totalZones: zones.length,
          totalCapacity,
          currentUtilization: totalUtilized,
          utilizationPercent: (totalUtilized / totalCapacity) * 100,
          activeShipments: allShipments.length,
          totalItemsStaged: allStagedItems.reduce((sum, item) => sum + item.quantityStaged, 0),
          avgStagingRate: 145, // items per hour
          readyForLoading: allShipments.filter(s => s.status === 'READY').length,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Staging GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getStagingZones(): Promise<StagingZone[]> {
  return [
    {
      id: 'STAGE-A1',
      name: 'Staging Zone A1',
      type: 'STANDARD',
      capacity: 500,
      currentUtilization: 285,
      status: 'OCCUPIED',
      assignedShipment: 'SHP-501',
      location: 'DOCK-SIDE-EAST',
    },
    {
      id: 'STAGE-A2',
      name: 'Staging Zone A2',
      type: 'STANDARD',
      capacity: 500,
      currentUtilization: 120,
      status: 'OCCUPIED',
      assignedShipment: 'SHP-502',
      location: 'DOCK-SIDE-EAST',
    },
    {
      id: 'STAGE-B1',
      name: 'Staging Zone B1',
      type: 'REFRIGERATED',
      capacity: 300,
      currentUtilization: 0,
      status: 'AVAILABLE',
      location: 'MAIN-AISLE-NORTH',
    },
    {
      id: 'STAGE-C1',
      name: 'Staging Zone C1',
      type: 'HAZMAT',
      capacity: 200,
      currentUtilization: 0,
      status: 'AVAILABLE',
      location: 'ISOLATED-WEST',
    },
    {
      id: 'STAGE-D1',
      name: 'Staging Zone D1',
      type: 'OVERSIZED',
      capacity: 400,
      currentUtilization: 340,
      status: 'OCCUPIED',
      assignedShipment: 'SHP-503',
      location: 'DOCK-SIDE-WEST',
    },
    {
      id: 'STAGE-A3',
      name: 'Staging Zone A3',
      type: 'STANDARD',
      capacity: 500,
      currentUtilization: 485,
      status: 'FULL',
      assignedShipment: 'SHP-504',
      location: 'MAIN-AISLE-SOUTH',
    },
  ];
}

async function getStagedItems(zoneId: string): Promise<StagedItem[]> {
  const allItems = await getAllStagedItems();
  return allItems.filter(item => item.zoneId === zoneId);
}

async function getAllStagedItems(): Promise<StagedItem[]> {
  return [
    {
      id: 'STAGED-001',
      shipmentId: 'SHP-501',
      itemId: 'PROD-101',
      itemName: 'Widget A',
      quantity: 100,
      quantityStaged: 100,
      zoneId: 'STAGE-A1',
      stagedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      stagedBy: 'PICKER-01',
      status: 'STAGED',
    },
    {
      id: 'STAGED-002',
      shipmentId: 'SHP-501',
      itemId: 'PROD-102',
      itemName: 'Widget B',
      quantity: 185,
      quantityStaged: 185,
      zoneId: 'STAGE-A1',
      stagedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      stagedBy: 'PICKER-02',
      status: 'STAGED',
    },
  ];
}

async function getStagedItemsByShipment(shipmentId: string): Promise<StagedItem[]> {
  const allItems = await getAllStagedItems();
  return allItems.filter(item => item.shipmentId === shipmentId);
}

async function getShipmentStaging(shipmentId: string): Promise<ShipmentStaging | null> {
  const allShipments = await getAllActiveShipments();
  return allShipments.find(s => s.shipmentId === shipmentId) || null;
}

async function getAllActiveShipments(): Promise<ShipmentStaging[]> {
  return [
    {
      shipmentId: 'SHP-501',
      carrier: 'FedEx Freight',
      loadTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      priority: 'HIGH',
      allocatedZones: ['STAGE-A1'],
      totalItems: 300,
      stagedItems: 285,
      completionPercent: 95,
      status: 'STAGING',
    },
    {
      shipmentId: 'SHP-502',
      carrier: 'UPS Freight',
      loadTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      priority: 'NORMAL',
      allocatedZones: ['STAGE-A2'],
      totalItems: 150,
      stagedItems: 120,
      completionPercent: 80,
      status: 'STAGING',
    },
    {
      shipmentId: 'SHP-503',
      carrier: 'XPO Logistics',
      loadTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      priority: 'URGENT',
      allocatedZones: ['STAGE-D1'],
      totalItems: 340,
      stagedItems: 340,
      completionPercent: 100,
      status: 'READY',
      verifiedAt: new Date(Date.now() - 30 * 60 * 1000),
      verifiedBy: 'SUPERVISOR-01',
    },
    {
      shipmentId: 'SHP-504',
      carrier: 'Old Dominion',
      loadTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      priority: 'NORMAL',
      allocatedZones: ['STAGE-A3'],
      totalItems: 485,
      stagedItems: 485,
      completionPercent: 100,
      status: 'READY',
      verifiedAt: new Date(Date.now() - 45 * 60 * 1000),
      verifiedBy: 'SUPERVISOR-02',
    },
  ];
}
